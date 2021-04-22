function toggleFollow() {
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

    let user = decodeURIComponent(window.location.pathname).split("/")[2];

    xHttp.open("PUT", "/ownProfile/config/?toggleFollowUser=" + user);
    xHttp.send();
}

window.onload = function() {
    const btnToggleFollow = document.getElementById("toggleFollowBtn");

    if (btnToggleFollow) {
        btnToggleFollow.addEventListener("click", toggleFollow);
    }
}