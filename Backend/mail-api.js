// =====================================
// EMAIL API
// =====================================
// Emails are queued in the Firestore "mail" collection.
// The Firebase "Trigger Email from Firestore" extension
// (firebase/firestore-send-email) watches this collection
// and sends each message through your SMTP provider.


// QUEUE AN EMAIL
async function queueEmail(to, subject, html, idToken) {

    if (!to) {
        return null;
    }

    const mailData = {
        to: to,
        message: {
            subject: subject,
            html: html
        },
        created_at: new Date()
    };

    return sendFirestoreRequest(
        "mail",
        "POST",
        { fields: convertToFirestoreFields(mailData) },
        idToken || sessionStorage.getItem("firebaseIdToken")
    );
}


// ESCAPE TEXT FOR EMAIL HTML
function escapeEmailText(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}


// WELCOME EMAIL AFTER SIGN UP
function sendWelcomeEmail(email, name, idToken) {

    const html = `
        <div style="font-family:Arial,sans-serif;color:#4B4352">
            <h2 style="color:#493B59">Welcome to Elegance Store, ${escapeEmailText(name)}!</h2>
            <p>Your account has been created successfully.</p>
            <p>You can now browse products, add them to your cart and place orders
               using cash or your store credit.</p>
            <p>Happy shopping!<br>Elegance Store</p>
        </div>`;

    return queueEmail(email, "Welcome to Elegance Store", html, idToken);
}


// ORDER CONFIRMATION / BILL EMAIL
function sendOrderEmail(email, order) {

    const rows = (order.items || []).map(function (item) {
        return `
            <tr>
                <td style="padding:6px;border-bottom:1px solid #eee">${escapeEmailText(item.title)}</td>
                <td style="padding:6px;border-bottom:1px solid #eee;text-align:right">₹${Number(item.price).toFixed(2)}</td>
                <td style="padding:6px;border-bottom:1px solid #eee;text-align:center">${Number(item.quantity)}</td>
                <td style="padding:6px;border-bottom:1px solid #eee;text-align:right">₹${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
            </tr>`;
    }).join("");

    const html = `
        <div style="font-family:Arial,sans-serif;color:#4B4352">
            <h2 style="color:#493B59">Thank you for your order!</h2>
            <p>Order ID: <strong>${escapeEmailText(order.order_id)}</strong></p>
            <p>Payment: <strong>${escapeEmailText(order.payment_method === "credit" ? "Store Credit" : "Cash on Delivery")}</strong></p>
            <table style="border-collapse:collapse;width:100%;max-width:560px">
                <thead>
                    <tr style="background:#F5ECFA">
                        <th style="padding:6px;text-align:left">Product</th>
                        <th style="padding:6px;text-align:right">Price</th>
                        <th style="padding:6px">Qty</th>
                        <th style="padding:6px;text-align:right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <h3 style="color:#C77D91">Total: ₹${Number(order.total_amount).toFixed(2)}</h3>
            <p>Delivery to: ${escapeEmailText([order.shipping_address, order.city, order.pincode].filter(Boolean).join(", "))}</p>
            <p>Elegance Store</p>
        </div>`;

    return queueEmail(
        email,
        "Your Elegance Store order " + order.order_id,
        html
    );
}
