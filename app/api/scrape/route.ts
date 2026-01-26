import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { scrapeFlipkart } from '@/lib/scraper';

export const maxDuration = 60; // Allow up to 60 seconds (requires Vercel Pro/Trial, but good practice)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { query, minPrice, maxPrice, maxPages } = body;

        if (!query || minPrice === undefined || maxPrice === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check for Env Vars
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.error("Missing Supabase Environment Variables");
            return NextResponse.json({
                error: 'Configuration Error',
                message: 'Missing Vercel Environment Variables (Supabase URL/Key). Please add them in Vercel Project Settings.'
            }, { status: 500 });
        }

        // Start scraping
        console.log(`API: Starting scrape for ${query}`);
        const products = await scrapeFlipkart(query, Number(minPrice), Number(maxPrice), Number(maxPages) || 5);

        console.log(`API: Scraped ${products.length} products`);

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Save to Supabase
        const productsWithQuery = products.map(p => ({
            ...p,
            search_query: query,
            user_id: user.id
        }));

        const { data, error } = await supabase
            .from('products')
            .insert(productsWithQuery)
            .select();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: 'Failed to save data to database', details: error }, { status: 500 });
        }

        return NextResponse.json({ success: true, count: products.length, data });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            type: error.name
        }, { status: 500 });
    }
}
