
// =====================================
// SHOPPING CART API
// =====================================


// GET USER CART
async function getCart(userId) {

    return sendFirestoreRequest(
        `carts/${encodeURIComponent(userId)}`,
        "GET",
        null,
        sessionStorage.getItem("firebaseIdToken")
    );
}


// CREATE OR UPDATE CART
async function saveCart(userId, items) {

    const cartData = {
        user_id: userId,
        items: items,
        updated_at: new Date()
    };

    const document = {
        fields: convertToFirestoreFields(cartData)
    };

    return sendFirestoreRequest(
        `carts/${encodeURIComponent(userId)}`,
        "PATCH",
        document,
        sessionStorage.getItem("firebaseIdToken")
    );
}


// ADD PRODUCT TO CART
async function addToCart(userId, product) {

    let items = [];

    try {
        const cart = await getCart(userId);

        if (cart && cart.fields && cart.fields.items) {
            items = cart.fields.items.arrayValue.values.map(item => {
                const fields = item.mapValue.fields;

                return {
                    product_id: fields.product_id.stringValue,
                    title: fields.title.stringValue,
                    price: Number(fields.price.integerValue ??
                        fields.price.doubleValue),
                    quantity: Number(fields.quantity.integerValue ??
                        fields.quantity.doubleValue)
                };
            });
        }

    } catch (error) {
        if (error.error?.status !== "NOT_FOUND") {
            throw error;
        }
    }

    const existingItem = items.find(
        item => item.product_id === product.id
    );

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        items.push({
            product_id: product.id,
            title: product.title,
            price: Number(product.price),
            quantity: 1
        });
    }

    return saveCart(userId, items);
}


// REMOVE PRODUCT FROM CART
async function removeFromCart(userId, productId) {

    const cart = await getCart(userId);

    const items = cart.fields.items.arrayValue.values
        .map(item => {
            const fields = item.mapValue.fields;

            return {
                product_id: fields.product_id.stringValue,
                title: fields.title.stringValue,
                price: Number(fields.price.integerValue ??
                    fields.price.doubleValue),
                quantity: Number(fields.quantity.integerValue ??
                    fields.quantity.doubleValue)
            };
        })
        .filter(item => item.product_id !== productId);

    return saveCart(userId, items);
}


// CLEAR CART
async function clearCart(userId) {

    return saveCart(userId, []);
}
