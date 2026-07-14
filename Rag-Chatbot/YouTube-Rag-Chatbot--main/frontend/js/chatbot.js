// =====================================================
//                  DOM ELEMENTS
// =====================================================

const datasetInput = document.getElementById("dataset_file");
const loadDatasetBtn = document.getElementById("loadDatasetBtn");
const sendBtn = document.getElementById("sendBtn");
const questionInput = document.getElementById("question");
const thumbnail = document.getElementById("thumbnail");
const videoTitle = document.getElementById("videoTitle");
const statusText = document.getElementById("status");
const chatContainer = document.getElementById("chatContainer");
const typing = document.getElementById("typing");
const logoutBtn = document.getElementById("logoutBtn");
const userId = document.getElementById("userid");

window.onload = () => {
    const user = getUser();
    if (user == null) {
        window.location.href = "login.html";
        return;
    }

    userId.innerHTML = "User ID : " + user;
    typing.style.display = "none";
};

logoutBtn.addEventListener("click", () => logout());
loadDatasetBtn.addEventListener("click", loadDataset);

async function loadDataset() {
    const file = datasetInput.files[0];
    if (!file) {
        alert("Please choose a .txt file.");
        return;
    }
    if (!file.name.toLowerCase().endsWith(".txt")) {
        alert("Only .txt files are supported.");
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds the maximum limit of 5MB.");
        return;
    }

    loadDatasetBtn.disabled = true;
    loadDatasetBtn.innerHTML = "Loading...";
    statusText.innerHTML = "Creating Vector Store...";

    try {
        const data = await ingestDataset(file);
        console.log(data);

        if (data.status) {
            saveConversation(data.conversation_id);
            statusText.innerHTML = "AI Ready";
            videoTitle.innerHTML = data.filename || "Dataset Loaded Successfully";
            appendBotMessage("✅ Dataset Loaded Successfully.\\n\\nYou can now ask questions about this document.");
            questionInput.focus();
        } else {
            statusText.innerHTML = "Failed";
            alert(data.message || "Unable to load dataset.");
        }
    } catch (error) {
        console.error(error);
        statusText.innerHTML = "Failed";
        alert("Unable to load dataset.");
    } finally {
        loadDatasetBtn.disabled = false;
        loadDatasetBtn.innerHTML = "Load Dataset";
    }
}

sendBtn.addEventListener("click", sendQuestion);
questionInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendQuestion();
    }
});

async function sendQuestion() {
    const question = questionInput.value.trim();
    if (question === "") {
        return;
    }

    const conversation_id = getConversation();
    if (conversation_id == null) {
        alert("Please load a dataset first.");
        return;
    }

    sendBtn.disabled = true;
    questionInput.disabled = true;

    appendUserMessage(question);
    questionInput.value = "";
    typing.style.display = "block";

    try {
        const data = await askQuestion(question);
        console.log(data);
        typing.style.display = "none";

        if (data?.status === false) {
            appendBotMessage(data.message || "Unable to generate a response right now.");
        } else if (data?.BOT || data?.bot || data?.message) {
            appendBotMessage(data.BOT || data.bot || data.message);
        } else {
            appendBotMessage("No response received.");
        }
    } catch (error) {
        console.log(error);
        typing.style.display = "none";
        appendBotMessage("Server Error.");
    } finally {
        sendBtn.disabled = false;
        questionInput.disabled = false;
        questionInput.focus();
    }
}

function appendUserMessage(message) {
    const messageBox = document.createElement("div");
    messageBox.classList.add("user-message");
    messageBox.innerHTML = message;
    chatContainer.appendChild(messageBox);
    scrollToBottom();
}

function appendBotMessage(message) {
    const messageBox = document.createElement("div");
    messageBox.classList.add("bot-message");
    messageBox.innerHTML = message;
    chatContainer.appendChild(messageBox);
    scrollToBottom();
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function checkLogin() {
    const user = getUser();
    if (user == null) {
        alert("Please Login First.");
        window.location.href = "login.html";
        return false;
    }
    return true;
}

if (!checkLogin()) {
    throw new Error("User Not Logged In");
}
