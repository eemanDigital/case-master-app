const { chromium } = require("playwright");
const fs = require("fs");

const CAC_SEARCH_URL = "https://icrp.cac.gov.ng/public-search";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cleanRegistrationNumber = (rcNumber) => {
  return rcNumber.replace(/^(RC|BN)\s*/i, "").trim();
};

const checkCacStatus = async (
  rcNumber,
  entityType = "private-limited",
  debug = false,
) => {
  let browser = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
  } catch (launchError) {
    console.warn("Browser launch failed:", launchError.message);
    return {
      available: false,
      error: `Browser not available: ${launchError.message}`,
      status: null,
      entityName: null
    };
  }

  try {

    const page = await browser.newPage();

    await page.setViewportSize({ width: 1280, height: 800 });

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    });

    const searchNumber = cleanRegistrationNumber(rcNumber);
    console.log(`Navigating to CAC search for: ${searchNumber}`);

    // ── Step 1: Load the page ─────────────────────────────────────────────
    await page.goto(CAC_SEARCH_URL, {
      waitUntil: "networkidle", // wait until network is idle
      timeout: 60000,
    });

    // Give SPA time to fully render initial state
    await sleep(3000);

    if (debug) {
      await page.screenshot({
        path: `cac-debug-initial-${searchNumber}.png`,
        fullPage: true,
      });
      console.log(`[DEBUG] Initial page screenshot saved`);
    }

    // ── Step 2: Log what inputs exist on the page ─────────────────────────
    const pageInputs = await page.evaluate(() => {
      const inputs = document.querySelectorAll("input");
      return Array.from(inputs).map((inp) => ({
        type: inp.type,
        name: inp.name,
        id: inp.id,
        placeholder: inp.placeholder,
        className: inp.className,
        visible:
          inp.getBoundingClientRect().width > 0 &&
          inp.getBoundingClientRect().height > 0,
      }));
    });

    console.log(`[CAC] Found ${pageInputs.length} inputs on page:`, pageInputs);

    // ── Step 3: Determine if BN or RC search ─────────────────────────────
    const isBusinessName =
      entityType === "business-name" || entityType === "bn";

    // Try to select the correct search type (BN vs Company)
    // CAC portal typically has tabs or radio buttons for this
    if (isBusinessName) {
      try {
        // Try clicking a Business Name tab/radio/button
        const bnClicked = await page.evaluate(() => {
          const allElements = document.querySelectorAll(
            'button, a, input[type="radio"], [role="tab"], li',
          );
          for (const el of allElements) {
            const text = (el.textContent || el.value || "").toLowerCase();
            if (
              text.includes("business name") ||
              text.includes("bn") ||
              el.value === "BN"
            ) {
              el.click();
              return true;
            }
          }
          return false;
        });
        if (bnClicked) {
          await sleep(1000);
          console.log(`[CAC] Switched to Business Name search`);
        }
      } catch (tabError) {
        console.warn(`[CAC] Could not switch to BN tab: ${tabError.message}`);
      }
    }

    // ── Step 4: Find and fill the search input ────────────────────────────
    let inputFilled = false;

    const inputSelectors = [
      'input[placeholder*="RC Number"]',
      'input[placeholder*="BN Number"]',
      'input[placeholder*="Registration"]',
      'input[placeholder*="Search"]',
      'input[placeholder*="search"]',
      'input[placeholder*="Enter"]',
      'input[type="search"]',
      'input[type="text"]',
      ".search-input",
      "#searchInput",
      "#search",
      'input[name="search"]',
      'input[name="query"]',
      'input[name="rcNumber"]',
      'input[name="bnNumber"]',
    ];

    for (const selector of inputSelectors) {
      try {
        const input = await page.$(selector);
        if (input) {
          const isVisible = await page.evaluate((el) => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && !el.disabled;
          }, input);

          if (isVisible) {
            await input.click({ clickCount: 3 }); // select all existing text
            await input.type(searchNumber, { delay: 50 });
            console.log(`[CAC] Filled input using selector: ${selector}`);
            inputFilled = true;
            break;
          }
        }
      } catch {
        // Try next selector
      }
    }

    // Approach B — if no selector worked, use evaluate to find and fill
    if (!inputFilled) {
      inputFilled = await page.evaluate((searchNum) => {
        const inputs = document.querySelectorAll("input");
        for (const input of inputs) {
          const rect = input.getBoundingClientRect();
          if (
            rect.width > 0 &&
            rect.height > 0 &&
            !input.disabled &&
            input.type !== "hidden" &&
            input.type !== "checkbox" &&
            input.type !== "radio"
          ) {
            input.value = searchNum;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
            input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
            return true;
          }
        }
        return false;
      }, searchNumber);

      if (inputFilled) {
        console.log(`[CAC] Filled input using page.evaluate fallback`);
      }
    }

    if (!inputFilled) {
      console.error(`[CAC] Could not find any input field on the page`);
      if (debug) {
        const html = await page.content();
        fs.writeFileSync(`cac-debug-noinput-${searchNumber}.html`, html);
      }
      return {
        success: false,
        rcNumber: searchNumber,
        status: null,
        error: "Could not find search input on CAC portal",
      };
    }

    // ── Step 5: Submit the search ─────────────────────────────────────────
    let searchSubmitted = false;

    // Try clicking a visible search/submit button
    const buttonSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Search")',
      ".search-btn",
      ".btn-search",
      "#searchBtn",
      "#search-btn",
      'button[class*="search"]',
      'button[class*="Search"]',
      "form button",
    ];

    for (const selector of buttonSelectors) {
      try {
        const btn = await page.$(selector);
        if (btn) {
          const isVisible = await page.evaluate((el) => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && !el.disabled;
          }, btn);

          if (isVisible) {
            await btn.click();
            console.log(`[CAC] Clicked submit button: ${selector}`);
            searchSubmitted = true;
            break;
          }
        }
      } catch {
        // Try next selector
      }
    }

    // Fallback — press Enter on the input
    if (!searchSubmitted) {
      try {
        await page.keyboard.press("Enter");
        console.log(`[CAC] Submitted search via Enter key`);
        searchSubmitted = true;
      } catch (enterError) {
        console.warn(`[CAC] Enter key failed: ${enterError.message}`);
      }
    }

    // ── Step 6: Wait for results to appear ───────────────────────────────
    // SPA renders results dynamically — wait for content to change
    console.log(`[CAC] Waiting for search results...`);

    try {
      // Wait for any of these result indicators to appear
      await page.waitForFunction(
        () => {
          const body = document.body.textContent || "";
          const hasResults =
            body.match(/ACTIVE|INACTIVE|REGISTERED|STRUCK|DISSOLVED/i) ||
            document.querySelector(
              'table tbody tr, .result-item, .search-result, [class*="result"]',
            ) ||
            body.match(/Company Name|Business Name|RC Number|BN Number/i);
          return !!hasResults;
        },
        { timeout: 15000, polling: 500 },
      );
      console.log(`[CAC] Results appeared on page`);
    } catch {
      // waitForFunction timed out — page may still have content
      console.warn(
        `[CAC] Timeout waiting for results — attempting to read anyway`,
      );
      await sleep(3000);
    }

    // Extra wait for full render
    await sleep(2000);

    if (debug) {
      await page.screenshot({
        path: `cac-debug-results-${searchNumber}.png`,
        fullPage: true,
      });
      const html = await page.content();
      fs.writeFileSync(`cac-debug-results-${searchNumber}.html`, html);
      console.log(`[DEBUG] Results screenshot and HTML saved`);
    }

    // ── Step 7: Extract the result data ──────────────────────────────────
    const finalResult = await page.evaluate((searchNum) => {
      const result = {
        success: false,
        entityName: null,
        status: null,
        rcNumber: null,
        registrationDate: null,
        error: null,
      };

      const pageText = document.body.textContent || "";
      const pageHTML = document.body.innerHTML;

      // ── Check for not-found first ───────────────────────────────────────
      if (
        pageText.match(/no\s*result|not\s*found|invalid|no\s*record/i) &&
        !pageText.match(/ACTIVE|INACTIVE|REGISTERED/i)
      ) {
        result.error = "No results found for this registration number";
        return result;
      }

      // ── Extract status — try specific elements first ────────────────────
      const statusSelectors = [
        '[class*="status"]',
        '[class*="badge"]',
        '[class*="Status"]',
        '[class*="Badge"]',
        "td.status",
        ".entity-status",
        ".company-status",
      ];

      for (const sel of statusSelectors) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
          const text = (el.textContent || "").trim().toUpperCase();
          if (
            text.match(
              /^(ACTIVE|INACTIVE|REGISTERED|STRUCK[\s-]*OFF|DISSOLVED|SUSPENDED|PENDING|WOUND[\s-]*UP)$/,
            )
          ) {
            result.status = text.replace(/\s+/g, "-");
            break;
          }
        }
        if (result.status) break;
      }

      // ── Extract status from table rows ──────────────────────────────────
      if (!result.status) {
        const rows = document.querySelectorAll("tr");
        for (const row of rows) {
          const cells = row.querySelectorAll("td, th");
          for (let i = 0; i < cells.length - 1; i++) {
            const label = (cells[i].textContent || "").toLowerCase().trim();
            const value = (cells[i + 1].textContent || "").trim().toUpperCase();
            if (
              label.includes("status") &&
              value.match(/ACTIVE|INACTIVE|REGISTERED|STRUCK|DISSOLVED/i)
            ) {
              result.status = value;
              break;
            }
          }
          if (result.status) break;
        }
      }

      // ── Extract status from raw text using regex ─────────────────────────
      if (!result.status) {
        const statusPatterns = [
          /status[:\s]+([A-Z][A-Z\s-]{2,20})/i,
          /company\s+status[:\s]+([A-Z][A-Z\s-]{2,20})/i,
        ];
        for (const pattern of statusPatterns) {
          const match = pageText.match(pattern);
          if (match && match[1]) {
            const candidate = match[1].trim().toUpperCase();
            if (
              candidate.match(/ACTIVE|INACTIVE|REGISTERED|STRUCK|DISSOLVED/)
            ) {
              result.status = candidate.replace(/\s+/g, "-");
              break;
            }
          }
        }
      }

      // ── Scan entire page text for known status words ──────────────────
      if (!result.status) {
        const knownStatuses = [
          "STRUCK-OFF",
          "WOUND-UP",
          "STRUCK OFF",
          "WOUND UP",
          "INACTIVE",
          "DISSOLVED",
          "SUSPENDED",
          "ACTIVE",
          "REGISTERED",
        ];
        for (const s of knownStatuses) {
          if (pageText.toUpperCase().includes(s)) {
            result.status = s.replace(/\s+/g, "-");
            break;
          }
        }
      }

      // ── Extract entity name ────────────────────────────────────────────
      // Try table cells adjacent to "Company Name" or "Business Name" labels
      const allRows = document.querySelectorAll("tr");
      for (const row of allRows) {
        const cells = row.querySelectorAll("td, th");
        for (let i = 0; i < cells.length - 1; i++) {
          const label = (cells[i].textContent || "").toLowerCase().trim();
          if (
            label.includes("company name") ||
            label.includes("business name") ||
            label.includes("entity name")
          ) {
            const nameValue = (cells[i + 1].textContent || "").trim();
            if (nameValue.length > 2 && nameValue.length < 300) {
              result.entityName = nameValue;
              break;
            }
          }
        }
        if (result.entityName) break;
      }

      // Fallback — heading elements
      if (!result.entityName) {
        const headings = document.querySelectorAll("h1, h2, h3, h4, h5");
        for (const h of headings) {
          const text = (h.textContent || "").trim();
          if (
            text.length > 5 &&
            text.length < 200 &&
            !text.match(/search|result|welcome|home|portal|cac/i)
          ) {
            result.entityName = text;
            break;
          }
        }
      }

      // ── Extract RC Number from results ─────────────────────────────────
      const rcPatterns = [
        /RC\s*Number[:\s]+([0-9]+)/i,
        /BN\s*Number[:\s]+([0-9]+)/i,
        /Registration\s*Number[:\s]+([0-9]+)/i,
      ];
      for (const pattern of rcPatterns) {
        const match = pageText.match(pattern);
        if (match && match[1]) {
          result.rcNumber = match[1].trim();
          break;
        }
      }

      // ── Mark success if we got any meaningful data ─────────────────────
      if (result.status || result.entityName) {
        result.success = true;
      }

      return result;
    }, searchNumber);

    console.log(`[CAC] Result for ${searchNumber}:`, {
      success: finalResult.success,
      status: finalResult.status,
      entityName: finalResult.entityName,
      error: finalResult.error,
    });

    return {
      success: finalResult.success,
      available: true,
      rcNumber: searchNumber,
      originalRcNumber: rcNumber,
      entityName: finalResult.entityName,
      status: finalResult.status || "UNKNOWN",
      registrationDate: finalResult.registrationDate,
      error: finalResult.error,
    };
  } catch (error) {
    console.error(`Error checking CAC status for ${rcNumber}:`, error.message);
    return {
      success: false,
      available: true,
      rcNumber,
      entityName: null,
      status: null,
      registrationDate: null,
      error: error.message.includes("timeout")
        ? "CAC portal timeout - please try again later"
        : `Unable to access CAC portal: ${error.message}`,
    };
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log(`Browser closed for RC: ${rcNumber}`);
      } catch (closeError) {
        console.error("Error closing browser:", closeError.message);
      }
    }
  }
};

const checkMultipleEntities = async (entities) => {
  const results = [];
  const delay = 5000;

  console.log(`Starting sequential CAC checks for ${entities.length} entities`);

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];

    if (i > 0) {
      console.log(`Waiting ${delay / 1000}s before next check...`);
      await sleep(delay);
    }

    console.log(
      `Checking entity ${i + 1}/${entities.length}: ${entity.rcNumber}`,
    );

    try {
      const result = await checkCacStatus(entity.rcNumber, entity.entityType);
      results.push({
        entityId: entity.entityId,
        rcNumber: entity.rcNumber,
        ...result,
      });
    } catch (error) {
      results.push({
        entityId: entity.entityId,
        rcNumber: entity.rcNumber,
        success: false,
        error: error.message,
      });
    }
  }

  console.log(`Completed ${results.length} CAC checks`);
  return results;
};

module.exports = {
  checkCacStatus,
  checkMultipleEntities,
};
