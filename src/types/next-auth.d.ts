import 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      token: string;
      ranking: number;
      languageTests?: {
        english?: unknown;
        [key: string]: unknown;
      };
    }
  }

  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    token?: string;
    ranking?: number;
    languageTests?: {
      english?: unknown;
      [key: string]: unknown;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    id?: string;
    token?: string;
    ranking?: number;
    languageTests?: {
      english?: unknown;
      [key: string]: unknown;
    };
  }
} 