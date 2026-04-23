'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ScrapedProduct, HistoryItem } from '@/types';

// Components
import Header from '@/components/Header';
import SearchForm from '@/components/SearchForm';
import ResultsTable from '@/components/ResultsTable';
import HistoryModal from '@/components/HistoryModal';

const supabase = createClient();
const ITEMS_PER_PAGE = 20;

export default function Home() {
  // Search State
  const [query, setQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [maxPages, setMaxPages] = useState('5');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ScrapedProduct[]>([]);
  const [error, setError] = useState('');

  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/history');
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Server returned ${res.status}` }));
        throw new Error(errorData.error || 'Failed to fetch history');
      }

      const data = await res.json();
      if (data.history) {
        setHistory(data.history);
      }
    } catch (e: any) {
      console.error("Failed to fetch history", e);
      // Don't show full error in UI for background refresh, but good for debug
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
      }
    } catch (e) {
      console.error("Failed to delete history", e);
    }
  };

  const loadHistoryItem = async (historyQuery: string) => {
    setQuery(historyQuery);
    setShowHistory(false);
    setLoading(true);
    setProducts([]);

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('search_query', historyQuery)
        .order('price', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
      setCurrentPage(1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (products.length === 0) return;

    const headers = ['Name', 'Price', 'Link', 'Image', 'Source', 'Scraped At'];
    const csvContent = [
      headers.join(','),
      ...products.map(p => {
        const name = `"${(p.name || '').replace(/"/g, '""')}"`;
        const price = p.price || '';
        const link = p.link || '';
        const image = p.image || '';
        const source = p.source || '';
        const scrapedAt = p.scraped_at || '';
        return [name, price, link, image, source, scrapedAt].join(',');
      })
    ].join('\n');

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

      // Handle non-JSON or error responses gracefully
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("Non-JSON response received:", text.slice(0, 500));
        throw new Error(`Server returned an unexpected response (Status ${res.status}). This often happens if you're not logged in or the session expired.`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Scraping failed');
      }

      setProducts(data.data || []);
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 sm:p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-10">
        
        <Header onShowHistory={() => setShowHistory(true)} />

        <main className="space-y-12">
          <SearchForm 
            query={query}
            setQuery={setQuery}
            minPrice={minPrice}
            setMinPrice={setMinPrice}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            maxPages={maxPages}
            setMaxPages={setMaxPages}
            loading={loading}
            onScrape={handleScrape}
            error={error}
          />

          <ResultsTable 
            products={products}
            loading={loading}
            onDownloadCSV={downloadCSV}
            onClear={() => setProducts([])}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </main>

        <footer className="pt-10 border-t border-slate-900 text-center">
           <p className="text-slate-600 text-xs font-bold uppercase tracking-[0.2em]">
             Flipkart Scraper Pro &copy; {new Date().getFullYear()} • Powered by Playwright & Supabase
           </p>
        </footer>
      </div>

      <HistoryModal 
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        loading={loadingHistory}
        history={history}
        onLoadItem={loadHistoryItem}
        onDeleteItem={deleteHistory}
      />
    </div>
  );
}
