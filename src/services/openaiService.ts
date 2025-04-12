import axios from 'axios';

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
    role: 'user' | 'assistant';
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

  async generateConversation(
    context: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ): Promise<ConversationResponse> {
    try {
      const response = await axios.get(`${API_URL}/openai/conversation`, {
        params: { context, difficulty }
      });
      return response.data;
    } catch (error) {
      console.error('Error generating conversation:', error);
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