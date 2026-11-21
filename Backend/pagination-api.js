
 // =====================================
 // FIRESTORE PAGINATION API
 // =====================================


// GET PRODUCTS WITH PAGINATION
async function getProductsPaginated(pageSize = 5, pageToken = null) {

    let documentPath = `products?pageSize=${pageSize}`;

    if (pageToken) {
        documentPath += `&pageToken=${encodeURIComponent(pageToken)}`;
    }

    return sendFirestoreRequest(
        documentPath,
        "GET",
        null,
        sessionStorage.getItem("firebaseIdToken")
    );
}
