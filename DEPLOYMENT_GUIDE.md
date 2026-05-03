# 🚀 Automated Deployment Guide - 60centenergy.com

Your project has been prepared for deployment! Follow these steps to get live.

## ✅ Completed Steps
- [x] Frontend built for production (`/frontend/dist/`)
- [x] `.env` file created with credentials
- [x] Git repository initialized
- [x] Initial commit created

## 📋 Next Steps (Interactive)

### STEP 1: Create GitHub Repository (2 min)

1. Go to https://github.com/new
2. Create new repository:
   - **Repository name**: `bible-ai-chat`
   - **Description**: "Bible AI Chat - Interactive AI-powered Bible study"
   - **Visibility**: Public
   - **DO NOT initialize** with README (we have one)
3. Click **Create repository**
4. You'll see commands - copy the first remote URL like:
   ```
   https://github.com/60centenergy/bible-ai-chat.git
   ```

### STEP 2: Push Code to GitHub (1 min)

Run this command in PowerShell:
```powershell
# Set paths for git and node
$env:Path = "C:\Program Files\Git\cmd;C:\Program Files\nodejs;" + $env:Path

# Navigate to project
cd "C:\Users\zamos\SynologyDrive\Online Bible AI site\bible-ai-chat"

# Add remote and push
git remote add origin https://github.com/60centenergy/bible-ai-chat.git
git branch -M main
git push -u origin main
```

**You'll be prompted for GitHub credentials:**
- If using HTTPS: Enter your GitHub username and a Personal Access Token (PAT)
- If using SSH: Make sure you have SSH key set up

### STEP 3: Create GitHub Personal Access Token (if needed) (2 min)

If you don't have a token:
1. Go to https://github.com/settings/tokens/new
2. Click **Generate new token (classic)**
3. Give it a name: `bible-ai-deployment`
4. Select scopes:
   - ✅ `repo` (all)
5. Scroll to bottom → **Generate token**
6. Copy the token (you'll only see it once!)
7. Use this token as your password in Step 2

---

## 🔥 Backend Deployment to Render

### STEP 4: Deploy Backend to Render (10 min)

1. Go to https://render.com
2. Sign up with GitHub (click "Sign up with GitHub")
3. Click **"New +" → "Web Service"**
4. **Connect Repository**:
   - Click "Connect your GitHub account" if prompted
   - Select `60centenergy/bible-ai-chat`
   - Confirm
5. **Configure deployment**:
   - **Name**: `bible-ai-backend`
   - **Environment**: `Node`
   - **Build Command**: 
     ```
     cd backend && npm install && npm run build
     ```
   - **Start Command**: 
     ```
     cd backend && npm start
     ```
   - **Plan**: Choose Free (or Starter for better uptime)
6. Scroll down → **Create Web Service**
7. Wait 3-5 minutes for deployment

#### Get your Backend URL
Once deployed, you'll see a URL like:
```
https://bible-ai-backend-xxxx.onrender.com
```
**Save this URL** - you'll need it in the next step!

### STEP 5: Add Environment Variables to Render Backend

1. On the Render dashboard, select your `bible-ai-backend` service
2. Go to **Environment** tab (left sidebar)
3. Add these variables:
   ```
   JWT_SECRET = your-jwt-secret-here
   GROQ_API_KEY = your-groq-api-key
   GROQ_MODEL = openai/gpt-oss-120b
   DATABASE_PATH = ./bible-ai.db
   NODE_ENV = production
   ```
   (Use the values from your `.env` file)
4. Click **Save** (service auto-redeploys)

---

## 🌐 Frontend Deployment to Cloudflare Pages

### STEP 6: Set Up Cloudflare Pages

1. Go to https://dash.cloudflare.com
2. Log in to your Cloudflare account (or create one)
3. Select your domain: **60centenergy.com**
4. In left sidebar, click **Pages**
5. Click **Create a project → Connect to Git**
6. Select **GitHub** → Authorize
7. Choose your repo: `bible-ai-chat`
8. Click **Begin setup**

### STEP 7: Configure Cloudflare Build Settings

When asked to configure:
- **Framework preset**: `Vite`
- **Build command**: `cd frontend && npm install && npm run build`
- **Build output directory**: `frontend/dist`
- **Root directory**: (leave empty)
- **Environment Variables**:
  - Variable: `VITE_API_URL`
  - Value: (use your Render backend URL from Step 4)
    ```
    https://bible-ai-backend-xxxx.onrender.com
    ```

9. Click **Save and Deploy**
10. Wait 2-3 minutes for deployment

✅ Your frontend is now live at: **https://60centenergy.com**

---

## 🔐 Final Setup

### STEP 8: Verify Everything Works

1. Open https://60centenergy.com in your browser
2. See the "Bible AI Chat" home screen
3. Click **"New Chat"** button
4. Type a test message and press Enter
5. Verify the AI responds

### STEP 9: Update API URL if Needed

If your backend URL changes:
1. Update the `VITE_API_URL` in Cloudflare Pages environment variables
2. Push to GitHub (automatic redeploy)
3. Test again

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "GitHub API rate limit" | Wait an hour or use Personal Access Token |
| "Render deployment failed" | Check build logs in Render dashboard |
| "Backend not responding" | Verify `VITE_API_URL` matches your Render URL exactly |
| "404 on page refresh" | Cloudflare Pages should handle this - it's configured |
| "Env vars not working" | Redeploy service after adding variables |

---

## 📞 Need Help?

- **Render docs**: https://render.com/docs
- **Cloudflare Pages docs**: https://developers.cloudflare.com/pages/
- **GitHub docs**: https://docs.github.com

---

## 🎯 Summary

Your deployment architecture:
```
60centenergy.com
├── Frontend → Cloudflare Pages
│   └── Fetches from:
└── Backend → Render.com
    ├── Groq API (AI responses)
    └── SQLite Database
```

All automated! Good luck! 🚀
