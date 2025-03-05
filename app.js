let recognition;
let isListening = false;
const feedbackArea = document.getElementById('feedback');
const speechTextArea = document.getElementById('speech-text');
const startButton = document.getElementById('start-speech');

// Initialize the SpeechRecognition API
function initSpeechRecognition() {
    // Check for browser compatibility (SpeechRecognition is only supported in some browsers)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true; // Enable continuous listening
        recognition.interimResults = true; // Show results while speaking

        recognition.onstart = () => {
            console.log('Speech recognition started');
            startButton.innerText = 'Listening...';
        };

        recognition.onend = () => {
            console.log('Speech recognition ended');
            startButton.innerText = 'Start Listening';
        };

        recognition.onresult = (event) => {
            // Process speech result (transcription)
            let transcript = '';
            let feedback = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }

            // Update the UI with the spoken text
            speechTextArea.value = transcript;

            // Call VAPI API for feedback with real-time text
            feedback = getRealTimeFeedback(transcript);
            feedbackArea.textContent = `Feedback: ${feedback}`;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };
    } else {
        alert('Speech recognition is not supported in your browser.');
    }
}

// Real-time feedback function that sends text to VAPI
async function getRealTimeFeedback(text) {
    // Assuming `text` is the transcribed speech that you want to analyze
    const response = await fetch('https://your-vapi-endpoint.com/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text })
    });

    const data = await response.json();
    return data.feedback; // Assuming the API returns feedback
}

// Toggle Speech Recognition on or off
startButton.addEventListener('click', () => {
    if (isListening) {
        recognition.stop();
        isListening = false;
    } else {
        recognition.start();
        isListening = true;
    }
});

// Initialize the SpeechRecognition API when the page loads
initSpeechRecognition();
