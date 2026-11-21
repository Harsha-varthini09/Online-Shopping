
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


// =====================================
// CONVERT JAVASCRIPT OBJECT TO FIRESTORE FIELDS
// =====================================

function convertToFirestoreFields(data) {

    const fields = {};

    for (const key in data) {

        const value = data[key];

        if (value === null || value === undefined) {

            fields[key] = {
                nullValue: null
            };

        } else if (typeof value === "string") {

            fields[key] = {
                stringValue: value
            };

        } else if (typeof value === "number") {

            if (Number.isInteger(value)) {
                fields[key] = {
                    integerValue: String(value)
                };
            } else {
                fields[key] = {
                    doubleValue: value
                };
            }

        } else if (typeof value === "boolean") {

            fields[key] = {
                booleanValue: value
            };

        } else if (value instanceof Date) {

            fields[key] = {
                timestampValue: value.toISOString()
            };

        } else if (Array.isArray(value)) {

            fields[key] = {
                arrayValue: {
                    values: value.map(function (item) {
                        return convertToFirestoreValue(item);
                    })
                }
            };

        } else if (typeof value === "object") {

            fields[key] = {
                mapValue: {
                    fields: convertToFirestoreFields(value)
                }
            };

        }

    }

    return fields;
}


// CONVERT INDIVIDUAL JAVASCRIPT VALUE TO FIRESTORE VALUE

function convertToFirestoreValue(value) {

    if (value === null || value === undefined) {
        return { nullValue: null };
    }

    if (typeof value === "string") {
        return { stringValue: value };
    }

    if (typeof value === "number") {

        if (Number.isInteger(value)) {
            return { integerValue: String(value) };
        }

        return { doubleValue: value };
    }

    if (typeof value === "boolean") {
        return { booleanValue: value };
    }

    if (value instanceof Date) {
        return { timestampValue: value.toISOString() };
    }

    if (Array.isArray(value)) {
        return {
            arrayValue: {
                values: value.map(convertToFirestoreValue)
            }
        };
    }

    if (typeof value === "object") {
        return {
            mapValue: {
                fields: convertToFirestoreFields(value)
            }
        };
    }

    return { nullValue: null };
}
