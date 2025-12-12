import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard") ||
        req.nextUrl.pathname === "/" ||
        req.nextUrl.pathname.startsWith("/transactions") ||
        req.nextUrl.pathname.startsWith("/reports") ||
        req.nextUrl.pathname.startsWith("/master-data") ||
        req.nextUrl.pathname.startsWith("/ai");

    const isOnLogin = req.nextUrl.pathname.startsWith("/login");

    if (isOnDashboard) {
        if (isLoggedIn) return NextResponse.next();
        return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    if (isOnLogin) {
        if (isLoggedIn) return NextResponse.redirect(new URL("/", req.nextUrl));
        return NextResponse.next();
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
