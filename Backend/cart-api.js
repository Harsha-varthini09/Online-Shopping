
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


// READ CART ITEMS FROM A FIRESTORE CART DOCUMENT
// Firestore returns an EMPTY array as { arrayValue: {} } (no "values"),
// e.g. after an order is placed or the cart is cleared - handle that safely.
function readCartItems(cart) {

    const values =
        (cart && cart.fields && cart.fields.items &&
         cart.fields.items.arrayValue &&
         cart.fields.items.arrayValue.values) || [];

    return values
        .filter(item => item && item.mapValue && item.mapValue.fields)
        .map(item => {
            const fields = item.mapValue.fields;

            const number = value => value
                ? Number(value.integerValue ?? value.doubleValue ?? 0)
                : 0;

            return {
                product_id: fields.product_id ? fields.product_id.stringValue : "",
                title: fields.title ? fields.title.stringValue : "",
                price: number(fields.price),
                quantity: number(fields.quantity)
            };
        });
}


// ADD PRODUCT TO CART (WITH THE SELECTED QUANTITY)
async function addToCart(userId, product, quantity = 1) {

    quantity = Math.max(1, Math.floor(Number(quantity) || 1));


    let items = [];

    try {
        const cart = await getCart(userId);

        items = readCartItems(cart);

    } catch (error) {
        if (error.error?.status !== "NOT_FOUND") {
            throw error;
        }
    }

    const existingItem = items.find(
        item => item.product_id === product.id
    );

    const alreadyInCart = existingItem ? existingItem.quantity : 0;

    const stock = Number(product.qty ?? Infinity);

    if (alreadyInCart + quantity > stock) {

        const left = Math.max(0, stock - alreadyInCart);

        throw new Error(
            left > 0
                ? `Only ${left} more can be added (stock: ${stock}, in cart: ${alreadyInCart}).`
                : `You already have all ${stock} available in your cart.`
        );
    }

    if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.price = Number(product.price);
    } else {
        items.push({
            product_id: product.id,
            title: product.title,
            price: Number(product.price),
            quantity: quantity
        });
    }

    return saveCart(userId, items);
}


// REMOVE PRODUCT FROM CART
async function removeFromCart(userId, productId) {

    const cart = await getCart(userId);

    const items = readCartItems(cart)
        .filter(item => item.product_id !== productId);

    return saveCart(userId, items);
}


// CLEAR CART
async function clearCart(userId) {

    return saveCart(userId, []);
}
