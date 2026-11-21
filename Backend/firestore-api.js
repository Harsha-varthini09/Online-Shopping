
function sendFirestoreRequest(
    documentPath,
    method,
    data = null,
    idToken = null
) {
    return new Promise(function (resolve, reject) {

        const xhr = new XMLHttpRequest();

        const url = documentPath.startsWith(":")
    ? `${FIRESTORE_BASE_URL}${documentPath}`
    : `${FIRESTORE_BASE_URL}/${documentPath}`;

        xhr.open(method, url, true);
        console.log(
    "Firestore request:",
    documentPath,
    "Token attached:",
    Boolean(idToken)
);

        xhr.setRequestHeader(
            "Content-Type",
            "application/json"
        );

        // Add authentication token when available
        if (idToken) {
            xhr.setRequestHeader(
                "Authorization",
                `Bearer ${idToken}`
            );
        }

        xhr.onload = function () {

            const response = xhr.responseText
                ? JSON.parse(xhr.responseText)
                : null;

            if (xhr.status >= 200 && xhr.status < 300) {
    resolve(response);
} else {
    console.error("Firestore Error Status:", xhr.status);
    console.error(
    "Firestore Error Details:",
    JSON.stringify(response, null, 2)
);

    reject({
        status: xhr.status,
        error: response.error || response
    });
}
        };

        xhr.onerror = function () {
            reject(new Error("Network request failed"));
        };

        if (data) {
            xhr.send(JSON.stringify(data));
        } else {
            xhr.send();
        }
    });
}
