import AIFloatingWidget from "@/components/ai/AIFloatingWidget";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-50">
            <div className="print:hidden">
                <Sidebar />
            </div>
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-8 relative">
                    {children}
                </div>
                <AIFloatingWidget />
            </main>
        </div>
    );
}
