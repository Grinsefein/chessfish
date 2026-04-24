import { test, expect } from '@playwright/test';

test('verify analysis and badges', async ({ page }) => {
  await page.goto('http://localhost:4000');

  // Go to Analysis
  await page.getByRole('button', { name: 'ANALYSIS' }).click();

  // Boot engine
  await page.getByRole('button', { name: 'BOOT' }).first().click();

  // Wait for "Ready"
  await page.waitForSelector('text=Ready');

  // Perform a move: e2 to e4
  // We'll use CSS selectors for the squares if possible, or coordinate clicks
  // But wait, we can just check if the arrows appear after some time
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/home/jules/verification/analysis_ready_v3.png' });

  // Trigger Review to see badges
  await page.getByRole('button', { name: 'Review' }).click();
  await page.getByRole('button', { name: 'Review Game' }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/jules/verification/review_badges_v3.png' });
});
