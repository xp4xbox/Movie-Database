import {autocomplete} from "./helper.js";

const MAX_RESULTS = 10;

function addPerson() {
    const person = document.getElementById("inPerson").value;

    let xHttp = new XMLHttpRequest();

    xHttp.onreadystatechange = (e) => {
       if (xHttp.readyState === 4) {
           if (xHttp.status === 200) {
               window.location = "/peopleProfile/" + xHttp.responseText;
           } else if (xHttp.status === 404) {
               alert(xHttp.responseText);
           }
       }
    }

    xHttp.open("POST", "/peopleProfile?addPerson=" + person);
    xHttp.send();
}

function addMovie() {
    const title = document.getElementById("inTitle").value;
    const runtime = document.getElementById("inRuntime").value;
    const releaseYear = document.getElementById("inReleaseYear").value;
    const rating = document.getElementById("inRating").value;
    const genre = document.getElementById("inGenre").value;
    const writer = document.getElementById("inWriter").value;
    const director = document.getElementById("inDirector").value;
    const actors = document.getElementById("inActors").value;
    const posterURL = document.getElementById("inPoster").value;
    const plot = document.getElementById("inPlot").value;

    let xHttp = new XMLHttpRequest();

    xHttp.onreadystatechange = (e) => {
        if (xHttp.readyState === 4) {
            if (xHttp.status === 200) {
                window.location = "/movies/" + xHttp.responseText;
            } else if (xHttp.status === 404) {
                alert(xHttp.responseText);
            }
        }
    }

    xHttp.open("POST", "/movie?title=" + title + "&runtime=" + runtime + "&releaseYear=" + releaseYear +
        "&rating=" + rating + "&genre=" + genre + "&plot=" + plot + "&writer=" + writer + "&director=" + director + "&actors=" + actors + "&poster=" + posterURL);
    xHttp.send();

}

function getGenreAutoComplete() {
    const inGenre = document.getElementById("inGenre");

    let xHttp = new XMLHttpRequest();

    xHttp.onreadystatechange = (e) => {
        if (xHttp.readyState === 4) {
            if (xHttp.status === 200) {
                autocomplete(inGenre, JSON.parse(xHttp.responseText), MAX_RESULTS);
            }
        }
    }

    xHttp.open("GET", "/genre");
    xHttp.send();
}

function getPeopleAutoComplete() {
    const writer = document.getElementById("inWriter");
    const director = document.getElementById("inDirector");
    const actors = document.getElementById("inActors");

    let xHttp = new XMLHttpRequest();

    xHttp.onreadystatechange = (e) => {
        if (xHttp.readyState === 4) {
            if (xHttp.status === 200) {
                let data = JSON.parse(xHttp.responseText);
                autocomplete(writer, data, MAX_RESULTS);
                autocomplete(director, data, MAX_RESULTS);
                autocomplete(actors, data, MAX_RESULTS);
                getGenreAutoComplete();
            }
        }
    }

    xHttp.open("GET", "/peopleProfile");
    xHttp.send();
}

window.onload = function() {
    getPeopleAutoComplete();

    const btnAddPerson = document.getElementById("addPersonBtn");

    if (btnAddPerson) {
        btnAddPerson.addEventListener("click", addPerson);
    }

    const btnAddMovie = document.getElementById("addMovieBtn");

    if (btnAddMovie) {
        btnAddMovie.addEventListener("click", addMovie);
    }
}