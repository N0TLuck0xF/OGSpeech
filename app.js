import { generateCoachingFeedback } from './coachingAI.js';

class SpeechCoach {
    constructor() {
        // DOM Elements
        this.startButton = document.getElementById('start-speech');
        this.endButton = document.getElementById('end-speech');
        this.chatContainer = document.getElementById('chat-container');
        this.statusIndicator = document.getElementById('status-indicator');
        this.downloadButton = document.getElementById('download-recording');

        // Validate DOM elements
        this.validateDOMElements();

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

    validateDOMElements() {
        const requiredElements = [
            { element: this.startButton, name: 'start-speech' },
            { element: this.endButton, name: 'end-speech' },
            { element: this.chatContainer, name: 'chat-container' },
            { element: this.statusIndicator, name: 'status-indicator' }
        ];

        const missingElements = requiredElements
            .filter(({ element }) => !element)
            .map(({ name }) => name);

        if (missingElements.length > 0) {
            throw new Error(`Missing DOM elements: ${missingElements.join(', ')}`);
        }
    }

    // ... rest of the code remains the same as in your original implementation
}

// Instantiate the Speech Coach when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new SpeechCoach();
    } catch (error) {
        console.error('Failed to initialize Speech Coach:', error);
        alert('Failed to initialize the application. Please check console for details.');
    }
});
