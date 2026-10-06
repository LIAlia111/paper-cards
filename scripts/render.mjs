// Screenshot each .board (by id) in an HTML page to <outDir>/<id>.png
// usage: node scripts/render.mjs page.html outDir id1,id2,...   (ids optional: defaults to every .board[id])
// needs: npm i puppeteer-core ; a local Chrome/Edge (set CHROME_PATH if it isn't found)
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [html, outDir = "out", idArg] = process.argv.slice(2);
if (!html) { console.error("usage: node scripts/render.mjs page.html outDir [id1,id2]"); process.exit(1); }

const candidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
].filter(Boolean);
const executablePath = candidates.find(existsSync);
if (!executablePath) { console.error("Chrome not found — set CHROME_PATH"); process.exit(1); }

mkdirSync(outDir, { recursive: true });
const browser = await puppeteer.launch({ executablePath, headless: "new", args: ["--allow-file-access-from-files"] });
const page = await browser.newPage();
await page.setViewport({ width: 2200, height: 1600, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve(html)).href, { waitUntil: "networkidle0" });
await page.evaluate(() => document.fonts.ready);
const ids = idArg ? idArg.split(",") : await page.$$eval(".board[id]", els => els.map(e => e.id));
for (const id of ids) {
  const el = await page.$("#" + id);
  if (!el) { console.warn("missing #" + id); continue; }
  await el.screenshot({ path: `${outDir}/${id}.png` });
  console.log("saved", `${outDir}/${id}.png`);
}
await browser.close();
