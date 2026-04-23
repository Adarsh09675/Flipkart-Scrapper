export type ScrapedProduct = {
    id?: string;
    name: string;
    price: number;
    link: string;
    image: string;
    source: string;
    scraped_at: string;
    search_query?: string;
    user_id?: string;
};

export type HistoryItem = {
    query: string;
    count: number;
    last_scraped: string;
};
