'use client';

import { useState, useRef, useEffect, useCallback, type Dispatch, type SetStateAction } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import Link from 'next/link';
import Image from 'next/image';
import EnglishProgressChart from '@/components/EnglishProgressChart';
import { MicrophoneIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { languageService, SessionCompletionResponse } from '@/services/languageService';
import {
  LiveKitRoom,
  BarVisualizer,
  RoomAudioRenderer,
  useDataChannel,
  useLocalParticipant,
  useConnectionState,
  useIsSpeaking,
  useTranscriptions,
  useRemoteParticipants,
  useParticipantTracks,
  useTrackTranscription,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

const MARIA_PARTICIPANT_IDENTITY = 'maria-agent';
const MARIA_AUDIO_TRACK_NAME = 'maria-voice';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  feedback?: {
    type: 'perfect' | 'error' | 'suggestion';
    suggestions?: string[];
  };
}

interface ConversationHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface BackendTranscriptEntry {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface MariaSubtitleMessage {
  type: 'maria_subtitle';
  participantIdentity: string;
  trackSid: string;
  segmentId: string;
  text: string;
  final: boolean;
  startTimeMs: number;
  endTimeMs: number;
  language: string;
}

interface MariaSubtitleSegment extends MariaSubtitleMessage {
  updatedAt: number;
}

type PracticeType = 'interview' | 'grammar' | 'vocabulary' | 'pronunciation' | 'business' | 'placement';

type ViewType = 'practice' | 'progress' | 'conversations';

interface TranscriptHandlerProps {
  setFullSubtitles: Dispatch<SetStateAction<string>>;
}

function LocalAudioDiagnostics() {
  const connectionState = useConnectionState();
  const { localParticipant, microphoneTrack } = useLocalParticipant();
  const isSpeaking = useIsSpeaking(localParticipant);

  useEffect(() => {
    console.log('[LK] local participant status', {
      connectionState,
      participantIdentity: localParticipant.identity,
      participantSid: localParticipant.sid,
      microphoneTrackSid: microphoneTrack?.trackSid || '',
      microphoneTrackName: microphoneTrack?.trackName || '',
      microphoneSource: microphoneTrack?.source || '',
      microphoneIsMuted: microphoneTrack?.isMuted,
      microphoneIsEnabled: microphoneTrack?.isEnabled,
      microphoneIsSubscribed: microphoneTrack?.isSubscribed,
      microphoneHasTrack: Boolean(microphoneTrack?.track),
      canPublish: localParticipant.permissions?.canPublish,
      isSpeaking,
    });
  }, [connectionState, isSpeaking, localParticipant, microphoneTrack]);

  useEffect(() => {
    if (connectionState !== 'connected') {
      return;
    }

    console.log('[LK] user speaking state', {
      participantIdentity: localParticipant.identity,
      isSpeaking,
      microphoneTrackSid: microphoneTrack?.trackSid || '',
      microphoneIsMuted: microphoneTrack?.isMuted,
      microphoneHasTrack: Boolean(microphoneTrack?.track),
    });
  }, [connectionState, isSpeaking, localParticipant.identity, microphoneTrack]);

  return null;
}

function TranscriptHandler({ setFullSubtitles }: TranscriptHandlerProps) {
  const remoteParticipants = useRemoteParticipants();
  const mariaParticipant = remoteParticipants.find(
    (participant) =>
      participant.identity === MARIA_PARTICIPANT_IDENTITY
      || participant.identity.includes(MARIA_PARTICIPANT_IDENTITY)
  ) || remoteParticipants.find((participant) =>
    Array.from(participant.trackPublications.values()).some(
      (publication) => publication.trackName === MARIA_AUDIO_TRACK_NAME
    )
  );

  const mariaPublication = mariaParticipant
    ? Array.from(mariaParticipant.trackPublications.values()).find(
      (publication) => publication.trackName === MARIA_AUDIO_TRACK_NAME
    )
    : undefined;

  const mariaTrackSid = mariaPublication?.trackSid;

  const mariaAudioTracks = useParticipantTracks([Track.Source.Microphone], {
    participantIdentity: mariaParticipant?.identity,
  });

  const mariaAudioTrack = mariaAudioTracks.find(
    (track) => track.publication?.trackSid === mariaTrackSid
  ) || mariaAudioTracks.find(
    (track) => track.publication?.trackName === MARIA_AUDIO_TRACK_NAME
  ) || mariaAudioTracks[0];

  const { segments: remoteTrackTranscriptions } = useTrackTranscription(mariaAudioTrack);
  const fallbackTranscriptions = useTranscriptions({
    participantIdentities: mariaParticipant ? [mariaParticipant.identity] : undefined,
    trackSids: mariaTrackSid ? [mariaTrackSid] : undefined,
  });
  const subtitleSegmentsRef = useRef<Map<string, MariaSubtitleSegment>>(new Map());
  const [accumulatedDataSubtitle, setAccumulatedDataSubtitle] = useState('');

  useDataChannel('maria_subtitles', (message) => {
    try {
      const parsed = JSON.parse(new TextDecoder().decode(message.payload)) as Partial<MariaSubtitleMessage>;

      if (parsed.type !== 'maria_subtitle') {
        return;
      }

      if (parsed.participantIdentity !== MARIA_PARTICIPANT_IDENTITY) {
        return;
      }

      if (!parsed.segmentId || !parsed.text) {
        return;
      }

      if (mariaTrackSid && parsed.trackSid && parsed.trackSid !== mariaTrackSid) {
        return;
      }

      const nextSegment: MariaSubtitleSegment = {
        type: 'maria_subtitle',
        participantIdentity: parsed.participantIdentity,
        trackSid: parsed.trackSid || mariaTrackSid || '',
        segmentId: parsed.segmentId,
        text: parsed.text,
        final: Boolean(parsed.final),
        startTimeMs: parsed.startTimeMs || 0,
        endTimeMs: parsed.endTimeMs || 0,
        language: parsed.language || '',
        updatedAt: Date.now(),
      };

      subtitleSegmentsRef.current.set(nextSegment.segmentId, nextSegment);

      const orderedSegments = [...subtitleSegmentsRef.current.values()]
        .sort((a, b) => {
          const aTime = Math.max(a.endTimeMs || 0, a.startTimeMs || 0, a.updatedAt);
          const bTime = Math.max(b.endTimeMs || 0, b.startTimeMs || 0, b.updatedAt);
          return aTime - bTime;
        });

      const nextAccumulatedSubtitle = orderedSegments
        .map((segment) => segment.text.trim())
        .filter(Boolean)
        .join(' ');

      setAccumulatedDataSubtitle(nextAccumulatedSubtitle);
    } catch (error) {
      console.error('[LK] Failed to parse maria_subtitles payload', error);
    }
  });

  useEffect(() => {
    const latestRemoteTrackSegment = [...remoteTrackTranscriptions]
      .reverse()
      .find((segment) => segment.text?.trim());
    const latestFallback = [...fallbackTranscriptions]
      .reverse()
      .find((transcription) => transcription.text?.trim());

    const nextSubtitle =
      accumulatedDataSubtitle.trim()
      || latestRemoteTrackSegment?.text?.trim()
      || latestFallback?.text?.trim()
      || '';

    setFullSubtitles(nextSubtitle);
  }, [accumulatedDataSubtitle, fallbackTranscriptions, remoteTrackTranscriptions, setFullSubtitles]);

  return null;
}

export default function EnglishPractice() {
  const { isDarkMode } = useTheme();
  const { data: session, status } = useSession();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subtitlesContainerRef = useRef<HTMLDivElement>(null);
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
  const [expandedGrammarErrors, setExpandedGrammarErrors] = useState<{ [key: number]: boolean }>({});
  const [expandedPronunciationWords, setExpandedPronunciationWords] = useState<{ [key: number]: boolean }>({});
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
  const [evaluationData, setEvaluationData] = useState<{
    level: string;
    pronunciation: {
      score: number;
      mispronouncedWords?: Array<{
        word: string;
        attempts: number;
        lastHeard: string;
        ipa: string;
        notes: string;
      }>;
    };
    grammar: {
      score: number;
      errors?: Array<{
        type: string;
        example: string;
        correction: string;
        notes: string;
      }>;
    };
    vocabulary: {
      score: number;
      rareWordsUsed?: string[];
      repeatedWords?: string[];
      suggestedWords?: string[];
    };
    fluency: {
      score: number;
      wordsPerMinute?: number;
      nativeRange?: {
        min: number;
        max: number;
      };
      pausesPerMinute?: number;
      fillerWordsCount?: number;
      fillerWordsRatio?: number;
      mostUsedWords?: Array<{
        word: string;
        count: number;
      }>;
    };
  } | null>(null);
  const sessionIdRef = useRef<string | null>(null); // Ref para acceso inmediato al sessionId
  const isRecordingRef = useRef<boolean>(false); // Ref para acceso inmediato al estado de grabación
  const subtitleAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const conversationStartTimeRef = useRef<number>(0);
  const [conversations, setConversations] = useState([
    { id: 1, title: 'Software Development Interview', date: '2024-01-15', duration: '15 min' },
    { id: 2, title: 'Grammar Practice', date: '2024-01-14', duration: '10 min' },
    { id: 3, title: 'Vocabulary Building', date: '2024-01-13', duration: '12 min' },
  ]);
  const [conversationHistory, setConversationHistory] = useState<Record<number, ConversationHistoryEntry[]>>({
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
  });

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

  useEffect(() => {
    if (!showSubtitles) {
      return;
    }

    subtitlesContainerRef.current?.scrollTo({
      top: subtitlesContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [displayedSubtitles, fullSubtitles, showSubtitles]);

  // Sincronizar sessionId con el ref (por si se actualiza directamente el estado)
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Sincronizar isRecording con el ref
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Efecto para mostrar subtítulos gradualmente
  useEffect(() => {
    if (!showSubtitles || !isRecording) {
      setDisplayedSubtitles('');
      return;
    }

    if (!fullSubtitles.trim()) {
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
    };
  }, []);

  // Función helper para sincronizar sessionId con el ref
  const updateSessionId = useCallback((newSessionId: string | null) => {
    setSessionId(newSessionId);
    sessionIdRef.current = newSessionId;
  }, []);

  // Función para enviar la conversación completa al backend
  const sendConversationToBackend = useCallback(async (): Promise<number | null> => {
    const currentSessionId = sessionIdRef.current;
    const userId = session?.user?.id;

    if (!currentSessionId || !userId) {
      console.warn('No se puede enviar conversación: falta sessionId o userId');
      return null;
    }

    const endTime = Date.now();
    const durationSeconds = Math.floor((endTime - conversationStartTimeRef.current) / 1000);

    const payload = {
      language: 'english',
      level: '',
      endedAt: new Date(endTime).toISOString(),
      durationSeconds,
      feedback: {}, // Será sobrescrito por análisis CEFR en el backend
    };

    try {
      const result: SessionCompletionResponse = await languageService.completeSession(userId, currentSessionId, payload);
      let latestConversationId: number | null = null;

      console.log('========== RESPUESTA DEL BACKEND ==========');
      console.log('Response:', JSON.stringify(result, null, 2));
      console.log('✅ Sesión completada exitosamente');

      // Almacenar datos de evaluación si están disponibles
      if (result.level && result.pronunciation?.score !== undefined && result.grammar?.score !== undefined && result.vocabulary?.score !== undefined && result.fluency?.score !== undefined) {
        setEvaluationData({
          level: result.level,
          pronunciation: {
            score: result.pronunciation.score,
            mispronouncedWords: result.pronunciation.mispronouncedWords || []
          },
          grammar: {
            score: result.grammar.score,
            errors: result.grammar.errors || []
          },
          vocabulary: {
            score: result.vocabulary.score,
            rareWordsUsed: result.vocabulary.rareWordsUsed || [],
            repeatedWords: result.vocabulary.repeatedWords || [],
            suggestedWords: result.vocabulary.suggestedWords || []
          },
          fluency: {
            score: result.fluency.score,
            wordsPerMinute: result.fluency.wordsPerMinute,
            nativeRange: result.fluency.nativeRange,
            pausesPerMinute: result.fluency.pausesPerMinute,
            fillerWordsCount: result.fluency.fillerWordsCount,
            fillerWordsRatio: result.fluency.fillerWordsRatio,
            mostUsedWords: result.fluency.mostUsedWords || []
          }
        });
      }

      // Procesar conversationLog si está disponible
      if (result.conversationLog?.transcript && Array.isArray(result.conversationLog.transcript)) {
        // Generar un nuevo ID para la conversación
        const newConversationId = Math.max(...conversations.map(c => c.id), 0) + 1;

        // Determinar el título basado en el tipo de práctica
        let title = 'English Practice';
        if (practiceType === 'placement') {
          title = 'Assessment Call';
        } else if (practiceType === 'interview') {
          title = 'Software Development Interview';
        } else if (practiceType === 'grammar') {
          title = 'Grammar Practice';
        } else if (practiceType === 'vocabulary') {
          title = 'Vocabulary Building';
        } else if (practiceType === 'pronunciation') {
          title = 'Pronunciation Tips';
        } else if (practiceType === 'business') {
          title = 'Business English';
        }

        // Función para convertir timestamp numérico a formato MM:SS
        const formatTimestamp = (timestamp: number): string => {
          const startTime = conversationStartTimeRef.current;
          const relativeTime = startTime > 0 ? timestamp - startTime : timestamp;
          const seconds = Math.floor(relativeTime / 1000);
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = seconds % 60;
          return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        };

        // Convertir transcript del backend al formato del frontend
        const formattedTranscript = result.conversationLog.transcript.map((entry: BackendTranscriptEntry) => ({
          role: entry.role,
          content: entry.text, // Cambiar 'text' a 'content'
          timestamp: formatTimestamp(entry.timestamp)
        }));

        // Agregar nueva conversación a la lista
        const newConversation = {
          id: newConversationId,
          title: title,
          date: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
          duration: `${Math.floor(durationSeconds / 60)} min`
        };
        latestConversationId = newConversationId;

        // Actualizar la lista de conversaciones
        setConversations(prev => [newConversation, ...prev]);

        // Agregar el historial de la conversación
        setConversationHistory(prev => ({
          ...prev,
          [newConversationId]: formattedTranscript
        }));

        console.log('✅ Conversación agregada al historial:', {
          id: newConversationId,
          title: title,
          transcriptLength: formattedTranscript.length
        });
      }
      return latestConversationId;
    } catch (error) {
      console.error('========== ERROR AL ENVIAR CONVERSACIÓN ==========');
      console.error(error);
      return null;
    }

  }, [conversations, practiceType, session]);

  const handleStopRecording = useCallback(async () => {
    setIsRecording(false);
    isRecordingRef.current = false;
    setIsTestMode(false);
    setTimeRemaining(240);
    setFullSubtitles('');
    setDisplayedSubtitles('');
    setShowSubtitles(true);
    setLiveKitToken(null);

    const latestConversationId = await sendConversationToBackend();
    updateSessionId(null);

    setShowPlacementTest(false);
    setShowPracticeView(false);
    setPracticeType(null);
    setConversationsOpen(true);
    setCurrentView('conversations');
    if (latestConversationId !== null) {
      setSelectedConversationId(latestConversationId);
    }
  }, [updateSessionId, sendConversationToBackend]);

  // Manejar el cronómetro
  useEffect(() => {
    if (isRecording) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (isTestMode) {
            if (prev <= 1) {
              handleStopRecording();
              return 0;
            }
            return prev - 1;
          } else {
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
  const handleStartPractice = async () => {
    try {
      const userId = session?.user?.id;
      if (!userId) {
        alert('User not found. Please log in again.');
        return;
      }

      let context = '';
      switch (practiceType) {
        case 'interview': context = 'software development job interview'; break;
        case 'grammar': context = 'grammar practice'; break;
        case 'vocabulary': context = 'vocabulary building'; break;
        case 'pronunciation': context = 'pronunciation tips'; break;
        case 'business': context = 'business English'; break;
        default: context = 'general English practice';
      }

      const response = await languageService.startSession(userId, {
        language: 'english',
        mode: 'practice',
        context: context
      });

      const newSessionId = response.sessionId || response._id;
      if (!newSessionId) {
        throw new Error('Session ID not returned by backend.');
      }
      setSessionId(newSessionId);

      const { token: lkToken } = await languageService.getLiveKitToken(newSessionId);
      setLiveKitToken(lkToken);

      conversationStartTimeRef.current = Date.now();

      setFullSubtitles('');
      setDisplayedSubtitles('');
      setIsTestMode(false);
      setTimeRemaining(0);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting practice:', error);
      alert('Could not start practice session. Please try again.');
    }
  };

  const handleStartRecording = async () => {
    try {
      const userId = session?.user?.id;
      if (!userId) {
        alert('User not found. Please log in again.');
        return;
      }

      const response = await languageService.startSession(userId, {
        language: 'english',
        mode: 'test'
      });

      const newSessionId = response.sessionId || response._id;
      if (!newSessionId) {
        throw new Error('Session ID not returned by backend.');
      }
      setSessionId(newSessionId);

      const { token: lkToken } = await languageService.getLiveKitToken(newSessionId);
      setLiveKitToken(lkToken);

      conversationStartTimeRef.current = Date.now();

      setFullSubtitles('');
      setDisplayedSubtitles('');
      setIsTestMode(true);
      setTimeRemaining(240);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not start placement test. Please try again.');
    }
  };

  // Cleanup Maria
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


  // Verificar si el usuario tiene el test de inglés completado
  const hasEnglishTest = session?.user?.languageTests?.english !== undefined && session?.user?.languageTests?.english !== null;

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

  // Función para alternar la expansión de errores de gramática
  const toggleGrammarError = (index: number) => {
    setExpandedGrammarErrors(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleSuggestions = (index: number) => {
    setExpandedSuggestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Función para encontrar y desplazarse al texto en el transcript
  const scrollToTranscriptText = (searchText: string) => {
    if (!selectedConversationId || !conversationHistory[selectedConversationId]) return;

    // Buscar el texto en el historial de conversación
    const history = conversationHistory[selectedConversationId];
    const matchingEntry = history.find(entry =>
      entry.role === 'user' && entry.content.toLowerCase().includes(searchText.toLowerCase())
    );

    if (matchingEntry) {
      // Cambiar a la vista de conversaciones si no está activa
      if (currentView !== 'conversations') {
        setCurrentView('conversations');
      }

      // Usar setTimeout para asegurar que el DOM se actualice antes de hacer scroll
      setTimeout(() => {
        // Buscar el elemento que contiene este texto específico
        const messageElements = document.querySelectorAll('[data-message-content]');
        for (const element of messageElements) {
          if (element.textContent?.toLowerCase().includes(searchText.toLowerCase())) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
            // Resaltar temporalmente el elemento
            element.classList.add('bg-yellow-200', 'transition-colors', 'duration-1000');
            setTimeout(() => {
              element.classList.remove('bg-yellow-200');
            }, 2000);
            break;
          }
        }
      }, 100);
    }
  };

  // Función para resaltar diferencias entre example y correction
  const highlightGrammarDifferences = (example: string, correction: string) => {
    return (
      <div className="space-y-2">
        <div>
          <span className={`text-xs font-medium ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            Your version:
          </span>
          <div className={`mt-1 p-2 rounded ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
            <span className={`${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
              {example}
            </span>
          </div>
        </div>
        <div>
          <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
            Corrected version:
          </span>
          <div className={`mt-1 p-2 rounded ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
            <span className={`${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
              {correction}
            </span>
          </div>
        </div>
      </div>
    );
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

  // Función para obtener la descripción del nivel
  const getLevelDescription = (level: string): string => {
    switch (level) {
      case 'A1': return 'Beginner';
      case 'A2': return 'Basic';
      case 'B1': return 'Intermediate';
      case 'B2': return 'Upper-Intermediate';
      case 'C1': return 'Advanced';
      case 'C2': return 'Expert';
      default: return 'Intermediate';
    }
  };

  // Función para obtener el score general basado en los scores individuales
  const getOverallScore = (data: typeof evaluationData): number => {
    if (!data) return 0; // Valor por defecto en cero
    const scores = [
      data.pronunciation.score,
      data.grammar.score,
      data.vocabulary.score,
      data.fluency.score
    ];
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  // Datos para el gráfico de progreso (dinámicos o mock)
  const progressData = evaluationData ? [
    { skill: 'Pronunciation', score: evaluationData.pronunciation.score },
    { skill: 'Vocabulary', score: evaluationData.vocabulary.score },
    { skill: 'Grammar', score: evaluationData.grammar.score },
    { skill: 'Fluency', score: evaluationData.fluency.score },
  ] : [
    { skill: 'Pronunciation', score: 0 },
    { skill: 'Vocabulary', score: 0 },
    { skill: 'Grammar', score: 0 },
    { skill: 'Fluency', score: 0 },
  ];

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
      {(showPlacementTest || showPracticeView) && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-purple-900 via-purple-950 to-black flex flex-col items-center justify-center">
          {liveKitToken ? (
            <LiveKitRoom
              token={liveKitToken}
              serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-url'}
              connect={true}
              audio={{
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }}
              video={false}
              onConnected={() => {
                console.log('[EnglishPractice] LiveKit connected');
              }}
              onError={(error) => {
                console.error('[EnglishPractice] LiveKit error', error);
              }}
              onMediaDeviceFailure={(failure, kind) => {
                console.error('[EnglishPractice] Media device failure', { failure, kind });
              }}
              onDisconnected={(reason) => {
                console.warn('[EnglishPractice] LiveKit disconnected', { reason });
                handleStopRecording();
              }}
              style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
            >
              <LocalAudioDiagnostics />
              <TranscriptHandler setFullSubtitles={setFullSubtitles} />
              <div className="flex flex-col items-center justify-center w-full max-w-2xl">
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
                  <div className="absolute -top-2 -right-2">
                    <button
                      onClick={() => setShowSubtitles(!showSubtitles)}
                      className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${showSubtitles ? 'bg-blue-600' : 'bg-gray-700'}`}
                      title={showSubtitles ? 'Ocultar subtítulos' : 'Mostrar subtítulos'}
                    >
                      <span className="text-white text-xs font-semibold">CC</span>
                    </button>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-3xl font-semibold text-white mb-2">{getPracticeTitle(practiceType)}</h2>
                  <p className="text-xl text-gray-300">with Maria</p>
                </div>

                <div className="mb-8 flex flex-col items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-4 border-gray-700 flex items-center justify-center bg-gray-900">
                    <span className="text-4xl font-bold text-white">{formatTime(timeRemaining)}</span>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <BarVisualizer />
                  </div>
                </div>

                {showSubtitles && (
                  <div className="w-full max-w-xl px-4 mb-12 min-h-24 flex items-center justify-center">
                    <div
                      ref={subtitlesContainerRef}
                      className="w-full max-h-40 overflow-y-auto rounded-xl bg-black/35 px-4 py-3 text-center text-white text-lg leading-relaxed shadow-md"
                    >
                      {displayedSubtitles || fullSubtitles || 'Waiting for Maria subtitles...'}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 items-center justify-center">
                  <button
                    onClick={handleStopRecording}
                    className="bg-red-600 hover:bg-red-700 w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white"
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white" style={{ transform: 'rotate(135deg)' }}>
                      <path fill="white" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                  </button>
                </div>

                <RoomAudioRenderer />
              </div>
            </LiveKitRoom>
          ) : (
            <div className="flex flex-col items-center justify-center w-full max-w-2xl">
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
              </div>
              <div className="text-center mb-6">
                <h2 className="text-3xl font-semibold text-white mb-2">{getPracticeTitle(practiceType)}</h2>
                <p className="text-xl text-gray-300">with Maria</p>
              </div>
              <div className="flex gap-4 items-center justify-center">
                <button
                  onClick={showPlacementTest ? handleSkipPlacementTest : handleSkipPractice}
                  className="px-8 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors"
                >
                  Skip for now
                </button>
                <button
                  onClick={showPlacementTest ? handleStartRecording : handleStartPractice}
                  className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium flex items-center gap-2"
                >
                  <MicrophoneIcon className="w-5 h-5" />
                  Start Call
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={`flex h-[calc(100vh-4rem)] ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        {/* Sidebar */}
        <div className={`w-64 border-r ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <div className="p-4 space-y-2">
            <button
              onClick={() => setCurrentView('practice')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'practice'
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'progress'
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
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'conversations'
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
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedConversationId === conv.id
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
                        disabled={loading || !hasEnglishTest}
                        className={`p-4 rounded-lg text-left transition-all ${isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm'
                          } ${loading || !hasEnglishTest ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <h3 className="font-medium mb-1">Software Development Interview</h3>
                        <p className="text-sm opacity-80">Practice technical development interviews</p>
                      </button>

                      <button
                        onClick={() => handlePracticeTypeSelection('grammar')}
                        disabled={loading || !hasEnglishTest}
                        className={`p-4 rounded-lg text-left transition-all ${isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm'
                          } ${loading || !hasEnglishTest ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <h3 className="font-medium mb-1">Grammar Practice</h3>
                        <p className="text-sm opacity-80">Focus on grammar rules and structures</p>
                      </button>

                      <button
                        onClick={() => handlePracticeTypeSelection('vocabulary')}
                        disabled={loading || !hasEnglishTest}
                        className={`p-4 rounded-lg text-left transition-all ${isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm'
                          } ${loading || !hasEnglishTest ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <h3 className="font-medium mb-1">Vocabulary Building</h3>
                        <p className="text-sm opacity-80">Learn new words and expressions</p>
                      </button>

                      <button
                        onClick={() => handlePracticeTypeSelection('pronunciation')}
                        disabled={loading || !hasEnglishTest}
                        className={`p-4 rounded-lg text-left transition-all ${isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm'
                          } ${loading || !hasEnglishTest ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <h3 className="font-medium mb-1">Pronunciation Tips</h3>
                        <p className="text-sm opacity-80">Improve your pronunciation</p>
                      </button>

                      <button
                        onClick={() => handlePracticeTypeSelection('business')}
                        disabled={loading || !hasEnglishTest}
                        className={`p-4 rounded-lg text-left transition-all ${isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm'
                          } ${loading || !hasEnglishTest ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <h3 className="font-medium mb-1">Business English</h3>
                        <p className="text-sm opacity-80">Practice professional and business English</p>
                      </button>

                      <button
                        onClick={() => handlePracticeTypeSelection('placement')}
                        disabled={loading || hasEnglishTest}
                        className={`p-4 rounded-lg text-left transition-all ${isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm'
                          } ${loading || hasEnglishTest ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  overallScore={getOverallScore(evaluationData)}
                  level={evaluationData ? getLevelDescription(evaluationData.level) : "Intermediate"}
                  levelCode={evaluationData ? evaluationData.level : "B1"}
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
                              className={`rounded-lg p-4 ${message.role === 'user'
                                ? isDarkMode
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-blue-500 text-white'
                                : isDarkMode
                                  ? 'bg-gray-700 text-white'
                                  : 'bg-white text-gray-800 border border-gray-200'
                                }`}
                              data-message-content
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
                          className={`px-3 py-2 text-sm font-medium capitalize transition-colors ${activeRecommendationTab === tab
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
                    {activeRecommendationTab === 'pronunciation' && evaluationData?.pronunciation ? (
                      <div className="space-y-4">
                        {/* Score de pronunciación */}
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Pronunciation
                            </h4>
                            <span className={`px-2 py-1 rounded text-sm font-medium ${evaluationData.pronunciation.score >= 80
                              ? 'bg-green-100 text-green-800'
                              : evaluationData.pronunciation.score >= 60
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                              {evaluationData.pronunciation.score}%
                            </span>
                          </div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Practice sounds and tricky words to make your speech clearer.
                          </p>
                        </div>

                        {/* Palabras mal pronunciadas */}
                        {evaluationData.pronunciation.mispronouncedWords && evaluationData.pronunciation.mispronouncedWords.length > 0 && (
                          <div className="space-y-3">
                            <h5 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Words to Practice
                            </h5>

                            <div className="space-y-2">
                              {evaluationData.pronunciation.mispronouncedWords.map((wordData, index) => (
                                <div key={index} className={`border rounded-lg ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                  {/* Palabra clickeable */}
                                  <button
                                    onClick={() => {
                                      setExpandedPronunciationWords(prev => ({
                                        ...prev,
                                        [index]: !prev[index]
                                      }));
                                      // También desplazarse al transcript
                                      scrollToTranscriptText(wordData.word);
                                    }}
                                    className={`w-full p-4 text-left transition-colors ${isDarkMode
                                      ? 'hover:bg-gray-800 text-white'
                                      : 'hover:bg-gray-50 text-gray-900'
                                      }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                          <span className="text-lg font-medium">
                                            {wordData.word}
                                          </span>
                                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            /{wordData.ipa}/
                                          </span>
                                        </div>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                          Attempted {wordData.attempts} time{wordData.attempts !== 1 ? 's' : ''}
                                        </p>
                                      </div>
                                      <svg
                                        className={`w-5 h-5 transition-transform ${expandedPronunciationWords[index] ? 'rotate-180' : ''
                                          } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
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
                                    </div>
                                  </button>

                                  {/* Contenido expandido */}
                                  {expandedPronunciationWords[index] && (
                                    <div className={`border-t p-4 ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                                      {/* Pronunciación IPA */}
                                      <div className="mb-4">
                                        <h6 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                          Correct Pronunciation
                                        </h6>
                                        <div className={`p-3 rounded ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                                          <span className={`text-lg font-mono ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                            /{wordData.ipa}/
                                          </span>
                                        </div>
                                      </div>

                                      {/* Notas y consejos */}
                                      <div className="mb-4">
                                        <h6 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                          Tips
                                        </h6>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                          {wordData.notes}
                                        </p>
                                      </div>

                                      {/* Última vez escuchada */}
                                      <div>
                                        <h6 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                          Last heard
                                        </h6>
                                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                          {new Date(wordData.lastHeard).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Mensaje si no hay palabras mal pronunciadas */}
                        {(!evaluationData.pronunciation.mispronouncedWords || evaluationData.pronunciation.mispronouncedWords.length === 0) && (
                          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">🎉</span>
                              <h5 className={`font-medium ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                                Great pronunciation!
                              </h5>
                            </div>
                            <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                              No mispronounced words detected in this session. Keep up the excellent work!
                            </p>
                          </div>
                        )}
                      </div>
                    ) : activeRecommendationTab === 'pronunciation' ? (
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Complete a practice session to see pronunciation recommendations.
                        </p>
                      </div>
                    ) : activeRecommendationTab === 'vocabulary' && evaluationData?.vocabulary ? (
                      <div className="space-y-4">
                        {/* Score del vocabulario */}
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Vocabulary
                            </h4>
                            <span className={`px-2 py-1 rounded text-sm font-medium ${evaluationData.vocabulary.score >= 80
                              ? 'bg-green-100 text-green-800'
                              : evaluationData.vocabulary.score >= 60
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                              {evaluationData.vocabulary.score}%
                            </span>
                          </div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Replace words you used in the call with stronger ones to sound like native.
                          </p>
                        </div>

                        {/* YOU SAID - Palabras repetidas */}
                        {evaluationData.vocabulary.repeatedWords && evaluationData.vocabulary.repeatedWords.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h5 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                LEVEL
                              </h5>
                              <h5 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                YOU SAID
                              </h5>
                              <h5 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                WE SUGGEST
                              </h5>
                            </div>

                            <div className="space-y-3">
                              {evaluationData.vocabulary.repeatedWords.map((word, index) => {
                                // Buscar la sugerencia correspondiente en el array de suggestedWords
                                // Las sugerencias vienen en formato "collaborate instead of work"
                                const suggestionText = evaluationData.vocabulary.suggestedWords?.find(suggestion =>
                                  suggestion.toLowerCase().includes(`instead of ${word.toLowerCase()}`)
                                );

                                // Extraer solo la palabra sugerida (antes de "instead of")
                                const suggestedWord = suggestionText
                                  ? suggestionText.split(' instead of ')[0].trim()
                                  : 'No suggestion available';

                                return (
                                  <div key={index} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} grid grid-cols-3 gap-4 items-center`}>
                                    <span className={`px-2 py-1 rounded text-xs font-medium text-center ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}>
                                      A1
                                    </span>
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {word}
                                    </span>
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                      {suggestedWord}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Palabras raras usadas (si las hay) */}
                        {evaluationData.vocabulary.rareWordsUsed && evaluationData.vocabulary.rareWordsUsed.length > 0 && (
                          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
                            <h5 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                              Advanced words you used:
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {evaluationData.vocabulary.rareWordsUsed.map((word, index) => (
                                <span key={index} className={`px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'}`}>
                                  {word}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : activeRecommendationTab === 'grammar' && evaluationData?.grammar ? (
                      <div className="space-y-4">
                        {/* Score de gramática */}
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Grammar
                            </h4>
                            <span className={`px-2 py-1 rounded text-sm font-medium ${evaluationData.grammar.score >= 80
                              ? 'bg-green-100 text-green-800'
                              : evaluationData.grammar.score >= 60
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                              {evaluationData.grammar.score}%
                            </span>
                          </div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Review your grammar mistakes.
                          </p>
                        </div>

                        {/* Lista de errores de gramática */}
                        {evaluationData.grammar.errors && evaluationData.grammar.errors.length > 0 && (
                          <div className="space-y-3">
                            {/* Agrupar errores por tipo */}
                            {Object.entries(
                              evaluationData.grammar.errors.reduce((acc, error, index) => {
                                const type = error.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                if (!acc[type]) {
                                  acc[type] = [];
                                }
                                acc[type].push({ ...error, originalIndex: index });
                                return acc;
                              }, {} as Record<string, Array<typeof evaluationData.grammar.errors[0] & { originalIndex: number }>>)
                            ).map(([errorType, errors]) => (
                              <div key={errorType}>
                                <h5 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {errorType}
                                </h5>
                                <div className="space-y-2">
                                  {errors.map((error) => (
                                    <div key={error.originalIndex} className={`border rounded-lg ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                      {/* Error clickeable */}
                                      <button
                                        onClick={() => {
                                          toggleGrammarError(error.originalIndex);
                                          // También desplazarse al transcript
                                          scrollToTranscriptText(error.example);
                                        }}
                                        className={`w-full p-4 text-left transition-colors ${isDarkMode
                                          ? 'hover:bg-gray-800 text-white'
                                          : 'hover:bg-gray-50 text-gray-900'
                                          }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <p className="text-sm font-medium mb-1">
                                              {error.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </p>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                              {error.example}
                                            </p>
                                          </div>
                                          <svg
                                            className={`w-5 h-5 transition-transform ${expandedGrammarErrors[error.originalIndex] ? 'rotate-180' : ''
                                              } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
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
                                        </div>
                                      </button>

                                      {/* Contenido expandido */}
                                      {expandedGrammarErrors[error.originalIndex] && (
                                        <div className={`border-t p-4 ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                                          {/* Comparación example vs correction */}
                                          {highlightGrammarDifferences(error.example, error.correction)}

                                          {/* Explicación */}
                                          <div className="mt-4">
                                            <h6 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                              Explanation
                                            </h6>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                              {error.notes}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : activeRecommendationTab === 'grammar' ? (
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Complete a practice session to see grammar recommendations.
                        </p>
                      </div>
                    ) : activeRecommendationTab === 'fluency' && evaluationData?.fluency ? (
                      <div className="space-y-4">
                        {/* Score de fluidez */}
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Fluency
                            </h4>
                            <span className={`px-2 py-1 rounded text-sm font-medium ${evaluationData.fluency.score >= 80
                              ? 'bg-green-100 text-green-800'
                              : evaluationData.fluency.score >= 60
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                              {evaluationData.fluency.score}%
                            </span>
                          </div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Review your speech pace and parasitic words.
                          </p>
                        </div>

                        {/* Parasitic Words */}
                        {evaluationData.fluency.mostUsedWords && evaluationData.fluency.mostUsedWords.length > 0 && (
                          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-2 mb-3">
                              <h5 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Parasitic Words
                              </h5>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                              <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {evaluationData.fluency.fillerWordsRatio ? Math.round(evaluationData.fluency.fillerWordsRatio * 100) : 0}%
                              </span>
                              <span className="text-2xl">👍</span>
                            </div>

                            <p className={`text-sm mb-3 ${(evaluationData.fluency.fillerWordsRatio || 0) < 0.1
                              ? isDarkMode ? 'text-green-400' : 'text-green-600'
                              : isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                              }`}>
                              <span className="font-medium">
                                {(evaluationData.fluency.fillerWordsRatio || 0) < 0.1 ? 'Great results!' : 'Good progress!'}
                              </span>
                              {' '}Your filler words usage is {(evaluationData.fluency.fillerWordsRatio || 0) < 0.1 ? 'low' : 'moderate'}.
                            </p>

                            <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Your most frequently used words are:
                            </p>

                            <div className="flex flex-wrap gap-3">
                              {evaluationData.fluency.mostUsedWords.map((wordData, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {wordData.word}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-sm ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                                    {wordData.count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Words per Minute */}
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2 mb-3">
                            <h5 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Words per Minute
                            </h5>
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {Math.round(evaluationData.fluency.wordsPerMinute || 0)} words
                            </span>
                            <span className="text-2xl">🤖</span>
                          </div>

                          {evaluationData.fluency.nativeRange && (
                            <>
                              <p className={`text-sm mb-3 ${(evaluationData.fluency.wordsPerMinute || 0) >= evaluationData.fluency.nativeRange.min &&
                                (evaluationData.fluency.wordsPerMinute || 0) <= evaluationData.fluency.nativeRange.max
                                ? isDarkMode ? 'text-green-400' : 'text-green-600'
                                : (evaluationData.fluency.wordsPerMinute || 0) < evaluationData.fluency.nativeRange.min
                                  ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                                  : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                }`}>
                                <span className="font-medium">
                                  {(evaluationData.fluency.wordsPerMinute || 0) >= evaluationData.fluency.nativeRange.min &&
                                    (evaluationData.fluency.wordsPerMinute || 0) <= evaluationData.fluency.nativeRange.max
                                    ? 'Perfect pace!'
                                    : (evaluationData.fluency.wordsPerMinute || 0) < evaluationData.fluency.nativeRange.min
                                      ? 'Speed up'
                                      : 'Slow down'
                                  }
                                </span>
                                {' '}
                                {(evaluationData.fluency.wordsPerMinute || 0) < evaluationData.fluency.nativeRange.min
                                  ? 'a bit and add confidence to make your speech more engaging.'
                                  : (evaluationData.fluency.wordsPerMinute || 0) > evaluationData.fluency.nativeRange.max
                                    ? 'a bit to make your speech clearer and easier to follow.'
                                    : 'Your speaking speed is in the native range.'
                                }
                              </p>

                              <div className="mb-2">
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  You
                                </span>
                              </div>

                              {/* Barra de progreso */}
                              <div className="relative">
                                <div className={`h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                  {/* Rango nativo (verde) */}
                                  <div
                                    className="absolute h-2 bg-green-500 rounded-full"
                                    style={{
                                      left: `${(evaluationData.fluency.nativeRange.min / 200) * 100}%`,
                                      width: `${((evaluationData.fluency.nativeRange.max - evaluationData.fluency.nativeRange.min) / 200) * 100}%`
                                    }}
                                  />
                                  {/* Posición del usuario */}
                                  <div
                                    className="absolute w-4 h-4 bg-white border-2 border-orange-500 rounded-full -top-1"
                                    style={{
                                      left: `${Math.min(Math.max((evaluationData.fluency.wordsPerMinute || 0) / 200 * 100, 0), 100)}%`,
                                      transform: 'translateX(-50%)'
                                    }}
                                  />
                                </div>

                                {/* Labels */}
                                <div className="flex justify-between mt-2 text-xs">
                                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>slow</span>
                                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{evaluationData.fluency.nativeRange.min}</span>
                                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>just right</span>
                                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{evaluationData.fluency.nativeRange.max}</span>
                                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>fast</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : activeRecommendationTab === 'fluency' ? (
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Complete a practice session to see fluency recommendations.
                        </p>
                      </div>
                    ) : (
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {tutorRecommendations[activeRecommendationTab]}
                        </p>
                      </div>
                    )}
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
