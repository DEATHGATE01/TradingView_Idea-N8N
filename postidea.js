const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Load cookies from JSON file
function loadCookies() {
  const cookiePath = path.join(__dirname, 'tradingview_cookies.json');
  const raw = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
  
  return raw.map(c => {
    let sameSite = 'Lax';
    if (c.sameSite === 'no_restriction' || c.sameSite === 'None') {
      sameSite = 'None';
    } else if (c.sameSite === 'lax' || c.sameSite === 'Lax') {
      sameSite = 'Lax';
    } else if (c.sameSite === 'strict' || c.sameSite === 'Strict') {
      sameSite = 'Strict';
    }
    
    return {
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path || '/',
      expires: c.expirationDate || c.expires || -1,
      httpOnly: c.httpOnly || false,
      secure: c.secure || false,
      sameSite
    };
  });
}

// Find first visible element from selector list
async function findElement(locator, selectors, timeout = 2000) {
  for (const selector of selectors) {
    try {
      const el = locator.locator(selector).first();
      if (await el.isVisible({ timeout })) return el;
    } catch {}
  }
  return null;
}

// Fill input and select from autocomplete dropdown
async function selectAutocomplete(page, input, value) {
  await input.fill(value);
  await page.waitForTimeout(800);
  
  const suggestion = page.locator(`[role="option"]:has-text("${value}")`).first();
  if (await suggestion.isVisible({ timeout: 1000 }).catch(() => false)) {
    await suggestion.click();
  } else {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
  }
}

// Main function - can be called directly or via CLI
async function postIdea(idea) {
  let browser;
  const headless = process.env.HEADLESS !== 'false';
  
  try {
    browser = await chromium.launch({ headless });
    const context = await browser.newContext();
    await context.addCookies(loadCookies());

    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    // Navigate to chart with ticker
    await page.goto(`https://www.tradingview.com/chart/?symbol=${idea.ticker}`, {
      waitUntil: 'load',
      timeout: 60000
    });
    await page.waitForTimeout(5000);

    // Click publish button
    const publishBtn = await findElement(page, [
      '#header-toolbar-publish-desktop button',
      '#header-toolbar-publish-mobile button'
    ], 3000);
    
    if (!publishBtn) throw new Error('Publish button not found - check login');
    await publishBtn.click();
    await page.waitForTimeout(1500);

    // Click "Publish idea" in menu
    const menuItem = await findElement(page, [
      'span:text-is("Publish idea")',
      'div[role="menuitem"]:has-text("Publish idea")'
    ]);
    
    if (!menuItem) throw new Error('Publish idea menu not found');
    await menuItem.click();
    await page.waitForTimeout(2000);

    // Handle potential new tab
    const allPages = context.pages();
    const activePage = allPages.length > 1 ? allPages[allPages.length - 1] : page;
    if (allPages.length > 1) await activePage.waitForLoadState('load');

    // Wait for modal
    const modal = activePage.locator('[class*="dialog"]').first();
    await modal.waitFor({ timeout: 10000 });

    // Stage 1: Title & Description
    await modal.getByRole('textbox', { name: 'Title' }).fill(idea.title);
    await modal.locator('textarea').first().fill(idea.idea);
    await modal.getByRole('button', { name: /continue/i }).click();
    await activePage.waitForTimeout(2000);

    // Stage 2: Metadata
    
    // Privacy: Public
    const publicBtn = await findElement(modal, ['button[name="privacy-public"]']);
    if (publicBtn) await publicBtn.click();

    // Bias: Long/Short/Neutral
    const biasName = `${idea.bias.toLowerCase()}-direction`;
    const biasBtn = await findElement(modal, [`button[name="${biasName}"]`]);
    if (biasBtn) await biasBtn.click();

    // Category
    const categoryInput = modal.locator('input[aria-label="Category"]');
    if (await categoryInput.isVisible({ timeout: 2000 })) {
      await selectAutocomplete(activePage, categoryInput, idea.category);
    }
    await activePage.waitForTimeout(500);

    // Expand tags section
    const showMore = await findElement(modal, ['button:has-text("Show more")']);
    if (showMore) {
      await showMore.click();
      await activePage.waitForTimeout(500);
    }

    // Tags
    const tagInput = modal.locator('#script-tag-selector');
    if (await tagInput.isVisible({ timeout: 2000 })) {
      for (const tag of idea.tags.slice(0, 5)) {
        await tagInput.click();
        await selectAutocomplete(activePage, tagInput, tag);
        await activePage.waitForTimeout(300);
      }
    }

    // Accept house rules
    const checkbox = modal.locator('label[class*="house-rules"]').first();
    if (await checkbox.isVisible({ timeout: 2000 })) {
      await checkbox.click({ force: true });
    }

    // Click publish
    const finalPublishBtn = modal.locator('button[data-attr="publish-button"]');
    if (await finalPublishBtn.getAttribute('aria-disabled') === 'true') {
      throw new Error('Publish button disabled - check required fields');
    }

    await finalPublishBtn.click();
    await activePage.waitForTimeout(3000);

    const published = !(await modal.isVisible().catch(() => false));
    await browser.close();
    
    return { status: 'success', ticker: idea.ticker, published };
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    return { status: 'failed', ticker: idea.ticker, error: err.message };
  }
}

// CLI entry point
if (require.main === module) {
  (async () => {
    try {
      let ideaJson;
      const arg = process.argv[2];
      
      // Priority: 1) Environment variable, 2) Base64 arg, 3) File path, 4) Direct JSON, 5) STDIN
      if (process.env.IDEA_JSON) {
        ideaJson = process.env.IDEA_JSON;
      } else if (arg && arg.startsWith('base64:')) {
        ideaJson = Buffer.from(arg.slice(7), 'base64').toString('utf8');
      } else if (arg && (arg.endsWith('.json') || fs.existsSync(arg))) {
        ideaJson = fs.readFileSync(arg, 'utf8');
      } else if (arg) {
        ideaJson = arg;
      } else {
        ideaJson = fs.readFileSync(0, 'utf8');
      }
      
      const result = await postIdea(JSON.parse(ideaJson));
      console.log(JSON.stringify(result));
      
      if (result.status === 'failed') process.exit(1);
    } catch (err) {
      console.log(JSON.stringify({ status: 'failed', error: err.message }));
      process.exit(1);
    }
  })();
}

module.exports = { postIdea };