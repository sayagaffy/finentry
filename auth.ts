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
                    include: { company: true }, // Sertakan relasi perusahaan
                });

                if (!user) return null;

                // Pada aplikasi nyata, gunakan bcrypt.compare(credentials.password, user.password)
                // Untuk project ini kita gunakan plain text sementara
                if (credentials.password !== user.password) return null;

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    companyId: user.companyId,
                    companyName: user.company?.name || null, // Tambahkan nama perusahaan ke sesi
                };
            },
        }),
    ],
    callbacks: {
        // Callback JWT dipanggil saat token dibuat atau diperbarui
        async jwt({ token, user }: any) {
            if (user) {
                token.role = user.role;
                token.companyId = user.companyId;
                token.companyName = user.companyName; // Tambahkan nama perusahaan ke token
            }
            return token;
        },
        // Callback session dipanggil saat data sesi diambil di client/server
        async session({ session, token }: any) {
            if (token && session.user) {
                session.user.role = token.role;
                session.user.companyId = token.companyId;
                session.user.companyName = token.companyName; // Tambahkan nama perusahaan ke sesi
                session.user.id = token.sub; // Pastikan ID tersedia di sesi
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.AUTH_SECRET || "fallback_secret_for_dev_only",
});

