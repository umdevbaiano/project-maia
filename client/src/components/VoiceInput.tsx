import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    isListening?: boolean;
    className?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, className }) => {
    const [isListening, setIsListening] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'pt-BR';

            recognitionRef.current.onresult = (event: any) => {
                let interim = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        onTranscript(event.results[i][0].transcript);
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }
                setInterimTranscript(interim);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                setInterimTranscript('');
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [onTranscript]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setIsListening(true);
            recognitionRef.current?.start();
        }
    };

    if (!recognitionRef.current && typeof window !== 'undefined') {
        return null; // Speech recognition not supported
    }

    return (
        <div className={`relative flex items-center ${className}`}>
            <AnimatePresence>
                {isListening && interimTranscript && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute bottom-full mb-4 left-0 right-0 p-4 glass-premium rounded-2xl border-blue-500/30 shadow-2xl z-50"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex gap-1">
                                {[1, 2, 3].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [8, 16, 8] }}
                                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                        className="w-1 bg-blue-500 rounded-full"
                                    />
                                ))}
                            </div>
                            <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest leading-none">Ouvindo Maia...</span>
                        </div>
                        <p className="text-sm text-white/80 italic line-clamp-2">
                            "{interimTranscript}"
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={toggleListening}
                className={`p-3 rounded-xl transition-all flex items-center justify-center ${
                    isListening 
                    ? 'bg-red-500/20 text-red-500 border border-red-500/30' 
                    : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
                }`}
                title={isListening ? 'Parar Ditado' : 'Ditado por Voz'}
            >
                {isListening ? (
                    <div className="relative">
                        <MicOff className="w-5 h-5" />
                        <motion.div 
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-0 bg-red-500 rounded-full -z-10"
                        />
                    </div>
                ) : (
                    <Mic className="w-5 h-5" />
                )}
            </button>
        </div>
    );
};

export default VoiceInput;
