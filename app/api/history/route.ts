
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET: Fetch search history (group by search_query)
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        // We want to get distinct search queries and their counts/latest date
        // Supabase/Postgres specific:
        const { data, error } = await supabase
            .from('products')
            .select('search_query, scraped_at')
            .order('scraped_at', { ascending: false });

        if (error) throw error;

        // Group by search_query manually since simple group by with count is tricky in simple select helper
        // or we can use .rpc() if we had a function, but let's do JS processing for simplicity 
        // as the dataset isn't huge yet. 
        // A better SQL approach: select distinct search_query, sent in a raw query or similar.
        // But let's just get everything and aggregate. Note: NOT EFFICIENT for massive data.
        // Optimization: Create a database view or function. 
        // Let's try to just get distinct names if possible, but we want the count.

        // Alternative: Use a separate 'searches' table. But for now we are using products table.
        // Let's just process the list.

        const historyMap = new Map();

        data.forEach((item: any) => {
            if (!item.search_query) return;

            if (!historyMap.has(item.search_query)) {
                historyMap.set(item.search_query, {
                    query: item.search_query,
                    count: 0,
                    last_scraped: item.scraped_at
                });
            }

            const entry = historyMap.get(item.search_query);
            entry.count += 1;
            // Update last_scraped if deeper one is newer (list is ordered desc so first is newest)
        });

        return NextResponse.json({ history: Array.from(historyMap.values()) });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Delete a specific search history
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('query');

        if (!query) {
            return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('search_query', query);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
