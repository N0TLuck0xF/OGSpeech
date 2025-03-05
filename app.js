// app.js

import { getRealTimeFeedback } from './api/vapi.js';

let recognition;
let isListening = false;
let mediaRecorder;
let audioChunks = [];
let scene, camera, renderer, avatar;

// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatContainer = document.getElementById('chat-container');
    const startButton = document.getElementById('start-speech');
    const endButton = document.getElementById('end-speech');
    const downloadButton = document.getElementById('download-recording');
    const statusIndicator = document.getElementById('status-indicator');

    // Check if all required DOM elements exist
    if (!startButton || !endButton || !chatContainer || !statusIndicator || !downloadButton) {
        console.error('One or more DOM elements not found:', {
            startButton, endButton, chatContainer, statusIndicator, downloadButton
        });
        return;
    }

    // Initialize 3D Avatar
    function init3DAvatar() {
        try {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
            renderer = new THREE.WebGLRenderer({ alpha: true });
            renderer.setSize(200, 200);
            const avatarScene = document.getElementById('avatar-scene');
            if (avatarScene) {
                avatarScene.appendChild(renderer.domElement);
            } else {
                console.error('Avatar scene container not found');
                return;
            }

            const geometry = new THREE.SphereGeometry(1, 32, 32);
            const material = new THREE.MeshPhongMaterial({ color: 0x007bff });
            avatar = new THREE.Mesh(geometry, material);
            scene.add(avatar);

            const light = new THREE.PointLight(0xffffff, 1, 100);
            light.position.set(5, 5, 5);
            scene.add(light);

            camera.position.z = 3;
            animateAvatar();
        } catch (error) {
            console.error('Failed to initialize 3D avatar:', error);
        }
    }

    function animateAvatar() {
        if (!renderer || !scene || !camera) return;
        requestAnimationFrame(animateAvatar);
        if (isListening) {
            avatar.rotation.y += 0.02;
            avatar.scale.set(
                1 + Math.sin(Date.now() * 0.005) * 0.1,
                1 + Math.cos(Date.now() * 0.005) * 0.1,
                1
            );
        }
        renderer.render(scene, camera);
    }

    // Initialize Speech Recognition
    function initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            try {
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
                    try {
                        const transcript = event.results[event.resultIndex][0].transcript;
                        addChatMessage('You', transcript);
                        const feedback = await getRealTimeFeedback(transcript);
                        addChatMessage('AI Agent', feedback);
                        speak(feedback);
                    } catch (error) {
                        console.error('Error processing speech result:', error);
                        addChatMessage('AI Agent', 'Sorry, I encountered an error while processing your speech.');
                    }
                };

                recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    let errorMessage = '';
                    switch (event.error) {
                        case 'no-speech':
                            errorMessage = 'No speech detected. Please try again.';
                            break;
                        case 'not-allowed':
                        case 'service-not-allowed':
                            errorMessage = 'Microphone access denied. Please enable microphone permissions in your browser settings.';
                            break;
                        case 'network':
                            errorMessage = 'Network error. Please check your internet connection.';
                            break;
                        default:
                            errorMessage = `Speech recognition error: ${event.error}`;
                    }
                    alert(errorMessage);
                    recognition.stop();
                };
            } catch (error) {
                console.error('Failed to initialize SpeechRecognition:', error);
                alert('Failed to initialize speech recognition: ' + error.message);
                startButton.disabled = true;
            }
        } else {
            console.error('Speech Recognition not supported in this browser.');
            alert('Your browser does not support Speech Recognition. Please use a modern browser like Chrome.');
            startButton.disabled = true;
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
            alert('Failed to start recording: ' + error.message);
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    }

    // Event Listeners
    startButton.addEventListener('click', () => {
        try {
            if (!recognition) {
                console.error('Speech recognition not initialized.');
                alert('Speech recognition not available. Please check your browser support.');
                return;
            }
            console.log('Starting speech recognition...');
            recognition.start();
            isListening = true;
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            alert('Error starting speech recognition: ' + error.message);
        }
    });

    endButton.addEventListener('click', () => {
        try {
            if (recognition) {
                recognition.stop();
                isListening = false;
            }
        } catch (error) {
            console.error('Failed to stop speech recognition:', error);
        }
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
        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 1.0;
            speechSynthesis.speak(utterance);
        } catch (error) {
            console.error('Failed to speak:', error);
        }
    }

    // Initialize everything
    try {
        init3DAvatar();
        initSpeechRecognition();
    } catch (error) {
        console.error('Initialization failed:', error);
        alert('Application initialization failed: ' + error.message);
    }
});
