
// =====================================
// ORDER MANAGEMENT API
// =====================================


// CREATE ORDER
async function createOrder(orderData) {

    const document = {
        fields: convertToFirestoreFields(orderData)
    };

    return sendFirestoreRequest(
        `orders?documentId=${encodeURIComponent(orderData.order_id)}`,
        "POST",
        document,
        sessionStorage.getItem("firebaseIdToken")
    );
}


// GET ALL ORDERS (ADMIN)
async function getAllOrders() {

    return sendFirestoreRequest(
        "orders",
        "GET",
        null,
        sessionStorage.getItem("firebaseIdToken")
    );
}


// GET ONE ORDER
async function getOrderById(orderId) {

    return sendFirestoreRequest(
        `orders/${encodeURIComponent(orderId)}`,
        "GET",
        null,
        sessionStorage.getItem("firebaseIdToken")
    );
}


// GET CUSTOMER ORDER HISTORY
async function getCustomerOrders(userId) {

    const query = {
        structuredQuery: {
            from: [
                { collectionId: "orders" }
            ],
            where: {
                fieldFilter: {
                    field: { fieldPath: "user_id" },
                    op: "EQUAL",
                    value: {
                        stringValue: userId
                    }
                }
            }
        }
    };

    return sendFirestoreRequest(
        "orders:runQuery",
        "POST",
        query,
        sessionStorage.getItem("firebaseIdToken")
    );
}
