
// =====================================
// CUSTOMER MANAGEMENT API
// =====================================

// CREATE CUSTOMER
async function createCustomer(customerData) {

    const document = {
        fields: convertToFirestoreFields(customerData)
    };

    return sendFirestoreRequest(
        `Customers?documentId=${encodeURIComponent(customerData.id)}`,
        "POST",
        document,
        sessionStorage.getItem("firebaseIdToken")
    );
}


// READ ALL CUSTOMERS
async function getCustomers() {

    return sendFirestoreRequest(
        "Customers",
        "GET",
        null,
        sessionStorage.getItem("firebaseIdToken")
    );
}


// READ ONE CUSTOMER
async function getCustomerById(customerId) {

    return sendFirestoreRequest(
        `Customers/${encodeURIComponent(customerId)}`,
        "GET",
        null,
        sessionStorage.getItem("firebaseIdToken")
    );
}


// UPDATE CUSTOMER
async function updateCustomer(customerId, customerData) {

    const fields = convertToFirestoreFields(customerData);

    const updateFields = Object.keys(customerData)
        .map(field =>
            `updateMask.fieldPaths=${encodeURIComponent(field)}`
        )
        .join("&");

    return sendFirestoreRequest(
        `Customers/${encodeURIComponent(customerId)}?${updateFields}`,
        "PATCH",
        { fields: fields },
        sessionStorage.getItem("firebaseIdToken")
    );
}


// DELETE CUSTOMER
async function deleteCustomer(customerId) {

    return sendFirestoreRequest(
        `Customers/${encodeURIComponent(customerId)}`,
        "DELETE",
        null,
        sessionStorage.getItem("firebaseIdToken")
    );
}
