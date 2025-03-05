// Import the function to call the VAPI API
import { getRealTimeFeedback } from './api/vapi.js';

let recognition;
let isListening = false;

const chatContainer = document.getElementById('chat-container');
const startButton = document.getElementById('start-speech');

// Initialize Speech Recognition
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            console.log('Speech recognition started');
            startButton.innerText = 'Listening...';
            startButton.classList.add('active');
        };

        recognition.onend = () => {
            console.log('Speech recognition ended');
            startButton.innerText = 'Start Coaching';
            startButton.classList.remove('active');
            isListening = false;
        };

        recognition.onresult = async (event) => {
            const transcript = event.results[event.resultIndex][0].transcript;
            addChatMessage('You', transcript);
            
            // Send speech text to VAPI API for chat response
            const feedback = await getRealTimeFeedback(transcript);
            addChatMessage('Coach', feedback);
            speak(feedback);
        };
    } else {
        alert('Your browser does not support Speech Recognition.');
    }
}

// Toggle Speech Recognition On/Off
startButton.addEventListener('click', () => {
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
    isListening = !isListening;
});

// Display messages in the chat UI
function addChatMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender.toLowerCase());
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Convert text-to-speech for VAPI's response
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
}

// Initialize the SpeechRecognition API
initSpeechRecognition();


