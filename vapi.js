export async function getRealTimeFeedback(text) {
    try {
        // Replace this with your actual VAPI endpoint
        const apiEndpoint = 'https://api.vapi.com/speech/analyze';  

        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `68316f9a-fc2b-4bc0-8bec-785999f5c567`, // Optional: if VAPI requires an API key
            },
            body: JSON.stringify({ text: text })  // Send the speech text to the API
        });

        if (!response.ok) {
            throw new Error('Error with the API request');
        }

        const data = await response.json();  // Parse the JSON response from VAPI
        return data.feedback;  // Assuming API returns feedback as a field in the response
    } catch (error) {
        console.error('API request failed:', error);
        return 'Sorry, something went wrong. Please try again later.';
    }
}
