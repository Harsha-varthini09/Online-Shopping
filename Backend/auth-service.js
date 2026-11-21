
 // =====================================
 // AUTHENTICATION SERVICE
 // =====================================


// CUSTOMER REGISTRATION
async function registerCustomer(email, password) {

    try {
        const authResponse = await registerUser(email, password);

        await createUserProfile(authResponse, "customer");

        return {
            success: true,
            message: "Registration successful!",
            userId: authResponse.localId
        };

    } catch (error) {
        console.error("Registration Error:", error);
        throw error;
    }
}


// USER LOGIN
async function loginUserAccount(email, password) {

    try {
        const authResponse = await loginUser(email, password);

        const userDocument = await sendFirestoreRequest(
            `users/${encodeURIComponent(authResponse.localId)}`,
            "GET",
            null,
            authResponse.idToken
        );

        const userData = convertFromFirestoreDocument(userDocument);

        sessionStorage.setItem("firebaseIdToken", authResponse.idToken);
        sessionStorage.setItem("firebaseUserId", authResponse.localId);
        sessionStorage.setItem("firebaseEmail", authResponse.email);
        sessionStorage.setItem("userRole", userData.role);

        return {
            success: true,
            message: "Login successful!",
            userId: authResponse.localId,
            role: userData.role
        };

    } catch (error) {
        console.error("Login Error:", error);
        throw error;
    }
}


// LOGOUT
function logoutAccount() {

    sessionStorage.removeItem("firebaseIdToken");
    sessionStorage.removeItem("firebaseUserId");
    sessionStorage.removeItem("firebaseEmail");
    sessionStorage.removeItem("userRole");
}
