export async function generateCoachingFeedback(speechText) {
    // Advanced AI Coaching Feedback Generator
    const coachingPrompts = [
        // Pace and Rhythm Feedback
        {
            keywords: ['fast', 'slow', 'pace'],
            feedback: [
                "Consider varying your speaking pace to maintain audience engagement.",
                "Try to modulate your speed to emphasize key points.",
                "Slow down when introducing complex ideas to ensure clarity."
            ]
        },
        // Clarity and Enunciation
        {
            keywords: ['mumble', 'unclear', 'pronunciation'],
            feedback: [
                "Focus on clear enunciation of each word.",
                "Practice consonant sounds to improve clarity.",
                "Pause briefly between key phrases to enhance comprehension."
            ]
        },
        // Confidence and Delivery
        {
            keywords: ['unsure', 'hesitate', 'confident'],
            feedback: [
                "Speak with conviction and believe in your message.",
                "Use pauses strategically to appear more confident.",
                "Practice power posing before presentations to boost confidence."
            ]
        },
        // Filler Words
        {
            keywords: ['um', 'like', 'basically', 'so'],
            feedback: [
                "Reduce filler words like 'um' and 'like'.",
                "Practice pausing instead of using verbal fillers.",
                "Record yourself to become aware of unnecessary words."
            ]
        }
    ];

    // Analyze speech text for coaching opportunities
    const analyzedFeedback = coachingPrompts.reduce((feedback, prompt) => {
        const matchedKeywords = prompt.keywords.filter(keyword => 
            speechText.toLowerCase().includes(keyword)
        );

        if (matchedKeywords.length) {
            feedback.push(
                prompt.feedback[Math.floor(Math.random() * prompt.feedback.length)]
            );
        }

        return feedback;
    }, []);

    // Default feedback if no specific insights found
    const defaultFeedback = [
        "Keep practicing and refining your public speaking skills.",
        "Remember to speak with clarity and confidence.",
        "Your communication is a skill that improves with consistent practice."
    ];

    // Return personalized or default feedback
    return analyzedFeedback.length 
        ? analyzedFeedback.join(' ') 
        : defaultFeedback[Math.floor(Math.random() * defaultFeedback.length)];
}
