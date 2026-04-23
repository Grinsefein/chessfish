// NNUE (Neural Network) Service for Stockfish
// Downloads and manages NNUE evaluation files

export interface NNUEFile {
  name: string;
  url: string;
  size: number; // in MB
  default: boolean;
}

// Official Stockfish NNUE files from GitHub releases
export const NNUE_FILES: NNUEFile[] = [
  {
    name: 'nn-1111cefa1111.nnue',
    url: 'https://github.com/official-stockfish/networks/raw/master/nn-1111cefa1111.nnue',
    size: 43,
    default: true
  },
  {
    name: 'nn-baff1ede1f90.nnue',
    url: 'https://github.com/official-stockfish/networks/raw/master/nn-baff1ede1f90.nnue',
    size: 43,
    default: false
  }
];

const NNUE_CACHE_KEY = 'chessfish_nnue_cache';
const NNUE_DEFAULT_KEY = 'chessfish_nnue_default';

export interface NNUEService {
  downloadNNUE: (file: NNUEFile, onProgress?: (progress: number) => void) => Promise<ArrayBuffer | null>;
  getCachedNNUE: (fileName: string) => ArrayBuffer | null;
  getDefaultNNUE: () => NNUEFile | null;
  setDefaultNNUE: (file: NNUEFile) => void;
  listCachedNNUE: () => string[];
  clearCache: () => void;
}

// Download NNUE file with progress tracking
export async function downloadNNUE(
  file: NNUEFile,
  onProgress?: (progress: number) => void
): Promise<ArrayBuffer | null> {
  try {
    console.log(`Downloading NNUE file: ${file.name} (${file.size}MB)`);
    
    const response = await fetch(file.url);
    if (!response.ok) {
      throw new Error(`Failed to download NNUE: ${response.status} ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    
    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      received += value.length;
      
      if (total > 0 && onProgress) {
        onProgress((received / total) * 100);
      }
    }

    // Combine chunks
    const allChunks = new Uint8Array(received);
    let position = 0;
    for (const chunk of chunks) {
      allChunks.set(chunk, position);
      position += chunk.length;
    }

    // Cache the file
    cacheNNUE(file.name, allChunks.buffer);
    
    console.log(`Successfully downloaded and cached: ${file.name}`);
    return allChunks.buffer;
  } catch (error) {
    console.error('Failed to download NNUE:', error);
    return null;
  }
}

// Cache NNUE file in localStorage (base64 encoded)
function cacheNNUE(fileName: string, data: ArrayBuffer): void {
  try {
    const base64 = arrayBufferToBase64(data);
    const cache = getNNUECache();
    cache[fileName] = base64;
    localStorage.setItem(NNUE_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to cache NNUE (might be too large for localStorage):', error);
  }
}

// Get cached NNUE file
export function getCachedNNUE(fileName: string): ArrayBuffer | null {
  try {
    const cache = getNNUECache();
    const base64 = cache[fileName];
    if (!base64) return null;
    return base64ToArrayBuffer(base64);
  } catch (error) {
    console.error('Failed to get cached NNUE:', error);
    return null;
  }
}

// Get all cached NNUE files
export function listCachedNNUE(): string[] {
  const cache = getNNUECache();
  return Object.keys(cache);
}

// Get default NNUE file
export function getDefaultNNUE(): NNUEFile | null {
  try {
    const defaultName = localStorage.getItem(NNUE_DEFAULT_KEY);
    if (!defaultName) return NNUE_FILES.find(f => f.default) || null;
    return NNUE_FILES.find(f => f.name === defaultName) || NNUE_FILES[0];
  } catch {
    return NNUE_FILES[0];
  }
}

// Set default NNUE file
export function setDefaultNNUE(file: NNUEFile): void {
  localStorage.setItem(NNUE_DEFAULT_KEY, file.name);
}

// Clear NNUE cache
export function clearNNUECache(): void {
  localStorage.removeItem(NNUE_CACHE_KEY);
  localStorage.removeItem(NNUE_DEFAULT_KEY);
}

// Get NNUE cache object
function getNNUECache(): Record<string, string> {
  try {
    const cache = localStorage.getItem(NNUE_CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  } catch {
    return {};
  }
}

// Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Check if NNUE is available and cached
export function isNNUEAvailable(fileName: string): boolean {
  return getCachedNNUE(fileName) !== null;
}

// Auto-download default NNUE on first use
export async function ensureDefaultNNUE(
  onProgress?: (progress: number) => void
): Promise<boolean> {
  const defaultFile = getDefaultNNUE();
  if (!defaultFile) return false;
  
  if (isNNUEAvailable(defaultFile.name)) {
    return true;
  }
  
  const downloaded = await downloadNNUE(defaultFile, onProgress);
  return downloaded !== null;
}
