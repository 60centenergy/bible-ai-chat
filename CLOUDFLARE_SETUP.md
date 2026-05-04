# Cloudflare Pages Groq API Proxy Setup

## Overview
The Bible AI Chat now uses a **secure Cloudflare Pages Function** to proxy Groq API calls. This keeps your API key server-side and secure.

## How It Works
1. **Frontend** → Sends chat messages to `/api/groq` (same origin, no CORS)
2. **Cloudflare Pages Function** → Receives request, adds Groq API key (server-side), calls Groq API
3. **Groq API** → Processes request and returns response
4. **Cloudflare Pages Function** → Returns response to frontend

## Setup Instructions

### Step 1: Set Cloudflare Pages Environment Variables

You need to set two environment variables in Cloudflare Pages:

**GROQ_API_KEY** - Your Groq API key (from https://console.groq.com)
**GROQ_MODEL** - The Groq model to use (default: `mixtral-8x7b-32768`)

#### Via Cloudflare Dashboard:
1. Go to https://dash.cloudflare.com
2. Click on **"Pages"** in the left sidebar
3. Click on your **"bible-ai-chat"** project
4. Go to **Settings** → **Environment variables**
5. Click **"Add variable"** and add:
   - **Variable name:** `GROQ_API_KEY`
   - **Value:** `gsk_mbpAwKmvm69...` (your actual key from Groq)
   - **Environment:** Production
6. Click **Add another** and add:
   - **Variable name:** `GROQ_MODEL`
   - **Value:** `mixtral-8x7b-32768`
   - **Environment:** Production
7. Click **Save**

#### Via Wrangler CLI (Alternative):
```bash
cd frontend
wrangler pages secret add GROQ_API_KEY
# Paste your Groq API key when prompted

wrangler pages secret add GROQ_MODEL
# Type: mixtral-8x7b-32768
```

### Step 2: Verify Deployment

1. Cloudflare Pages should automatically redeploy after setting environment variables
2. Wait 1-2 minutes for the deployment to complete
3. Go to https://bible-ai-chat.pages.dev
4. Enter password: `BibleAI-Admin-Secret-2026!`
5. Send a test message like "Hello"

### Step 3: Check for Errors

If messages still aren't working:
1. Open Developer Tools (F12)
2. Go to **Console** tab
3. Send a test message
4. Look for any error messages
5. Share the error with support

## Architecture Diagram

```
Frontend (browser)
  ↓ (POST /api/groq)
Cloudflare Pages Function
  ↓ (has GROQ_API_KEY in environment)
Groq API (groq.com)
  ↓ (response)
Cloudflare Pages Function
  ↓ (response to browser)
Frontend (receives answer)
```

## Security Notes

✅ **API Key is Server-Side** - Never exposed to frontend browser
✅ **No CORS Issues** - Same-origin requests to Cloudflare Pages
✅ **Password Protected** - App requires password on load
✅ **HTTPS** - All communication encrypted

## Files Modified

- `frontend/functions/api/groq.ts` - New Groq proxy function
- `frontend/src/services/apiService.ts` - Updated to call `/api/groq`
- `frontend/wrangler.toml` - Configuration template

## Troubleshooting

### "API key not set" error
→ Make sure `GROQ_API_KEY` environment variable is set in Cloudflare Pages settings

### "404 Not Found" on /api/groq
→ Wait for Cloudflare to redeploy after setting environment variables

### "No response from AI model"
→ Check your Groq API key is valid at https://console.groq.com

### Still getting "Network Error"
→ Check browser console (F12) for the actual error message and share it
