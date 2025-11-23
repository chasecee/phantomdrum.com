# Vercel Blob Storage Setup

## Steps to Set Up Blob Storage

### 1. Create a Blob Store in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (or create one)
3. Go to the **Storage** tab
4. Click **Create Database** → Select **Blob**
5. Give it a name (e.g., "phantomdrum-blob")
6. Select a region close to you
7. Click **Create**

### 2. Get Your Token

After creating the blob store:

1. In the Vercel dashboard, go to your project
2. Go to **Settings** → **Storage**
3. Click on your blob store
4. Go to the **.env.local** tab
5. Copy the `BLOB_READ_WRITE_TOKEN` value

### 3. Set Environment Variable Locally

Add the token to your `.env.local` file:

```bash
BLOB_READ_WRITE_TOKEN=your_token_here
```

### 4. Set Environment Variable in Vercel (for production)

1. In Vercel dashboard, go to your project
2. Go to **Settings** → **Environment Variables**
3. Add:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: (paste your token)
   - **Environment**: Production, Preview, Development (select all)
4. Click **Save**

### 5. Restart Your Dev Server

After adding the token, restart your Next.js dev server:

```bash
npm run dev
```

## Alternative: Using Vercel CLI

You can also use the Vercel CLI to link your project and pull environment variables:

```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local
```

This will automatically pull all environment variables including `BLOB_READ_WRITE_TOKEN`.

