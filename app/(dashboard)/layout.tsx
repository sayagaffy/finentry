import AIFloatingWidget from "@/components/ai/AIFloatingWidget";
import Sidebar from "@/components/layout/Sidebar";
import { Suspense } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar Komponen: Navigasi Utama */}
            <div className="print:hidden">
                <Suspense fallback={<div className="w-64 bg-white border-r h-full" />}>
                    <Sidebar />
                </Suspense>
            </div>
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-8 relative">
                    {children}
                </div>
                {/* AI Widget: Floating Button untuk asisten AI, tersedia di seluruh dashboard */}
                <AIFloatingWidget />
            </main>
        </div>
    );
}
