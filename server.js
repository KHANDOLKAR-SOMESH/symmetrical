const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const cors = require("cors");

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors()); // Enable CORS for all origins (can be restricted for security)

app.get("/", (req, res) => {
  res.send("Puppeteer API is running!");
});

app.get("/scrape", async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  const launchOptions = {
    headless: "new", // Use latest headless mode
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };

  // ✅ Use Puppeteer's bundled Chromium (Fix for Render)
  const puppeteerPkg = require("puppeteer");
  launchOptions.executablePath = puppeteerPkg.executablePath();

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();
    console.log("Navigating to the website...");
    await page.goto("https://teradownloader.com/", { waitUntil: "networkidle2" });

    // Handle popups
    try {
      console.log("Checking for popups...");
      await page.waitForSelector('button[aria-label="Close"]', { timeout: 5000 });
      await page.click('button[aria-label="Close"]');
      console.log("Popup closed.");
    } catch (err) {
      console.log("No popup detected.");
    }

    // Fill the input field
    console.log("Filling the input field...");
    await page.type("#inputField", url);

    // Click the submit button
    console.log("Clicking the submit button...");
    await page.click("button[type='submit']");

    // Wait for CAPTCHA (handled manually)
    console.log("Checking for CAPTCHA...");
    try {
      await page.waitForSelector("iframe[src*='hcaptcha'], iframe[src*='recaptcha']", { timeout: 10000 });
      await browser.close();
      return res.status(403).json({ error: "CAPTCHA detected. Solve it manually." });
    } catch (err) {
      console.log("No CAPTCHA detected.");
    }

    // Wait for download buttons
    console.log("Waiting for download links...");
    try {
      await page.waitForSelector("a[href*='download']", { timeout: 30000 });
    } catch (err) {
      await browser.close();
      return res.status(404).json({ error: "No download links found." });
    }

    // Extract all download links
    const downloadLinks = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href*='download']")).map(link => ({
        text: link.innerText.trim(),
        url: link.href,
      }))
    );

    await browser.close();

    if (downloadLinks.length === 0) {
      return res.status(404).json({ error: "No download links found." });
    }

    return res.json({ success: true, downloadLinks });
  } catch (err) {
    await browser.close();
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
