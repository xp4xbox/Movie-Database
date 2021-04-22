function removeNotification() {
        let xHttp = new XMLHttpRequest();

        xHttp.onreadystatechange = (e) => {
            if (xHttp.readyState === 4) {
                if (xHttp.status === 404) {
                    alert(xHttp.responseText);
                } else if (xHttp.status === 200) {
                    window.location = "/ownProfile";
                }
            }
        }

        let index = decodeURIComponent(window.location.pathname).split("/")[3];

        xHttp.open("PUT", "/ownProfile/config/?removeNotification=" + index);
        xHttp.send();
}

window.onload = function() {
    const btnRemoveNotification = document.getElementById("removeNotificationBtn");

    if (btnRemoveNotification) {
        btnRemoveNotification.addEventListener("click", removeNotification);
    }
}