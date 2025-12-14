import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Memperluas tipe session dan user bawaan NextAuth
     * agar bisa menyimpan data tambahan seperti role dan companyId.
     */
    interface Session {
        user: {
            /** ID unik pengguna */
            id: string
            /** Peran pengguna (OWNER atau ADMIN) */
            role: string
            /** ID perusahaan pengguna (null untuk OWNER) */
            companyId: string | null
            /** Nama perusahaan pengguna (null untuk OWNER) */
            companyName: string | null
        } & DefaultSession["user"]
    }

    interface User {
        role: string
        companyId: string | null
        companyName: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: string
        companyId: string | null
        companyName: string | null
    }
}
