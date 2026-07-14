// ======================================================
//                  DOM ELEMENTS
// ======================================================

const loginBtn = document.getElementById("loginBtn");

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const message = document.getElementById("message");



// ======================================================
//                  LOGIN BUTTON
// ======================================================

loginBtn.addEventListener(

    "click",

    login

);



// ======================================================
//                  LOGIN FUNCTION
// ======================================================

async function login() {

    const email = emailInput.value.trim();

    const password = passwordInput.value.trim();


    // ---------------- Validation ----------------

    if (email === "" || password === "") {

        message.style.color = "red";

        message.innerHTML = "Please fill all fields.";

        return;

    }


    // Disable button while request is processing

    loginBtn.disabled = true;

    loginBtn.innerHTML = "Logging In...";


    // ---------------- API Call ----------------

    const data = await loginUser(

        email,

        password

    );


    // Enable button again

    loginBtn.disabled = false;

    loginBtn.innerHTML = "Login";


    // ---------------- Response ----------------

    if (data.status) {

        saveUser(

            data.user_id

        );

        message.style.color = "lightgreen";

        message.innerHTML = data.message;


        // Wait for 1 second

        setTimeout(() => {

            window.location.href = "chatbot.html";

        }, 1000);

    }

    else {

        message.style.color = "red";

        message.innerHTML = data.message;

    }

}



// ======================================================
//          PRESS ENTER TO LOGIN
// ======================================================

passwordInput.addEventListener(

    "keypress",

    function (event) {

        if (event.key === "Enter") {

            login();

        }

    }

);