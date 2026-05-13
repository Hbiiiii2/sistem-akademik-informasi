# Google OAuth v2 Setup Guide

## Overview
This guide explains how to configure Google OAuth v2 authentication for the Sistem Akademik application.

## Prerequisites
- Google Cloud Console account
- Admin access to create OAuth credentials
- MongoDB and server running locally

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

## Step 2: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - User Type: External
   - Add your email as test user
   - Add required scopes: `openid`, `email`, `profile`

4. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: "Sistem Akademik"
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/login`
     - `http://localhost:5000/api/auth/google/callback`

## Step 3: Configure Environment Variables

Copy the `Client ID` and `Client Secret` from Google Cloud Console and update `.env.local`:

```env
# Google OAuth v2 Configuration
VITE_GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
OAUTH_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# JWT Secret (change in production)
JWT_SECRET=your_jwt_secret_key_change_in_production
```

## Step 4: Install Dependencies

```bash
npm install
```

This installs:
- `jsonwebtoken` - For JWT token generation
- `axios` - For Google API calls

## Step 5: Start Services

### Option 1: Run Both Services (Recommended)
```bash
npm run dev:all
```

### Option 2: Run Services Separately
Terminal 1 - Backend:
```bash
npm run dev:server
```

Terminal 2 - Frontend:
```bash
npm run dev
```

## Step 6: Test OAuth Flow

1. Open http://localhost:3000
2. Click "Masuk dengan Google"
3. You'll be redirected to Google login
4. After authentication, you'll be redirected back with an auth token
5. Token is stored in localStorage

## Technical Architecture

### Frontend Flow
```
Login.tsx 
  → initiateGoogleAuth() in oauth.ts
  → Redirects to Google OAuth endpoint
  → User authenticates with Google
  → Redirected to http://localhost:3000/auth/callback with code
  → exchangeCodeForToken(code) called
  → Backend validates code and returns JWT
  → Token stored in localStorage
  → User redirected to dashboard
```

### Backend Flow
```
POST /api/auth/google/callback
  → Receives authorization code from frontend
  → Exchanges code with Google OAuth servers
  → Gets user info from Google
  → Creates/updates user in MongoDB
  → Generates JWT token
  → Returns user data + JWT token
```

## Token Storage & Usage

**Storage Location**: Browser localStorage
```javascript
localStorage.getItem('authToken')    // JWT token
localStorage.getItem('authUser')     // User data
```

**Usage**: Automatically added to all API requests via Authorization header
```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### POST /api/auth/google/callback
Exchange Google authorization code for JWT token

**Request**:
```json
{
  "code": "authorization_code_from_google"
}
```

**Response**:
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "picture": "https://...",
  "token": "jwt_token"
}
```

### GET /api/auth/verify
Verify JWT token validity

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "picture": "https://...",
  "token": "new_jwt_token"
}
```

## Troubleshooting

### "Invalid Client ID"
- Verify `VITE_GOOGLE_CLIENT_ID` is correct
- Check it matches value in Google Cloud Console

### "Redirect URI mismatch"
- Ensure all redirect URIs match exactly in Google Cloud Console
- Include http:// or https:// in URIs

### "Token expired"
- Token has 24-hour expiration
- User needs to login again
- Or implement token refresh endpoint

### "MongoDB connection error"
- Ensure MongoDB is running
- Check `MONGODB_URI` in .env.local

### "CORS errors"
- Backend has CORS enabled
- Check backend is running on port 5000
- Verify `VITE_API_BASE_URL` matches backend

## Production Deployment

Before deploying to production:

1. **Secure JWT_SECRET**:
   ```env
   JWT_SECRET=use_a_strong_random_secret_here
   ```

2. **Update Google OAuth credentials**:
   - Change redirect URIs to production domain
   - Remove localhost URLs

3. **Environment Variables**:
   ```env
   VITE_GOOGLE_CLIENT_ID=production_client_id
   GOOGLE_CLIENT_SECRET=production_secret
   OAUTH_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
   ```

4. **SSL/HTTPS**:
   - Google OAuth requires HTTPS in production
   - Configure with proper SSL certificate

5. **Database Security**:
   - Use strong MongoDB passwords
   - Enable authentication on MongoDB

## Security Considerations

- **JWT Secret**: Keep secret and rotate periodically
- **Client Secret**: Never expose in frontend code
- **Token Storage**: Consider using httpOnly cookies instead of localStorage for production
- **Token Expiration**: Implement refresh token mechanism for better security
- **HTTPS**: Always use HTTPS in production

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com)
- [JWT Documentation](https://jwt.io)
