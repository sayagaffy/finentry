'use client';
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

// Providers: Komponen Client-side untuk membungkus aplikasi dengan context
// SessionProvider: Mengelola status sesi autentikasi (NextAuth)
// Toaster: Menampilkan notifikasi popup (Sonner)
export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            {children}
            <Toaster position="top-center" richColors />
        </SessionProvider>
    );
}
