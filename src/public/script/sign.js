function register(createAccount) {
    let xHttp = new XMLHttpRequest();

    let username = document.getElementById("inUsername").value;
    let password = document.getElementById("inPassword").value;

    xHttp.onreadystatechange = (e) => {
        if (xHttp.readyState === 4) {
            if (xHttp.status === 401) {
                alert(xHttp.responseText);
            } else if (xHttp.status === 200) {
                window.location = "/ownprofile";
            }
        }
    }

    if (createAccount) {
        xHttp.open("PUT", "/signin");
    } else {
        xHttp.open("POST", "/signin");
    }

    xHttp.send(JSON.stringify({username: username, password: password}));
}

function login() {
    register(false);
}

function createAccount() {
    register(true);
}

function logOut() {
    let xHttp = new XMLHttpRequest();
    xHttp.open("PUT", "/signin");
    xHttp.send();

    window.location = "/signin";
}

window.onload = function() {
    const loggedOutBtn = document.getElementById("btnLogOut");

    if (loggedOutBtn) {
        loggedOutBtn.addEventListener("click", logOut)
    }

    const btnLogin = document.getElementById("btnLogin");

    if (btnLogin) {
        btnLogin.addEventListener("click", login);
    }

    const btnCreateAccount = document.getElementById("btnCreateAccount");

    if (btnCreateAccount) {
        btnCreateAccount.addEventListener("click", createAccount);
    }


}
