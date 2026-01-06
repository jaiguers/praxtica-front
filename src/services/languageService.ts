import { fetchWithAuth } from './api';

export interface SessionCompletionPayload {
  language: string;
  level: string;
  endedAt: string;
  durationSeconds: number;
  feedback: Record<string, unknown>;
}

export interface MispronouncedWord {
  word: string;
  attempts: number;
  lastHeard: string;
  ipa: string;
  notes: string;
}

export interface SessionCompletionResponse {
  success: boolean;
  sessionId: string;
  analysis?: Record<string, unknown>;
  level?: string;
  pronunciation?: {
    score: number;
    mispronouncedWords?: MispronouncedWord[];
  };
  grammar?: {
    score: number;
    errors?: Array<{
      type: string;
      example: string;
      correction: string;
      notes: string;
    }>;
  };
  vocabulary?: {
    score: number;
    rareWordsUsed?: string[];
    repeatedWords?: string[];
    suggestedWords?: string[];
  };
  fluency?: {
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
  conversationLog?: {
    transcript: Array<{
      role: 'user' | 'assistant';
      text: string;
      timestamp: number;
    }>;
    audioUrls: Array<any>;
  };
  [key: string]: unknown;
}

export const languageService = {
  completeSession: async (
    userId: string, 
    sessionId: string, 
    payload: SessionCompletionPayload
  ): Promise<SessionCompletionResponse> => {
    try {
      const response = await fetchWithAuth(
        `/language/users/${encodeURIComponent(userId)}/practice-sessions/${encodeURIComponent(sessionId)}/complete`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload)
        }
      );
      return response;
    } catch (error) {
      console.error('Error completing language session:', error);
      throw error;
    }
  }
};