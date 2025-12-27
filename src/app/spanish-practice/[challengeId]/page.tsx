'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { openAIService } from '@/services/openaiService';
import { challengeService } from '@/services/challengeService';
import Modal from '@/components/Modal';
import Link from 'next/link';

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
    onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

declare global {
    interface Window {
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    feedback?: {
        type: 'perfect' | 'error' | 'suggestion';
        suggestions?: string[];
    };
}

type PracticeType = 'Entrevista' | 'Gramática' | 'Vocabulario' | 'Pronunciación' | 'Negocios';
export default function SpanishPracticePage() {
    const { isDarkMode } = useTheme();
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const challengeId = params.challengeId as string;
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'system',
            content: 'Eres un asistente que ayuda a practicar español. Debes ser amable, paciente y proporcionar retroalimentación constructiva.'
        },
        {
            role: 'assistant',
            content: "¡Hola! Soy tu asistente de práctica de español. Te ayudaré a mejorar tu español a través de la conversación. ¿Qué te gustaría practicar hoy? Podemos trabajar en:"
        }
    ]);
    const [expandedSuggestions, setExpandedSuggestions] = useState<{ [key: number]: boolean }>({});
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [conversationStarted, setConversationStarted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentStepId, setCurrentStepId] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const initializeSpeechRecognition = () => {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'es-ES';

            recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
                const transcript = Array.from(event.results)
                    .map((result) => result[0])
                    .map((result) => result.transcript)
                    .join('');

                setInput(transcript);
            };

            recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    };

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        initializeSpeechRecognition();
    }, []);

    if (status === 'loading') {
        return (
            <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in your browser');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setInput('');
            recognitionRef.current.start();
        }
        setIsListening(!isListening);
    };

    const handlePracticeTypeSelection = async (type: PracticeType) => {
        setLoading(true);
        setError(null);
        let context = '';
        switch (type) {
            case 'Entrevista':
                context = 'entrevista';
                break;
            case 'Gramática':
                context = 'gramatica';
                break;
            case 'Vocabulario':
                context = 'vocabulario';
                break;
            case 'Pronunciación':
                context = 'pronunciacion';
                break;
            case 'Negocios':
                context = 'negocios';
                break;
        }

        try {
            // Verificar límites de uso
            const usageLimits = await challengeService.checkUsageLimits('spanish');
            if (!usageLimits.success) {
                setModalMessage(usageLimits.message);
                setIsModalOpen(true);
                setError(usageLimits.message);
                return;
            }

            const result = await openAIService.generateSpanishConversation(context, 'avanzado', messages);

            // Verificar si result.conversation existe y tiene elementos
            const assistantMessage = result.conversation && result.conversation.length > 0
                ? result.conversation[result.conversation.length - 1].content
                : "Te ayudaré a practicar " + context + ". Empecemos!";

            setMessages(prev => [
                ...prev,
                {
                    role: 'user',
                    content: `Quiero practicar ${context}.`
                },
                {
                    role: 'assistant',
                    content: assistantMessage
                }
            ]);

            setConversationStarted(true);
            setCurrentStepId(prev => 1 + prev);
        } catch (error) {
            console.error('Error:', error);
            setError('Ocurrió un error al generar la conversación. Por favor, intenta de nuevo.');
        }

        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        }

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);
        setError(null);

        try {
            // Verificar límites de uso
            const usageLimits = await challengeService.checkUsageLimits('spanish');
            if (!usageLimits.success) {
                setModalMessage(usageLimits.message);
                setIsModalOpen(true);
                setError(usageLimits.message);
                return;
            }

            // Primero verificamos la gramática
            const grammarResult = await openAIService.checkSpanishGrammar(userMessage);
            console.log('grammarResult', grammarResult);
            // Luego generamos una conversación basada en el contexto y el historial
            const conversationResult = await openAIService.generateSpanishConversation(
                userMessage,
                'avanzado',
                messages
            );

            if (!conversationResult?.conversation?.length) {
                throw new Error('No se pudo generar una respuesta válida');
            }

            // Procesamos la respuesta
            const feedbackType = grammarResult.errors.length === 0
                ? 'perfect'
                : (grammarResult.errors.some(error => error.type === 'grammar') ? 'error' : 'suggestion');

            const assistantMessage: Message = {
                role: 'assistant',
                content: conversationResult.conversation[conversationResult.conversation.length - 1].content,
                feedback: {
                    type: feedbackType,
                    suggestions: [
                        ...grammarResult.suggestions,
                    ]
                }
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Enviamos el feedback al backend
            await challengeService.updateChallengeFeedback(challengeId, {
                stepId: currentStepId,
                feedback: {
                    type: feedbackType
                },
                type: 'spanish'
            });
            // Incrementamos el stepId para el próximo mensaje
            setCurrentStepId(prev => prev + 1);

        } catch (error) {
            console.error('Error:', error);
            setError('Ocurrió un error al generar la conversación. Por favor, intenta de nuevo.');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
                feedback: {
                    type: 'error',
                    suggestions: ['Intenta de nuevo en unos momentos.']
                }
            }]);
        }

        setLoading(false);
    };

    const toggleSuggestions = (index: number) => {
        setExpandedSuggestions(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const getMessageColor = (message: Message) => {
        if (message.role === 'user') {
            return isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white';
        }
        return isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800';
    };

    const getSuggestionColor = (type: 'perfect' | 'error' | 'suggestion') => {
        switch (type) {
            case 'perfect':
                return isDarkMode ? 'bg-emerald-500/20 text-emerald-200' : 'bg-emerald-400/20 text-emerald-700';
            case 'error':
                return isDarkMode ? 'bg-pink-600/20 text-pink-200' : 'bg-pink-500/20 text-pink-700';
            case 'suggestion':
                return isDarkMode ? 'bg-yellow-500/20 text-yellow-200' : 'bg-yellow-50 text-yellow-700';
        }
    };

    return (
        <div className={`flex flex-col h-[calc(100vh-4rem)] ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-3xl mx-auto">
                    {messages.filter(message => message.role !== 'system').map((message, index) => (
                        <div
                            key={index}
                            className={`mb-6 ${message.role === 'assistant' ? 'mr-12' : 'ml-12'}`}
                        >
                            <div
                                className={`rounded-lg p-4 ${getMessageColor(message)}`}
                            >
                                <p className="whitespace-pre-wrap">{message.content}</p>
                                {message.feedback?.suggestions && message.feedback.suggestions.length > 0 && (
                                    <div className="mt-2">
                                        {message.feedback?.type === 'perfect' ? (
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <svg
                                                    className={`w-4 h-5 ${isDarkMode ? 'text-emerald-500' : 'text-emerald-400'}`}
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M5 12l5 5 9-9 M5 19l5 5 9-9"
                                                    />
                                                </svg>
                                                <span className={`${isDarkMode ? 'text-emerald-500' : 'text-emerald-400'}`}>
                                                    ¡Estupendo!
                                                </span>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => toggleSuggestions(index)}
                                                    className="flex items-center gap-2 text-sm font-medium hover:opacity-80"
                                                >
                                                    <div className={`w-2.5 h-2.5 rounded-full ${message.feedback?.type === 'error'
                                                        ? isDarkMode ? 'bg-pink-600' : 'bg-pink-500'
                                                        : isDarkMode ? 'bg-yellow-500' : 'bg-yellow-400'
                                                        }`} />
                                                    <span>Sugerencias</span>
                                                    <svg
                                                        className={`w-4 h-4 transform transition-transform ${expandedSuggestions[index] ? 'rotate-180' : ''
                                                            }`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 9l-7 7-7-7"
                                                        />
                                                    </svg>
                                                </button>
                                                {expandedSuggestions[index] && message.feedback?.type && (
                                                    <div className={`mt-2 p-3 rounded-lg ${getSuggestionColor(message.feedback.type)}`}>
                                                        <ul className="space-y-1">
                                                            {message.feedback.suggestions.map((suggestion, idx) => (
                                                                <li key={idx} className="text-sm">
                                                                    • {suggestion}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Opciones de práctica si no se ha seleccionado ninguna */}
                    {!conversationStarted && messages.length === 2 && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <button
                                onClick={() => handlePracticeTypeSelection('Entrevista')}
                                disabled={loading}
                                className={`p-4 rounded-lg text-left transition-all ${isDarkMode
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                    : 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm'
                                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <h3 className="font-medium mb-1">Entrevista de Trabajo en Desarrollo de Software</h3>
                                <p className="text-sm opacity-80">Practica entrevistas técnicas de desarrollo de software</p>
                            </button>

                            <button
                                onClick={() => handlePracticeTypeSelection('Gramática')}
                                disabled={loading}
                                className={`p-4 rounded-lg text-left transition-all ${isDarkMode
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                    : 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm'
                                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <h3 className="font-medium mb-1">Práctica de Gramática</h3>
                                <p className="text-sm opacity-80">Enfoque en las reglas gramaticales y estructuras</p>
                            </button>

                            <button
                                onClick={() => handlePracticeTypeSelection('Vocabulario')}
                                disabled={loading}
                                className={`p-4 rounded-lg text-left transition-all ${isDarkMode
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                    : 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm'
                                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <h3 className="font-medium mb-1">Construcción de Vocabulario</h3>
                                <p className="text-sm opacity-80">Aprende nuevas palabras y expresiones</p>
                            </button>

                            <button
                                onClick={() => handlePracticeTypeSelection('Pronunciación')}
                                disabled={loading}
                                className={`p-4 rounded-lg text-left transition-all ${isDarkMode
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                    : 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm'
                                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <h3 className="font-medium mb-1">Consejos de Pronunciación</h3>
                                <p className="text-sm opacity-80">Mejora tu pronunciación</p>
                            </button>

                            <button
                                onClick={() => handlePracticeTypeSelection('Negocios')}
                                disabled={loading}
                                className={`p-4 rounded-lg text-left transition-all ${isDarkMode
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                    : 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm'
                                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <h3 className="font-medium mb-1">Español de Negocios</h3>
                                <p className="text-sm opacity-80">Practica español de negocios</p>
                            </button>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Formulario de entrada */}
            <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                    {error && (
                        <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-600'}`}>
                            {error}
                        </div>
                    )}
                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="Escribe tu mensaje en inglés... (Enter para enviar, Shift+Enter para nueva línea)"
                            rows={3}
                            className={`w-full p-4 pr-24 rounded-lg resize-none ${isDarkMode
                                ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                                : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
                                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            disabled={loading || !conversationStarted}
                        />
                        <div className="absolute right-2 top-2 flex gap-2">
                            <button
                                type="button"
                                onClick={toggleListening}
                                className={`p-2 rounded-lg ${isDarkMode
                                    ? isListening
                                        ? 'bg-pink-500 text-white'
                                        : 'bg-gray-600 text-gray-300 hover:text-white'
                                    : isListening
                                        ? 'bg-pink-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                                    }`}
                                disabled={!conversationStarted}
                            >
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                                    />
                                </svg>
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !conversationStarted}
                                className={`p-2 rounded-lg ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                                    } ${(loading || !conversationStarted) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="h-6 w-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 5l7 7-7 7M5 5l7 7-7 7"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Límite de Uso Alcanzado"
            >
                <div className="space-y-4">
                    <p className="text-gray-700">{modalMessage}</p>
                    <p className="text-gray-700">Actualiza tu plan y sigue disfrutando de todos los beneficios</p>
                    <Link
                        href="/plans"
                        className={`inline-flex items-center px-4 py-2 rounded-lg text-white font-medium transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                    >
                        Actualizar ahora
                        <svg
                            className="ml-2 w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                        </svg>
                    </Link>
                </div>
            </Modal>
        </div>
    );
} 