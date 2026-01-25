# Vercel Environment Variable Setup

## ⚠️ CRITICAL: You MUST set this environment variable in Vercel

Your app is trying to connect to `localhost:8080` because the `VITE_API_URL` environment variable is not set in Vercel.

## Steps to Fix:

1. **Go to Vercel Dashboard**
   - Open https://vercel.com
   - Select your project

2. **Navigate to Settings**
   - Click on your project
   - Go to **Settings** tab
   - Click on **Environment Variables** in the left sidebar

3. **Add Environment Variable**
   - Click **Add New**
   - **Name**: `VITE_API_URL`
   - **Value**: `https://real-scribe-backend.onrender.com` (replace with your actual Render backend URL)
   - **Important**: 
     - ✅ Must start with `https://` (NOT `http://`)
     - ✅ Must NOT have a trailing slash
     - ✅ Must be your actual Render backend URL
   - **Environments**: Select all (Production, Preview, Development)
   - Click **Save**

4. **Redeploy Your Project**
   - After saving, go to **Deployments** tab
   - Click the **⋯** (three dots) on the latest deployment
   - Click **Redeploy**
   - OR push a new commit to trigger a new deployment

## Example:

```
Name: VITE_API_URL
Value: https://real-scribe-backend.onrender.com
```

## After Setting:

- The app will stop trying to connect to localhost
- WebSocket connections will work properly
- All API calls will go to your Render backend
- The "SecurityError" will be resolved

## Verify It's Working:

After redeploying, check the browser console. You should see:
- ✅ Logs showing your Render backend URL (not localhost)
- ✅ No "localhost:8080" errors
- ✅ No "SecurityError" for WebSocket
- ✅ API calls succeeding
