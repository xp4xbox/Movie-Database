function addReview(isFull) {
    let review = {};
    review["rating"] = document.getElementById("inScore").value;

    if (isFull) {
        const summary = document.getElementById("inSummary").value;
        const text = document.getElementById("txtInFullText").value;

        if (summary === "" || text === "") {
            alert("Summary and text cannot be left blank for full review");
            return;
        }

        review["summary"] = summary;
        review["text"] = text;
    } else {
        review["summary"] = "";
        review["text"] = "";
    }

    review["movie"] = decodeURIComponent(window.location.pathname).split("/")[2];

    let xHttp = new XMLHttpRequest();

    xHttp.onreadystatechange = (e) => {
        if (xHttp.readyState === 4) {
            if (xHttp.status === 404) {
                alert(xHttp.responseText);
            } else if (xHttp.status === 200) {
                location.reload();
            }
        }
    }

    xHttp.open("POST", "/review");
    xHttp.send(JSON.stringify(review));
}

function toggleWatchList() {
    let xHttp = new XMLHttpRequest();

    xHttp.onreadystatechange = (e) => {
        if (xHttp.readyState === 4) {
            if (xHttp.status === 200) {
                location.reload();
            } else if (xHttp.status === 404) {
                alert(xHttp.responseText);
            }
        }
    }

    let movie = decodeURIComponent(window.location.pathname).split("/")[2];

    xHttp.open("PUT", "/ownProfile/config/?toggleMovieWatchlist=" + movie);
    xHttp.send();
}

window.onload = function() {
    const btnBasicReview = document.getElementById("basicReviewBtn");
    const btnFullReview = document.getElementById("fullReviewBtn");

    if (btnFullReview && btnFullReview) {
        btnBasicReview.addEventListener("click", function(){addReview(false);});
        btnFullReview.addEventListener("click", function(){addReview(true);});
    }

    const btnAddToWatchList = document.getElementById("addToWatchListBtn");

    if (btnAddToWatchList) {
        btnAddToWatchList.addEventListener("click", toggleWatchList)
    }

}