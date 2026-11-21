
function convertToFirestoreValue(value) {

    if (value instanceof Date) {
        return {
            timestampValue: value.toISOString()
        };
    }

    if (typeof value === "number") {
        if (Number.isInteger(value)) {
            return {
                integerValue: String(value)
            };
        }

        return {
            doubleValue: value
        };
    }

    if (typeof value === "boolean") {
        return {
            booleanValue: value
        };
    }

    if (Array.isArray(value)) {
        return {
            arrayValue: {
                values: value.map(item =>
                    convertToFirestoreValue(item)
                )
            }
        };
    }

    if (value !== null && typeof value === "object") {
        return {
            mapValue: {
                fields: convertToFirestoreFields(value)
            }
        };
    }

    if (value === null) {
        return {
            nullValue: null
        };
    }

    return {
        stringValue: String(value)
    };
}

function convertToFirestoreFields(data) {

    const fields = {};

    for (const key in data) {
        fields[key] = convertToFirestoreValue(data[key]);
    }

    return fields;
}



function createUserProfile(authResponse, role = "customer") {

    const userData = {
        uid: authResponse.localId,
        email: authResponse.email,
        role: role,
        created_at: new Date()
    };

    const firestoreDocument = {
        fields: convertToFirestoreFields(userData)
    };

    return sendFirestoreRequest(
        `users?documentId=${encodeURIComponent(authResponse.localId)}`,
        "POST",
        firestoreDocument,
        authResponse.idToken
    );
}


// READ ALL USER ACCOUNTS (ADMIN)
async function getAllUsers() {

    const documents = await listAllDocuments("users");

    return documents.map(function (document) {

        const user = convertFromFirestoreDocument(document);

        user.uid = user.uid || getDocumentId(document);

        return user;
    });
}
