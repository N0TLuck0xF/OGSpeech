import { getRealTimeFeedback } from './api/vapi.js';

let recognition;
let isListening = false;
let mediaRecorder;
let audioChunks = [];
let scene, camera, renderer, avatar;

const chatContainer = document.getElementById('chat-container');
const startButton = document.getElementById('start-speech');
const endButton = document.getElementById('end-speech');
const downloadButton = document.getElementById('download-recording');
const statusIndicator = document.getElementById('status-indicator');

// Initialize 3D Avatar
function init3DAvatar() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(200, 200);
    document.getElementById('avatar-scene').appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: 0x007bff });
    avatar = new THREE.Mesh(geometry, material);
    scene.add(avatar);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(5, 5, 5);
    scene.add(light);

    camera.position.z = 3;
    animateAvatar();
}

function animateAvatar() {
    requestAnimationFrame(animateAvatar);
    if (isListening) {
        avatar.rotation.y += 0.02;
        avatar.scale.set(1 + Math.sin(Date.now() * 0.005) * 0.1, 
                        1 + Math.cos(Date.now() * 0.005) * 0.1, 
                        1);
    }
    renderer.render(scene, camera);
}

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
            startButton.disabled = true;
            endButton.disabled = false;
            statusIndicator.innerText = 'Online';
            statusIndicator.style.background = '#28a745';
            startRecording();
        };

        recognition.onend = () => {
            console.log('Speech recognition ended');
            startButton.innerText = 'Start Call';
            startButton.disabled = false;
            endButton.disabled = true;
            statusIndicator.innerText = 'Offline';
            statusIndicator.style.background = 'rgba(255, 255, 255, 0.1)';
            isListening = false;
            stopRecording();
        };

        recognition.onresult = async (event) => {
            const transcript = event.results[event.resultIndex][0].transcript;
            addChatMessage('You', transcript);
            
            const feedback = await getRealTimeFeedback(transcript);
            addChatMessage('AI Agent', feedback);
            speak(feedback);
        };
    } else {
        alert('Your browser does not support Speech Recognition.');
    }
}

// Initialize Audio Recording
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            downloadButton.href = audioUrl;
            downloadButton.download = `conversation_${new Date().toISOString()}.wav`;
            downloadButton.disabled = false;
        };

        mediaRecorder.start();
    } catch (error) {
        console.error('Recording failed:', error);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}

// Event Listeners
startButton.addEventListener('click', () => {
    recognition.start();
    isListening = true;
});

endButton.addEventListener('click', () => {
    recognition.stop();
    isListening = false;
});

// Display messages in the chat UI
function addChatMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender.toLowerCase().replace(' ', '-'));
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Text-to-speech for AI response
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    speechSynthesis.speak(utterance);
}

// Initialize everything
init3DAvatar();
initSpeechRecognition();
