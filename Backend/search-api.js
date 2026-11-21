
// =====================================
// PRODUCT SEARCH API
// =====================================


// SEARCH ALL ACTIVE PRODUCTS
async function searchAllProducts() {

    const query = {
        structuredQuery: {
            from: [
                { collectionId: "products" }
            ],
            where: {
                fieldFilter: {
                    field: { fieldPath: "status" },
                    op: "EQUAL",
                    value: { stringValue: "active" }
                }
            }
        }
    };

    return sendFirestoreRequest(
        "products:runQuery",
        "POST",
        query,
        sessionStorage.getItem("firebaseIdToken")
    );
}


// SEARCH PRODUCTS BY CATEGORY
async function searchProductsByCategory(categoryId) {

    const query = {
        structuredQuery: {
            from: [
                { collectionId: "products" }
            ],
            where: {
                fieldFilter: {
                    field: { fieldPath: "cat_id" },
                    op: "EQUAL",
                    value: { stringValue: categoryId }
                }
            }
        }
    };

    return sendFirestoreRequest(
        "products:runQuery",
        "POST",
        query,
        sessionStorage.getItem("firebaseIdToken")
    );
}


// SEARCH A SPECIFIC PRODUCT
async function searchProductByName(productName) {

    const query = {
        structuredQuery: {
            from: [
                { collectionId: "products" }
            ],
            where: {
                fieldFilter: {
                    field: { fieldPath: "title" },
                    op: "EQUAL",
                    value: { stringValue: productName }
                }
            }
        }
    };

    return sendFirestoreRequest(
        "products:runQuery",
        "POST",
        query,
        sessionStorage.getItem("firebaseIdToken")
    );
}
