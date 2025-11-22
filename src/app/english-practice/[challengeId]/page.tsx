'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { openAIService } from '@/services/openaiService';
import { challengeService } from '@/services/challengeService';
import Modal from '@/components/Modal';
import Link from 'next/link';
import EnglishProgressChart from '@/components/EnglishProgressChart';
import { MicrophoneIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import io, { Socket } from 'socket.io-client';

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
  role: 'user' | 'assistant';
  content: string;
  feedback?: {
    type: 'perfect' | 'error' | 'suggestion';
    suggestions?: string[];
  };
}

type PracticeType = 'interview' | 'grammar' | 'vocabulary' | 'pronunciation' | 'business' | 'placement';

type ViewType = 'practice' | 'progress' | 'conversations';

export default function EnglishPractice() {
  const { isDarkMode } = useTheme();
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const challengeId = params.challengeId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your English practice assistant. I'll help you improve your English through conversation. What would you like to practice today? We can work on:"
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
  const [currentView, setCurrentView] = useState<ViewType>('practice');
  const [conversationsOpen, setConversationsOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [activeRecommendationTab, setActiveRecommendationTab] = useState<'pronunciation' | 'vocabulary' | 'grammar' | 'fluency'>('pronunciation');
  const [showPlacementTest, setShowPlacementTest] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(240); // 4 minutos en segundos
  const [subtitles, setSubtitles] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const audioPlaybackContextRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSpeechRecognition = () => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

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

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (audioWorkletNodeRef.current) {
        audioWorkletNodeRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (audioPlaybackContextRef.current) {
        audioPlaybackContextRef.current.close().catch(console.error);
      }
    };
  }, []);

  // Manejar el cronómetro
  useEffect(() => {
    if (isRecording && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleStopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRecording, timeRemaining]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para inicializar Socket.IO
  const initializeSocket = () => {
    try {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000/realtime-practice';
      const socket = io(`${socketUrl}`);

      socket.on('connect', () => {
        console.log('Socket.IO conectado');
      });

      socket.on('disconnect', () => {
        console.log('Socket.IO desconectado');
      });

      socket.on('connect_error', (error) => {
        console.error('Error de conexión Socket.IO:', error);
      });

      // Escuchar cuando la sesión esté lista
      socket.on('practice-started', (data) => {
        console.log('Sesión iniciada:', data);
        if (data.sessionId) {
          setSessionId(data.sessionId);
        }
      });

      // Recibir audio del asistente
      socket.on('assistant-audio-chunk', async (data: { audio: string }) => {
        try {
          // Decodificar base64 a ArrayBuffer
          const audioData = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0));
          const audioBuffer = audioData.buffer;

          // Reproducir audio
          if (!audioPlaybackContextRef.current) {
            audioPlaybackContextRef.current = new AudioContext();
          }

          const audioContext = audioPlaybackContextRef.current;
          const decodedAudio = await audioContext.decodeAudioData(audioBuffer);
          const source = audioContext.createBufferSource();
          source.buffer = decodedAudio;
          source.connect(audioContext.destination);
          source.start();
        } catch (error) {
          console.error('Error al reproducir audio del asistente:', error);
        }
      });

      // Recibir transcripción del asistente
      socket.on('assistant-transcript-delta', (data: { text: string }) => {
        if (data.text) {
          setSubtitles(data.text);
        }
      });

      socketRef.current = socket;
      return socket;
    } catch (error) {
      console.error('Error al inicializar Socket.IO:', error);
      return null;
    }
  };

  // Función para convertir Float32Array a base64
  const float32ArrayToBase64 = (float32Array: Float32Array): string => {
    const uint8Array = new Uint8Array(float32Array.buffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  };

  // Función para enviar audio a través del Socket.IO
  const sendAudioToSocket = (audioData: Float32Array) => {
    if (socketRef.current && socketRef.current.connected && sessionId) {
      try {
        // Convertir Float32Array a base64
        const base64Audio = float32ArrayToBase64(audioData);
        
        // Enviar audio chunk
        socketRef.current.emit('audio-chunk', {
          sessionId: sessionId,
          audio: base64Audio
        });
      } catch (error) {
        console.error('Error al enviar audio:', error);
      }
    }
  };

  const handleStartRecording = async () => {
    try {
      // Inicializar Socket.IO
      const socket = initializeSocket();
      if (!socket) {
        alert('No se pudo conectar al servidor. Por favor, intenta de nuevo.');
        return;
      }

      // Obtener userId de la sesión
      const userId = session?.user?.email || session?.user?.token;
      const currentSessionId = `cefr-test-${Date.now()}`;
      setSessionId(currentSessionId);

      // Iniciar práctica en modo test
      socket.emit('start-practice', {
        userId,
        sessionId: currentSessionId,
        language: 'english',
        mode: 'test' // Modo test para placement test
      });

      // Obtener acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000, // OpenAI Realtime recomienda 16kHz
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;

      // Crear AudioContext
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass({
        sampleRate: 16000
      });
      audioContextRef.current = audioContext;

      // Crear AudioContext para reproducción
      audioPlaybackContextRef.current = new AudioContext();

      // Cargar y conectar AudioWorklet
      try {
        await audioContext.audioWorklet.addModule('/audio-processor.js');
      } catch (error) {
        console.error('Error al cargar AudioWorklet:', error);
        alert('Error al inicializar el procesador de audio. Por favor, recarga la página.');
        return;
      }

      // Crear fuente de audio desde el stream
      const source = audioContext.createMediaStreamSource(stream);

      // Crear AudioWorkletNode
      const audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
      audioWorkletNodeRef.current = audioWorkletNode;

      // Escuchar mensajes del AudioWorkletProcessor
      audioWorkletNode.port.onmessage = (event) => {
        if (event.data.type === 'audioData') {
          const audioData = new Float32Array(event.data.data);
          
          console.log('Audio procesado:', {
            length: audioData.length,
            sampleRate: event.data.sampleRate,
            timestamp: new Date().toISOString()
          });

          // Enviar audio al Socket.IO
          sendAudioToSocket(audioData);
        }
      };

      // Conectar el flujo de audio
      source.connect(audioWorkletNode);
      audioWorkletNode.connect(audioContext.destination);

      setSubtitles('Hi! 👋 I\'m Stacy. We\'ll');
      setIsRecording(true);
      console.log('Grabación iniciada con AudioWorklet y Socket.IO');
    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
      alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
    }
  };

  const handleStopRecording = () => {
    // Desconectar AudioWorkletNode
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current = null;
    }

    // Cerrar AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    // Cerrar AudioContext de reproducción
    if (audioPlaybackContextRef.current) {
      audioPlaybackContextRef.current.close().catch(console.error);
      audioPlaybackContextRef.current = null;
    }

    // Detener el stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Desconectar Socket.IO
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsRecording(false);
    setTimeRemaining(240);
    setSubtitles('');
    setSessionId(null);
    
    // Cerrar la vista del placement test y volver a practice
    setShowPlacementTest(false);
    setCurrentView('practice');
  };

  const handleSkipPlacementTest = () => {
    if (isRecording) {
      handleStopRecording();
    }
    setShowPlacementTest(false);
    setTimeRemaining(240);
  };

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
    if (type === 'placement') {
      setShowPlacementTest(true);
      setTimeRemaining(240); // Resetear a 4 minutos
      return;
    }

    setLoading(true);
    setError(null);
    let context = '';
    switch (type) {
      case 'interview':
        context = 'software development job interview';
        break;
      case 'grammar':
        context = 'grammar practice';
        break;
      case 'vocabulary':
        context = 'vocabulary building';
        break;
      case 'pronunciation':
        context = 'pronunciation tips';
        break;
      case 'business':
        context = 'business English';
        break;
    }

    try {
      // Verificar límites de uso
      const usageLimits = await challengeService.checkUsageLimits('english');
      if (!usageLimits.success) {
        setModalMessage(usageLimits.message);
        setIsModalOpen(true);
        setError(usageLimits.message);
        return;
      }

      const result = await openAIService.generateConversation(context, 'intermediate');

      // Verificar si result.conversation existe y tiene elementos
      const assistantMessage = result.conversation && result.conversation.length > 0
        ? result.conversation[result.conversation.length - 1].content
        : "I'll help you practice " + context + ". Let's get started!";

      setMessages(prev => [
        ...prev,
        {
          role: 'user',
          content: `I want to practice ${context}.`
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
      const usageLimits = await challengeService.checkUsageLimits('english');
      if (!usageLimits.success) {
        setModalMessage(usageLimits.message);
        setIsModalOpen(true);
        setError(usageLimits.message);
        return;
      }

      // Primero verificamos la gramática
      const grammarResult = await openAIService.checkGrammar(userMessage);

      // Luego generamos una conversación basada en el contexto
      const conversationResult = await openAIService.generateConversation(
        userMessage,
        'intermediate',
        messages
      );

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
            // ...conversationResult.vocabulary.map(v => `Vocabulary: ${v.word} - ${v.meaning}`)
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
        type: 'english'
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

  // Datos mock para el gráfico de progreso
  const progressData = [
    { skill: 'Pronunciation', score: 19 },
    { skill: 'Vocabulary', score: 47 },
    { skill: 'Grammar', score: 20 },
    { skill: 'Fluency', score: 40 },
    { skill: 'Clarity', score: 65 },
  ];

  // Datos mock de conversaciones
  const conversations = [
    { id: 1, title: 'Software Development Interview', date: '2024-01-15', duration: '15 min' },
    { id: 2, title: 'Grammar Practice', date: '2024-01-14', duration: '10 min' },
    { id: 3, title: 'Vocabulary Building', date: '2024-01-13', duration: '12 min' },
  ];

  // Historiales mock de conversaciones
  const conversationHistory: { [key: number]: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }> } = {
    1: [
      { role: 'assistant', content: "Hello! I'm your English practice assistant. Let's start with a software development interview. Can you tell me about your experience with version control systems?", timestamp: '00:01' },
      { role: 'user', content: "I have experience with Git. I use it daily for my projects.", timestamp: '00:17' },
      { role: 'assistant', content: "Great! Can you explain the difference between Git merge and Git rebase?", timestamp: '00:35' },
      { role: 'user', content: "Merge combines branches and creates a merge commit, while rebase rewrites history.", timestamp: '00:52' },
      { role: 'assistant', content: "Excellent explanation! Let's move on to another topic. How do you handle code reviews in your team?", timestamp: '01:10' },
    ],
    2: [
      { role: 'assistant', content: "Welcome to Grammar Practice! Let's work on verb tenses. Can you complete this sentence: 'By next year, I _____ (work) here for five years.'", timestamp: '00:01' },
      { role: 'user', content: "I will have worked here for five years.", timestamp: '00:20' },
      { role: 'assistant', content: "Perfect! You used the future perfect tense correctly. Let's try another one.", timestamp: '00:38' },
      { role: 'user', content: "I'm ready.", timestamp: '00:45' },
    ],
    3: [
      { role: 'assistant', content: "Let's build your vocabulary! Today we'll focus on technical terms. Can you explain what 'refactoring' means?", timestamp: '00:01' },
      { role: 'user', content: "Refactoring is improving code without changing its functionality.", timestamp: '00:18' },
      { role: 'assistant', content: "Excellent! That's a precise definition. Now, can you tell me what 'technical debt' means?", timestamp: '00:35' },
      { role: 'user', content: "Technical debt is when you take shortcuts that need to be fixed later.", timestamp: '00:52' },
    ],
  };

  // Recomendaciones mock del tutor
  const tutorRecommendations = {
    pronunciation: "Practice sounds /d/ and /tf/. Focus on tricky words like 'changer' to make your speech clearer.",
    vocabulary: "Use more advanced terms and synonyms like 'simple' and 'straightforward' for precision in your speech.",
    grammar: "Your grammar shows basic understanding, but frequent errors in Articles and incomplete sentences like 'The boy is.' hinder clarity.",
    fluency: "Speed up a bit and watch out for 'okay' filler words to help people understand you better.",
  };

  const selectedConversation = selectedConversationId ? conversations.find(c => c.id === selectedConversationId) : null;
  const selectedHistory = selectedConversationId ? conversationHistory[selectedConversationId] || [] : [];

  return (
    <>
      {/* Vista del Placement Test - Pantalla completa */}
      {showPlacementTest && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-purple-900 via-purple-950 to-black flex flex-col items-center justify-center">
          {/* Icono de Closed Captions */}
          <div className="absolute top-4 right-4">
            <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
              <span className="text-white text-xs font-semibold">CC</span>
            </div>
          </div>

          {/* Avatar de Stacy */}
          <div className="mb-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Título */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-semibold text-white mb-2">Assessment Call</h2>
            <p className="text-xl text-gray-300">with Stacy</p>
          </div>

          {/* Cronómetro */}
          <div className="mb-8">
            <div className="w-32 h-32 rounded-full border-4 border-gray-700 flex items-center justify-center bg-gray-900">
              <span className="text-4xl font-bold text-white">{formatTime(timeRemaining)}</span>
            </div>
          </div>

          {/* Descripción */}
          <p className="text-center text-gray-300 mb-12 max-w-md px-4">
            4 minutes call with AI tutor to assess your English and identify key growth areas.
          </p>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              onClick={handleSkipPlacementTest}
              className="px-8 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all flex items-center gap-2"
            >
              {isRecording ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V7zM12 9a1 1 0 10-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
                  </svg>
                  Stop Call
                </>
              ) : (
                <>
                  <MicrophoneIcon className="w-5 h-5" />
                  Start Call
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Vista del Placement Test - Pantalla completa */}
      {showPlacementTest && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-purple-900 via-purple-950 to-black flex flex-col items-center justify-center">
          {/* Icono de Closed Captions */}
          <div className="absolute top-4 right-4">
            <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
              <span className="text-white text-xs font-semibold">CC</span>
            </div>
          </div>

          {/* Avatar de Stacy */}
          <div className="mb-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Título */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-semibold text-white mb-2">Assessment Call</h2>
            <p className="text-xl text-gray-300">with Stacy</p>
          </div>

          {/* Cronómetro */}
          <div className="mb-8">
            <div className="w-32 h-32 rounded-full border-4 border-gray-700 flex items-center justify-center bg-gray-900">
              <span className="text-4xl font-bold text-white">{formatTime(timeRemaining)}</span>
            </div>
          </div>

          {/* Descripción o Subtítulos */}
          {isRecording && subtitles ? (
            <p className="text-center text-white text-lg mb-12 max-w-md px-4">
              {subtitles}
            </p>
          ) : !isRecording ? (
            <p className="text-center text-gray-300 mb-12 max-w-md px-4">
              4 minutes call with AI tutor to assess your English and identify key growth areas.
            </p>
          ) : null}

          {/* Botones */}
          <div className="flex gap-4 items-center justify-center">
            {!isRecording && (
              <button
                onClick={handleSkipPlacementTest}
                className="px-8 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors"
              >
                Skip for now
              </button>
            )}
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`text-white font-medium transition-all flex items-center justify-center ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 w-16 h-16 rounded-lg'
                  : 'px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2'
              }`}
            >
              {isRecording ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white" style={{ transform: 'rotate(135deg)' }}>
                  <path fill="white" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              ) : (
                <>
                  <MicrophoneIcon className="w-5 h-5" />
                  Start Call
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className={`flex h-[calc(100vh-4rem)] ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <div className={`w-64 border-r ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <div className="p-4 space-y-2">
          <button
            onClick={() => setCurrentView('practice')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'practice'
                ? isDarkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : isDarkMode
                  ? 'text-gray-300 hover:bg-gray-800'
                  : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <MicrophoneIcon className="w-5 h-5" />
            <span className="font-medium">Practice</span>
          </button>

          <button
            onClick={() => setCurrentView('progress')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'progress'
                ? isDarkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : isDarkMode
                  ? 'text-gray-300 hover:bg-gray-800'
                  : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ChartBarIcon className="w-5 h-5" />
            <span className="font-medium">Progress</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setConversationsOpen(!conversationsOpen)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'conversations'
                  ? isDarkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDarkMode
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <ClockIcon className="w-5 h-5" />
                <span className="font-medium">Conversations</span>
              </div>
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform ${conversationsOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {conversationsOpen && (
              <div className={`mt-2 ml-4 space-y-1 border-l-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pl-4`}>
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setCurrentView('conversations');
                      setSelectedConversationId(conv.id);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedConversationId === conv.id
                        ? isDarkMode
                          ? 'bg-blue-600/20 text-blue-300 border border-blue-500'
                          : 'bg-blue-50 text-blue-700 border border-blue-300'
                        : isDarkMode
                          ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <div className="font-medium">{conv.title}</div>
                    <div className="text-xs opacity-70">{conv.date} • {conv.duration}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentView === 'practice' && (
          <>
            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto">
          {messages.map((message, index) => (
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
          {!conversationStarted && messages.length === 1 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => handlePracticeTypeSelection('interview')}
                disabled={loading}
                className={`p-4 rounded-lg text-left transition-all ${isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <h3 className="font-medium mb-1">Software Development Interview</h3>
                <p className="text-sm opacity-80">Practice technical development interviews</p>
              </button>

              <button
                onClick={() => handlePracticeTypeSelection('grammar')}
                disabled={loading}
                className={`p-4 rounded-lg text-left transition-all ${isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <h3 className="font-medium mb-1">Grammar Practice</h3>
                <p className="text-sm opacity-80">Focus on grammar rules and structures</p>
              </button>

              <button
                onClick={() => handlePracticeTypeSelection('vocabulary')}
                disabled={loading}
                className={`p-4 rounded-lg text-left transition-all ${isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <h3 className="font-medium mb-1">Vocabulary Building</h3>
                <p className="text-sm opacity-80">Learn new words and expressions</p>
              </button>

              <button
                onClick={() => handlePracticeTypeSelection('pronunciation')}
                disabled={loading}
                className={`p-4 rounded-lg text-left transition-all ${isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <h3 className="font-medium mb-1">Pronunciation Tips</h3>
                <p className="text-sm opacity-80">Improve your pronunciation</p>
              </button>

              <button
                onClick={() => handlePracticeTypeSelection('business')}
                disabled={loading}
                className={`p-4 rounded-lg text-left transition-all ${isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <h3 className="font-medium mb-1">Business English</h3>
                <p className="text-sm opacity-80">Practice professional and business English</p>
              </button>

              <button
                onClick={() => handlePracticeTypeSelection('placement')}
                disabled={loading}
                className={`p-4 rounded-lg text-left transition-all ${isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <h3 className="font-medium mb-1">Take the Placement Test</h3>
                <p className="text-sm opacity-80">Make a 4 minute call and get your real English level</p>
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
          </>
        )}

        {currentView === 'progress' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <EnglishProgressChart
                data={progressData}
                overallScore={32}
                level="Intermediate"
                levelCode="B1"
                speakingTime={114}
              />
            </div>
          </div>
        )}

        {currentView === 'conversations' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Área central - Historial de conversación */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedConversation ? (
                <div className="max-w-3xl mx-auto">
                  {/* Header de la conversación */}
                  <div className="mb-6">
                    <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedConversation.title}
                    </h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedConversation.date} • {selectedConversation.duration} • AI Tutor
                    </p>
                  </div>

                  {/* Historial de mensajes */}
                  <div className="space-y-4">
                    {selectedHistory.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                          <div className={`mb-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {message.role === 'user' ? 'You' : 'AI Tutor'} • {message.timestamp}
                          </div>
                          <div
                            className={`rounded-lg p-4 ${
                              message.role === 'user'
                                ? isDarkMode
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-blue-500 text-white'
                                : isDarkMode
                                  ? 'bg-gray-700 text-white'
                                  : 'bg-white text-gray-800 border border-gray-200'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto">
                  <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Your Conversations
                  </h2>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Selecciona una conversación del menú lateral para ver su historial.
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar derecho - Recomendaciones del tutor */}
            {selectedConversation && (
              <div className={`w-[500px] border-l ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} overflow-y-auto`}>
                <div className="p-6">
                  <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Tutor recommendations
                  </h3>

                  {/* Tabs */}
                  <div className="flex border-b mb-4" style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}>
                    {(['pronunciation', 'vocabulary', 'grammar', 'fluency'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveRecommendationTab(tab)}
                        className={`px-3 py-2 text-sm font-medium capitalize transition-colors ${
                          activeRecommendationTab === tab
                            ? isDarkMode
                              ? 'text-blue-400 border-b-2 border-blue-400'
                              : 'text-blue-600 border-b-2 border-blue-600'
                            : isDarkMode
                              ? 'text-gray-400 hover:text-gray-300'
                              : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Contenido de recomendaciones */}
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {tutorRecommendations[activeRecommendationTab]}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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
    </>
  );
} 