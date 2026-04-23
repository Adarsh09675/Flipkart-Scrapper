# 🚀 Flipkart Scraper Pro

Flipkart Scraper Pro is a high-performance, full-stack web application designed for automated product extraction and price analysis. Built with **Next.js**, **Playwright**, and **Supabase**, it provides a seamless interface for scraping product data, storing search history, and exporting results.

---

## ✨ Key Features

- **🔍 Advanced Search**: Filter products by query, price range, and number of pages.
- **⚡ Automated Scraping**: Leverages Playwright for robust, headless data extraction from Flipkart.
- **📊 Real-time Results**: View scraped product data in a clean, paginated table with live updates.
- **📅 Search History**: Automatically stores every search and its results for future reference.
- **📥 Data Export**: Download your scraped data instantly as a CSV file for offline analysis.
- **🔐 Secure Auth**: Built-in authentication using Supabase Auth (Sign In / Sign Up).
- **🌙 Premium Dark UI**: A sleek, responsive interface designed with Tailwind CSS and Framer-ready components.

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Scraper**: [Playwright](https://playwright.dev/) & [Sparticuz Chromium](https://github.com/Sparticuz/chromium)
- **Backend/Database**: [Supabase](https://supabase.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### 1. Prerequisites

- **Node.js** (v18.x or later)
- **pnpm** (recommended) or npm
- **Supabase Account**: Create a project and set up a `products` table.

### 2. Database Setup (Supabase)

Run the following SQL in your Supabase SQL Editor to create the necessary table:

```sql
create table products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price numeric,
  link text,
  image text,
  source text,
  scraped_at timestamp with time zone default now(),
  search_query text,
  user_id uuid references auth.users(id) on delete cascade
);

-- Optional: Enable RLS and add policies
alter table products enable row level security;

create policy "Users can view their own products"
on products for select
using (auth.uid() = user_id);

create policy "Users can insert their own products"
on products for insert
with check (auth.uid() = user_id);

create policy "Users can delete their own products"
on products for delete
using (auth.uid() = user_id);
```

### 3. Installation

Clone the repository and install dependencies:

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
npx playwright install chromium
```

### 4. Environment Variables

Copy the [`.env.example`](file:///.env.example) file to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key.

### 5. Run the Application

```bash
# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

- `app/`: Next.js pages and API routes.
- `components/`: Modular UI components (Header, SearchForm, Results, etc.).
- `lib/`: Core scraper logic using Playwright.
- `utils/`: Supabase client and server-side helpers.
- `types/`: Shared TypeScript interfaces.

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ for better data extraction.
</p>
