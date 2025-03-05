// Import the function to call the VAPI API
import { getRealTimeFeedback } from './api/vapi.js';

let recognition;
let isListening = false;

const feedbackArea = document.getElementById('feedback');
const speechTextArea = document.getElementById('speech-text');
const startButton = document.getElementById('start-speech');

// Initialize Speech Recognition
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US'; // Set language to English (change as needed)

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
            let transcript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }

            // Update UI with spoken text
            speechTextArea.value = transcript;

            // Send speech text to VAPI API for feedback
            const feedback = await getRealTimeFeedback(transcript);
            feedbackArea.textContent = `Feedback: ${feedback}`;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            feedbackArea.textContent = 'Error: Please try again!';
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

// Initialize the SpeechRecognition API
initSpeechRecognition();

