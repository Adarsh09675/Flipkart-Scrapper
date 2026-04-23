'use client';

import { Loader2 } from 'lucide-react';

interface SearchFormProps {
    query: string;
    setQuery: (val: string) => void;
    minPrice: string;
    setMinPrice: (val: string) => void;
    maxPrice: string;
    setMaxPrice: (val: string) => void;
    maxPages: string;
    setMaxPages: (val: string) => void;
    loading: boolean;
    onScrape: (e: React.FormEvent) => void;
    error?: string;
}

export default function SearchForm({
    query, setQuery,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    maxPages, setMaxPages,
    loading,
    onScrape,
    error
}: SearchFormProps) {
    return (
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
            <form onSubmit={onScrape} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Search Query</label>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g. Apple iPhone 15"
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Min Price (₹)</label>
                    <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="10000"
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Max Price (₹)</label>
                    <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="50000"
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                </div>

                <div className="flex items-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-bold rounded-xl px-4 py-3 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/30 active:scale-95"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Scraping...</span>
                            </>
                        ) : (
                            <span>Start Scrape</span>
                        )}
                    </button>
                </div>
            </form>
            {error && (
                <div className="mt-6 p-4 bg-red-900/20 border border-red-800/50 text-red-200 rounded-xl text-sm animate-in fade-in slide-in-from-top-1">
                    <span className="font-bold">Error:</span> {error}
                </div>
            )}
        </section>
    );
}
