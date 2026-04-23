import { chromium as playwright, Page } from "playwright-core";
import chromium from "@sparticuz/chromium";

// Slow scroll
async function slowScroll(page: Page, steps = 6, delay = 400) {
    for (let i = 0; i < steps; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await new Promise(res => setTimeout(res, delay));
    }
}

import { ScrapedProduct } from "@/types";

export async function scrapeFlipkart(
    query: string,
    minPrice: number,
    maxPrice: number,
    maxPages: number = 3
) {
    let browser: any;
    const isVercel = process.env.VERCEL === '1';

    // Stealth args to avoid detection (for local playwright)
    const stealthArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
        '--disable-blink-features=AutomationControlled',
    ];

    if (isVercel) {
        console.log("Environment: Vercel - Launching Chromium...");
        try {
            const executablePath = await chromium.executablePath();
            console.log(`Executable Path: ${executablePath}`);

            browser = await playwright.launch({
                args: [...chromium.args, '--disable-blink-features=AutomationControlled'],
                executablePath: executablePath || undefined,
                headless: true,
            });
            console.log("Browser launched successfully.");
        } catch (err: any) {
            console.error("Failed to launch browser on Vercel:", err);
            throw new Error(`Failed to launch browser on Vercel: ${err.message}`);
        }
    } else {
        // For local development
        console.log("Environment: Local - Launching Playwright...");
        try {
            // Dynamically import to prevent Vercel build issues with full playwright
            const { chromium: localChromium } = await import('playwright');
            browser = await localChromium.launch({
                headless: true,
                args: stealthArgs
            });
        } catch (err: any) {
            console.error("Failed to launch local browser:", err);
            throw new Error(`Failed to launch local browser: ${err.message}. \nTry running: npx playwright install`);
        }
    }

    const context = await browser.newContext({
        viewport: { width: 1366, height: 768 },
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        extraHTTPHeaders: {
            "Accept-Language": "en-US,en;q=0.9",
        },
    });

    const page = await context.newPage();



    page.setDefaultTimeout(45000);

    const formattedQuery = encodeURIComponent(query);
    const FLIPKART_URL = `https://www.flipkart.com/search?q=${formattedQuery}`;

    console.log("Opening:", FLIPKART_URL);

    try {
        await page.goto(FLIPKART_URL, { waitUntil: "domcontentloaded" });

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

            const rawProducts = await page.$$eval(productCard, (cards: any[]) =>
                cards.map((card: any) => {
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
