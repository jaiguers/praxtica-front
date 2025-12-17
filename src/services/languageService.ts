import { fetchWithAuth } from './api';

export interface SessionCompletionPayload {
  language: string;
  level: string;
  endedAt: string;
  durationSeconds: number;
  feedback: Record<string, unknown>;
}

export interface SessionCompletionResponse {
  success: boolean;
  sessionId: string;
  analysis?: Record<string, unknown>;
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