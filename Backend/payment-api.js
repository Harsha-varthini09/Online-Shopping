
 // =====================================
 // PAYMENT MANAGEMENT API
 // =====================================


// CREDIT LIMIT GIVEN TO EVERY NEW CUSTOMER (AS DISCUSSED: ₹1000)
// If you change this, also change it in firestore.rules
const DEFAULT_CREDIT_LIMIT = 1000;


// VALIDATE PAYMENT METHOD
function validatePaymentMethod(paymentMethod) {

    if (
        paymentMethod !== "cash" &&
        paymentMethod !== "credit"
    ) {
        throw new Error("Invalid payment method");
    }

    return true;
}


// CHECK CUSTOMER CREDIT LIMIT
function checkCreditLimit(totalAmount, creditLimit) {

    if (totalAmount <= 0) {
        throw new Error("Invalid order amount");
    }

    if (totalAmount > creditLimit) {
        throw new Error("Insufficient credit limit");
    }

    return true;
}


// PREPARE PAYMENT DETAILS
function preparePaymentDetails(totalAmount, paymentMethod, creditLimit = 0) {

    validatePaymentMethod(paymentMethod);

    if (paymentMethod === "credit") {
        checkCreditLimit(totalAmount, creditLimit);
    }

    return {
        payment_method: paymentMethod,
        payment_status: paymentMethod === "credit" ? "on credit" : "pending",
        total_amount: totalAmount
    };
}
