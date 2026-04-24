import { test, expect } from '@playwright/test';

test('verify review and badges', async ({ page }) => {
  await page.goto('http://localhost:4000');

  // Go to Analysis
  await page.getByRole('button', { name: 'ANALYSIS' }).click();

  // Trigger Review to see badges
  await page.getByRole('button', { name: 'Review' }).click();
  await page.getByRole('button', { name: 'Review Game' }).click();
  await page.waitForTimeout(2000);

  // Verify badges are present
  const badges = page.locator('.z-50.pointer-events-none');
  const count = await badges.count();
  console.log('Badges found:', count);

  await page.screenshot({ path: '/home/jules/verification/review_badges_v4.png' });
});
