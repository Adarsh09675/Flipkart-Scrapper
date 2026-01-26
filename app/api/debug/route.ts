import { NextResponse } from 'next/server';
import { chromium } from 'playwright-core';
import chromium_vercel from '@sparticuz/chromium';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
    console.log("Debug Route: Starting...");
    let browser = null;
    try {
        const isVercel = process.env.VERCEL === '1';
        console.log(`Environment: ${isVercel ? 'Vercel' : 'Local'}`);

        if (isVercel) {
            console.log("Attempting to load executable path...");
            const executablePath = await chromium_vercel.executablePath();
            console.log(`Executable Path: ${executablePath}`);

            console.log("Launching browser...");
            browser = await chromium.launch({
                args: chromium_vercel.args,
                executablePath: executablePath || undefined,
                headless: true,
            });
        } else {
            const { chromium: localChromium } = await import('playwright');
            browser = await localChromium.launch({ headless: true });
        }

        console.log("Browser launched. Creating page...");
        const page = await browser.newPage();

        console.log("Navigating to example.com...");
        await page.goto('https://example.com');
        const title = await page.title();
        console.log(`Title: ${title}`);

        await browser.close();

        return NextResponse.json({
            status: 'ok',
            environment: isVercel ? 'Vercel' : 'Local',
            pageTitle: title,
            message: 'Browser successfully launched and scraped example.com'
        });

    } catch (error: any) {
        console.error("Debug Route Error:", error);
        return NextResponse.json({
            status: 'error',
            message: error.message,
            stack: error.stack,
            env: process.env.VERCEL === '1' ? 'Vercel' : 'Local'
        }, { status: 500 });
    } finally {
        if (browser) await browser.close();
    }
}
