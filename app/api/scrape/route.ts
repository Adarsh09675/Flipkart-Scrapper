
import { NextRequest, NextResponse } from 'next/server';
import { scrapeFlipkart } from '@/lib/scraper';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { query, minPrice, maxPrice, maxPages } = body;

        if (!query || minPrice === undefined || maxPrice === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Start scraping
        console.log(`API: Starting scrape for ${query}`);
        const products = await scrapeFlipkart(query, Number(minPrice), Number(maxPrice), Number(maxPages) || 5);

        console.log(`API: Scraped ${products.length} products`);

        // Save to Supabase
        // Assuming table 'products' exists with columns: name, price, link, image, source, scraped_at
        // We might need to create this table.
        // Check if we need to map the data to match the new schema or if 'products' variable already has it?
        // 'products' is ScrapedProduct[] which doesn't have search_query.
        // We need to map it.
        const productsWithQuery = products.map(p => ({
            ...p,
            search_query: query
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
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
