
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
// Optional pageToken fetches the next page (response.nextPageToken)
async function getAllOrders(pageToken) {

    const path = pageToken
        ? `orders?pageSize=300&pageToken=${encodeURIComponent(pageToken)}`
        : "orders?pageSize=300";

    return sendFirestoreRequest(
        path,
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
// GET CUSTOMER ORDER HISTORY
async function getCustomerOrders(userId) {

    const query = {
        structuredQuery: {
            from: [
                {
                    collectionId: "orders"
                }
            ],
            where: {
                fieldFilter: {
                    field: {
                        fieldPath: "user_id"
                    },
                    op: "EQUAL",
                    value: {
                        stringValue: userId
                    }
                }
            }
        }
    };

    return sendFirestoreRequest(
        ":runQuery",
        "POST",
        query,
        sessionStorage.getItem("firebaseIdToken")
    );
}

// =====================================
// PLACE ORDER (ATOMIC)
// =====================================
// In ONE Firestore commit:
//  - creates the order
//  - reduces stock for every product
//  - adds the amount to the customer's used credit (credit payments)
//  - empties the cart
// Each product / customer write is tied to the exact version we just
// read, so if someone else bought the same item meanwhile the commit
// is rejected and we re-check stock and try again.

function roundMoney(value) {
    return Math.round(Number(value || 0) * 100) / 100;
}

async function placeOrder(userId, email, cartItems, deliveryDetails, paymentMethod) {

    validatePaymentMethod(paymentMethod);

    if (!cartItems || cartItems.length === 0) {
        throw new Error("Your cart is empty.");
    }

    for (let attempt = 1; attempt <= 3; attempt++) {

        // 1. READ LATEST PRODUCT DATA

        const productDocuments = await Promise.all(
            cartItems.map(function (item) {
                return getProductById(item.product_id).catch(function (error) {
                    if (error.status === 404) return null;
                    throw error;
                });
            })
        );

        const orderItems = [];

        cartItems.forEach(function (item, index) {

            const document = productDocuments[index];

            const product = document ? convertFromFirestoreDocument(document) : null;

            const quantity = Number(item.quantity);

            if (!product || product.status !== "active") {
                throw new Error(`"${item.title}" is no longer available. Please remove it from your cart.`);
            }

            if (Number(product.qty || 0) < quantity) {
                throw new Error(`Only ${Number(product.qty || 0)} of "${product.title}" left in stock. Please update your cart.`);
            }

            orderItems.push({
                product_id: item.product_id,
                title: product.title || item.title,
                cat_id: product.cat_id || "",
                price: Number(product.price),
                quantity: quantity
            });
        });

        const totalAmount = roundMoney(
            orderItems.reduce(function (sum, item) {
                return sum + item.price * item.quantity;
            }, 0)
        );

        // 2. CHECK CREDIT

        let customer = null;

        if (paymentMethod === "credit") {

            customer = await getOrCreateCustomerProfile(userId, email);

            const available = roundMoney(customer.profile.credit_limit - customer.profile.credit_used);

            checkCreditLimit(totalAmount, available);
        }

        const paymentDetails = preparePaymentDetails(
            totalAmount,
            paymentMethod,
            Infinity
        );

        // 3. BUILD ORDER

        const orderId = "ORD" + Date.now();

        const orderData = {
            order_id: orderId,
            user_id: userId,
            customer_email: email || "",
            customer_name: deliveryDetails.customer_name,
            phone: deliveryDetails.phone,
            shipping_address: deliveryDetails.shipping_address,
            city: deliveryDetails.city,
            pincode: deliveryDetails.pincode,
            items: orderItems,
            total_amount: totalAmount,
            payment_method: paymentDetails.payment_method,
            payment_status: paymentDetails.payment_status,
            order_status: "pending",
            created_at: new Date()
        };

        // 4. BUILD ATOMIC WRITES

        const writes = [
            {
                update: {
                    name: firestoreDocumentName("orders/" + orderId),
                    fields: convertToFirestoreFields(orderData)
                },
                currentDocument: { exists: false }
            }
        ];

        // NEW STOCK IS WRITTEN AS A PLAIN NUMBER. This also repairs products whose
        // qty was saved as text (e.g. "10" typed in the Firebase console).
        // The updateTime precondition still makes this safe if someone else
        // buys the same product at the same moment.
        orderItems.forEach(function (item, index) {

            const currentQty = Math.trunc(Number(
                convertFromFirestoreDocument(productDocuments[index]).qty || 0
            ));

            writes.push({
                update: {
                    name: firestoreDocumentName("products/" + item.product_id),
                    fields: {
                        qty: { integerValue: String(currentQty - item.quantity) }
                    }
                },
                updateMask: { fieldPaths: ["qty"] },
                currentDocument: { updateTime: productDocuments[index].updateTime }
            });
        });

        // NEW CREDIT USED IS WRITTEN AS A PLAIN NUMBER (works even if an older
        // profile has credit_used missing or saved as text). The updateTime
        // precondition keeps it safe against two orders at the same moment.
        if (customer) {
            writes.push({
                update: {
                    name: firestoreDocumentName("Customers/" + userId),
                    fields: {
                        credit_used: convertToFirestoreValue(
                            roundMoney(customer.profile.credit_used + totalAmount)
                        )
                    }
                },
                updateMask: { fieldPaths: ["credit_used"] },
                currentDocument: { updateTime: customer.updateTime }
            });
        }

        writes.push({
            update: {
                name: firestoreDocumentName("carts/" + userId),
                fields: convertToFirestoreFields({
                    user_id: userId,
                    items: [],
                    updated_at: new Date()
                })
            }
        });

        // 5. COMMIT

        try {

            await commitFirestoreWrites(writes);

        } catch (error) {

            const status = error && error.error && error.error.status;

            const changedMeanwhile =
                status === "FAILED_PRECONDITION" ||
                status === "ABORTED" ||
                status === "ALREADY_EXISTS";

            if (changedMeanwhile && attempt < 3) {
                continue;
            }

            // PERMISSION DENIED: FIND OUT WHY (READ-ONLY CHECKS)
            if (error && error.status === 403) {
                try {
                    error.diagnosis = await diagnoseOrderPermissions(
                        userId, orderItems, productDocuments, customer
                    );
                } catch (diagnoseError) {
                    console.warn("Diagnosis failed:", diagnoseError);
                }
            }

            throw error;
        }

        // 6. EMAIL (BEST-EFFORT)

        try {
            await sendOrderEmail(email, orderData);
        } catch (mailError) {
            console.warn("Order email not queued:", mailError);
        }

        return orderData;
    }

    throw new Error("Stock changed while placing your order. Please try again.");
}



// =====================================
// DIAGNOSE A REJECTED ORDER (READ-ONLY)
// =====================================
// Production Firestore only says "Missing or insufficient permissions",
// so this works out the likely reason without writing anything.

async function diagnoseOrderPermissions(userId, orderItems, productDocuments, customer) {

    const token = sessionStorage.getItem("firebaseIdToken");

    async function canRead(path) {
        try {
            await sendFirestoreRequest(path, "GET", null, token);
            return "ok";
        } catch (error) {
            if (error.status === 404) return "ok";   // allowed, just missing
            return error.status === 403 ? "denied" : "error " + error.status;
        }
    }

    const findings = [];

    // 1. ARE THE NEW RULES LIVE? (the old rules never covered "Customers")
    const customersRead = await canRead("Customers/" + encodeURIComponent(userId));

    if (customersRead === "denied") {
        findings.push(
            "The new security rules are NOT active: reading your own Customers record is denied. " +
            "Publish firestore.rules (Firebase Console > Firestore Database > Rules > Publish, " +
            "or: npx firebase-tools deploy --only firestore:rules)."
        );
        return findings;
    }

    // 2. ROLE RECORD
    const userRead = await canRead("users/" + encodeURIComponent(userId));

    if (userRead !== "ok") {
        findings.push("Your users/" + userId + " record cannot be read (" + userRead + ").");
    }

    // 3. PRODUCT DATA THE RULES CHECK
    orderItems.forEach(function (item, index) {

        const fields = (productDocuments[index] && productDocuments[index].fields) || {};

        const qty = fields.qty;

        if (!qty) {
            findings.push("Product " + item.product_id + " has no qty field.");
        } else if ("stringValue" in qty && !/^\s*\d+\s*$/.test(qty.stringValue)) {
            findings.push("Product " + item.product_id + " has qty \"" + qty.stringValue + "\" which is not a whole number.");
        }
    });

    // 4. CREDIT PROFILE
    if (customer) {
        const limit = customer.profile.credit_limit;
        if (!(Number(limit) >= 0)) {
            findings.push("Your Customers record has an invalid credit_limit (" + limit + ").");
        }
    }

    if (findings.length === 0) {
        findings.push(
            "The new rules look active and the data looks valid, so the live rules may differ from firestore.rules. " +
            "Re-publish firestore.rules and check the Rules tab shows a new publish time."
        );
    }

    return findings;
}
