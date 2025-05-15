import axios from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface GrammarCheckResponse {
  correctedText: string;
  suggestions: string[];
  errors: {
    type: string;
    message: string;
    suggestion: string;
  }[];
}

export interface ConversationResponse {
  conversation: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
  vocabulary: {
    word: string;
    meaning: string;
    example: string;
  }[];
}

export interface SpeakingPracticeResponse {
  topic: string;
  questions: string[];
  vocabulary: {
    word: string;
    meaning: string;
    example: string;
  }[];
  tips: string[];
}

export interface TranslationResponse {
  translatedText: string;
  pronunciation: string;
  alternatives: string[];
}

class OpenAIService {
  async checkGrammar(text: string): Promise<GrammarCheckResponse> {
    try {
      const response = await axios.post(`${API_URL}/openai/check-grammar`, { text });
      return response.data;
    } catch (error) {
      console.error('Error checking grammar:', error);
      throw error;
    }
  }

  async checkSpanishGrammar(text: string): Promise<GrammarCheckResponse> {
    try {
      const response = await axios.post(`${API_URL}/openai/check-spanish-grammar`, { text });
      return response.data;
    } catch (error) {
      console.error('Error checking spanish grammar:', error);
      throw error;
    }
  }

  async generateConversation(
    context: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
    conversationHistory?: { role: 'user' | 'assistant' | 'system'; content: string; }[]
  ): Promise<ConversationResponse> {
    try {
      const session = await getSession();
      const token = session?.user?.token;

      if (!token) {
        throw new Error('No access token available');
      }

      const response = await axios(`${API_URL}/openai/conversation`, {
        params: { context, difficulty },
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        data: { conversationHistory }
      });
      return response.data;
    } catch (error) {
      console.error('Error generating conversation:', error);
      throw error;
    }
  }

  async generateSpanishConversation(
    context: string,
    difficulty: 'principiante' | 'intermedio' | 'avanzado' = 'intermedio',
    conversationHistory?: { role: 'user' | 'assistant' | 'system'; content: string; }[]
  ): Promise<ConversationResponse> {
    try {
      const session = await getSession();
      const token = session?.user?.token;

      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch(`${API_URL}/openai/spanish-conversation?context=${context}&difficulty=${difficulty}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ conversationHistory })
      });
      return response.json();
    } catch (error) {
      console.error('Error generating Spanish conversation:', error);
      throw error;
    }
  }

  async practiceSpeaking(
    topic: string,
    level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ): Promise<SpeakingPracticeResponse> {
    try {
      const response = await axios.get(`${API_URL}/openai/practice-speaking`, {
        params: { topic, level }
      });
      return response.data;
    } catch (error) {
      console.error('Error practicing speaking:', error);
      throw error;
    }
  }

  async translateToEnglish(
    text: string,
    fromLanguage: string
  ): Promise<TranslationResponse> {
    try {
      const response = await axios.post(`${API_URL}/openai/translate`, {
        text,
        fromLanguage
      });
      return response.data;
    } catch (error) {
      console.error('Error translating text:', error);
      throw error;
    }
  }
}

export const openAIService = new OpenAIService(); 