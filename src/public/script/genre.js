import {renderResults, splitMovies} from "./helper.js";

const ITEMS_PER_PAGE = 10;
let movies = [];

window.onload = function() {
    let xHttp = new XMLHttpRequest();

    xHttp.onreadystatechange = (e) => {
        if (xHttp.readyState === 4) {
            if (xHttp.status === 200) {
                movies = splitMovies(JSON.parse(xHttp.responseText), ITEMS_PER_PAGE);
                renderResults(0, movies, "container");
            } else if (xHttp.status === 404) {
                const container = document.getElementById("container");
                container.innerHTML = "<p1><b>Genre not found</b></p1>";
            }
        }
    }

    let genre = decodeURIComponent(window.location.pathname).split("/")[2];

    xHttp.open("GET", "/genre?genre=" + genre);
    xHttp.send();

}