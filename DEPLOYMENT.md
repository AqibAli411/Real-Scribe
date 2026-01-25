# Deployment Configuration Guide

## Issues Fixed

1. **WebSocket HTTPS/WSS Security Error**: Fixed the "insecure SockJS connection" error by ensuring HTTPS pages use secure WebSocket connections
2. **Undefined API URL**: Added validation to prevent API calls when `VITE_API_URL` is undefined (which was causing localhost fallback)
3. **WebSocket URL Construction**: Fixed WebSocket URL construction to properly handle HTTPS/WSS protocol conversion
4. **API Call Validation**: Added validation in all components that make API calls to prevent errors when environment variables are missing

## Required Environment Variables in Vercel

You **MUST** set the following environment variable in your Vercel project settings:

### Required Variable:
1. **VITE_API_URL** - Your Render backend URL (e.g., `https://real-scribe-backend.onrender.com`)

### How to Set Environment Variables in Vercel:
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://real-scribe-backend.onrender.com` (your actual Render backend URL - **MUST use HTTPS**)
   - **Environment**: Production, Preview, Development (select all)

4. **After adding**, click **Save** and then **Redeploy** your project

### Important Notes:
- ✅ **MUST use HTTPS** in the URL (not HTTP) - this is critical for WebSocket connections from HTTPS pages
- ✅ Make sure your Render backend URL does NOT include a trailing slash
- ✅ The WebSocket endpoint (`/ws`) will be automatically appended
- ✅ If `VITE_WS_URL` is not set, it will automatically use `VITE_API_URL` + `/ws`
- ⚠️ **After adding environment variables, you MUST redeploy** your Vercel project for changes to take effect

## Backend Configuration (Render)

Make sure your Render backend has the following environment variables set:
- `SPRING_DATASOURCE_URL` - Your Neon database connection string
- `SPRING_DATASOURCE_USERNAME` - Database username
- `SPRING_DATASOURCE_PASSWORD` - Database password
- `SPRING_JPA_HIBERNATE_DDL_AUTO` - Usually set to `update` for production

## Testing After Deployment

1. Check browser console for any connection errors
2. Verify that API calls are going to your Render backend (not localhost)
3. Verify WebSocket connections are working
4. Check that the environment variables are being loaded correctly (check console.log outputs)

## Common Issues & Solutions

### 1. "localhost:8080" errors in console
**Cause**: `VITE_API_URL` is not set in Vercel  
**Solution**: 
- Go to Vercel → Settings → Environment Variables
- Add `VITE_API_URL` with your Render backend URL (must be HTTPS)
- Redeploy your project

### 2. "SecurityError: An insecure SockJS connection may not be initiated from a page loaded over HTTPS"
**Cause**: Backend URL is using HTTP instead of HTTPS  
**Solution**: 
- Ensure `VITE_API_URL` uses `https://` not `http://`
- Example: `https://real-scribe-backend.onrender.com` ✅
- NOT: `http://real-scribe-backend.onrender.com` ❌

### 3. "Failed to fetch" or "ERR_BLOCKED_BY_CLIENT" errors
**Cause**: API URL is undefined or incorrect  
**Solution**: 
- Verify `VITE_API_URL` is set correctly in Vercel
- Check browser console for the actual API URL being used
- Ensure the URL is accessible (test in browser)

### 4. CORS errors
**Cause**: Backend doesn't allow requests from Vercel domain  
**Solution**: 
- In your Spring Boot backend, ensure CORS is configured to allow your Vercel domain
- Check `WebConfig.java` or similar CORS configuration

### 5. WebSocket connection fails
**Cause**: Backend URL incorrect or backend not running  
**Solution**: 
- Verify `VITE_API_URL` points to your Render backend
- Check that Render backend is running and accessible
- Ensure backend WebSocket endpoint `/ws` is properly configured
