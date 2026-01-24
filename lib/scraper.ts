
import { chromium } from 'playwright';

// Slow scroll function
async function slowScroll(page: any, steps = 10, delay = 1500) {
    for (let i = 0; i < steps; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

export type ScrapedProduct = {
    name: string;
    price: number;
    link: string;
    image: string;
    source: string;
    scraped_at: string;
};

export async function scrapeFlipkart(query: string, minPrice: number, maxPrice: number, maxPages: number = 10) {
    const browser = await chromium.launch({ headless: true, slowMo: 30 });

    // Format query for URL
    const formattedQuery = encodeURIComponent(query);
    const FLIPKART_URL = `https://www.flipkart.com/search?q=${formattedQuery}&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=on&as=off`;

    console.log(`Starting scrape for ${query} at ${FLIPKART_URL}`);
    console.log(`Filters: minPrice=${minPrice} (${typeof minPrice}), maxPrice=${maxPrice} (${typeof maxPrice})`);

    try {
        const context = await browser.newContext({
            viewport: { width: 1366, height: 768 },
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        });

        const page = await context.newPage();
        await page.goto(FLIPKART_URL, { waitUntil: "networkidle", timeout: 60000 });

        // Close login popup if present
        try {
            await page.waitForSelector("button._2KpZ6l._2doB4z", { timeout: 5000 });
            await page.click("button._2KpZ6l._2doB4z");
            await new Promise(resolve => setTimeout(resolve, 1500));
        } catch {
            // Ignore if no popup
        }

        let allRawProducts: any[] = [];
        let pageCount = 0;

        while (pageCount < maxPages) {
            pageCount++;
            console.log(`Scraping page ${pageCount}...`);

            const productCard = "div[data-id]";
            try {
                await page.waitForSelector(productCard, { timeout: 30000 });
            } catch (e) {
                console.log(`No products found on page ${pageCount}. Stopping.`);
                break;
            }

            await slowScroll(page, 5, 500); // Slightly faster scroll for production

            const rawProducts = await page.$$eval(productCard, cards =>
                cards.map(card => {
                    const fullText = (card as HTMLElement).innerText;
                    const link = card.querySelector("a[href]")?.getAttribute("href") || null;
                    const image = card.querySelector("img")?.src || null;
                    // Try to get specifically the selling price element
                    const priceEl = card.querySelector('div._30jeq3, div._30jeq3._1_WHN1');
                    const priceText = priceEl ? (priceEl as HTMLElement).innerText : null;
                    return { fullText, link, image, priceText };
                })
            );

            console.log(`Products found on page ${pageCount}:`, rawProducts.length);
            allRawProducts.push(...rawProducts);

            // Check for Next button
            const nextBtn = page.locator("a").filter({ hasText: "Next" }).first();

            if ((await nextBtn.count()) === 0) {
                console.log("No more pages.");
                break;
            }

            try {
                await Promise.all([
                    nextBtn.click(),
                    page.waitForLoadState("networkidle")
                ]);
                await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
            } catch (e) {
                console.log("Error navigating to next page:", e);
                break;
            }
        }

        await browser.close();

        console.log(`Total raw products collected: ${allRawProducts.length}`);
        if (allRawProducts.length > 0) {
            console.log("Sample raw text:", allRawProducts[0].fullText.substring(0, 100));
            console.log("Sample extracted price:", allRawProducts[0].priceText);
        }

        // Process data
        let parsedProducts = allRawProducts.map(p => {
            const text = p.fullText.replace(/\n+/g, " ").trim();

            // Logic to get price:
            // 1. Use specific priceText if available.
            // 2. Fallback to regex on fullText, picking the first match (usually selling price) instead of Max (MRP).

            let price = null;

            if (p.priceText) {
                const numeric = p.priceText.replace(/[^0-9]/g, "");
                if (numeric) price = Number(numeric);
            }

            if (price === null) {
                const priceMatches = text.match(/₹\s?[\d,]+/g);
                if (priceMatches && priceMatches.length > 0) {
                    // Take the first one as it is usually the main price
                    price = Number(priceMatches[0].replace(/[^0-9]/g, ""));
                }
            }

            let name = text.split('₹')[0].trim();
            if (name.length > 150) name = name.substring(0, 150) + "...";

            return {
                name,
                price,
                link: p.link ? `https://www.flipkart.com${p.link}` : '',
                image: p.image || '',
                source: "Flipkart",
                scraped_at: new Date().toISOString()
            };
        });

        console.log(`Products with valid price extracted: ${parsedProducts.filter(p => p.price !== null).length}`);

        // Filter
        let final: ScrapedProduct[] = parsedProducts.filter((p): p is ScrapedProduct => {
            if (!p.name || !p.price) return false;
            const inRange = p.price >= minPrice && p.price <= maxPrice;
            if (!inRange) {
                console.log(`Filtered out price ${p.price} not in range ${minPrice}-${maxPrice}`);
            }
            return inRange;
        });

        console.log(`Final filtered products: ${final.length}`);

        // Sort High -> Low
        final.sort((a, b) => b.price - a.price);

        return final;

    } catch (error) {
        console.error("Scraping failed:", error);
        await browser.close();
        throw error;
    }
}
