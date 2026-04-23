// Chess.com OAuth Service
// OAuth 2.0 flow for Chess.com API authentication
// Register your app at: https://www.chess.com/club/chess-com-developer-community

export interface ChesscomConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
}

export interface ChesscomUser {
  username: string;
  playerId: number;
  title?: string;
  status: string;
  isVerified: boolean;
  league?: string;
  country: string;
  joined: number;
  lastOnline: number;
  avatar?: string;
}

export interface ChesscomGame {
  url: string;
  pgn: string;
  timeControl: string;
  endTime: number;
  rated: boolean;
  fen: string;
  timeClass: string;
  rules: string;
  white: {
    rating: number;
    result: string;
    username: string;
  };
  black: {
    rating: number;
    result: string;
    username: string;
  };
}

const CHESSCOM_AUTH_URL = 'https://oauth.chess.com/oauth/authorize';
const CHESSCOM_TOKEN_URL = 'https://oauth.chess.com/oauth/token';
const CHESSCOM_API_BASE = 'https://api.chess.com/pub';

const STORAGE_KEY = 'chessfish_chesscom_auth';

// Generate PKCE code verifier and challenge
function generatePKCE() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  // For simplicity, using plain challenge method
  // In production, use S256 method
  return { verifier, challenge: verifier };
}

// Generate random state parameter
function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Start OAuth flow
export function initiateChesscomAuth(clientId: string, redirectUri: string): void {
  const { verifier, challenge } = generatePKCE();
  const state = generateState();
  
  // Store PKCE verifier and state
  sessionStorage.setItem('chesscom_pkce_verifier', verifier);
  sessionStorage.setItem('chesscom_oauth_state', state);
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: state,
    code_challenge: challenge,
    code_challenge_method: 'plain', // Use 'S256' in production
    scope: 'profile games:read'
  });
  
  window.location.href = `${CHESSCOM_AUTH_URL}?${params.toString()}`;
}

// Handle OAuth callback
export async function handleChesscomCallback(
  code: string,
  state: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ success: boolean; error?: string }> {
  // Verify state
  const storedState = sessionStorage.getItem('chesscom_oauth_state');
  if (state !== storedState) {
    return { success: false, error: 'Invalid state parameter' };
  }
  
  const verifier = sessionStorage.getItem('chesscom_pkce_verifier');
  if (!verifier) {
    return { success: false, error: 'PKCE verifier not found' };
  }
  
  try {
    const response = await fetch(CHESSCOM_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code_verifier: verifier,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }
    
    const tokenData = await response.json();
    
    // Store tokens
    storeAuthTokens(tokenData);
    
    // Clear session storage
    sessionStorage.removeItem('chesscom_pkce_verifier');
    sessionStorage.removeItem('chesscom_oauth_state');
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Store auth tokens
function storeAuthTokens(tokenData: {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}): void {
  const expiresAt = tokenData.expires_in 
    ? Date.now() + tokenData.expires_in * 1000 
    : null;
    
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt,
  }));
}

// Get stored auth tokens
export function getChesscomAuth(): {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number | null;
} | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Check if authenticated
export function isChesscomAuthenticated(): boolean {
  const auth = getChesscomAuth();
  if (!auth) return false;
  
  // Check if token is expired
  if (auth.expiresAt && Date.now() > auth.expiresAt) {
    return false;
  }
  
  return true;
}

// Clear auth
export function logoutChesscom(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Fetch user profile
export async function fetchChesscomUser(): Promise<ChesscomUser | null> {
  const auth = getChesscomAuth();
  if (!auth) return null;
  
  try {
    const response = await fetch(`${CHESSCOM_API_BASE}/player`, {
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch user');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Chess.com user:', error);
    return null;
  }
}

// Fetch user's games
export async function fetchChesscomGames(
  username: string,
  year?: number,
  month?: number
): Promise<ChesscomGame[]> {
  const auth = getChesscomAuth();
  if (!auth) return [];
  
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month || now.getMonth() + 1;
  
  try {
    const response = await fetch(
      `${CHESSCOM_API_BASE}/player/${username}/games/${targetYear}/${targetMonth}`,
      {
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`,
        },
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch games');
    const data = await response.json();
    return data.games || [];
  } catch (error) {
    console.error('Failed to fetch Chess.com games:', error);
    return [];
  }
}

// Fetch archived games (paginated)
export async function fetchChesscomArchives(username: string): Promise<string[]> {
  try {
    const response = await fetch(`${CHESSCOM_API_BASE}/player/${username}/games/archives`);
    if (!response.ok) throw new Error('Failed to fetch archives');
    const data = await response.json();
    return data.archives || [];
  } catch (error) {
    console.error('Failed to fetch Chess.com archives:', error);
    return [];
  }
}
