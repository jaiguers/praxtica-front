import 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      token: string;
      ranking: number;
    }
  }

  interface User {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    token?: string;
    ranking?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    token?: string;
    ranking?: number;
  }
} 