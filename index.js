const Constants = {
    apiPath: 'http://autocomplete.travelpayouts.com/places2',
    eventInput: 'input',
    eventClick: 'click',
    eventKeydown: 'keydown',
    upKeyCode: 38,
    downKeyCode: 40,
    maxSuggestions: 5
}

class Suggest {

    constructor(title, subtitle) {
        this.title = title;
        this.subtitle = subtitle
    }
}

class SuggestPresenter {

    constructor(input) {
        this.suggests = [];
        this.input = input;
    }

    showSuggests(suggests) {
        this.removeAllExcept();
        this.suggests = suggests;

        let val = this.input.value;
        this.removeAllExcept();
        let arr = suggests;
        if (!val) return;
        let a = document.createElement("DIV");
        a.setAttribute("id", this.input.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.input.parentNode.appendChild(a);
        for (let i = 0; i < arr.length; i++) {
            let b = document.createElement("DIV");
            b.innerHTML = "<p class='title'>" + arr[i].title + "</p>";
            b.innerHTML += "<p class='subtitle'>" + arr[i].subtitle + "</p>";
            b.innerHTML += "<input type='hidden' value='" + arr[i].title + "'>";
            b.addEventListener(Constants.eventClick, this.didTapSuggest(i).bind(this));
            a.appendChild(b);
        }
    }

    addActive(items, current) {
        items[current].classList.add("autocomplete-active");
    }

    removeActive(items) {
        for (var i = 0; i < items.length; i++) {
            items[i].classList.remove("autocomplete-active");
         }
    }

    removeAllExcept(item) {
        var items = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < items.length; i++) {
            if (item != items[i] && items != this.input) {
                items[i].parentNode.removeChild(items[i]);
            }
        }    
    }

    didTapSuggest(index) {
        return () => {
            let text = document.getElementsByClassName("title")[index].innerHTML;
            this.input.value = text;
        }
    }
}

class SuggestManager {

    constructor(presenter) {
        this.timeoutHolder = null;
        this.presenter = presenter;
    }

    addRequest(query) {
        this.removePendingRequests();
        let timeout = setTimeout(this.makeRequest, 500, query, this.parseResponse.bind(this));
        this.timeoutHolder = timeout;
    }

    makeRequest(query, parser) {
        let term = encodeURIComponent(query);
        let url = `${Constants.apiPath}?term=${term}&lang=ru`;
        fetch(url)
            .then(r => r.json())
            .then(data => parser(data));
    }

    removePendingRequests() {
        if (this.timeoutHolder !== null)  {
            clearTimeout(this.timeoutHolder);
            this.timeoutHolder = null;
        }
    }

    parseResponse(data) {
        let items = data.slice(0, Constants.maxSuggestions)
            .map(item => this.mapSuggest(item));
        this.presenter.showSuggests(items);
    }

    mapSuggest(item) {
        if (item.type == 'city'){
            let subtitle = "";
            if (item.main_airport_name) {
                subtitle = item.main_airport_name;
            }
            return new Suggest(item.name, subtitle);
        }
        return new Suggest(item.name, item.city_name);
    }
}

class SuggestController {

    constructor(input, presenter, manager) {
        this.input = input;
        this.presenter = presenter;
        this.manager = manager;
        this.currentFocus;
    }

    startListening() {
        this.input.addEventListener(Constants.eventInput, this.handleInputChange.bind(this));
        this.input.addEventListener(Constants.eventKeydown, this.handleKeydown.bind(this));
        document.addEventListener(Constants.eventClick, this.handleClick.bind(this));
    }

    handleInputChange() {
        this.currentFocus = -1;
        let value = this.input.value;
        this.presenter.removeAllExcept();
        if (value.length < 3) return;
        this.manager.addRequest(value);
    }

    handleKeydown(event) {
        var items = document.getElementById(this.input.id + "autocomplete-list");
        if (items) items = items.getElementsByTagName("div");
        if (event.keyCode == 40) {
          this.currentFocus++;
          this.addActive(items);
        } else if (event.keyCode == 38) { 
          this.currentFocus--;
          this.addActive(items);
        } else if (event.keyCode == 13) {
          event.preventDefault();
          if (this.currentFocus > -1) {
            if (items) items[this.currentFocus].click();
          }
        }
    }

    handleClick(event) {
        this.presenter.removeAllExcept(event.target);
    }

    addActive(items) {
        if (!items) return;
        this.removeActive(items);
        if (this.currentFocus >= items.length) this.currentFocus = 0;
        if (this.currentFocus < 0) this.currentFocus = (items.length - 1);
        this.presenter.addActive(items, this.currentFocus);
    }

    removeActive(items) {
        this.presenter.removeActive(items);
    }
}

function enableFetching() {
    let input = document.getElementById('myInput');
    let presenter = new SuggestPresenter(input);
    let manager = new SuggestManager(presenter);
    let controller = new SuggestController(input, presenter, manager);
    controller.startListening();    
}
enableFetching();
