// ======================================================
//                  DOM ELEMENTS
// ======================================================

const registerBtn = document.getElementById("registerBtn");

const nameInput = document.getElementById("name");

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const confirmPasswordInput = document.getElementById("confirm_password");

const message = document.getElementById("message");



// ======================================================
//              REGISTER BUTTON EVENT
// ======================================================

registerBtn.addEventListener(

    "click",

    register

);



// ======================================================
//                REGISTER FUNCTION
// ======================================================

async function register() {

    const name = nameInput.value.trim();

    const email = emailInput.value.trim();

    const password = passwordInput.value.trim();

    const confirmPassword = confirmPasswordInput.value.trim();



    // ==================================================
    //                  VALIDATIONS
    // ==================================================

    if (

        name === "" ||

        email === "" ||

        password === "" ||

        confirmPassword === ""

    ) {

        message.style.color = "red";

        message.innerHTML = "Please fill all fields.";

        return;

    }


    if (password !== confirmPassword) {

        message.style.color = "red";

        message.innerHTML = "Passwords do not match.";

        return;

    }


    if (password.length < 6) {

        message.style.color = "red";

        message.innerHTML = "Password should be at least 6 characters.";

        return;

    }



    // ==================================================
    //                DISABLE BUTTON
    // ==================================================

    registerBtn.disabled = true;

    registerBtn.innerHTML = "Creating Account...";



    // ==================================================
    //                  API CALL
    // ==================================================

    const data = await registerUser(

        name,

        email,

        password

    );



    // ==================================================
    //              ENABLE BUTTON AGAIN
    // ==================================================

    registerBtn.disabled = false;

    registerBtn.innerHTML = "Create Account";



    // ==================================================
    //              HANDLE RESPONSE
    // ==================================================

    if (

        data.message === "accout created"

    ) {

        message.style.color = "lightgreen";

        message.innerHTML = "Account Created Successfully.";

        setTimeout(() => {

            window.location.href = "login.html";

        }, 1200);

    }

    else {

        message.style.color = "red";

        message.innerHTML = data.message;

    }

}



// ======================================================
//          PRESS ENTER TO REGISTER
// ======================================================

confirmPasswordInput.addEventListener(

    "keypress",

    function (event) {

        if (event.key === "Enter") {

            register();

        }

    }

);