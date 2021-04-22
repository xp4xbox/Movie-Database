function setIsContributing() {
    let xHttp = new XMLHttpRequest();

    let isContributing = !(document.getElementById("rdRegular").checked);

    xHttp.onreadystatechange = (e) => {
        if (xHttp.readyState === 4) {
            if (xHttp.status === 200) {
                let container = document.getElementById("bottomContainer");
                container.innerHTML = "<br><div class='generalTxt'><b>Setting saved<b></div>";
            } else if (xHttp.status === 404) {
                alert(xHttp.responseText);
            }
        }
    }

    xHttp.open("PUT", "/ownProfile/config/?isContributing=" + isContributing)
    xHttp.send();
}

window.onload = function() {
    document.getElementById("btnContributing").addEventListener("click", setIsContributing);
}