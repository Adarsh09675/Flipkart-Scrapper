'use client';

import { History, X, Loader2, Trash2 } from 'lucide-react';
import { HistoryItem } from '@/types';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    loading: boolean;
    history: HistoryItem[];
    onLoadItem: (query: string) => void;
    onDeleteItem: (query: string) => void;
}

export default function HistoryModal({
    isOpen,
    onClose,
    loading,
    history,
    onLoadItem,
    onDeleteItem
}: HistoryModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)] animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-600/20 rounded-lg">
                            <History className="w-5 h-5 text-blue-400" />
                        </div>
                        Search History
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                            <p className="font-medium animate-pulse">Loading history...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-4">
                            <div className="p-5 bg-slate-800/30 rounded-full">
                                <History className="w-12 h-12 opacity-10" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-slate-400">No searches yet</p>
                                <p className="text-sm mt-1">Your recent searches will appear here.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {history.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-slate-800/20 hover:bg-slate-800/50 border border-slate-800/50 rounded-2xl group transition-all cursor-default">
                                    <div
                                        className="flex-1 cursor-pointer"
                                        onClick={() => onLoadItem(item.query)}
                                    >
                                        <h4 className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors leading-tight">{item.query}</h4>
                                        <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                            <span>{new Date(item.last_scraped).toLocaleDateString()}</span>
                                            <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                            <span className="text-blue-400/80">{item.count} items</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onDeleteItem(item.query)}
                                        className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-xl transition-all sm:opacity-0 group-hover:opacity-100"
                                        title="Delete results"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-800 bg-slate-950/50 text-center rounded-b-3xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Click on a search to restore its results
                    </p>
                </div>
            </div>
        </div>
    );
}
