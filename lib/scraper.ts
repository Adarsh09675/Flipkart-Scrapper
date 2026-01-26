import { chromium as playwright, Page } from "playwright-core";
import chromium from "@sparticuz/chromium";

// Slow scroll
async function slowScroll(page: Page, steps = 6, delay = 400) {
    for (let i = 0; i < steps; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await new Promise(res => setTimeout(res, delay));
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

export async function scrapeFlipkart(
    query: string,
    minPrice: number,
    maxPrice: number,
    maxPages: number = 3
) {
    console.log("Launching Vercel-compatible Chromium...");

    const browser = await playwright.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
    });

    const context = await browser.newContext({
        viewport: { width: 1366, height: 768 },
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();

    // 🚀 Performance + memory safety
    await page.route("**/*", route => {
        const type = route.request().resourceType();
        if (["image", "font", "media"].includes(type)) route.abort();
        else route.continue();
    });

    page.setDefaultTimeout(45000);

    const formattedQuery = encodeURIComponent(query);
    const FLIPKART_URL = `https://www.flipkart.com/search?q=${formattedQuery}`;

    console.log("Opening:", FLIPKART_URL);

    try {
        await page.goto(FLIPKART_URL, { waitUntil: "networkidle" });

        // Close login popup
        try {
            await page.waitForSelector("button._2KpZ6l._2doB4z", { timeout: 5000 });
            await page.click("button._2KpZ6l._2doB4z");
        } catch { }

        let allRawProducts: any[] = [];

        for (let pageCount = 1; pageCount <= maxPages; pageCount++) {
            console.log(`Scraping page ${pageCount}...`);

            const productCard = "div[data-id]";
            await page.waitForSelector(productCard, { timeout: 30000 });

            await slowScroll(page);

            const rawProducts = await page.$$eval(productCard, cards =>
                cards.map(card => {
                    const fullText = (card as HTMLElement).innerText;
                    const link = card.querySelector("a[href]")?.getAttribute("href");
                    const image = card.querySelector("img")?.getAttribute("src");
                    const priceText =
                        card.querySelector("div._30jeq3, div._30jeq3._1_WHN1")?.textContent;

                    return { fullText, link, image, priceText };
                })
            );

            console.log("Found:", rawProducts.length);
            allRawProducts.push(...rawProducts);

            const nextBtn = page.locator("a").filter({ hasText: "Next" }).first();
            if ((await nextBtn.count()) === 0) break;

            await Promise.all([
                nextBtn.click(),
                page.waitForLoadState("networkidle"),
            ]);
        }

        console.log("Total raw products:", allRawProducts.length);

        // 🧠 Data cleaning
        const parsed = allRawProducts.map(p => {
            const text = p.fullText.replace(/\n+/g, " ").trim();

            let price: number | null = null;

            if (p.priceText) {
                const n = p.priceText.replace(/[^0-9]/g, "");
                if (n) price = Number(n);
            }

            if (price === null) {
                const m = text.match(/₹\s?[\d,]+/);
                if (m) price = Number(m[0].replace(/[^0-9]/g, ""));
            }

            let name = text.split("₹")[0].trim();
            if (name.length > 150) name = name.slice(0, 150) + "...";

            return {
                name,
                price,
                link: p.link ? `https://www.flipkart.com${p.link}` : "",
                image: p.image || "",
                source: "Flipkart",
                scraped_at: new Date().toISOString(),
            };
        });

        const final = parsed
            .filter(
                (p): p is ScrapedProduct =>
                    !!p.name && !!p.price && p.price >= minPrice && p.price <= maxPrice
            )
            .sort((a, b) => b.price - a.price);

        console.log("Final filtered products:", final.length);

        return final;

    } catch (err) {
        console.error("Scraping failed:", err);
        throw err;
    } finally {
        await browser.close();
        console.log("Browser closed.");
    }
}
