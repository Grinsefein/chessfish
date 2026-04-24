import { test, expect } from '@playwright/test';

test.describe('UCI Protocol', () => {
  test('should follow correct UCI handshake sequence', async ({ page }) => {
    const messages: string[] = [];
    
    // Intercept worker creation and messages
    await page.addInitScript(() => {
      const originalWorker = window.Worker;
      let workerInstance: Worker | null = null;
      
      (window as any).__workerMessages = [];
      (window as any).__uciState = {
        uciSent: false,
        uciokReceived: false,
        optionsSent: false,
        isreadySent: false,
        readyokReceived: false
      };
      
      window.Worker = class extends originalWorker {
        constructor(url: string | URL, options?: WorkerOptions) {
          super(url, options);
          workerInstance = this;
          
          const originalPostMessage = this.postMessage.bind(this);
          this.postMessage = (message: any) => {
            (window as any).__workerMessages.push({ type: 'toEngine', message });
            
            // Track UCI state
            if (typeof message === 'string') {
              if (message === 'uci') (window as any).__uciState.uciSent = true;
              if (message.startsWith('setoption')) (window as any).__uciState.optionsSent = true;
              if (message === 'isready') (window as any).__uciState.isreadySent = true;
            }
            
            return originalPostMessage(message);
          };
          
          this.addEventListener('message', (e) => {
            (window as any).__workerMessages.push({ type: 'fromEngine', message: e.data });
            
            if (typeof e.data === 'string') {
              if (e.data.includes('uciok')) (window as any).__uciState.uciokReceived = true;
              if (e.data.includes('readyok')) (window as any).__uciState.readyokReceived = true;
            }
          });
        }
      };
    });
    
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the engine to be bootable
    await page.waitForSelector('[data-testid="engine-boot-button"], button:has-text("Boot"), button:has-text("Start Engine")', { timeout: 10000 }).catch(() => null);
    
    // Find and click the engine boot button
    const bootButton = await page.locator('button:has-text("Boot"), button:has-text("Start Engine"), [data-testid="engine-boot-button"]').first();
    if (await bootButton.isVisible().catch(() => false)) {
      await bootButton.click();
    }
    
    // Wait for engine to initialize
    await page.waitForTimeout(3000);
    
    // Get UCI state
    const uciState = await page.evaluate(() => (window as any).__uciState);
    const workerMessages = await page.evaluate(() => (window as any).__workerMessages);
    
    // Verify UCI protocol sequence
    expect(uciState.uciSent, 'uci command should be sent').toBe(true);
    expect(uciState.uciokReceived, 'uciok should be received from engine').toBe(true);
    expect(uciState.optionsSent, 'setoption commands should be sent after uciok').toBe(true);
    expect(uciState.isreadySent, 'isready should be sent after options').toBe(true);
    expect(uciState.readyokReceived, 'readyok should be received from engine').toBe(true);
    
    // Verify message order: uci -> uciok -> setoption(s) -> isready -> readyok
    const messageSequence = workerMessages.map((m: any) => ({
      type: m.type,
      cmd: typeof m.message === 'string' ? m.message.split(' ')[0] : 'unknown'
    }));
    
    // Find indices
    const uciIndex = messageSequence.findIndex((m: any) => m.type === 'toEngine' && m.message === 'uci');
    const uciokIndex = messageSequence.findIndex((m: any) => m.type === 'fromEngine' && m.message.includes('uciok'));
    const setoptionIndices = messageSequence
      .map((m: any, i: number) => m.type === 'toEngine' && m.message?.startsWith('setoption') ? i : -1)
      .filter((i: number) => i !== -1);
    const isreadyIndex = messageSequence.findIndex((m: any) => m.type === 'toEngine' && m.message === 'isready');
    const readyokIndex = messageSequence.findIndex((m: any) => m.type === 'fromEngine' && m.message.includes('readyok'));
    
    // Assert correct order
    expect(uciokIndex).toBeGreaterThan(uciIndex);
    expect(setoptionIndices.length).toBeGreaterThan(0);
    setoptionIndices.forEach((idx: number) => {
      expect(idx).toBeGreaterThan(uciokIndex);
      expect(idx).toBeLessThan(isreadyIndex);
    });
    expect(isreadyIndex).toBeGreaterThan(Math.max(uciokIndex, ...setoptionIndices));
    expect(readyokIndex).toBeGreaterThan(isreadyIndex);
    
    console.log('UCI message sequence:', messageSequence.slice(0, 20));
  });
  
  test('engine should respond to analysis after readyok', async ({ page }) => {
    await page.goto('/');
    
    // Wait for and boot engine
    await page.waitForTimeout(2000);
    
    const bootButton = await page.locator('button:has-text("Boot"), button:has-text("Start Engine")').first();
    if (await bootButton.isVisible().catch(() => false)) {
      await bootButton.click();
    }
    
    // Wait for engine to be ready
    await page.waitForTimeout(3000);
    
    // Check if engine is ready via console logs or UI state
    const isReady = await page.evaluate(() => {
      // Check for ready state in UI or window
      return (window as any).__uciState?.readyokReceived || false;
    });
    
    if (isReady) {
      // Try to trigger analysis by making a move or clicking analyze
      const analyzeButton = await page.locator('button:has-text("Analyze"), button:has-text("Analysis"), [data-testid="analyze-button"]').first();
      if (await analyzeButton.isVisible().catch(() => false)) {
        await analyzeButton.click();
      }
      
      // Wait for analysis results
      await page.waitForTimeout(2000);
      
      // Check if analysis produced results
      const hasResults = await page.evaluate(() => {
        const messages = (window as any).__workerMessages || [];
        return messages.some((m: any) => m.type === 'fromEngine' && m.message?.includes('bestmove'));
      });
      
      expect(hasResults, 'Engine should return bestmove after analysis').toBe(true);
    }
  });
});
