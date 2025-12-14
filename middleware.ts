import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const isLoggedIn = !!req.auth;

    // Daftar path yang dilindungi (perlu login)
    const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard") ||
        req.nextUrl.pathname === "/" ||
        req.nextUrl.pathname.startsWith("/transactions") ||
        req.nextUrl.pathname.startsWith("/reports") ||
        req.nextUrl.pathname.startsWith("/master-data") ||
        req.nextUrl.pathname.startsWith("/ai");

    const isOnLogin = req.nextUrl.pathname.startsWith("/login");

    // Jika user mengakses halaman dashboard tapi belum login, redirect ke login
    if (isOnDashboard) {
        if (isLoggedIn) return NextResponse.next();
        return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    // Jika user mengakses halaman login tapi sudah login, redirect ke dashboard
    if (isOnLogin) {
        if (isLoggedIn) return NextResponse.redirect(new URL("/", req.nextUrl));
        return NextResponse.next();
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
