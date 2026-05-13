/**
 * Google OAuth v2 Authentication Service
 */

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id';
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  token: string;
}

/**
 * Initiate Google OAuth flow
 */
export const initiateGoogleAuth = () => {
  const scope = 'openid email profile';
  const responseType = 'code';
  const redirectUri = `${window.location.origin}/auth/callback`;
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: responseType,
    scope: scope,
    access_type: 'offline',
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Exchange authorization code for token
 */
export const exchangeCodeForToken = async (code: string): Promise<AuthUser> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/google/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error('Failed to authenticate');
    }

    const data = await response.json();
    return data as AuthUser;
  } catch (error) {
    console.error('Auth exchange failed:', error);
    throw error;
  }
};

/**
 * Verify JWT token with backend
 */
export const verifyToken = async (token: string): Promise<AuthUser | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json() as AuthUser;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

/**
 * Logout user
 */
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  window.location.href = '/';
};

/**
 * Get stored auth token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Get stored auth user
 */
export const getAuthUser = (): AuthUser | null => {
  const userStr = localStorage.getItem('authUser');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Set auth data
 */
export const setAuthData = (user: AuthUser) => {
  localStorage.setItem('authToken', user.token);
  localStorage.setItem('authUser', JSON.stringify(user));
};
