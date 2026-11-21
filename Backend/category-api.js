
// =====================================
// CATEGORY MANAGEMENT API
// =====================================


// CREATE CATEGORY
async function createCategory(categoryData) {

    const document = {
        fields: convertToFirestoreFields(categoryData)
    };

    return sendFirestoreRequest(
        `categories?documentId=${encodeURIComponent(categoryData.id)}`,
        "POST",
        document,
        sessionStorage.getItem("firebaseIdToken")
    );
}


// READ ALL CATEGORIES
async function getCategories() {

    return sendFirestoreRequest(
        "categories",
        "GET",
        null,
        sessionStorage.getItem("firebaseIdToken")
    );
}


// UPDATE CATEGORY
async function updateCategory(categoryId, categoryData) {

    const fields = convertToFirestoreFields(categoryData);

    const updateFields = Object.keys(categoryData)
        .map(field => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
        .join("&");

    return sendFirestoreRequest(
        `categories/${encodeURIComponent(categoryId)}?${updateFields}`,
        "PATCH",
        { fields: fields },
        sessionStorage.getItem("firebaseIdToken")
    );
}


// DELETE CATEGORY
async function deleteCategory(categoryId) {

    return sendFirestoreRequest(
        `categories/${encodeURIComponent(categoryId)}`,
        "DELETE",
        null,
        sessionStorage.getItem("firebaseIdToken")
    );
}
