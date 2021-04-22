import {autocomplete, splitMovies, renderResults} from "./helper.js";

const ITEMS_PER_PAGE = 10;
let movies;

function search() {
    const title = document.getElementById("inTitle").value;
    const year = document.getElementById("inYear").value;
    const genres = document.getElementById("inGenre").value;
    const persons = document.getElementById("inPerson").value;

    let query = "?";
    if (title !== "") {
        query += "title=" + title + "&";
    }
    if (year !== "") {
        query += "year=" + year + "&";
    }
    if (genres !== "") {
        query += "genre=" + genres + "&";
    }
    if (persons !== "") {
        query += "persons=" + persons + "&";
    }

    if (query.charAt(query.length - 1) === "?" || query.charAt(query.length - 1) === "&") {
        query = query.substr(0, query.length - 1);
    }

    let xHttp = new XMLHttpRequest();

    xHttp.onreadystatechange = (e) => {
        if (xHttp.readyState === 4 && xHttp.status === 200) {
            movies = splitMovies(JSON.parse(xHttp.responseText), ITEMS_PER_PAGE);
            renderResults(0, movies, "container");
        }
    }

    xHttp.open("GET", "/searchResults" + query);
    xHttp.send();
}

function getPeopleNamesData() {
    let xHttp = new XMLHttpRequest();

    const input = document.getElementById("inPerson");

    xHttp.onreadystatechange = (e) => {
        if (xHttp.status === 200 && xHttp.readyState === 4) {
            autocomplete(input, JSON.parse(xHttp.responseText), 10);
        }
    }

    xHttp.open("GET", "/peopleProfile");
    xHttp.send();
}

function getGenreData() {
    let xHttp = new XMLHttpRequest();

    const input = document.getElementById("inGenre");

    xHttp.onreadystatechange = (e) => {
        if (xHttp.status === 200 && xHttp.readyState === 4) {
            autocomplete(input, JSON.parse(xHttp.responseText), 10);
            getPeopleNamesData();
        }
    }

    xHttp.open("GET", "/genre");
    xHttp.send();
}

window.onload = function() {
    getGenreData();

    const searchBtn = document.getElementById("btnSearch");

    if (searchBtn) {
        searchBtn.addEventListener("click", search);
    }
}