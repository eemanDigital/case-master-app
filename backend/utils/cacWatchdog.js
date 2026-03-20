const puppeteer = require("puppeteer");

const CAC_SEARCH_URL = "https://search.cac.gov.ng/home";

const parseEntityType = (entityType) => {
  if (entityType === "business-name" || entityType === "business_name") {
    return "businessname";
  }
  return "company";
};

const checkCacStatus = async (rcNumber, entityType = "private-limited") => {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
      ],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });

    console.log(`Navigating to CAC search for RC: ${rcNumber}`);

    await page.goto(CAC_SEARCH_URL, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await page.waitForSelector("input[type='text']", { timeout: 30000 });

    const searchInput = await page.$("input[type='text']");
    await searchInput.type(rcNumber, { delay: 100 });

    const entityTypeParam = parseEntityType(entityType);

    const typeSelector = await page.$(`select[name*='type'], select[id*='type'], select[class*='type']`);
    if (typeSelector) {
      await typeSelector.select(entityTypeParam);
    }

    const searchButton = await page.$("button[type='submit'], button:contains('Search')");
    if (searchButton) {
      await searchButton.click();
    } else {
      await page.keyboard.press("Enter");
    }

    await page.waitForTimeout(5000);

    const resultData = await page.evaluate(() => {
      const result = {
        success: false,
        entityName: null,
        status: null,
        registrationDate: null,
        error: null,
      };

      const statusElement = document.querySelector(
        "[class*='status'], [id*='status'], td:contains('Status')"
      );

      if (statusElement) {
        const statusText = statusElement.textContent || statusElement.innerText || "";
        result.status = statusText.toUpperCase().trim();
        result.success = true;
      }

      const nameElement = document.querySelector(
        "[class*='name'], [id*='name'], h1, h2, h3"
      );
      if (nameElement) {
        result.entityName = nameElement.textContent || nameElement.innerText || "";
      }

      const errorElement = document.querySelector(
        "[class*='error'], [class*='not-found'], [class*='no-result']"
      );
      if (errorElement) {
        result.error = errorElement.textContent || "No results found";
        result.success = false;
      }

      const tableRows = document.querySelectorAll("tr, table td");
      tableRows.forEach((row) => {
        const text = row.textContent || "";
        if (text.toLowerCase().includes("status") && text.length < 200) {
          const statusMatch = text.match(/Status[:\s]*([A-Za-z-]+)/i);
          if (statusMatch) {
            result.status = statusMatch[1].toUpperCase();
            result.success = true;
          }
        }
      });

      return result;
    });

    console.log(`CAC check result for ${rcNumber}:`, resultData);

    return {
      success: resultData.success,
      rcNumber,
      entityName: resultData.entityName,
      status: resultData.status || "UNKNOWN",
      registrationDate: resultData.registrationDate,
      error: resultData.error,
    };
  } catch (error) {
    console.error(`Error checking CAC status for ${rcNumber}:`, error.message);

    return {
      success: false,
      rcNumber,
      entityName: null,
      status: null,
      registrationDate: null,
      error: error.message.includes("timeout")
        ? "CAC portal timeout - please try again later"
        : "Unable to access CAC portal",
    };
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log(`Browser closed for RC: ${rcNumber}`);
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }
  }
};

const checkMultipleEntities = async (entities) => {
  const results = [];
  const delay = 3000;

  console.log(`Starting sequential CAC checks for ${entities.length} entities`);

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];

    if (i > 0) {
      console.log(`Waiting ${delay / 1000}s before next check...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    console.log(`Checking entity ${i + 1}/${entities.length}: ${entity.rcNumber}`);

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
