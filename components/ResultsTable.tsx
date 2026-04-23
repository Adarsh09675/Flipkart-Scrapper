'use client';

import { ExternalLink, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ScrapedProduct } from '@/types';

interface ResultsTableProps {
    products: ScrapedProduct[];
    loading: boolean;
    onDownloadCSV: () => void;
    onClear: () => void;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    itemsPerPage: number;
}

export default function ResultsTable({
    products,
    loading,
    onDownloadCSV,
    onClear,
    currentPage,
    setCurrentPage,
    itemsPerPage
}: ResultsTableProps) {
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const currentProducts = products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Results 
                    <span className="text-slate-500 text-sm font-normal bg-slate-800/50 px-2.5 py-0.5 rounded-full border border-slate-700">
                        {products.length}
                    </span>
                </h2>
                {products.length > 0 && (
                    <div className="flex items-center space-x-2">
                        <span className="hidden sm:inline-block text-[10px] text-green-400 font-bold uppercase tracking-widest px-2 py-1 bg-green-900/20 border border-green-800/50 rounded">Live Data</span>
                        <button
                            onClick={onDownloadCSV}
                            className="text-xs font-semibold text-blue-400 hover:text-white hover:bg-blue-600 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 border border-blue-900/50"
                            title="Download as CSV"
                        >
                            <Download className="w-3.5 h-3.5" />
                            CSV
                        </button>
                        <button
                            onClick={onClear}
                            className="text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 border border-slate-800"
                            title="Clear results"
                        >
                            <X className="w-3.5 h-3.5" />
                            Clear
                        </button>
                    </div>
                )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-sm shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-950/80 text-slate-200 uppercase tracking-widest text-[10px] font-bold border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Image</th>
                                <th className="px-6 py-4">Product Name</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-16 h-16 rounded-full bg-slate-800/30 flex items-center justify-center">
                                                <X className="w-8 h-8 opacity-20" />
                                            </div>
                                            <p className="font-medium text-lg text-slate-400">
                                                {loading ? 'Fetching data...' : 'No products found'}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {loading ? 'Please wait while we scrape Flipkart' : 'Try searching for a product to see results here'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentProducts.map((product, idx) => (
                                    <tr key={idx} className="hover:bg-blue-600/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            {product.image ? (
                                                <div className="relative w-16 h-16 group-hover:scale-105 transition-transform">
                                                    <img src={product.image} alt={product.name} className="w-full h-full object-contain rounded-lg bg-white p-1.5 shadow-sm" />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-500">NO IMG</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-200 max-w-md">
                                            <div className="line-clamp-2 leading-relaxed group-hover:text-white transition-colors">{product.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-green-400 font-bold text-base tabular-nums">
                                            {product.price ? `₹${product.price.toLocaleString()}` : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <a
                                                href={product.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center space-x-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-1.5 rounded-lg transition-all font-semibold"
                                            >
                                                <span>View</span>
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {products.length > itemsPerPage && (
                    <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-t border-slate-800 bg-slate-950/30 gap-4">
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Showing <span className="text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-white">{Math.min(currentPage * itemsPerPage, products.length)}</span> of <span className="text-white">{products.length}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-slate-700"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="text-xs font-bold text-slate-400 bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-700">
                                PAGE {currentPage} <span className="text-slate-600 mx-1">/</span> {totalPages}
                            </div>
                            <button
                                onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-slate-700"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
