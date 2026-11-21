
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


// CREATE CUSTOMER PROFILE (ID = FIREBASE USER ID)
// idToken lets this run during sign up, before the session is saved
async function createCustomerProfile(customerData, idToken) {

    const profile = {
        id: customerData.id,
        name: customerData.name || "",
        email: customerData.email || "",
        mob: customerData.mob || "",
        credit_limit: customerData.credit_limit ?? DEFAULT_CREDIT_LIMIT,
        credit_used: 0,
        created_at: new Date()
    };

    return sendFirestoreRequest(
        `Customers?documentId=${encodeURIComponent(profile.id)}`,
        "POST",
        { fields: convertToFirestoreFields(profile) },
        idToken || sessionStorage.getItem("firebaseIdToken")
    );
}


// GET THE LOGGED-IN CUSTOMER'S PROFILE, CREATING IT IF MISSING
// Returns { profile, updateTime }
async function getOrCreateCustomerProfile(userId, email) {

    let document;

    try {

        document = await getCustomerById(userId);

    } catch (error) {

        if (error.status !== 404) {
            throw error;
        }

        // OLDER ACCOUNTS HAVE NO PROFILE YET

        document = await createCustomerProfile({
            id: userId,
            name: (email || "").split("@")[0],
            email: email || ""
        });
    }

    const profile = convertFromFirestoreDocument(document);

    profile.id = profile.id || getDocumentId(document);

    profile.credit_limit = Number(profile.credit_limit ?? DEFAULT_CREDIT_LIMIT);

    profile.credit_used = Number(profile.credit_used || 0);

    return {
        profile: profile,
        updateTime: document.updateTime
    };
}
