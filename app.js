import { getRealTimeFeedback } from './api/vapi.js';

class SpeechAgent {
    constructor() {
        // DOM Elements
        this.chatContainer = document.getElementById('chat-container');
        this.startButton = document.getElementById('start-speech');
        this.endButton = document.getElementById('end-speech');
        this.downloadButton = document.getElementById('download-recording');
        this.statusIndicator = document.getElementById('status-indicator');

        // Speech and Recording Variables
        this.recognition = null;
        this.isListening = false;
        this.mediaRecorder = null;
        this.audioChunks = [];

        // 3D Avatar Variables
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.avatar = null;

        this.init();
    }

    init() {
        if (!this.validateDOMElements()) return;

        this.init3DAvatar();
        this.initSpeechRecognition();
        this.setupEventListeners();
    }

    validateDOMElements() {
        const elements = [
            this.chatContainer, 
            this.startButton, 
            this.endButton, 
            this.statusIndicator, 
            this.downloadButton
        ];

        const missingElements = elements.filter(el => !el);
        if (missingElements.length > 0) {
            console.error('Missing DOM elements:', missingElements);
            alert('Application initialization failed. Some UI elements are missing.');
            return false;
        }
        return true;
    }

    init3DAvatar() {
        try {
            const avatarScene = document.getElementById('avatar-scene');
            if (!avatarScene) {
                console.error('Avatar scene container not found');
                return;
            }

            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer({ alpha: true });
            this.renderer.setSize(200, 200);
            avatarScene.appendChild(this.renderer.domElement);

            const geometry = new THREE.SphereGeometry(1, 32, 32);
            const material = new THREE.MeshPhongMaterial({ 
                color: 0x007bff,
                shininess: 100 
            });
            this.avatar = new THREE.Mesh(geometry, material);
            this.scene.add(this.avatar);

            const light = new THREE.PointLight(0xffffff, 1, 100);
            light.position.set(5, 5, 5);
            this.scene.add(light);

            this.camera.position.z = 3;
            this.animateAvatar();
        } catch (error) {
            console.error('Failed to initialize 3D avatar:', error);
        }
    }

    animateAvatar() {
        if (!this.renderer || !this.scene || !this.camera) return;
        
        requestAnimationFrame(() => this.animateAvatar());
        
        if (this.isListening) {
            this.avatar.rotation.y += 0.02;
            const scale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
            this.avatar.scale.set(scale, scale, 1);
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.error('Speech Recognition not supported');
            this.showNotSupported();
            return;
        }

        try {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => this.handleRecognitionStart();
            this.recognition.onend = () => this.handleRecognitionEnd();
            this.recognition.onresult = (event) => this.handleSpeechResult(event);
            this.recognition.onerror = (event) => this.handleRecognitionError(event);
        } catch (error) {
            console.error('Speech Recognition initialization failed:', error);
            this.showNotSupported();
        }
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startCall());
        this.endButton.addEventListener('click', () => this.endCall());
    }

    startCall() {
        if (!this.recognition) {
            alert('Speech recognition is not available.');
            return;
        }

        try {
            this.recognition.start();
            this.isListening = true;
            this.startRecording();
        } catch (error) {
            console.error('Failed to start call:', error);
            alert('Failed to start the call. Please check microphone permissions.');
        }
    }

    endCall() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.stopRecording();
        this.resetUI();
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                this.downloadButton.href = audioUrl;
                this.downloadButton.download = `conversation_${new Date().toISOString()}.wav`;
                this.downloadButton.disabled = false;
            };

            this.mediaRecorder.start();
        } catch (error) {
            console.error('Recording failed:', error);
            alert('Failed to start recording. Please check microphone permissions.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
    }

    async handleSpeechResult(event) {
        try {
            const transcript = event.results[event.resultIndex][0].transcript;
            this.addChatMessage('You', transcript);
            
            const feedback = await getRealTimeFeedback(transcript);
            this.addChatMessage('AI Agent', feedback);
            this.speak(feedback);
        } catch (error) {
            console.error('Speech processing error:', error);
            this.addChatMessage('AI Agent', 'Sorry, I encountered an error processing your speech.');
        }
    }

    handleRecognitionStart() {
        this.startButton.innerText = 'Listening...';
        this.startButton.disabled = true;
        this.endButton.disabled = false;
        this.statusIndicator.innerText = 'Online';
        this.statusIndicator.style.background = '#28a745';
    }

    handleRecognitionEnd() {
        this.resetUI();
    }

    resetUI() {
        this.startButton.innerText = 'Start Call';
        this.startButton.disabled = false;
        this.endButton.disabled = true;
        this.statusIndicator.innerText = 'Offline';
        this.statusIndicator.style.background = 'rgba(255, 255, 255, 0.1)';
        this.isListening = false;
    }

    handleRecognitionError(event) {
        console.error('Speech recognition error:', event.error);
        let errorMessage = this.getRecognitionErrorMessage(event.error);
        alert(errorMessage);
        this.recognition.stop();
    }

    getRecognitionErrorMessage(error) {
        const errorMessages = {
            'no-speech': 'No speech detected. Please try again.',
            'not-allowed': 'Microphone access denied. Please enable microphone permissions.',
            'service-not-allowed': 'Microphone access denied. Please enable microphone permissions.',
            'network': 'Network error. Please check your internet connection.',
            'default': 'An unexpected error occurred during speech recognition.'
        };
        return errorMessages[error] || errorMessages['default'];
    }

    showNotSupported() {
        alert('Your browser does not support Speech Recognition. Please use a modern browser like Chrome.');
        this.startButton.disabled = true;
    }

    addChatMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender.toLowerCase().replace(' ', '-'));
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        this.chatContainer.appendChild(messageElement);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    speak(text) {
        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 1.0;
            speechSynthesis.speak(utterance);
        } catch (error) {
            console.error('Text-to-speech failed:', error);
        }
    }
}

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new SpeechAgent();
});
