import prisma from '@/lib/prisma';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: String(credentials.email) },
                    include: { company: true }, // Include company relation
                });

                if (!user) return null;

                // In a real app, use bcrypt.compare(credentials.password, user.password)
                // For this MVP seed, we used plain text "password"
                if (credentials.password !== user.password) return null;

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    companyId: user.companyId,
                    companyName: user.company?.name || null, // Add company name
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.role = user.role;
                token.companyId = user.companyId;
                token.companyName = user.companyName; // Add company name to token
            }
            return token;
        },
        async session({ session, token }: any) {
            if (token && session.user) {
                session.user.role = token.role;
                session.user.companyId = token.companyId;
                session.user.companyName = token.companyName; // Add company name to session
                session.user.id = token.sub; // Ensure ID is passed
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.AUTH_SECRET || "fallback_secret_for_dev_only",
});

