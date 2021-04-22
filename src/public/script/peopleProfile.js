function followPerson() {
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

    let person = decodeURIComponent(window.location.pathname).split("/")[2];

    xHttp.open("PUT", "/ownProfile/config/?toggleFollowPerson=" + person);
    xHttp.send();
}

window.onload = function() {
    const btnFollow = document.getElementById("watchListBtn");

    if (btnFollow) {
        btnFollow.addEventListener("click", followPerson);
    }
}