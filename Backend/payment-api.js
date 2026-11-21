
 // =====================================
 // PAYMENT MANAGEMENT API
 // =====================================


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
        payment_status: "pending",
        total_amount: totalAmount
    };
}
