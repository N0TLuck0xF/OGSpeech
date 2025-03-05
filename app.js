document.addEventListener('DOMContentLoaded', () => {
    // DOM Element Selectors
    const startButton = document.getElementById('start-speech');
    const endButton = document.getElementById('end-speech');
    const chatContainer = document.getElementById('chat-container');
    const statusIndicator = document.getElementById('status-indicator');
    const downloadButton = document.getElementById('download-recording');

    // Comprehensive Browser Support Check
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    // Disable start button until permissions are checked
    startButton.disabled = true;
    statusIndicator.textContent = 'Checking Permissions...';

    // Explicit Microphone Permission Request
    async function requestMicrophonePermission() {
        try {
            // First, try to get media devices
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });

            // If successful, stop the stream
            stream.getTracks().forEach(track => track.stop());

            // Now check speech recognition support
            if (!SpeechRecognition) {
                throw new Error('Speech Recognition not supported in this browser');
            }

            // Enable start button
            startButton.disabled = false;
            statusIndicator.textContent = 'Ready';
            statusIndicator.style.background = '#FFC107';

            console.log('Microphone permission granted');
            return true;
        } catch (error) {
            console.error('Microphone Permission Error:', error);
            
            // Detailed error messaging
            let errorMessage = 'Microphone access denied. ';
            if (error.name === 'NotAllowedError') {
                errorMessage += 'Please enable microphone permissions in your browser settings.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'No microphone devices found.';
            } else {
                errorMessage += error.message;
            }

            statusIndicator.textContent = 'Permission Denied';
            statusIndicator.style.background = '#FF0000';
            
            alert(errorMessage);
            return false;
        }
    }

    // Speech Recognition Setup
    let recognition;
    let mediaRecorder;
    let audioChunks = [];
    let isListening = false;

    function initializeSpeechRecognition() {
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
                statusIndicator.textContent = 'Online';
                statusIndicator.style.background = '#28a745';
                isListening = true;
                startAudioRecording();
            };

            recognition.onresult = async (event) => {
                try {
                    const transcript = event.results[event.resultIndex][0].transcript;
                    addMessage('You', transcript);
                    
                    // Simulated AI response
                    const response = await getMockAIResponse(transcript);
                    addMessage('AI', response);
                } catch (error) {
                    console.error('Speech processing error:', error);
                    addMessage('System', 'Error processing speech');
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech Recognition Error:', event.error);
                alert(`Speech Recognition Error: ${event.error}`);
                resetUI();
            };

            recognition.onend = () => {
                console.log('Speech recognition ended');
                resetUI();
            };
        } catch (error) {
            console.error('Failed to initialize speech recognition:', error);
            alert('Failed to initialize speech recognition. Check console for details.');
        }
    }

    async function startAudioRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                downloadButton.href = audioUrl;
                downloadButton.download = `recording_${new Date().toISOString()}.wav`;
                downloadButton.disabled = false;
            };

            mediaRecorder.start();
        } catch (error) {
            console.error('Audio recording failed:', error);
            alert('Failed to start audio recording. Ensure microphone permissions are granted.');
        }
    }

    async function getMockAIResponse(text) {
        const responses = [
            "That sounds interesting.",
            "Could you tell me more about that?",
            "I'm listening carefully.",
            "What made you think of that?",
            "Interesting perspective!"
        ];
        await new Promise(resolve => setTimeout(resolve, 500));
        return responses[Math.floor(Math.random() * responses.length)];
    }

    function addMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender.toLowerCase());
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function resetUI() {
        startButton.innerText = 'Start Call';
        startButton.disabled = false;
        endButton.disabled = true;
        statusIndicator.textContent = 'Ready';
        statusIndicator.style.background = '#FFC107';
        isListening = false;

        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    }

    // Event Listeners
    startButton.addEventListener('click', () => {
        try {
            console.log('Start button clicked');
            recognition.start();
        } catch (error) {
            console.error('Failed to start recognition:', error);
            alert('Failed to start call. Check browser compatibility and microphone permissions.');
        }
    });

    endButton.addEventListener('click', () => {
        try {
            recognition.stop();
        } catch (error) {
            console.error('Failed to end recognition:', error);
        }
    });

    // Initial Setup
    async function initializeApp() {
        // First, request microphone permissions
        const permissionGranted = await requestMicrophonePermission();
        
        if (permissionGranted) {
            initializeSpeechRecognition();
            endButton.disabled = true;
        }
    }

    // Start the initialization process
    initializeApp();
});
