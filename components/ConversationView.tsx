import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { AiIcon, UserIcon } from './Icons';

interface ConversationViewProps {
    conversation: ChatMessage[];
}

const renderEnglishWithPhonetics = (message: ChatMessage) => {
    if (!message.phonetic || message.phonetic.length === 0) {
        return <p className="text-lg md:text-xl">{message.english}</p>;
    }

    let enrichedText = message.english;
    // Create a regex to find all occurrences of the words, case-insensitive
    message.phonetic.forEach(p => {
        const regex = new RegExp(`\\b(${p.word})\\b`, 'gi');
        enrichedText = enrichedText.replace(regex, `$1 <span class="text-cyan-300 font-orbitron">[${p.ipa}]</span>`);
    });

    return <p className="text-lg md:text-xl" dangerouslySetInnerHTML={{ __html: enrichedText }}></p>;
};


export const ConversationView: React.FC<ConversationViewProps> = ({ conversation }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // A slight delay can make the scroll more reliable after render.
        setTimeout(() => {
            endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, [conversation]);

    return (
        <div className="w-full max-w-4xl max-h-[35vh] overflow-y-auto p-4 space-y-4 bg-black/30 backdrop-blur-md border border-pink-500/50 rounded-lg shadow-[0_0_15px] shadow-pink-500/30">
            {conversation.map((msg) => {
                const isUser = msg.speaker === 'user';
                return (
                    <div
                        key={msg.id}
                        className={`flex items-start gap-3 transition-opacity duration-300 ${isUser ? '' : 'flex-row-reverse'} ${!msg.isFinal ? 'opacity-60' : 'opacity-100'}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border-2 ${isUser ? 'bg-pink-500/50 border-pink-400' : 'bg-cyan-500/50 border-cyan-400'}`}>
                            {isUser ? <UserIcon className="w-5 h-5 text-pink-200" /> : <AiIcon className="w-5 h-5 text-cyan-200" />}
                        </div>
                        <div className={`p-3 rounded-lg max-w-[80%] ${isUser ? 'bg-gray-700/50' : 'bg-cyan-900/50'}`}>
                            {renderEnglishWithPhonetics(msg)}
                            <p className="text-sm text-gray-400 mt-1">{msg.chinese}</p>
                        </div>
                    </div>
                );
            })}
             <div ref={endOfMessagesRef} />
        </div>
    );
};
