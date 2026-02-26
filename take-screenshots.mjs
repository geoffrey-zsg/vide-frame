import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Step 1: Close settings dialog if it appears (click the cancel button "取消")
  const cancelBtn = page.locator('button', { hasText: '取消' });
  if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Settings dialog found, clicking cancel...');
    await cancelBtn.click();
    await page.waitForTimeout(500);
  } else {
    console.log('No settings dialog visible.');
  }

  // Step 2: Take screenshot of the full page showing the left panel
  console.log('Taking docs/screenshots/screenshot-style-closed.png...');
  await page.screenshot({ path: 'docs/screenshots/screenshot-style-closed.png', fullPage: false });

  // Step 3: Click on the StyleSelector area to open it
  // The StyleSelector trigger button contains the text "设计风格" label above it
  const styleButton = page.locator('button').filter({ hasText: /极简/ }).first();
  if (await styleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Found style selector button, clicking...');
    await styleButton.click();
  } else {
    // Try clicking by the label
    const styleLabel = page.locator('text=设计风格');
    const container = styleLabel.locator('..');
    const btn = container.locator('button').first();
    console.log('Trying alternate style selector click...');
    await btn.click();
  }
  await page.waitForTimeout(500);

  // Take screenshot with style dropdown open
  console.log('Taking docs/screenshots/screenshot-style-open.png...');
  await page.screenshot({ path: 'docs/screenshots/screenshot-style-open.png', fullPage: false });

  // Step 4: Close the style dropdown by clicking elsewhere
  console.log('Closing style dropdown by clicking elsewhere...');
  await page.locator('h1', { hasText: 'VibeFrame' }).click();
  await page.waitForTimeout(300);

  // Step 5: Click the history button (contains "历史" text)
  const historyBtn = page.locator('button', { hasText: '历史' });
  console.log('Clicking history button...');
  await historyBtn.click();
  await page.waitForTimeout(500);

  // Take screenshot with history dropdown open
  console.log('Taking docs/screenshots/screenshot-history-dropdown.png...');
  await page.screenshot({ path: 'docs/screenshots/screenshot-history-dropdown.png', fullPage: false });

  await browser.close();
  console.log('All screenshots taken successfully!');
})();
