'use client';

import { Bot, Box, Building2, FileText, LayoutDashboard, LogOut, Receipt, Settings, Truck, Users } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const menuItems = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/transactions', label: 'Transaksi', icon: Receipt },
    { href: '/reports/income-statement', label: 'Laporan Laba Rugi', icon: FileText },
    { href: '/ai', label: 'AI Assistant', icon: Bot },
];

const masterDataItems = [
    { href: '/master-data/customers', label: 'Customers', icon: Users },
    { href: '/master-data/vendors', label: 'Vendors', icon: Truck },
    { href: '/master-data/items', label: 'Items', icon: Box },
];

export default function Sidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const isOwner = session?.user?.role === 'OWNER';
    const companyParam = searchParams.get('company');

    // Helper to add company param to links if OWNER is in company context
    const addCompanyParam = (href: string) => {
        if (isOwner && companyParam) {
            return `${href}${href.includes('?') ? '&' : '?'}company=${companyParam}`;
        }
        return href;
    };

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
            <div className="p-6 border-b border-slate-100">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-bold tracking-tight text-black">FinEntry</h1>
                    <span className="text-xs font-medium text-black">by Priventry</span>
                </div>

                {/* OWNER in Company Context: Show Breadcrumb + Company Badge */}
                {isOwner && companyParam ? (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                        <Link
                            href="/admin/overview"
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                        >
                            ← Back to Companies
                        </Link>
                        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-md">
                            <Building2 className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                            <span className="text-sm font-semibold text-indigo-900 truncate">
                                Viewing Company
                            </span>
                        </div>
                    </div>
                ) : (
                    /* ADMIN: Show their Company Badge */
                    session?.user?.companyName && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-md">
                                <Building2 className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                                <span className="text-sm font-semibold text-indigo-900 truncate">
                                    {session.user.companyName}
                                </span>
                            </div>
                        </div>
                    )
                )}
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
                {/* Main Menu & Master Data - Only show if ADMIN or OWNER with company context */}
                {(!isOwner || companyParam) && (
                    <>
                        {/* Main Menu */}
                        <div>
                            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Main Menu</p>
                            <nav className="space-y-1">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    const href = addCompanyParam(item.href);
                                    const isActive = pathname === item.href || (item.label === 'AI Assistant' && pathname === '/ai') || (item.label === 'Overview' && pathname === '/');

                                    return (
                                        <Link
                                            key={item.href}
                                            href={href}
                                            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                }`}
                                        >
                                            <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Master Data */}
                        <div>
                            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Master Data</p>
                            <nav className="space-y-1">
                                {masterDataItems.map((item) => {
                                    const Icon = item.icon;
                                    const href = addCompanyParam(item.href);
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={href}
                                            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                }`}
                                        >
                                            <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </>
                )}

                {/* Admin Menu (Owner Only) */}
                {isOwner && (
                    <div>
                        <p className="px-3 text-xs font-semibold text-orange-500 uppercase tracking-wider mb-2">Super Admin</p>
                        <nav className="space-y-1">
                            <Link
                                href="/admin/companies"
                                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${pathname === '/admin/companies' ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <Settings className="h-5 w-5 text-orange-500" />
                                Company Management
                            </Link>
                        </nav>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                        {session?.user?.name?.[0] || 'U'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-slate-900 truncate">{session?.user?.name || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">
                            {session?.user?.role || 'Role'}
                            {session?.user?.companyName && ` · ${session.user.companyName}`}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-2 rounded text-sm transition"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
