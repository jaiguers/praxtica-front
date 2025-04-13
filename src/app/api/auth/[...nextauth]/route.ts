import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';

interface GitHubProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
}

interface BackendResponse {
  token: string;
  user: {
    name: string;
    email: string;
    avatar: string;
    ranking: number;
  }
}

let userRanking: number | null = null;
let userToken: string | null = null;

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
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
      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        session.user = {
          name: null,
          email: null,
          image: null,
          token: token.token as string,
          ranking: token.ranking as number
        };
      } else {
        session.user.token = token.token as string;
        session.user.ranking = token.ranking as number;
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