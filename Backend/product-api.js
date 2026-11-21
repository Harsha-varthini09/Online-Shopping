
// =====================================
// PRODUCT MANAGEMENT API
// =====================================

// CREATE PRODUCT
async function createProduct(productData) {

    const document = {
        fields: convertToFirestoreFields(productData)
    };

    return sendFirestoreRequest(
        `products?documentId=${encodeURIComponent(productData.id)}`,
        "POST",
        document,
        sessionStorage.getItem("firebaseIdToken")
    );
}


// READ ALL PRODUCTS
async function getProducts() {

    const token = sessionStorage.getItem("firebaseIdToken");

    console.log(
        "Product API - Token available:",
        Boolean(token)
    );

    return sendFirestoreRequest(
        "products",
        "GET",
        null,
        token
    );
}


// READ ONE PRODUCT
async function getProductById(productId) {

    return sendFirestoreRequest(
        `products/${encodeURIComponent(productId)}`,
        "GET",
        null,
        sessionStorage.getItem("firebaseIdToken")
    );
}


// UPDATE PRODUCT
async function updateProduct(productId, productData) {

    const fields = convertToFirestoreFields(productData);

    const updateFields = Object.keys(productData)
        .map(field =>
            `updateMask.fieldPaths=${encodeURIComponent(field)}`
        )
        .join("&");

    return sendFirestoreRequest(
        `products/${encodeURIComponent(productId)}?${updateFields}`,
        "PATCH",
        { fields: fields },
        sessionStorage.getItem("firebaseIdToken")
    );
}


// DELETE PRODUCT
async function deleteProduct(productId) {

    return sendFirestoreRequest(
        `products/${encodeURIComponent(productId)}`,
        "DELETE",
        null,
        sessionStorage.getItem("firebaseIdToken")
    );
}
