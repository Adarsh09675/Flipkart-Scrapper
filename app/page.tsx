'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, ExternalLink, History, Trash2, X, Download, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { signout } from '@/app/auth/actions';
import { createClient } from '@/utils/supabase/client';

// Initialize Supabase client for client-side fetching
const supabase = createClient();

type HistoryItem = {
  query: string;
  count: number;
  last_scraped: string;
};

export default function Home() {
  const [query, setQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [maxPages, setMaxPages] = useState('5');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState('');

  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const currentProducts = products.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (data.history) {
        setHistory(data.history);
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const deleteHistory = async (queryToDelete: string) => {
    if (!confirm(`Are you sure you want to delete all results for "${queryToDelete}"?`)) return;

    try {
      const res = await fetch(`/api/history?query=${encodeURIComponent(queryToDelete)}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setHistory(prev => prev.filter(h => h.query !== queryToDelete));
        // If currently showing results for this query, maybe clear them? 
        // For now, let's just clear products if they match the deleted query, but simple to just leave them.
      }
    } catch (e) {
      console.error("Failed to delete history", e);
    }
  };

  const loadHistoryItem = async (historyQuery: string) => {
    // Just load from DB directly basically reusing logic or just setting query and search manually
    // But better: fetch from DB directly.
    // For simplicity, let's just pre-fill search and maybe fetch data if we had a pure fetch endpoint.
    // Since our main scrape endpoint does scraping, we might need a "fetch only" mode or just filter locally if we had all data.
    // But user wants to "see previous searches", usually meaning the results.
    // Let's just fetch from Supabase directly for that query.

    setQuery(historyQuery);
    setShowHistory(false);
    setLoading(true);
    setProducts([]); // Clear current

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('search_query', historyQuery)
        .order('price', { ascending: false }); // High to low as default

      if (error) throw error;
      setProducts(data || []);
      setCurrentPage(1); // Reset to first page
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (products.length === 0) return;

    // Define headers
    const headers = ['Name', 'Price', 'Link', 'Image', 'Source', 'Scraped At'];

    // Convert data to CSV format
    const csvContent = [
      headers.join(','),
      ...products.map(p => {
        // Handle commas in content (wrap in quotes)
        const name = `"${(p.name || '').replace(/"/g, '""')}"`;
        const price = p.price || '';
        const link = p.link || '';
        const image = p.image || '';
        const source = p.source || '';
        const scrapedAt = p.scraped_at || '';
        return [name, price, link, image, source, scrapedAt].join(',');
      })
    ].join('\n');

    // Create blobs and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `flipkart_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setProducts([]);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          minPrice: Number(minPrice),
          maxPrice: Number(maxPrice),
          maxPages: Number(maxPages)
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Scraping failed');
      }

      setProducts(data.data || []);
      setCurrentPage(1); // Reset to first page

      // Refresh history if open (unlikely but good practice)
      if (showHistory) fetchHistory();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans relative">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/20">
              <Search className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Flipkart Scraper Pro
              </h1>
              <p className="text-slate-400 text-sm mt-1">Advanced product extraction & analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg transition border border-slate-700 text-slate-300"
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>
            <button
              onClick={() => signout()}
              className="flex items-center space-x-2 px-4 py-2 bg-red-900/10 hover:bg-red-900/20 border border-red-900/30 hover:border-red-900/50 text-red-400 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Search Form */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <form onSubmit={handleScrape} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Search Query</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Apple iPhone 15"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Min Price (₹)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="10000"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Max Price (₹)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="50000"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/20"
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
            <div className="mt-4 p-3 bg-red-900/30 border border-red-800 text-red-200 rounded-lg text-sm">
              Error: {error}
            </div>
          )}
        </section>

        {/* Results */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Results <span className="text-slate-500 text-base font-normal">({products.length})</span></h2>
            {products.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-green-400 font-medium px-2 py-1 bg-green-900/20 border border-green-800 rounded">Live Data</span>
                <button
                  onClick={downloadCSV}
                  className="text-xs text-blue-400 hover:text-white hover:bg-blue-900/50 px-2 py-1 rounded transition flex items-center gap-1 border border-blue-900/50"
                  title="Download as CSV"
                >
                  <Download className="w-3 h-3" />
                  CSV
                </button>
                <button
                  onClick={() => setProducts([])}
                  className="text-xs text-slate-400 hover:text-white hover:bg-slate-800 px-2 py-1 rounded transition flex items-center gap-1"
                  title="Clear results from view"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950 text-slate-200 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Image</th>
                    <th className="px-6 py-4 font-semibold">Product Name</th>
                    <th className="px-6 py-4 font-semibold">Price</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        {loading ? 'Fetching data...' : 'No products found yet. Start a search.'}
                      </td>
                    </tr>
                  ) : (
                    currentProducts.map((product, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50 transition duration-150">
                        <td className="px-6 py-4">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-16 h-16 object-contain rounded bg-white p-1" />
                          ) : (
                            <div className="w-16 h-16 bg-slate-800 rounded flex items-center justify-center text-xs">No Img</div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-white max-w-md" title={product.name}>
                          <div className="line-clamp-2">{product.name}</div>
                        </td>
                        <td className="px-6 py-4 text-green-400 font-semibold text-base">
                          {product.price ? `₹${product.price.toLocaleString()}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <a
                            href={product.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition"
                          >
                            <span>View</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {products.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between mt-4 border-t border-slate-800 pt-4">
              <div className="text-sm text-slate-500">
                Showing <span className="text-white font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-white font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, products.length)}</span> of <span className="text-white font-medium">{products.length}</span> results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    // Simple logic to show first 5 pages or sliding window could be added
                    // For now, let's allow jumping to specific pages if total pages is small, 
                    // or just show "Page X of Y" if simple.
                    // Given the request was "pagination", usually Next/Prev is core.
                    // Let's stick to simple Page X of Y for clean UI with Next/Prev buttons.
                    return null;
                  })}
                  <span className="text-sm text-slate-400 font-medium px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </section>

      </div>

      {/* History Modal / Drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                Search History
              </h3>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p>Loading history...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                  <History className="w-12 h-12 mb-2 opacity-20" />
                  <p>No search history found.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {history.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-800 rounded-xl group transition">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => loadHistoryItem(item.query)}
                      >
                        <h4 className="font-semibold text-slate-200 group-hover:text-blue-400 transition">{item.query}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(item.last_scraped).toLocaleDateString()} • {item.count} items found
                        </p>
                      </div>
                      <button
                        onClick={() => deleteHistory(item.query)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                        title="Delete stored results"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/50 text-center text-xs text-slate-500 rounded-b-2xl">
              Click on a search to view stored results.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
