
console.log("Script started");

(async () => {
    try {
        console.log("Importing scraper...");
        const scraper = await import('./lib/scraper');
        console.log("Import successful. Calling scrapeFlipkart...");
        const results = await scraper.scrapeFlipkart("laptop", 30000, 40000, 1);
        console.log("Scrape finished. Found:", results.length);
    } catch (err: any) {
        console.error("Caught error:", err);
        if (err.message) {
            console.error("Error Message:", err.message);
        }
        if (err.stack) {
            console.error("Stack:", err.stack);
        }
    }
})();
