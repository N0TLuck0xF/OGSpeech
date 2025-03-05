import { generateCoachingFeedback } from './coachingAI.js';

class SpeechCoach {
    constructor() {
        // DOM Elements
        this.startButton = document.getElementById('start-speech');
        this.endButton = document.getElementById('end-speech');
        this.chatContainer = document.getElementById('chat-container');
        this.statusIndicator = document.getElementById('status-indicator');
        this.downloadButton = document.getElementById('download-recording');

        // Speech Recognition Setup
        this.recognition = null;
        this.speechSynthesis = window.speechSynthesis;
        this.isListening = false;

        // Coaching Session Variables
        this.coachingContext = {
            totalSpeechTime: 0,
            speechSegments: [],
            feedbackHistory: [],
            currentTopic: null
        };

        this.initializeApplication();
    }

    initializeApplication() {
        this.setupSpeechRecognition();
        this.setupEventListeners();
    }

    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            this.showError('Speech recognition not supported in your browser');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => this.onRecognitionStart();
        this.recognition.onresult = (event) => this.processSpeeches(event);
        this.recognition.onerror = (event) => this.handleRecognitionError(event);
        this.recognition.onend = () => this.endCoachingSession();
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startCoachingSession());
        this.endButton.addEventListener('click', () => this.endCoachingSession());
    }

    async startCoachingSession() {
        try {
            // Request microphone permissions
            await navigator.mediaDevices.getUserMedia({ audio: true });

            // Start recognition
            this.recognition.start();

            // Initial coaching greeting
            this.speakCoachMessage('Welcome to your public speaking coaching session. I\'m here to help you improve your communication skills. Would you like to practice a specific type of speech or presentation?');
        } catch (error) {
            this.showError('Failed to start coaching session. Check microphone permissions.');
        }
    }

    processSpeeches(event) {
        const speechResult = event.results[event.resultIndex][0].transcript;
        this.addChatMessage('You', speechResult);

        // Generate coaching feedback
        this.provideCoachingFeedback(speechResult);
    }

    async provideCoachingFeedback(speechText) {
        try {
            // Generate AI coaching feedback
            const coachingFeedback = await generateCoachingFeedback(speechText);
            
            // Display and speak feedback
            this.addChatMessage('Coach', coachingFeedback);
            this.speakCoachMessage(coachingFeedback);

            // Update coaching context
            this.updateCoachingContext(speechText, coachingFeedback);
        } catch (error) {
            console.error('Coaching feedback generation error:', error);
            this.speakCoachMessage('I encountered an error processing your speech. Could you please try again?');
        }
    }

    updateCoachingContext(speechText, feedback) {
        this.coachingContext.speechSegments.push({
            text: speechText,
            timestamp: new Date(),
            feedback: feedback
        });
    }

    speakCoachMessage(message) {
        // Text-to-Speech implementation
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;
        this.speechSynthesis.speak(utterance);
    }

    onRecognitionStart() {
        this.isListening = true;
        this.startButton.disabled = true;
        this.endButton.disabled = false;
        this.statusIndicator.textContent = 'Coaching Session Active';
        this.statusIndicator.style.background = '#28a745';
    }

    endCoachingSession() {
        if (this.recognition) {
            this.recognition.stop();
        }
        
        this.isListening = false;
        this.startButton.disabled = false;
        this.endButton.disabled = true;
        this.statusIndicator.textContent = 'Session Ended';
        this.statusIndicator.style.background = 'rgba(255, 255, 255, 0.1)';

        // Provide summary of coaching session
        this.provideFinalCoachingSummary();
    }

    provideFinalCoachingSummary() {
        const summary = `
            Coaching Session Summary:
            - Total Speech Segments: ${this.coachingContext.speechSegments.length}
            - Key Areas for Improvement: ${this.extractKeyImprovementAreas()}
        `;
        
        this.speakCoachMessage(summary);
        this.addChatMessage('Coach', summary);
    }

    extractKeyImprovementAreas() {
        // Basic implementation - in a real scenario, this would be more sophisticated
        const commonFeedback = this.coachingContext.speechSegments
            .map(segment => segment.feedback)
            .join(' ');
        
        const improvementAreas = [];
        
        if (commonFeedback.includes('pace')) improvementAreas.push('Speaking Pace');
        if (commonFeedback.includes('clarity')) improvementAreas.push('Pronunciation Clarity');
        if (commonFeedback.includes('filler words')) improvementAreas.push('Reducing Filler Words');

        return improvementAreas.join(', ') || 'No specific areas identified';
    }

    handleRecognitionError(event) {
        console.error('Speech recognition error:', event.error);
        this.speakCoachMessage(`I'm sorry, there was an error: ${event.error}. Could you please try again?`);
    }

    showError(message) {
        this.addChatMessage('System', message);
        this.speakCoachMessage(message);
    }

    addChatMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender.toLowerCase().replace(' ', '-'));
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        this.chatContainer.appendChild(messageElement);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
}

// Instantiate the Speech Coach when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SpeechCoach();
});
