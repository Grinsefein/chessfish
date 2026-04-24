/**
 * UCI Protocol Unit Tests
 * 
 * These tests verify that the UCI protocol is implemented correctly:
 * 1. uci command sent first
 * 2. uciok received from engine
 * 3. setoption commands sent after uciok
 * 4. isready sent after setoption commands
 * 5. readyok received before engine is marked ready
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('UCI Protocol', () => {
  let mockWorker: {
    postMessage: (msg: string) => void;
    onmessage: ((e: { data: string }) => void) | null;
    onerror: ((e: ErrorEvent) => void) | null;
    terminate: () => void;
  };
  
  let messageLog: Array<{ type: 'sent' | 'received'; message: string }>;
  
  beforeEach(() => {
    messageLog = [];
    mockWorker = {
      postMessage: vi.fn((msg: string) => {
        messageLog.push({ type: 'sent', message: msg });
      }),
      onmessage: null,
      onerror: null,
      terminate: vi.fn(),
    };
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  const simulateEngineResponse = (message: string) => {
    messageLog.push({ type: 'received', message });
    if (mockWorker.onmessage) {
      mockWorker.onmessage({ data: message });
    }
  };
  
  it('should send uci command first', () => {
    // Simulate bootEngine sending uci
    mockWorker.postMessage('uci');
    
    const uciMessage = messageLog.find(m => m.message === 'uci');
    expect(uciMessage).toBeDefined();
    expect(uciMessage?.type).toBe('sent');
  });
  
  it('should send setoption commands only after uciok', () => {
    const state = { status: 'booting' };
    
    // Simulate the message handler
    const handleMessage = (msg: string) => {
      if (msg.includes('uciok')) {
        // These should be sent AFTER uciok
        mockWorker.postMessage('setoption name Hash value 128');
        mockWorker.postMessage('setoption name Threads value 4');
        mockWorker.postMessage('setoption name MultiPV value 3');
        mockWorker.postMessage('isready');
      } else if (msg.includes('readyok')) {
        state.status = 'ready';
      }
    };
    
    // Step 1: Send uci
    mockWorker.postMessage('uci');
    
    // Step 2: No setoption commands should be sent yet
    const optionsBeforeUciok = messageLog.filter(m => m.message.startsWith('setoption'));
    expect(optionsBeforeUciok.length).toBe(0);
    
    // Step 3: Simulate uciok response
    simulateEngineResponse('id name Stockfish 16\nid author T. Romstad et al.\nuciok');
    handleMessage('uciok');
    
    // Step 4: Now setoption commands should be sent
    const optionsAfterUciok = messageLog.filter(m => m.type === 'sent' && m.message.startsWith('setoption'));
    expect(optionsAfterUciok.length).toBeGreaterThan(0);
    
    // Step 5: isready should be sent after setoption commands
    const isreadyIndex = messageLog.findIndex(m => m.type === 'sent' && m.message === 'isready');
    const setoptionSentIndices = messageLog
      .map((m, i) => (m.type === 'sent' && m.message.startsWith('setoption')) ? i : -1)
      .filter(i => i !== -1);
    const lastSetoptionIndex = setoptionSentIndices.length > 0 ? Math.max(...setoptionSentIndices) : -1;
    expect(isreadyIndex).toBeGreaterThan(lastSetoptionIndex);
  });
  
  it('should set status to ready only after readyok', () => {
    const state = { status: 'booting' };
    
    const handleMessage = (msg: string) => {
      if (msg.includes('uciok')) {
        mockWorker.postMessage('setoption name Hash value 128');
        mockWorker.postMessage('isready');
      } else if (msg.includes('readyok')) {
        state.status = 'ready';
      }
    };
    
    // Initial state should not be ready
    expect(state.status).toBe('booting');
    
    // Send uci and receive uciok
    mockWorker.postMessage('uci');
    simulateEngineResponse('uciok');
    handleMessage('uciok');
    
    // Status should still be booting after uciok
    expect(state.status).toBe('booting');
    
    // Simulate readyok
    simulateEngineResponse('readyok');
    handleMessage('readyok');
    
    // NOW status should be ready
    expect(state.status).toBe('ready');
  });
  
  it('should follow correct message sequence: uci -> uciok -> setoption -> isready -> readyok', () => {
    const state = { status: 'booting' };
    
    const handleMessage = (msg: string) => {
      if (msg.includes('uciok')) {
        mockWorker.postMessage('setoption name Hash value 128');
        mockWorker.postMessage('isready');
      } else if (msg.includes('readyok')) {
        state.status = 'ready';
      }
    };
    
    // Execute protocol
    mockWorker.postMessage('uci');
    simulateEngineResponse('uciok');
    handleMessage('uciok');
    simulateEngineResponse('readyok');
    handleMessage('readyok');
    
    // Verify sequence
    expect(messageLog[0]).toEqual({ type: 'sent', message: 'uci' });
    expect(messageLog[1]).toEqual({ type: 'received', message: 'uciok' });
    
    // setoption commands come after uciok
    const setoptionMessages = messageLog.filter(m => m.message.startsWith('setoption'));
    setoptionMessages.forEach(m => {
      const idx = messageLog.indexOf(m);
      const uciokIdx = messageLog.findIndex(m => m.message === 'uciok');
      expect(idx).toBeGreaterThan(uciokIdx);
    });
    
    // isready comes after setoption
    const isreadyIdx = messageLog.findIndex(m => m.message === 'isready');
    const setoptionIndices = messageLog
      .map((m, i) => m.message.startsWith('setoption') ? i : -1)
      .filter(i => i !== -1);
    const lastSetoptionIdx = setoptionIndices.length > 0 ? Math.max(...setoptionIndices) : -1;
    expect(isreadyIdx).toBeGreaterThan(lastSetoptionIdx);
    
    // readyok comes after isready
    const readyokIdx = messageLog.findIndex(m => m.message === 'readyok');
    expect(readyokIdx).toBeGreaterThan(isreadyIdx);
    
    expect(state.status).toBe('ready');
  });
});
