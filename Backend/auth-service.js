
 // =====================================
 // AUTHENTICATION SERVICE
 // =====================================


// CUSTOMER REGISTRATION
// Saves the login account, the user role and the customer profile
// (name, email, mobile, credit limit), then queues a welcome email.
async function registerCustomer(email, password, name, mobile, creditLimit) {

    try {
        const authResponse = await registerUser(email, password);

        // ROLE RECORD - REQUIRED. If it cannot be saved, remove the new
        // login account again so the customer can simply try again later
        // (otherwise the email would be "taken" by a half-created account).
        try {

            await createUserProfile(authResponse, "customer");

        } catch (profileError) {

            try {
                await sendAuthRequest("delete", { idToken: authResponse.idToken });
            } catch (deleteError) {
                console.warn("Could not roll back the new account:", deleteError);
            }

            throw profileError;
        }

        // CUSTOMER PROFILE (NAME, MOBILE, CREDIT). If this fails it is
        // created automatically at checkout, so do not block sign up.
        try {

            await createCustomerProfile({
                id: authResponse.localId,
                name: name,
                email: authResponse.email,
                mob: mobile,
                credit_limit: creditLimit
            }, authResponse.idToken);

        } catch (customerError) {
            console.warn("Customer profile not saved yet:", customerError);
        }

        // EMAIL IS BEST-EFFORT - NEVER BLOCK SIGN UP

        try {
            await sendWelcomeEmail(authResponse.email, name, authResponse.idToken);
        } catch (mailError) {
            console.warn("Welcome email not queued:", mailError);
        }

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

        let userDocument;

        try {

            userDocument = await sendFirestoreRequest(
                `users/${encodeURIComponent(authResponse.localId)}`,
                "GET",
                null,
                authResponse.idToken
            );

        } catch (readError) {

            if (readError.status !== 404) {
                throw readError;
            }

            // ACCOUNT EXISTS BUT ITS ROLE RECORD IS MISSING
            // (e.g. sign up was interrupted) - repair it as a customer
            userDocument = await createUserProfile(authResponse, "customer");
        }

        const userData = convertFromFirestoreDocument(userDocument);

        // ACCOUNT DISABLED BY THE ADMIN
        if (userData.disabled === true) {
            throw new Error("This account has been disabled. Please contact the store.");
        }

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
