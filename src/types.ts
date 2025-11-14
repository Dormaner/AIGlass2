
export interface Phonetic {
    word: string;
    ipa: string;
}

export interface ChatMessage {
    id: string;
    speaker: 'user' | 'ai';
    english: string;
    chinese: string;
    phonetic?: Phonetic[];
    isFinal: boolean;
}

export type AppStatus = 'idle' | 'permission_needed' | 'ready' | 'initializing' | 'listening' | 'speaking' | 'error';

export interface EnrichmentData {
    english: string;
    chinese: string;
    phonetics: Phonetic[];
}

export type Difficulty = 'elementary' | 'middle_school' | 'high_school' | 'university';