import { test, expect } from '@playwright/test';

test('verify final ui fixes', async ({ page }) => {
  await page.goto('http://localhost:4000');

  // 1. Check System Cockpit width
  await page.getByRole('button', { name: 'SETTINGS' }).click();
  await page.waitForSelector('text=System Cockpit');
  const dialog = page.locator('[data-slot="dialog-content"]');
  const box = await dialog.boundingBox();
  console.log('Dialog width:', box?.width);
  await page.screenshot({ path: '/home/jules/verification/settings_width_v2.png' });
  await page.keyboard.press('Escape');

  // 2. Check Analysis mode and arrows/depth
  await page.getByRole('button', { name: 'ANALYSIS' }).click();
  await page.getByRole('button', { name: 'BOOT' }).first().click();

  // Wait for engine to start and analyze
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/home/jules/verification/analysis_mode_v2.png' });

  // 3. Check Game Review
  await page.getByRole('button', { name: 'Review' }).click();
  await page.getByRole('button', { name: 'Review Game' }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/jules/verification/game_review_v2.png' });
});
