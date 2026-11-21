
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


// =====================================
// SHARED FIRESTORE HELPERS
// =====================================

// FULL DOCUMENT NAME (USED BY BATCH COMMITS)
function firestoreDocumentName(documentPath) {

    return `projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/${documentPath}`;
}


// GET DOCUMENT ID FROM A FIRESTORE DOCUMENT
function getDocumentId(document) {

    return document && document.name
        ? document.name.split("/").pop()
        : "";
}


// READ EVERY DOCUMENT IN A COLLECTION (FOLLOWS ALL PAGES)
async function listAllDocuments(collectionName) {

    const documents = [];

    let pageToken = null;

    do {

        let path = `${collectionName}?pageSize=300`;

        if (pageToken) {
            path += `&pageToken=${encodeURIComponent(pageToken)}`;
        }

        const response = await sendFirestoreRequest(
            path,
            "GET",
            null,
            sessionStorage.getItem("firebaseIdToken")
        );

        (response.documents || []).forEach(function (document) {
            documents.push(document);
        });

        pageToken = response.nextPageToken || null;

    } while (pageToken);

    return documents;
}


// APPLY SEVERAL WRITES ATOMICALLY (ALL SUCCEED OR NONE)
async function commitFirestoreWrites(writes) {

    return sendFirestoreRequest(
        ":commit",
        "POST",
        { writes: writes },
        sessionStorage.getItem("firebaseIdToken")
    );
}


// RUN A STRUCTURED QUERY AND RETURN PLAIN DOCUMENTS
async function runFirestoreQuery(structuredQuery) {

    const response = await sendFirestoreRequest(
        ":runQuery",
        "POST",
        { structuredQuery: structuredQuery },
        sessionStorage.getItem("firebaseIdToken")
    );

    return (response || [])
        .filter(function (result) {
            return result.document;
        })
        .map(function (result) {
            return result.document;
        });
}
