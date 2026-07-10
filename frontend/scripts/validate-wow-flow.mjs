import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:4322";
const consoleErrors = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

page.on("pageerror", (error) => {
  consoleErrors.push(error.message);
});

try {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForSelector("#ai-input");

  await page.click('[data-question="What is your AI experience?"]');

  await page.click("#ai-input-submit");
  await page.waitForFunction(() => {
    const processing = document.getElementById("phase-processing");
    return processing && !processing.classList.contains("hidden");
  });

  await page.waitForFunction(() => document.getElementById("page-root")?.classList.contains("is-thinking") === true);

  await page.waitForFunction(
    () => {
      const dashboard = document.getElementById("phase-dashboard");
      return dashboard && !dashboard.classList.contains("hidden") && dashboard.classList.contains("is-revealed");
    },
    { timeout: 45000 }
  );

  await page.waitForFunction(
    () => document.getElementById("page-root")?.classList.contains("is-thinking") === false,
    { timeout: 45000 }
  );

  await page.waitForFunction(
    () => {
      const container = document.getElementById("agent-response-container");
      return container && container.textContent && container.textContent.trim().length > 20;
    },
    { timeout: 45000 }
  );

  const unexpectedErrors = consoleErrors.filter((error) => {
    const normalized = error.toLowerCase();
    return !(
      normalized.includes("cors") ||
      normalized.includes("failed to fetch") ||
      normalized.includes("error al llamar al backend") ||
      normalized.includes("net::err_failed")
    );
  });

  if (unexpectedErrors.length > 0) {
    console.error("Unexpected console errors detected:");
    unexpectedErrors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log("UX wow flow validation passed.");
} catch (error) {
  console.error("UX wow flow validation failed:", error);
  if (consoleErrors.length > 0) {
    console.error("Console errors:");
    consoleErrors.forEach((entry) => console.error(`- ${entry}`));
  }
  process.exit(1);
} finally {
  await browser.close();
}
