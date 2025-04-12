import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';

interface GitHubProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
}

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
        console.log('account', account);
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
              name: user.name,
              avatar: user.image,
              accessToken: account.access_token,
            }),
          });

          if (!response.ok) {
            console.error('Error al registrar usuario en el backend');
            return false;
          }
        } catch (error) {
          console.error('Error al conectar con el backend:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.accessToken = token.accessToken;
      }
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