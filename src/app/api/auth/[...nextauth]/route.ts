import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: { params: { access_type: "offline", prompt: "consent", response_type: "code" } }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      // Expose ID token in session for API requests
      if (session.user) {
        (session as any).idToken = token.id_token;
      }
      return session;
    },
    async jwt({ token, account }) {
      // Store the ID token from Google for later use
      if (account?.id_token) {
        token.id_token = account.id_token;
      }
      console.error('JWT callback - token:', account?.refresh_token ? { ...token, refresh_token: account.refresh_token } : token);
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
