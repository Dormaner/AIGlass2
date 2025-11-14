
import React, { useState, useRef, useEffect, useCallback } from 'react';
// Fix: Removed non-exported `LiveSession` from import.
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import type { ChatMessage, AppStatus, Difficulty } from './types';
import { CameraFeed } from './components/CameraFeed';
import { ConversationView } from './components/ConversationView';
import { Controls } from './components/Controls';
import { StartScreen } from './components/StartScreen';
import { getSceneDescription, enrichTranscription } from './services/geminiService';
import { decode, decodeAudioData, encode } from './utils/audio';
import { SettingsIcon, SwitchCameraIcon } from './components/Icons';
import { SettingsScreen } from './components/SettingsScreen';

// Fix: The LiveSession type is not exported from the library, so we define a minimal interface based on its usage.
interface LiveSession {
    sendRealtimeInput(input: { text?: string; media?: { data: string; mimeType: string; } }): void;
    close(): void;
}

const App: React.FC = () => {
    const [status, setStatus] = useState<AppStatus>('idle');
    const [conversation, setConversation] = useState<ChatMessage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [hasPermissions, setHasPermissions] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [difficulty, setDifficulty] = useState<Difficulty>('middle_school');
    const [speechRate, setSpeechRate] = useState(1.0);


    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const aiRef = useRef<GoogleGenAI | null>(null);
    const sessionRef = useRef<LiveSession | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const microphoneStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const frameIntervalRef = useRef<number | null>(null);

    const currentInputTranscription = useRef('');
    const currentOutputTranscription = useRef('');
    const nextAudioStartTime = useRef(0);
    const audioQueue = useRef<Set<AudioBufferSourceNode>>(new Set());
    
    const isEnrichingRef = useRef(false);
    const enrichmentQueueRef = useRef<{ text: string; speaker: 'user' | 'ai'; messageId: string }[]>([]);
    const currentUserMessageIdRef = useRef<string | null>(null);
    const currentAiMessageIdRef = useRef<string | null>(null);

    const speechRateRef = useRef(speechRate);
    useEffect(() => {
        speechRateRef.current = speechRate;
    }, [speechRate]);

    const conversationRef = useRef(conversation);
    useEffect(() => {
        conversationRef.current = conversation;
    }, [conversation]);


    useEffect(() => {
      if (process.env.API_KEY) {
          aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
      }
    }, []);

    const setupMediaStream = useCallback(async (mode: 'user' | 'environment') => {
        if (microphoneStreamRef.current) {
            microphoneStreamRef.current.getTracks().forEach(track => track.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: true });
        microphoneStreamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
        return stream;
    }, []);

    useEffect(() => {
        if (status === 'initializing' && !hasPermissions) {
            const requestPermissions = async () => {
                try {
                    await setupMediaStream('user');
                    setHasPermissions(true);
                    setStatus('ready');
                } catch (err) {
                    setError('权限被拒绝或摄像头不可用。请在浏览器设置中允许访问。');
                    console.error(err);
                    setHasPermissions(false);
                    setStatus('idle');
                }
            };
            requestPermissions();
        }
    }, [status, hasPermissions, setupMediaStream]);


    const handleStart = () => {
        setError(null);
        setStatus('initializing');
    };

    const switchCamera = useCallback(async () => {
        if (status !== 'ready' && status !== 'listening') return;

        const newMode = facingMode === 'user' ? 'environment' : 'user';

        try {
            if (!microphoneStreamRef.current) {
                await setupMediaStream(newMode);
                setFacingMode(newMode);
                return;
            }

            const newVideoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newMode } });
            const newVideoTrack = newVideoStream.getVideoTracks()[0];

            const currentVideoTrack = microphoneStreamRef.current.getVideoTracks()[0];
            if (currentVideoTrack) {
                microphoneStreamRef.current.removeTrack(currentVideoTrack);
                currentVideoTrack.stop();
            }
            microphoneStreamRef.current.addTrack(newVideoTrack);
            setFacingMode(newMode);

        } catch (err) {
            setError('无法切换摄像头。');
            console.error(err);
        }
    }, [status, facingMode, setupMediaStream]);

    const captureFrame = useCallback((): string | null => {
        if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        }
        return null;
    }, []);

    const processEnrichmentQueue = useCallback(async () => {
        if (isEnrichingRef.current || enrichmentQueueRef.current.length === 0 || !aiRef.current) {
            return;
        }

        isEnrichingRef.current = true;
        const { messageId, text } = enrichmentQueueRef.current.shift()!;

        try {
            const currentConversation = conversationRef.current;
            const currentMessageIndex = currentConversation.findIndex(msg => msg.id === messageId);
            const history = currentMessageIndex > 0 ? currentConversation.slice(Math.max(0, currentMessageIndex - 4), currentMessageIndex) : [];
            const historyForApi = history.map(msg => ({ speaker: msg.speaker, english: msg.english }));

            const enrichment = await enrichTranscription(aiRef.current, text, historyForApi);
            setConversation(prev => prev.map(msg =>
                msg.id === messageId
                    ? { ...msg, english: enrichment.english, chinese: enrichment.chinese, phonetic: enrichment.phonetics, isFinal: true }
                    : msg
            ));
        } catch (e) {
            console.error("Enrichment failed:", e);
             setConversation(prev => prev.map(msg =>
                msg.id === messageId ? { ...msg, chinese: '翻译失败', isFinal: true } : msg
            ));
        } finally {
            isEnrichingRef.current = false;
            processEnrichmentQueue();
        }
    }, []);

    const addToEnrichmentQueue = useCallback((text: string, speaker: 'user' | 'ai', messageId: string) => {
        enrichmentQueueRef.current.push({ text, speaker, messageId });
        processEnrichmentQueue();
    }, [processEnrichmentQueue]);
    
    const stopAudioPlayback = () => {
        audioQueue.current.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                console.warn('Could not stop audio source', e);
            }
        });
        audioQueue.current.clear();
        nextAudioStartTime.current = 0;
    };

    const handleSendText = useCallback(async (text: string) => {
        if (!sessionRef.current || status !== 'listening') return;

        const messageId = `user-${Date.now()}`;
        const userMessage: ChatMessage = {
            id: messageId,
            speaker: 'user',
            english: text,
            chinese: '...',
            isFinal: false,
        };
        setConversation(prev => [...prev, userMessage]);

        sessionRef.current.sendRealtimeInput({ text });
        
        try {
            const history = conversation.slice(-4);
            const historyForApi = history.map(msg => ({ speaker: msg.speaker, english: msg.english }));
            const enriched = await enrichTranscription(aiRef.current!, text, historyForApi);
            setConversation(prev => prev.map(msg => 
                msg.id === messageId ? { ...msg, ...enriched, isFinal: true } : msg
            ));
        } catch(e) {
            console.error("Failed to enrich typed message", e);
             setConversation(prev => prev.map(msg => 
                msg.id === messageId ? { ...msg, chinese: '翻译失败', isFinal: true } : msg
            ));
        }

    }, [status, conversation]);

    const startSession = async () => {
        if (!hasPermissions || !aiRef.current) return;
        setError(null);
        setStatus('initializing');
        setConversation([]);

        const base64Image = captureFrame();
        if (!base64Image) {
            setError('无法从摄像头捕捉画面。');
            setStatus('ready');
            return;
        }
        
        try {
            const sceneDescription = await getSceneDescription(aiRef.current, base64Image);

            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            
            const difficultyMap: Record<Difficulty, string> = {
                elementary: 'elementary school',
                middle_school: 'middle school',
                high_school: 'high school',
                university: 'university',
            };

            const systemInstruction = `You are a friendly and patient English speaking practice teacher for a Chinese ${difficultyMap[difficulty]} student. Your goal is to help them practice English.
            Start a conversation based on what you see in this initial scene: "${sceneDescription}".
            You will receive a continuous stream of updated images from the camera at roughly one frame per second. Use this live visual feed to keep the conversation dynamic and relevant to what is currently happening.
            The student may speak or type in English or Chinese. 
            - If they use English, continue the conversation naturally.
            - If they use Chinese, understand their meaning, but gently guide them to express the same idea in English. For example, you could say "That's a good point. How would you say that in English?" or provide the English equivalent and then ask a follow-up question.
            Always keep your own responses in English. Keep your sentences clear and suitable for a ${difficultyMap[difficulty]} learner. Ask questions to encourage the student to respond.`;

            const sessionPromise = aiRef.current.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction,
                },
                callbacks: {
                    onopen: () => {
                       const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                       const source = inputAudioContext.createMediaStreamSource(microphoneStreamRef.current!);
                       scriptProcessorRef.current = inputAudioContext.createScriptProcessor(4096, 1, 1);
                       scriptProcessorRef.current.onaudioprocess = (event) => {
                           const inputData = event.inputBuffer.getChannelData(0);
                           const pcmBlob = { data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)), mimeType: 'audio/pcm;rate=16000' };
                           sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                       };
                       source.connect(scriptProcessorRef.current);
                       scriptProcessorRef.current.connect(inputAudioContext.destination);
                       setStatus('listening');

                       if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
                       frameIntervalRef.current = window.setInterval(() => {
                           const frame = captureFrame();
                           if (frame) {
                               sessionPromise.then(session => {
                                   session.sendRealtimeInput({ media: { data: frame, mimeType: 'image/jpeg' } });
                               });
                           }
                       }, 1000);
                    },
                    // Fix: Refactored `onmessage` to handle transcription updates without `messageId` or `isFinal` on the transcription object.
                    // This now relies on `turnComplete` to finalize transcriptions and trigger enrichment.
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            if (text) {
                                if (currentUserMessageIdRef.current) {
                                    currentInputTranscription.current += text;
                                    setConversation(prev => prev.map(m =>
                                        m.id === currentUserMessageIdRef.current
                                            ? { ...m, english: currentInputTranscription.current }
                                            : m
                                    ));
                                } else {
                                    const messageId = `user-${Date.now()}`;
                                    currentUserMessageIdRef.current = messageId;
                                    currentInputTranscription.current = text;
                                    setConversation(prev => [
                                        ...prev,
                                        { id: messageId, speaker: 'user', english: text, chinese: '...', isFinal: false }
                                    ]);
                                }
                            }
                        }

                        if (message.serverContent?.outputTranscription) {
                             const text = message.serverContent.outputTranscription.text;
                             if (text) {
                                if (currentAiMessageIdRef.current) {
                                    currentOutputTranscription.current += text;
                                    setConversation(prev => prev.map(m =>
                                        m.id === currentAiMessageIdRef.current
                                            ? { ...m, english: currentOutputTranscription.current }
                                            : m
                                    ));
                                } else {
                                    const messageId = `ai-${Date.now()}`;
                                    currentAiMessageIdRef.current = messageId;
                                    currentOutputTranscription.current = text;
                                    setConversation(prev => [
                                        ...prev,
                                        { id: messageId, speaker: 'ai', english: text, chinese: '...', isFinal: false }
                                    ]);
                                }
                            }
                        }
                        
                        if (message.serverContent?.turnComplete) {
                            if (currentUserMessageIdRef.current) {
                                addToEnrichmentQueue(currentInputTranscription.current, 'user', currentUserMessageIdRef.current);
                            }
                            if (currentAiMessageIdRef.current) {
                                addToEnrichmentQueue(currentOutputTranscription.current, 'ai', currentAiMessageIdRef.current);
                            }
                            
                            currentInputTranscription.current = '';
                            currentUserMessageIdRef.current = null;
                            currentOutputTranscription.current = '';
                            currentAiMessageIdRef.current = null;
                        }

                        if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                            const audioData = message.serverContent.modelTurn.parts[0].inlineData.data;
                            const audioBuffer = await decodeAudioData(decode(audioData), audioContextRef.current!, 24000, 1);
                            
                            const now = audioContextRef.current!.currentTime;
                            const startTime = Math.max(now, nextAudioStartTime.current);
                            
                            const source = audioContextRef.current!.createBufferSource();
                            source.buffer = audioBuffer;
                            source.playbackRate.value = speechRateRef.current;
                            source.connect(audioContextRef.current!.destination);
                            source.start(startTime);
                            
                            nextAudioStartTime.current = startTime + audioBuffer.duration;
                            audioQueue.current.add(source);
                            source.onended = () => audioQueue.current.delete(source);
                        }
                        
                        if (message.serverContent?.interrupted) {
                            stopAudioPlayback();
                        }

                    },
                    onerror: (e) => {
                        console.error('Session error:', e);
                        setError('会话出错。请重试。');
                        setStatus('ready');
                    },
                    onclose: () => {
                       if(status !== 'idle' && status !== 'ready') {
                         setStatus('ready');
                       }
                    }
                }
            });

            sessionRef.current = await sessionPromise;

        } catch (e) {
            console.error(e);
            setError('无法开始会话。请检查您的API密钥和网络连接。');
            setStatus('ready');
        }
    };

    const endSession = useCallback(() => {
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }
        sessionRef.current?.close();
        sessionRef.current = null;
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        stopAudioPlayback();
        setConversation([]);
        currentInputTranscription.current = '';
        currentOutputTranscription.current = '';
        enrichmentQueueRef.current = [];
        isEnrichingRef.current = false;
        currentUserMessageIdRef.current = null;
        currentAiMessageIdRef.current = null;
        if (hasPermissions) {
          setStatus('ready');
        } else {
          setStatus('idle');
        }
    }, [hasPermissions]);

    return (
        <div className="relative w-screen h-screen bg-black overflow-hidden flex flex-col font-orbitron">
            {status === 'idle' ? (
                <StartScreen onStart={handleStart} error={error} onOpenSettings={() => setIsSettingsOpen(true)}/>
            ) : (
                <>
                    <div className="relative flex-1 min-h-0">
                        <CameraFeed ref={videoRef} facingMode={facingMode} />
                        <div className="absolute top-4 right-4 z-20 flex gap-2">
                             <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="p-3 rounded-full bg-black/50 border-2 border-pink-400 text-pink-300 hover:bg-pink-500/40 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
                                aria-label="Open Settings"
                            >
                                <SettingsIcon className="w-6 h-6" />
                            </button>
                            {(status === 'ready' || status === 'listening') && (
                                <button
                                    onClick={switchCamera}
                                    className="p-3 rounded-full bg-black/50 border-2 border-cyan-400 text-cyan-300 hover:bg-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all"
                                    aria-label="Switch Camera"
                                >
                                    <SwitchCameraIcon className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none"></div>
                         <header className="absolute top-0 left-0 right-0 p-4 md:p-8 z-10">
                            <h1 className="text-2xl md:text-4xl font-bold text-cyan-300 tracking-widest uppercase" style={{textShadow: '0 0 8px #0891b2'}}>
                                Cyberpunk English Tutor AI
                            </h1>
                        </header>
                    </div>

                    <footer className="flex-shrink-0 flex flex-col items-center justify-end gap-4 p-4 md:p-8 pt-2 bg-black">
                        <ConversationView conversation={conversation} />
                        <Controls 
                            status={status} 
                            error={error} 
                            onStartSession={startSession} 
                            onEndSession={endSession} 
                            onSendText={handleSendText}
                        />
                    </footer>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                </>
            )}
             <SettingsScreen 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                speechRate={speechRate}
                setSpeechRate={setSpeechRate}
            />
        </div>
    );
};

export default App;
