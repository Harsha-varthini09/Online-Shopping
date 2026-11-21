
function sendAuthRequest(endpoint, data) {

    return new Promise(function (resolve, reject) {

        const xhr = new XMLHttpRequest();

        const url =
            `${AUTH_BASE_URL}:${endpoint}?key=${AUTH_API_KEY}`;

        xhr.open("POST", url, true);

        xhr.setRequestHeader(
            "Content-Type",
            "application/json"
        );

        xhr.onload = function () {

            let response;

            try {
                response = JSON.parse(xhr.responseText);
            } catch (error) {
                reject(new Error("Invalid server response"));
                return;
            }

            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(response);
            } else {
                reject(response);
            }
        };

        xhr.onerror = function () {
            reject(new Error("Authentication request failed"));
        };

        xhr.send(JSON.stringify(data));
    });
}


// Customer Registration
function registerUser(email, password) {

    return sendAuthRequest("signUp", {
        email: email,
        password: password,
        returnSecureToken: true
    });
}


// User Login
function loginUser(email, password) {

    return sendAuthRequest("signInWithPassword", {
        email: email,
        password: password,
        returnSecureToken: true
    });
}


// Password Reset
function resetPassword(email) {

    return sendAuthRequest("sendOobCode", {
        requestType: "PASSWORD_RESET",
        email: email
    });
}


// Logout
function logoutUser() {

    sessionStorage.removeItem("firebaseIdToken");
    sessionStorage.removeItem("firebaseUserId");
    sessionStorage.removeItem("firebaseEmail");

}
