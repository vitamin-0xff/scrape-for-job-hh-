import { DOMParser, Element } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

export const extractDataFromHtml = (html: string) => {

    // Parse HTML
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) throw new Error("Failed to parse HTML");

    // Get the article
    const article = doc.querySelectorAll("article.job");
    if (!article) throw new Error("No job article found");
    const jobs = [];
    for (const art of article) {
        const job = extractJobData(art);
        jobs.push(job);
    }
    return jobs;
}

function extractJobData(article: Element) { 
    // Extract info
    const titleEl = article.querySelector("h2 a");
    const companyEl = article.querySelector("p.company");
    const locationEl = article.querySelector("ul.location li");
    const salaryEl = article.querySelector("ul.salary li");
    const descEl = article.querySelector("div.desc");
    const tagsEl = Array.from(article.querySelectorAll("footer ul.tags li span"));

    // Build result object
    const job = {
        title: titleEl?.textContent.trim() || null,
        url: titleEl?.getAttribute("href") || null,
        company: companyEl?.textContent.trim() || null,
        location: locationEl?.textContent.replace(/\s+/g, " ").trim() || null,
        salary: salaryEl?.textContent.replace(/\s+/g, " ").trim() || null,
        description: descEl?.textContent.replace(/\s+/g, " ").trim() || null,
        tags: tagsEl.map(el => el.textContent.trim()),
        periodInfo: tagsEl.length > 0 ? parsePeriodTag(tagsEl[0].textContent.trim()) : null
    };

    return job;
}

/**
 * Convert a job tag string into structured period info.
 * Examples:
 *   "Il y a 17 jours"   -> { period: 17, unit: "days" }
 *   "Il y a 3 mois"     -> { period: 3, unit: "months" }
 *   "Il y a 1 an"       -> { period: 1, unit: "years" }
 */
function parsePeriodTag(tag: string) {
  // Match pattern "Il y a <number> <unit>"
  const match = tag.match(/Il y a (\d+)\s*(jour|jours|mois|an|ans)/i);
  if (!match) return null;

  const period = parseInt(match[1], 10);
  const unitMap: Record<string, string> = {
    "jour": "days",
    "jours": "days",
    "mois": "months",
    "an": "years",
    "ans": "years",
  };
  const unit = unitMap[match[2].toLowerCase()] || match[2];

  return { period, unit };
}

/**
 * random delay function
 */
export function randomDelay(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

export async function waitRandom(minMs: number = 1, maxMs: number = 3): Promise<number> {
  const ms = randomDelay(minMs, maxMs);
  await new Promise(resolve => setTimeout(resolve, ms * 1000));
  return ms;
}

/**
 * make a http request with retries
 */
export async function fetchWithRetries(url: string, options: RequestInit = {}, maxRetries: number = 3, retryDelayMs: number = 1000): Promise<Response> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      console.error(`Fetch attempt ${attempt + 1} failed:`, error);
      attempt++;
      if (attempt > maxRetries) {
        throw new Error(`Max retries reached. Failed to fetch ${url}`);
      }
      console.log(`Retrying in ${retryDelayMs} ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}