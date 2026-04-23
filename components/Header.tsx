'use client';

import { Search, History, LogOut } from 'lucide-react';
import { signout } from '@/app/auth/actions';

interface HeaderProps {
    onShowHistory: () => void;
}

export default function Header({ onShowHistory }: HeaderProps) {
    return (
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-6 gap-4">
            <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/20">
                    <Search className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                        Flipkart Scraper Pro
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 font-medium">Advanced product extraction & analytics</p>
                </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                    onClick={onShowHistory}
                    className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 bg-slate-800/50 hover:bg-slate-700 rounded-xl transition-all border border-slate-700 text-slate-300 hover:text-white"
                >
                    <History className="w-4 h-4" />
                    <span className="font-medium">History</span>
                </button>
                <button
                    onClick={() => signout()}
                    className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-900/10 hover:bg-red-900/20 border border-red-900/30 hover:border-red-900/50 text-red-400 rounded-xl transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </header>
    );
}
