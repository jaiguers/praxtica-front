'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import Link from 'next/link';
import Image from 'next/image';
import EnglishProgressChart from '@/components/EnglishProgressChart';
import { MicrophoneIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import io, { Socket } from 'socket.io-client';


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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your English practice assistant. I'll help you improve your English through conversation. What would you like to practice today? We can work on:"
    }
  ]);
  const [expandedSuggestions, setExpandedSuggestions] = useState<{ [key: number]: boolean }>({});
  const [loading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage] = useState('');
  const [currentView, setCurrentView] = useState<ViewType>('practice');
  const [conversationsOpen, setConversationsOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [activeRecommendationTab, setActiveRecommendationTab] = useState<'pronunciation' | 'vocabulary' | 'grammar' | 'fluency'>('pronunciation');
  const [showPlacementTest, setShowPlacementTest] = useState(false);
  const [showPracticeView, setShowPracticeView] = useState(false);
  const [practiceType, setPracticeType] = useState<PracticeType | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(240); // Tiempo en segundos (240 para test, 0 para practice)
  const [isTestMode, setIsTestMode] = useState(false); // true para test (cuenta atrás), false para practice (cuenta adelante)
  const [fullSubtitles, setFullSubtitles] = useState<string>(''); // Texto completo acumulado
  const [displayedSubtitles, setDisplayedSubtitles] = useState<string>(''); // Texto mostrado gradualmente
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true); // Toggle para CC
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null); // Ref para acceso inmediato al sessionId
  const subtitleAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const audioPlaybackContextRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<Array<{ buffer: AudioBuffer; timestamp: number }>>([]);
  const isPlayingAudioRef = useRef<boolean>(false);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const isUserSpeakingRef = useRef<boolean>(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sincronizar sessionId con el ref (por si se actualiza directamente el estado)
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Efecto para mostrar subtítulos gradualmente
  useEffect(() => {
    if (!showSubtitles || !isRecording) {
      setDisplayedSubtitles('');
      return;
    }

    // Limpiar animación anterior si existe
    if (subtitleAnimationRef.current) {
      clearInterval(subtitleAnimationRef.current);
    }

    // Si el texto completo es más largo que el mostrado, animar
    if (fullSubtitles.length > displayedSubtitles.length) {
      const targetText = fullSubtitles;
      let currentIndex = displayedSubtitles.length;

      subtitleAnimationRef.current = setInterval(() => {
        if (currentIndex < targetText.length) {
          setDisplayedSubtitles(targetText.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          if (subtitleAnimationRef.current) {
            clearInterval(subtitleAnimationRef.current);
            subtitleAnimationRef.current = null;
          }
        }
      }, 30); // Mostrar un carácter cada 30ms (ajustable para velocidad)
    } else if (fullSubtitles.length < displayedSubtitles.length) {
      // Si el texto se redujo (por ejemplo, se reinició), actualizar inmediatamente
      setDisplayedSubtitles(fullSubtitles);
    }

    return () => {
      if (subtitleAnimationRef.current) {
        clearInterval(subtitleAnimationRef.current);
        subtitleAnimationRef.current = null;
      }
    };
  }, [fullSubtitles, showSubtitles, isRecording, displayedSubtitles.length]);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (subtitleAnimationRef.current) {
        clearInterval(subtitleAnimationRef.current);
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

  // Función helper para sincronizar sessionId con el ref
  const updateSessionId = useCallback((newSessionId: string | null) => {
    setSessionId(newSessionId);
    sessionIdRef.current = newSessionId;
  }, []);

  const handleStopRecording = useCallback(() => {
    // Detener reproducción de audio
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
      } catch {
        // Ignorar errores
      }
      currentAudioSourceRef.current = null;
    }

    // Limpiar cola de audio
    audioQueueRef.current = [];
    isPlayingAudioRef.current = false;
    nextPlayTimeRef.current = 0;
    isUserSpeakingRef.current = false;

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
    setIsTestMode(false);
    setTimeRemaining(240); // Resetear a valor por defecto
    setFullSubtitles('');
    setDisplayedSubtitles('');
    setShowSubtitles(true);
    updateSessionId(null);
    
    // Cerrar la vista del placement test o práctica y volver a practice
    setShowPlacementTest(false);
    setShowPracticeView(false);
    setPracticeType(null);
    setCurrentView('practice');
  }, [updateSessionId]);

  // Manejar el cronómetro
  useEffect(() => {
    if (isRecording) {
      // Limpiar intervalo anterior si existe
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (isTestMode) {
            // Modo test: cuenta hacia atrás desde 240 (4 minutos)
            if (prev <= 1) {
              handleStopRecording();
              return 0;
            }
            return prev - 1;
          } else {
            // Modo practice: cuenta hacia adelante desde 0 (sin límite)
            return prev + 1;
          }
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
        timerIntervalRef.current = null;
      }
    };
  }, [isRecording, isTestMode, handleStopRecording]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para convertir PCM16 base64 a AudioBuffer
  const decodePCM16ToAudioBuffer = (base64Audio: string, sampleRate: number = 24000): AudioBuffer | null => {
    try {
      // Decodificar base64 a Uint8Array
      const binaryString = atob(base64Audio);
      let audioBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        audioBytes[i] = binaryString.charCodeAt(i);
      }

      // Asegurar que el buffer tenga un número par de bytes (PCM16 = 2 bytes por sample)
      const byteLength = audioBytes.length;
      if (byteLength % 2 !== 0) {
        console.warn('Audio buffer tiene longitud impar, truncando último byte');
        audioBytes = audioBytes.slice(0, byteLength - 1);
      }

      // Crear Int16Array con alineación correcta (2 bytes por sample)
      const sampleCount = audioBytes.length / 2;
      const int16Array = new Int16Array(audioBytes.buffer, audioBytes.byteOffset, sampleCount);
      
      // Convertir a Float32Array normalizado (-1.0 a 1.0)
      const float32Array = new Float32Array(sampleCount);
      for (let i = 0; i < int16Array.length; i++) {
        // Normalizar de Int16 (-32768 a 32767) a Float32 (-1.0 a 1.0)
        float32Array[i] = Math.max(-1, Math.min(1, int16Array[i] / 32768.0));
      }

      // Crear AudioBuffer
      if (!audioPlaybackContextRef.current) {
        audioPlaybackContextRef.current = new AudioContext({ sampleRate });
      }

      const audioContext = audioPlaybackContextRef.current;
      const audioBuffer = audioContext.createBuffer(1, sampleCount, sampleRate);
      audioBuffer.getChannelData(0).set(float32Array);

      return audioBuffer;
    } catch (error) {
      console.error('Error al decodificar PCM16:', error);
      return null;
    }
  };

  // Función para reproducir audio de la cola secuencialmente
  const playNextAudioChunk = () => {
    if (isUserSpeakingRef.current) {
      // Si el usuario está hablando, pausar la reproducción
      if (currentAudioSourceRef.current) {
        try {
          currentAudioSourceRef.current.stop();
        } catch {
          // Ignorar errores si ya se detuvo
        }
        currentAudioSourceRef.current = null;
      }
      isPlayingAudioRef.current = false;
      return;
    }

    if (audioQueueRef.current.length === 0) {
      isPlayingAudioRef.current = false;
      return;
    }

    if (isPlayingAudioRef.current) {
      return; // Ya hay un chunk reproduciéndose
    }

    const chunk = audioQueueRef.current.shift();
    if (!chunk || !audioPlaybackContextRef.current) {
      isPlayingAudioRef.current = false;
      return;
    }

    try {
      const audioContext = audioPlaybackContextRef.current;
      const source = audioContext.createBufferSource();
      source.buffer = chunk.buffer;
      source.connect(audioContext.destination);

      // Calcular el tiempo de inicio para evitar gaps
      const currentTime = audioContext.currentTime;
      const startTime = Math.max(currentTime, nextPlayTimeRef.current);
      
      source.start(startTime);
      
      // Calcular cuándo terminará este chunk
      const duration = chunk.buffer.duration;
      nextPlayTimeRef.current = startTime + duration;

      currentAudioSourceRef.current = source;
      isPlayingAudioRef.current = true;

      // Cuando termine este chunk, reproducir el siguiente
      source.onended = () => {
        currentAudioSourceRef.current = null;
        isPlayingAudioRef.current = false;
        // Reproducir el siguiente chunk
        setTimeout(() => playNextAudioChunk(), 0);
      };

      console.log('Audio chunk reproducido:', {
        frames: chunk.buffer.length,
        duration: duration.toFixed(3) + 's',
        startTime: startTime.toFixed(3)
      });
    } catch (error) {
      console.error('Error al reproducir chunk:', error);
      isPlayingAudioRef.current = false;
      // Intentar reproducir el siguiente chunk
      setTimeout(() => playNextAudioChunk(), 0);
    }
  };

  // Función para agregar audio a la cola
  const enqueueAudio = (audioBuffer: AudioBuffer, timestamp: number) => {
    audioQueueRef.current.push({ buffer: audioBuffer, timestamp });
    
    // Si no hay nada reproduciéndose, empezar a reproducir
    if (!isPlayingAudioRef.current) {
      playNextAudioChunk();
    }
  };

  // Detectar si el usuario está hablando (VAD básico)
  const detectUserSpeech = (audioData: Float32Array): boolean => {
    // Calcular el nivel de energía del audio
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += Math.abs(audioData[i]);
    }
    const averageLevel = sum / audioData.length;
    
    // Threshold para detectar voz (ajustable)
    const threshold = 0.01; // Ajustar según sea necesario
    
    return averageLevel > threshold;
  };

  // Función para inicializar Socket.IO
  const initializeSocket = (token: string | undefined) => {
    try {
      if (!token) {
        console.error('No se proporcionó token para la conexión Socket.IO');
        return null;
      }

      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000/realtime-practice';
      // Usar auth object (recomendado por Socket.IO) para enviar el token
      const socket = io(socketUrl, {
        auth: {
          token: token
        }
      });

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
          console.log('SessionId recibido del backend:', data.sessionId);
          updateSessionId(data.sessionId);
        } else {
          console.warn('No se recibió sessionId del backend');
        }
      });

      // Recibir audio del asistente
      socket.on('assistant-audio-chunk', async (data: { 
        sessionId: string; 
        audio: string; // Base64 PCM16
        timestamp: number;
      }) => {
        try {
          if (!audioPlaybackContextRef.current) {
            audioPlaybackContextRef.current = new AudioContext({ sampleRate: 24000 });
          }

          // Decodificar PCM16 a AudioBuffer
          const audioBuffer = decodePCM16ToAudioBuffer(data.audio, 24000);
          
          if (!audioBuffer) {
            console.error('No se pudo decodificar el audio');
            return;
          }

          // Agregar a la cola de reproducción
          enqueueAudio(audioBuffer, data.timestamp);

          console.log('Audio chunk recibido y encolado:', {
            sessionId: data.sessionId,
            timestamp: data.timestamp,
            frames: audioBuffer.length,
            duration: audioBuffer.duration.toFixed(3) + 's',
            queueLength: audioQueueRef.current.length
          });
        } catch (error) {
          console.error('Error al procesar audio del asistente:', error);
        }
      });

      // Recibir transcripción del asistente (delta - texto incremental)
      socket.on('assistant-transcript-delta', (data: { text: string }) => {
        if (data.text && showSubtitles) {
          // Acumular el texto completo gradualmente
          setFullSubtitles(prev => {
            const newText = prev + data.text;
            return newText;
          });
        }
      });

      socketRef.current = socket;
      return socket;
    } catch (error) {
      console.error('Error al inicializar Socket.IO:', error);
      return null;
    }
  };

  // Función para convertir Float32Array a PCM16 (Int16Array) y luego a base64
  const float32ArrayToPCM16Base64 = (float32Array: Float32Array): string => {
    // Convertir Float32Array (-1.0 a 1.0) a Int16Array (-32768 a 32767)
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      // Clampear el valor entre -1.0 y 1.0, luego escalar a Int16
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    
    // Convertir Int16Array a Uint8Array (little-endian)
    const uint8Array = new Uint8Array(int16Array.buffer);
    
    // Convertir a base64
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  };

  // Función para enviar audio a través del Socket.IO
  const sendAudioToSocket = (audioData: Float32Array) => {
    // Usar el ref para acceso inmediato al sessionId (sin depender del estado de React)
    const currentSessionId = sessionIdRef.current;
    
    if (socketRef.current && socketRef.current.connected && currentSessionId) {
      try {
        console.log('********** Enviando audio a audio-chunk **********');
        // Convertir Float32Array a PCM16 base64
        const base64Audio = float32ArrayToPCM16Base64(audioData);
        
        // Enviar audio chunk
        socketRef.current.emit('audio-chunk', {
          sessionId: currentSessionId,
          audio: base64Audio
        });
        
        // Log para debugging (solo ocasionalmente para no saturar la consola)
        if (Math.random() < 0.01) { // ~1% de los chunks
          console.log('Audio chunk enviado:', {
            sessionId: currentSessionId,
            samples: audioData.length,
            base64Length: base64Audio.length
          });
        }
      } catch (error) {
        console.error('Error al enviar audio:', error);
      }
    } else {
      // Logs de debugging para identificar qué condición falla
      if (!socketRef.current) {
        console.warn('Socket no inicializado');
      } else if (!socketRef.current.connected) {
        console.warn('Socket no conectado');
      } else if (!currentSessionId) {
        console.warn('SessionId no disponible. sessionIdRef.current:', currentSessionId);
      }
    }
  };

  const handleStartPractice = async () => {
    try {
      // Obtener el token de la sesión
      const token = session?.user?.token;
      if (!token) {
        alert('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
        return;
      }

      // Inicializar Socket.IO con el token
      const socket = initializeSocket(token);
      if (!socket) {
        alert('No se pudo conectar al servidor. Por favor, intenta de nuevo.');
        return;
      }

      // Obtener userId de la sesión
      const userId = session?.user?.email || session?.user?.token;
      const currentSessionId = `practice-${practiceType}-${Date.now()}`;
      updateSessionId(currentSessionId);

      // Determinar el contexto según el tipo de práctica
      let context = '';
      switch (practiceType) {
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
        default:
          context = 'general English practice';
      }

      // Iniciar práctica en modo practice
      socket.emit('start-practice', {
        userId,
        sessionId: currentSessionId,
        language: 'english',
        mode: 'practice', // Modo practice para práctica regular
        context: context
      });

      // Obtener acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
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
          
          // Detectar si el usuario está hablando (VAD)
          const userIsSpeaking = detectUserSpeech(audioData);
          isUserSpeakingRef.current = userIsSpeaking;

          // Si el usuario está hablando, pausar el audio del bot
          if (userIsSpeaking && currentAudioSourceRef.current) {
            try {
              currentAudioSourceRef.current.stop();
              currentAudioSourceRef.current = null;
              isPlayingAudioRef.current = false;
              console.log('Audio del bot pausado - usuario hablando');
            } catch {
              // Ignorar errores
            }
          }

          // Si el usuario dejó de hablar, reanudar reproducción
          if (!userIsSpeaking && !isPlayingAudioRef.current && audioQueueRef.current.length > 0) {
            playNextAudioChunk();
          }

          // Enviar audio al Socket.IO continuamente (el backend necesita el stream completo)
          console.log('********** Enviando audio sendAudioToSocket **********');
          sendAudioToSocket(audioData);
        }
      };

      // Conectar el flujo de audio
      source.connect(audioWorkletNode);
      audioWorkletNode.connect(audioContext.destination);

      setFullSubtitles('Hi! 👋 I\'m Maria. Let\'s practice together!');
      setDisplayedSubtitles('');
      setIsTestMode(false); // Modo practice: cuenta hacia adelante
      setTimeRemaining(0); // Iniciar en 00:00 para modo practice
      setIsRecording(true);
      console.log('Práctica iniciada con AudioWorklet y Socket.IO');
    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
      alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
    }
  };

  const handleStartRecording = async () => {
    try {
      // Obtener el token de la sesión
      const token = session?.user?.token;
      if (!token) {
        alert('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
        return;
      }

      // Inicializar Socket.IO con el token
      const socket = initializeSocket(token);
      if (!socket) {
        alert('No se pudo conectar al servidor. Por favor, intenta de nuevo.');
        return;
      }

      // Obtener userId de la sesión
      const userId = session?.user?.email || session?.user?.token;
      const currentSessionId = `cefr-test-${Date.now()}`;
      updateSessionId(currentSessionId);

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
          
          // Detectar si el usuario está hablando (VAD)
          const userIsSpeaking = detectUserSpeech(audioData);
          isUserSpeakingRef.current = userIsSpeaking;

          // Si el usuario está hablando, pausar el audio del bot
          if (userIsSpeaking && currentAudioSourceRef.current) {
            try {
              currentAudioSourceRef.current.stop();
              currentAudioSourceRef.current = null;
              isPlayingAudioRef.current = false;
              console.log('Audio del bot pausado - usuario hablando');
            } catch {
              // Ignorar errores
            }
          }

          // Si el usuario dejó de hablar, reanudar reproducción
          if (!userIsSpeaking && !isPlayingAudioRef.current && audioQueueRef.current.length > 0) {
            playNextAudioChunk();
          }

          console.log('Audio procesado:', {
            length: audioData.length,
            sampleRate: event.data.sampleRate,
            timestamp: new Date().toISOString(),
            userSpeaking: userIsSpeaking
          });

          // Enviar audio al Socket.IO
          sendAudioToSocket(audioData);
        }
      };

      // Conectar el flujo de audio
      source.connect(audioWorkletNode);
      audioWorkletNode.connect(audioContext.destination);

      setFullSubtitles('Hi! 👋 I\'m Maria. We\'ll');
      setDisplayedSubtitles('');
      setIsTestMode(true); // Modo test: cuenta hacia atrás
      setTimeRemaining(240); // Iniciar en 04:00 para modo test
      setIsRecording(true);
      console.log('Grabación iniciada con AudioWorklet y Socket.IO');
    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
      alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
    }
  };

  const handleSkipPlacementTest = () => {
    if (isRecording) {
      handleStopRecording();
    }
    setShowPlacementTest(false);
    setIsTestMode(false);
    setTimeRemaining(240);
  };

  const handleSkipPractice = () => {
    if (isRecording) {
      handleStopRecording();
    }
    setShowPracticeView(false);
    setIsTestMode(false);
    setTimeRemaining(240);
  };

  // Función para obtener el título según el tipo de práctica
  const getPracticeTitle = (type: PracticeType | null): string => {
    switch (type) {
      case 'interview':
        return 'Software Development Interview';
      case 'grammar':
        return 'Grammar Practice';
      case 'vocabulary':
        return 'Vocabulary Building';
      case 'pronunciation':
        return 'Pronunciation Tips';
      case 'business':
        return 'Business English';
      case 'placement':
        return 'Assessment Call';
      default:
        return 'Practice Call';
    }
  };

  // Función para obtener la descripción según el tipo de práctica
  const getPracticeDescription = (type: PracticeType | null): string => {
    switch (type) {
      case 'interview':
        return 'Practice technical development interviews with AI tutor Maria.';
      case 'grammar':
        return 'Focus on grammar rules and structures with personalized feedback.';
      case 'vocabulary':
        return 'Learn new words and expressions to expand your vocabulary.';
      case 'pronunciation':
        return 'Improve your pronunciation with real-time feedback and tips.';
      case 'business':
        return 'Practice professional and business English for workplace communication.';
      case 'placement':
        return '4 minutes call with AI tutor to assess your English and identify key growth areas.';
      default:
        return 'Practice your English with AI tutor Maria.';
    }
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


  const handlePracticeTypeSelection = async (type: PracticeType) => {
    setPracticeType(type);
    
    if (type === 'placement') {
      setIsTestMode(true); // Modo test: cuenta hacia atrás
      setTimeRemaining(240); // Iniciar en 04:00 para test
      setShowPlacementTest(true);
    } else {
      // Para los otros tipos de práctica, mostrar la vista de práctica
      setIsTestMode(false); // Modo practice: cuenta hacia adelante
      setTimeRemaining(0); // Iniciar en 00:00 para practice
      setShowPracticeView(true);
    }
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
      {/* Vista unificada para Placement Test y Práctica - Pantalla completa */}
      {(showPlacementTest || showPracticeView) && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-purple-900 via-purple-950 to-black flex flex-col items-center justify-center">
          {/* Avatar de Maria con botón CC */}
          <div className="mb-8 relative inline-block">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-300 to-purple-400 flex items-center justify-center overflow-hidden shadow-lg">
              <Image
                src="/images/maria-avatar.png"
                alt="Maria"
                width={128}
                height={128}
                className="w-full h-full object-cover rounded-full"
                priority
              />
            </div>
            {/* Icono de Closed Captions - Toggle */}
            <div className="absolute -top-2 -right-2">
              <button
                onClick={() => setShowSubtitles(!showSubtitles)}
                className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                  showSubtitles 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={showSubtitles ? 'Ocultar subtítulos' : 'Mostrar subtítulos'}
              >
                <span className="text-white text-xs font-semibold">CC</span>
              </button>
            </div>
          </div>

          {/* Título */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-semibold text-white mb-2">{getPracticeTitle(practiceType)}</h2>
            <p className="text-xl text-gray-300">with Maria</p>
          </div>

          {/* Cronómetro */}
          <div className="mb-8">
            <div className="w-32 h-32 rounded-full border-4 border-gray-700 flex items-center justify-center bg-gray-900">
              <span className="text-4xl font-bold text-white">{formatTime(timeRemaining)}</span>
            </div>
          </div>

          {/* Descripción o Subtítulos */}
          {isRecording && showSubtitles && displayedSubtitles ? (
            <p className="text-center text-white text-lg mb-12 max-w-md px-4">
              {displayedSubtitles}
            </p>
          ) : !isRecording ? (
            <p className="text-center text-gray-300 mb-12 max-w-md px-4">
              {getPracticeDescription(practiceType)}
            </p>
          ) : null}

          {/* Botones */}
          <div className="flex gap-4 items-center justify-center">
            {!isRecording && (
              <button
                onClick={showPlacementTest ? handleSkipPlacementTest : handleSkipPractice}
                className="px-8 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors"
              >
                Skip for now
              </button>
            )}
            <button
              onClick={isRecording ? handleStopRecording : (showPlacementTest ? handleStartRecording : handleStartPractice)}
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
          {!isRecording && messages.length === 1 && (
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