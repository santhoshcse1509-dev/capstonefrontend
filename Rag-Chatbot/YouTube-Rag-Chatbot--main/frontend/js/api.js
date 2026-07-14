// ==========================================================
//                  FASTAPI BASE URL
// ==========================================================

const BASE_URL = "http://127.0.0.1:8000";


// ==========================================================
//                  REGISTER USER
// ==========================================================

async function registerUser(name, email, password) {

    try {

        const response = await fetch(`${BASE_URL}/create_account`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                name: name,
                email: email,
                password: password

            })

        });

        return await response.json();

    }

    catch (error) {

        console.error(error);

        return {

            status: false,
            message: "Unable to connect to server."

        };

    }

}



// ==========================================================
//                      LOGIN USER
// ==========================================================

async function loginUser(email, password) {

    try {

        const response = await fetch(`${BASE_URL}/login`, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                email: email,
                password: password

            })

        });

        return await response.json();

    }

    catch (error) {

        console.error(error);

        return {

            status: false,
            message: "Unable to connect to server."

        };

    }

}



// ==========================================================
//              INGEST .TXT DATASET FILE
// ==========================================================

async function ingestDataset(file) {

    try {

        const formData = new FormData();
        formData.append("file", file);
        formData.append("user_id", getUser());

        // NOTE: no "Content-Type" header here - the browser sets the
        // correct multipart/form-data boundary automatically for FormData.
        const response = await fetch(`${BASE_URL}/ingestion`, {

            method: "POST",

            body: formData

        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {

            return {

                status: false,
                message: data.message || "Unable to process this video."

            };

        }

        return data;

    }

    catch (error) {

        console.error(error);

        return {

            status: false,
            message: "Unable to connect to server."

        };

    }

}



// ==========================================================
//                  CHATBOT API
// ==========================================================

async function askQuestion(question) {

    try {

        const response = await fetch(`${BASE_URL}/bot`, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                question: question,
                conversation_id: getConversation()

            })

        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {

            return {

                status: false,
                message: data.message || "Unable to generate a response."

            };

        }

        return data;

    }

    catch (error) {

        console.error(error);

        return {

            status: false,
            message: "Unable to connect to server."

        };

    }

}



// ==========================================================
//              SESSION STORAGE FUNCTIONS
// ==========================================================


// ---------- USER ----------

function saveUser(user_id) {

    sessionStorage.setItem(

        "user_id",

        user_id

    );

}


function getUser() {

    return sessionStorage.getItem(

        "user_id"

    );

}



// ---------- CONVERSATION ----------

function saveConversation(conversation_id) {

    sessionStorage.setItem(

        "conversation_id",

        conversation_id

    );

}


function getConversation() {

    return sessionStorage.getItem(

        "conversation_id"

    );

}



// ==========================================================
//                  LOGOUT
// ==========================================================

function logout() {

    sessionStorage.clear();

    window.location.href = "login.html";

}