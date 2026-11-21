
 // =====================================
 // COMMON UTILITY FUNCTIONS
 // =====================================


// GENERATE UNIQUE ID
function generateUniqueId() {
    return crypto.randomUUID();
}


// DISPLAY SUCCESS MESSAGE
function showSuccessMessage(message) {
    alert(message);
}


// DISPLAY ERROR MESSAGE
function showErrorMessage(message) {
    alert(message);
}


// CONVERT FIRESTORE VALUE TO JAVASCRIPT VALUE
function convertFromFirestoreValue(value) {

    if ("stringValue" in value) {
        return value.stringValue;
    }

    if ("integerValue" in value) {
        return Number(value.integerValue);
    }

    if ("doubleValue" in value) {
        return value.doubleValue;
    }

    if ("booleanValue" in value) {
        return value.booleanValue;
    }

    if ("timestampValue" in value) {
        return new Date(value.timestampValue);
    }

    if ("nullValue" in value) {
        return null;
    }

    if ("arrayValue" in value) {
        return (value.arrayValue.values || [])
            .map(convertFromFirestoreValue);
    }

    if ("mapValue" in value) {
        return convertFromFirestoreDocument({
            fields: value.mapValue.fields || {}
        });
    }

    return null;
}


// CONVERT FIRESTORE DOCUMENT TO JAVASCRIPT OBJECT
function convertFromFirestoreDocument(document) {

    const result = {};

    const fields = document.fields || {};

    for (const key in fields) {
        result[key] = convertFromFirestoreValue(fields[key]);
    }

    return result;
}


// CALCULATE ORDER TOTAL
function calculateOrderTotal(items) {

    return items.reduce(function (total, item) {
        return total + (item.price * item.quantity);
    }, 0);
}
