
import { GoogleGenAI, Type } from "@google/genai";
import type { EnrichmentData } from '../types';

export async function getSceneDescription(ai: GoogleGenAI, base64Image: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        text: "Describe this scene in a simple, brief sentence to start a conversation with an English learner. Focus on the main subject or action."
                    },
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64Image
                        }
                    }
                ]
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error getting scene description:", error);
        return "a room with a person in it." // Fallback description
    }
}


export async function enrichTranscription(ai: GoogleGenAI, text: string, history: { speaker: 'user' | 'ai'; english: string }[]): Promise<EnrichmentData> {
    try {
        const historyText = history.length > 0
            ? history.map(h => `${h.speaker === 'user' ? 'User' : 'AI'}: ${h.english}`).join('\n')
            : "No history yet.";

        const prompt = `
        You are an English learning assistant. A user is having a conversation with an AI tutor.
        Below is the recent conversation history for context:
        --- CONVERSATION HISTORY START ---
        ${historyText}
        --- CONVERSATION HISTORY END ---

        Now, analyze ONLY the following NEWEST message: "${text}"

        Based on the conversation context, your task is to:
        1. Identify the language of the NEWEST message (is it primarily English or Chinese?).
        2. Provide an accurate translation into the other language. The translation MUST make sense within the context of the conversation. For short phrases like "why?" or "and then?", use the context to provide a meaningful translation.
        3. If the NEWEST message is in English, identify up to 3 difficult words for a middle school learner and provide their IPA phonetic transcription.

        Your response MUST be a single JSON object with "english", "chinese", and "phonetics" keys. The "phonetics" array can be empty if the original text is not English or contains no difficult words.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        english: {
                            type: Type.STRING,
                            description: "The English version of the text."
                        },
                        chinese: {
                            type: Type.STRING,
                            description: "The Chinese version of the text."
                        },
                        phonetics: {
                            type: Type.ARRAY,
                            description: "A list of difficult English words with their IPA transcriptions. Empty if original text was Chinese.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    word: { type: Type.STRING },
                                    ipa: { type: Type.STRING }
                                },
                                required: ['word', 'ipa']
                            }
                        }
                    },
                    required: ['english', 'chinese', 'phonetics']
                }
            }
        });
        
        const jsonText = response.text.trim();
        const data = JSON.parse(jsonText);
        return data as EnrichmentData;
    } catch (error) {
        console.error("Error enriching transcription:", error);
        // Fallback in case of API error. Tries to guess the language.
        const isChinese = /[\u4e00-\u9fa5]/.test(text);
        return {
            english: isChinese ? "Translation failed" : text,
            chinese: isChinese ? text : "翻译失败",
            phonetics: []
        };
    }
}