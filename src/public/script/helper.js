// autocomplete from w3 schools with modifications
function autocomplete(inp, arr, max) {
    var currentFocus;

    inp.addEventListener("input", function(e) {
        let items = 0;
        var a, b, i, val = this.value;
        val = val.split(",");
        val = val[val.length-1];

        if (val.charAt(0) === " ") {
            val = val.substr(1, val.length);
        }

        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a);
        for (i = 0; i < arr.length; i++) {
            if (arr[i].substr(0, val.length).toUpperCase() === val.toUpperCase()) {
                b = document.createElement("DIV");
                b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(val.length);
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                b.addEventListener("click", function(e) {
                    let value = (inp.value);
                    let charsToRemove = 0;
                    for (let j = value.length - 1; j >= 0; j--) {
                        if (value.charAt(j) === ",") {
                            break;
                        }
                        charsToRemove++;
                        if (j === 0) {
                            break;
                        }
                    }
                    value = value.substr(0, value.length - charsToRemove);
                    value += this.getElementsByTagName("input")[0].value;
                    inp.value = value;
                    closeAllLists();
                });
                if (!(items > max)) {
                    a.appendChild(b);
                    items++;
                }
            }
        }
    });

    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode === 40) {
            currentFocus++;
            addActive(x);
        } else if (e.keyCode === 38) {
            currentFocus--;
            addActive(x);
        } else if (e.keyCode === 13) {
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    });
    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt) {
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt !== x[i] && elmnt !== inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

function renderResults(pg, movies, containerID) {
    let container = document.getElementById(containerID);

    container.innerHTML = "<p1><b>Results<b></p1><br>";

    if (movies.length <= 0) {
        container.innerHTML += "<br><div class='generalTxt'>No results</div>";
    } else {
        let numResults = movies.length * movies[0].length;

        container.innerHTML += "<br><div class='generalTxt'><b>" + numResults + " results found<b></div>";

        container.innerHTML += "<ul class='circle'>";

        movies[pg].forEach(item => {
            container.innerHTML += "<li><a href='/movies/" + item.toString() +
                "'><div class='hyperlink'><div class='generalTxt'>" + item + "</div></div></a></li>";
        });

        container.innerHTML += "</ul><br><div class='generalTxt'>Pg " + (pg + 1) + " of " + movies.length + "</div><br>";

        if (pg - 1 >= 0) {
            container.innerHTML += "<button class='nextBtn' id='btnPrev'>Prev</button>";
        }
        if (pg + 1 <= movies.length - 1) {
            container.innerHTML += "<button class='nextBtn' id='btnNext'>Next</button>";
        }

        const btnPrev = document.getElementById("btnPrev");
        if (btnPrev) {
            btnPrev.addEventListener("click", function(){renderResults(pg - 1, movies, containerID)});
        }

        const btnNext = document.getElementById("btnNext");
        if (btnNext) {
            btnNext.addEventListener("click", function(){renderResults(pg + 1, movies, containerID)});
        }
    }
}

function splitMovies(list, items) {
    let movies = [];
    let count = 0;
    for (let i = 0, j = list.length; i < j; i += items) {
        movies[count] = list.slice(i, i + items);
        count++;
    }

    return movies;
}

export {autocomplete, splitMovies, renderResults};
