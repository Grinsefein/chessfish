import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  isChesscomAuthenticated, 
  fetchChesscomUser, 
  initiateChesscomAuth,
  logoutChesscom,
  ChesscomUser 
} from '@/services/chesscomOAuth';
import { 
  isLichessAuthenticated, 
  fetchLichessUser, 
  initiateLichessAuth,
  logoutLichess,
  LichessUser 
} from '@/services/lichessOAuth';
import { ExternalLink, LogOut, Check, AlertCircle } from 'lucide-react';

// OAuth Configuration
// In production, these should be environment variables
const CHESSCOM_CLIENT_ID = import.meta.env.VITE_CHESSCOM_CLIENT_ID || '';
const LICHESS_CLIENT_ID = import.meta.env.VITE_LICHESS_CLIENT_ID || '';
const REDIRECT_URI = `${window.location.origin}/oauth/callback`;

export function OAuthConnections() {
  const [chesscomUser, setChesscomUser] = useState<ChesscomUser | null>(null);
  const [lichessUser, setLichessUser] = useState<LichessUser | null>(null);
  const [loading, setLoading] = useState({ chesscom: false, lichess: false });

  useEffect(() => {
    // Check auth status on mount
    if (isChesscomAuthenticated()) {
      loadChesscomUser();
    }
    if (isLichessAuthenticated()) {
      loadLichessUser();
    }
  }, []);

  const loadChesscomUser = async () => {
    setLoading(prev => ({ ...prev, chesscom: true }));
    const user = await fetchChesscomUser();
    setChesscomUser(user);
    setLoading(prev => ({ ...prev, chesscom: false }));
  };

  const loadLichessUser = async () => {
    setLoading(prev => ({ ...prev, lichess: true }));
    const user = await fetchLichessUser();
    setLichessUser(user);
    setLoading(prev => ({ ...prev, lichess: false }));
  };

  const handleChesscomConnect = () => {
    if (!CHESSCOM_CLIENT_ID) {
      alert('Chess.com OAuth not configured. Please set VITE_CHESSCOM_CLIENT_ID in your environment.');
      return;
    }
    initiateChesscomAuth(CHESSCOM_CLIENT_ID, REDIRECT_URI);
  };

  const handleLichessConnect = async () => {
    if (!LICHESS_CLIENT_ID) {
      alert('Lichess OAuth not configured. Please set VITE_LICHESS_CLIENT_ID in your environment.');
      return;
    }
    await initiateLichessAuth(LICHESS_CLIENT_ID, REDIRECT_URI);
  };

  const handleChesscomDisconnect = () => {
    logoutChesscom();
    setChesscomUser(null);
  };

  const handleLichessDisconnect = () => {
    logoutLichess();
    setLichessUser(null);
  };

  const isChesscomConfigured = !!CHESSCOM_CLIENT_ID;
  const isLichessConfigured = !!LICHESS_CLIENT_ID;

  return (
    <Card className="bg-card border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      <CardHeader className="p-4 border-b border-white/5">
        <h3 className="text-sm font-black uppercase tracking-widest">Account Connections</h3>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Chess.com Connection */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <span className="text-green-400 font-bold text-xs">C</span>
            </div>
            <div>
              <p className="text-xs font-bold">Chess.com</p>
              {chesscomUser ? (
                <p className="text-[10px] text-muted-foreground">@{chesscomUser.username}</p>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  {isChesscomConfigured ? 'Not connected' : 'Not configured'}
                </p>
              )}
            </div>
          </div>
          
          {chesscomUser ? (
            <div className="flex items-center gap-2">
              <Check size={14} className="text-green-400" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleChesscomDisconnect}
                className="h-6 px-2 text-red-400 hover:text-red-300"
              >
                <LogOut size={12} />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleChesscomConnect}
              disabled={!isChesscomConfigured || loading.chesscom}
              className="h-6 text-[10px]"
            >
              {loading.chesscom ? 'Loading...' : 'Connect'}
            </Button>
          )}
        </div>

        {/* Lichess Connection */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
              <span className="text-blue-400 font-bold text-xs">L</span>
            </div>
            <div>
              <p className="text-xs font-bold">Lichess</p>
              {lichessUser ? (
                <p className="text-[10px] text-muted-foreground">@{lichessUser.username}</p>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  {isLichessConfigured ? 'Not connected' : 'Not configured'}
                </p>
              )}
            </div>
          </div>
          
          {lichessUser ? (
            <div className="flex items-center gap-2">
              <Check size={14} className="text-green-400" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLichessDisconnect}
                className="h-6 px-2 text-red-400 hover:text-red-300"
              >
                <LogOut size={12} />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLichessConnect}
              disabled={!isLichessConfigured || loading.lichess}
              className="h-6 text-[10px]"
            >
              {loading.lichess ? 'Loading...' : 'Connect'}
            </Button>
          )}
        </div>

        {/* Configuration Notice */}
        {(!isChesscomConfigured || !isLichessConfigured) && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg">
            <AlertCircle size={14} className="text-yellow-400 mt-0.5" />
            <div className="text-[10px] text-muted-foreground">
              <p className="font-bold text-yellow-400 mb-1">OAuth Configuration Required</p>
              <p>To connect Chess.com or Lichess accounts:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {!isChesscomConfigured && (
                  <li>
                    Register at{' '}
                    <a 
                      href="https://www.chess.com/club/chess-com-developer-community" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      Chess.com Developers <ExternalLink size={8} />
                    </a>
                  </li>
                )}
                {!isLichessConfigured && (
                  <li>
                    Register at{' '}
                    <a 
                      href="https://lichess.org/account/oauth/app" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      Lichess OAuth Apps <ExternalLink size={8} />
                    </a>
                  </li>
                )}
                <li>Add client IDs to your .env file</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// OAuth Callback Handler Component
export function OAuthCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const provider = urlParams.get('provider'); // 'chesscom' or 'lichess'
      const error = urlParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(`OAuth error: ${error}`);
        return;
      }

      if (!code || !state || !provider) {
        setStatus('error');
        setMessage('Missing required OAuth parameters');
        return;
      }

      // Handle based on provider
      if (provider === 'chesscom') {
        const clientId = import.meta.env.VITE_CHESSCOM_CLIENT_ID;
        const clientSecret = import.meta.env.VITE_CHESSCOM_CLIENT_SECRET;
        
        if (!clientId || !clientSecret) {
          setStatus('error');
          setMessage('Chess.com OAuth not configured');
          return;
        }

        const { handleChesscomCallback } = await import('@/services/chesscomOAuth');
        const result = await handleChesscomCallback(
          code,
          state,
          clientId,
          clientSecret,
          `${window.location.origin}/oauth/callback`
        );

        if (result.success) {
          setStatus('success');
          setMessage('Successfully connected to Chess.com!');
        } else {
          setStatus('error');
          setMessage(result.error || 'Failed to connect to Chess.com');
        }
      } else if (provider === 'lichess') {
        const clientId = import.meta.env.VITE_LICHESS_CLIENT_ID;
        
        if (!clientId) {
          setStatus('error');
          setMessage('Lichess OAuth not configured');
          return;
        }

        const { handleLichessCallback } = await import('@/services/lichessOAuth');
        const result = await handleLichessCallback(
          code,
          state,
          clientId,
          `${window.location.origin}/oauth/callback`
        );

        if (result.success) {
          setStatus('success');
          setMessage('Successfully connected to Lichess!');
        } else {
          setStatus('error');
          setMessage(result.error || 'Failed to connect to Lichess');
        }
      }

      // Redirect back to app after 2 seconds on success
      if (status === 'success') {
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-96 bg-card border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <CardContent className="p-6 text-center">
          {status === 'processing' && (
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          )}
          {status === 'success' && (
            <Check size={32} className="text-green-400 mx-auto mb-4" />
          )}
          {status === 'error' && (
            <AlertCircle size={32} className="text-red-400 mx-auto mb-4" />
          )}
          <p className="text-sm font-bold">{message}</p>
          {status === 'error' && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.href = '/'}
            >
              Return to App
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
