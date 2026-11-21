
// =============================================
// ELEGANCE STORE - SHARED AUTH NAVIGATION
// =============================================


// GET LOGIN STATUS

const loggedIn =
    Boolean(sessionStorage.getItem("firebaseIdToken"));


// FIND NAVIGATION ELEMENTS

const authLink =
    document.getElementById("auth-link");

const registerLink =
    document.getElementById("register-link");


// UPDATE LOGIN / LOGOUT DISPLAY

if (authLink) {

    if (loggedIn) {

        authLink.textContent = "Logout";
        authLink.href = "#";

    } else {

        authLink.textContent = "Login";
        authLink.href = "login.html";

    }

}


// HIDE REGISTER LINK WHEN LOGGED IN

if (registerLink && loggedIn) {

    registerLink.parentElement.style.display = "none";

}


// LOGOUT FUNCTIONALITY

if (authLink) {

    authLink.addEventListener("click", function (event) {

        if (sessionStorage.getItem("firebaseIdToken")) {

            event.preventDefault();

            sessionStorage.removeItem("firebaseIdToken");
            sessionStorage.removeItem("firebaseUserId");
            sessionStorage.removeItem("firebaseEmail");
            sessionStorage.removeItem("userRole");

            window.location.replace("login.html");

        }

    });

}


// ADMIN: ADD "ADMIN" LINK TO THE NAVIGATION

(function () {

    if (!loggedIn || sessionStorage.getItem("userRole") !== "admin") {
        return;
    }

    const navLinks = document.querySelector(".nav-links");

    if (!navLinks || navLinks.querySelector('a[href="admin.html"]')) {
        return;
    }

    const item = document.createElement("li");

    const link = document.createElement("a");

    link.href = "admin.html";

    link.textContent = "Admin";

    item.appendChild(link);

    // PLACE IT BEFORE LOGIN / LOGOUT WHEN POSSIBLE

    const authItem = authLink ? authLink.closest("li") : null;

    if (authItem && authItem.parentElement === navLinks) {
        navLinks.insertBefore(item, authItem);
    } else {
        navLinks.appendChild(item);
    }

})();
