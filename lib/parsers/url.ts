import axios from "axios";
import * as cheerio from "cheerio";

const MAX_URL_LENGTH = 500_000;

export async function parseUrl(url: string): Promise<string> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Invalid URL format");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("URL must use http or https protocol");
  }

  let response;

  try {
    response = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; KnowledgeBaseAI/1.0; +https://github.com)",
      },
      maxContentLength: 5 * 1024 * 1024,
    });
  } catch (error) {
    console.error("[URL Parser] Fetch failed:", { url, error });
    throw new Error("Failed to fetch URL. Make sure it is a public webpage.");
  }

  const contentType = String(response.headers["content-type"] ?? "");
  if (!contentType.includes("text/html") && typeof response.data !== "string") {
    throw new Error("URL must point to an HTML webpage");
  }

  const html = typeof response.data === "string" ? response.data : String(response.data);
  const $ = cheerio.load(html);

  $("script, style, nav, footer, header, noscript, iframe").remove();

  const title = $("title").text().trim();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  const text = [title, bodyText].filter(Boolean).join("\n\n").trim();

  if (!text) {
    throw new Error("No readable text found at the provided URL");
  }

  return text.slice(0, MAX_URL_LENGTH);
}
