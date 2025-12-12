import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Extends the built-in session and user types
     */
    interface Session {
        user: {
            /** The user's unique ID */
            id: string
            /** The user's role (OWNER or ADMIN) */
            role: string
            /** The user's company ID (null for OWNERs) */
            companyId: string | null
            /** The user's company name (null for OWNERs) */
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
