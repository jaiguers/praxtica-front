import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

interface GitHubProfile {
  id: string;
  email: string;
  name: string;
  login:string;
  avatar_url: string;
}

interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

interface BackendResponse {
  token: string;
  user: {
    id?: string;
    _id?: string;
    name: string;
    email: string;
    avatar: string;
    ranking: number;
    isDemo?: boolean;
    languageTests?: {
      english?: unknown;
      [key: string]: unknown;
    };
  }
}

let userRanking: number | null = null;
let userToken: string | null = null;
let userId: string | null = null;
let userLanguageTests: { english?: unknown; [key: string]: unknown } | null = null;
let userIsDemo: boolean | null = null;

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email user:public_repo',
        },
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
    CredentialsProvider({
      id: 'demo-access',
      name: 'Demo Access',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/demo-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Demo login rejected by backend:', response.status, errorText);
            return null;
          }

          const data: BackendResponse = await response.json();
          const backendUserId = data.user.id || data.user._id;

          if (!data.user.isDemo) {
            console.error('Demo login succeeded but user.isDemo is false');
            return null;
          }

          userRanking = data.user.ranking;
          userToken = data.token;
          userId = backendUserId || null;
          userLanguageTests = data.user.languageTests || null;
          userIsDemo = Boolean(data.user.isDemo);

          if (!backendUserId) {
            return null;
          }

          return {
            id: backendUserId,
            name: data.user.name,
            email: data.user.email,
            image: 'https://i.postimg.cc/hvPt0d21/4.png', // Imagen genérica para usuarios demo
            token: data.token,
            ranking: data.user.ranking,
            languageTests: data.user.languageTests,
            isDemo: Boolean(data.user.isDemo),
          };
        } catch (error) {
          console.error('Error al conectar con demo-login:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'github') {
        try {
          const githubProfile = profile as GitHubProfile;
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/github`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              githubId: githubProfile.id,
              email: user.email,
              username: githubProfile.login,
              name: user.name,
              avatar: user.image,
              accessToken: account.access_token,
            }),
          });

          if (!response.ok) {
            console.error('Error al registrar usuario en el backend');
            return false;
          }

          const data: BackendResponse = await response.json();
          userRanking = data.user.ranking;
          userToken = data.token;
          userId = data.user.id || data.user._id || null;
          userLanguageTests = data.user.languageTests || null;
          userIsDemo = Boolean(data.user.isDemo);
          return true;
        } catch (error) {
          console.error('Error al conectar con el backend:', error);
          return false;
        }
      }

      if (account?.provider === 'google') {
        try {
          const googleProfile = profile as GoogleProfile;
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/gmail`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              googleId: googleProfile.sub,
              email: user.email,
              username: user.name,
              name: user.name,
              avatar: user.image,
              accessToken: account.access_token,
            }),
          });

          if (!response.ok) {
            console.error('Error al registrar usuario en el backend');
            return false;
          }

          const data: BackendResponse = await response.json();
          userRanking = data.user.ranking;
          userToken = data.token;
          userId = data.user.id || data.user._id || null;
          userLanguageTests = data.user.languageTests || null;
          userIsDemo = Boolean(data.user.isDemo);
          return true;
        } catch (error) {
          console.error('Error al conectar con el backend:', error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      if (userRanking !== null) {
        token.ranking = userRanking;
      }
      if (userToken !== null) {
        token.token = userToken;
      }
      if (userId !== null) {
        token.id = userId;
      }
      if (userLanguageTests !== null) {
        token.languageTests = userLanguageTests;
      }
      if (userIsDemo !== null) {
        token.isDemo = userIsDemo;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        session.user = {
          id: token.id as string,
          name: null,
          email: null,
          image: null,
          token: token.token as string,
          ranking: token.ranking as number,
          languageTests: token.languageTests,
          isDemo: token.isDemo as boolean | undefined,
        };
      } else {
        session.user.id = token.id as string;
        session.user.token = token.token as string;
        session.user.ranking = token.ranking as number;
        session.user.languageTests = token.languageTests;
        session.user.isDemo = token.isDemo as boolean | undefined;
      }
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST }; 
