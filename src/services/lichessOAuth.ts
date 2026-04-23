// Lichess OAuth Service
// OAuth 2.0 PKCE flow for Lichess API authentication
// Register your app at: https://lichess.org/account/oauth/app

export interface LichessConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
}

export interface LichessUser {
  id: string;
  username: string;
  title?: string;
  perfs: {
    bullet?: { rating: number; games: number };
    blitz?: { rating: number; games: number };
    rapid?: { rating: number; games: number };
    classical?: { rating: number; games: number };
  };
  createdAt: number;
  seenAt: number;
  playTime: {
    total: number;
    tv: number;
  };
  url: string;
  count: {
    all: number;
    rated: number;
    ai: number;
    draw: number;
    drawH: number;
    loss: number;
    lossH: number;
    win: number;
    winH: number;
    bookmark: number;
    playing: number;
    import: number;
    me: number;
  };
}

export interface LichessGame {
  id: string;
  rated: boolean;
  variant: string;
  speed: string;
  perf: string;
  createdAt: number;
  lastMoveAt: number;
  status: string;
  players: {
    white: {
      user?: { name: string; title?: string };
      rating: number;
      ratingDiff?: number;
    };
    black: {
      user?: { name: string; title?: string };
      rating: number;
      ratingDiff?: number;
    };
  };
  winner?: 'white' | 'black';
  moves: string;
  pgn: string;
  opening?: {
    eco: string;
    name: string;
    ply: number;
  };
}

const LICHESS_AUTH_URL = 'https://lichess.org/oauth';
const LICHESS_TOKEN_URL = 'https://lichess.org/api/token';
const LICHESS_API_BASE = 'https://lichess.org/api';

const STORAGE_KEY = 'chessfish_lichess_auth';

// Generate PKCE code verifier
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Generate PKCE code challenge from verifier
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
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
export async function initiateLichessAuth(clientId: string, redirectUri: string): Promise<void> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = generateState();
  
  // Store PKCE verifier and state
  sessionStorage.setItem('lichess_pkce_verifier', verifier);
  sessionStorage.setItem('lichess_oauth_state', state);
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    scope: 'preference:read game:read challenge:read' // Adjust scope as needed
  });
  
  window.location.href = `${LICHESS_AUTH_URL}?${params.toString()}`;
}

// Handle OAuth callback
export async function handleLichessCallback(
  code: string,
  state: string,
  clientId: string,
  redirectUri: string
): Promise<{ success: boolean; error?: string }> {
  // Verify state
  const storedState = sessionStorage.getItem('lichess_oauth_state');
  if (state !== storedState) {
    return { success: false, error: 'Invalid state parameter' };
  }
  
  const verifier = sessionStorage.getItem('lichess_pkce_verifier');
  if (!verifier) {
    return { success: false, error: 'PKCE verifier not found' };
  }
  
  try {
    const response = await fetch(LICHESS_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        code_verifier: verifier,
        client_id: clientId,
        redirect_uri: redirectUri,
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
    sessionStorage.removeItem('lichess_pkce_verifier');
    sessionStorage.removeItem('lichess_oauth_state');
    
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
export function getLichessAuth(): {
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
export function isLichessAuthenticated(): boolean {
  const auth = getLichessAuth();
  if (!auth) return false;
  
  // Check if token is expired
  if (auth.expiresAt && Date.now() > auth.expiresAt) {
    return false;
  }
  
  return true;
}

// Clear auth
export function logoutLichess(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Fetch user profile
export async function fetchLichessUser(): Promise<LichessUser | null> {
  const auth = getLichessAuth();
  if (!auth) return null;
  
  try {
    const response = await fetch(`${LICHESS_API_BASE}/account`, {
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch user');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Lichess user:', error);
    return null;
  }
}

// Fetch user's games
export async function fetchLichessGames(
  maxGames: number = 10,
  options: {
    rated?: boolean;
    perfType?: string; // bullet, blitz, rapid, classical, etc.
    color?: 'white' | 'black';
    analysed?: boolean;
  } = {}
): Promise<LichessGame[]> {
  const auth = getLichessAuth();
  if (!auth) return [];
  
  const params = new URLSearchParams({
    max: maxGames.toString(),
    pgnInJson: 'true',
    opening: 'true',
  });
  
  if (options.rated !== undefined) params.set('rated', options.rated.toString());
  if (options.perfType) params.set('perfType', options.perfType);
  if (options.color) params.set('color', options.color);
  if (options.analysed) params.set('analysed', 'true');
  
  try {
    const response = await fetch(`${LICHESS_API_BASE}/user/me/games?${params}`, {
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
        'Accept': 'application/x-ndjson',
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch games');
    
    const text = await response.text();
    const games: LichessGame[] = [];
    
    // Parse NDJSON response
    for (const line of text.trim().split('\n')) {
      if (line) {
        try {
          games.push(JSON.parse(line));
        } catch {
          // Skip invalid lines
        }
      }
    }
    
    return games;
  } catch (error) {
    console.error('Failed to fetch Lichess games:', error);
    return [];
  }
}

// Export games as PGN
export async function exportLichessGamesPGN(
  username: string,
  options: {
    since?: number;
    until?: number;
    max?: number;
  } = {}
): Promise<string> {
  const auth = getLichessAuth();
  if (!auth) return '';
  
  const params = new URLSearchParams();
  if (options.since) params.set('since', options.since.toString());
  if (options.until) params.set('until', options.until.toString());
  if (options.max) params.set('max', options.max.toString());
  
  try {
    const response = await fetch(
      `${LICHESS_API_BASE}/games/user/${username}?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`,
          'Accept': 'application/x-chess-pgn',
        },
      }
    );
    
    if (!response.ok) throw new Error('Failed to export games');
    return await response.text();
  } catch (error) {
    console.error('Failed to export Lichess games:', error);
    return '';
  }
}
