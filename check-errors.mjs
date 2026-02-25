import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const allMessages = [];

page.on('console', (msg) => {
  allMessages.push(`[${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', (err) => {
  allMessages.push(`[PAGE_ERROR] ${err.message}\n${err.stack}`);
});
page.on('requestfailed', (req) => {
  allMessages.push(`[REQ_FAIL] ${req.url()} - ${req.failure()?.errorText}`);
});

// Load the page multiple times to catch intermittent errors
for (let i = 0; i < 3; i++) {
  console.log(`\n--- Attempt ${i+1} ---`);
  allMessages.length = 0;

  await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(5000);

  // Check for hydration errors in the DOM
  const hydrationCheck = await page.evaluate(() => {
    // React 19 hydration errors create specific markers
    // Check for the NEXTJS error indicators
    const portals = document.querySelectorAll('nextjs-portal');
    const results = [];
    portals.forEach((portal, idx) => {
      if (!portal.shadowRoot) return;
      const sr = portal.shadowRoot;

      // Check ALL elements for any text content
      const walk = document.createTreeWalker(sr, NodeFilter.SHOW_TEXT);
      const texts = [];
      let node;
      while (node = walk.nextNode()) {
        const t = node.textContent.trim();
        // Filter out CSS
        if (t && t.length > 2 && !t.includes('{') && !t.includes('}') && !t.includes(':host')) {
          texts.push(t);
        }
      }
      results.push({ portalIndex: idx, nonCSSTexts: texts });
    });
    return results;
  });

  if (hydrationCheck.length > 0) {
    console.log('Portal texts:', JSON.stringify(hydrationCheck, null, 2));
  }

  // Check for any errors in console
  const errors = allMessages.filter(m => m.startsWith('[error]') || m.startsWith('[PAGE_ERROR]') || m.startsWith('[REQ_FAIL]'));
  if (errors.length > 0) {
    console.log('Errors found:');
    errors.forEach(e => console.log('  ', e));
  } else {
    console.log('No errors in console');
  }
}

// Also check the raw HTML for hydration mismatch clues
const html = await page.content();
const hasHydrationError = html.includes('hydration') || html.includes('Hydration');
console.log('\nHydration keyword in HTML:', hasHydrationError);

// Check the rendered body for expected structure
const bodyCheck = await page.evaluate(() => {
  const main = document.querySelector('main');
  if (!main) return { error: 'No <main> element found' };
  return {
    mainExists: true,
    childCount: main.children.length,
    innerHTML: main.innerHTML.slice(0, 200)
  };
});
console.log('\nBody check:', JSON.stringify(bodyCheck, null, 2));

await browser.close();
