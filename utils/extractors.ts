/**
* @DESCRIPTION THIS FILE CONTAINS EXTRACTORS SPECIFIC TO OPTIONCARRIER.
* I AM NOT RESPONSIBLE FOR, NOR AWARE OF, ANY USE, MISUSE, OR DISTRIBUTION OF THIS FILE,
* INCLUDING WHO USED IT OR HOW IT WAS CREATED, NOR FOR ANY IRRESPONSIBLE OR IMPROPER USE.
 */


import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.56/deno-dom-wasm.ts";
import { encodeHex } from "jsr:@std/encoding/hex";


/**
 * 
 * @param article extract data from website of optioncarriere specific 'https://www.optioncarriere.tn/emploi?s=&l=Tunisie'
 * @returns job data {title, url, company, location, salary, description, tags, periodInfo} 
 */

export function extractJobNodetailedJob(article: Element) { 

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
export function parsePeriodTag(tag: string) {
  // Match pattern "Il y a <number> <unit>"
  const match = tag.match(/Il y a (\d+)\s*(minute|minutes|heure|heures|jour|jours|mois|an|ans)/i);
  if (!match) return null;

  const period = parseInt(match[1], 10);
  const unitMap: Record<string, string> = {
    "minute": "minute",
    "minutes": "minutes",
    "heure": "hour",
    "heures": "hours",
    "jour": "day",
    "jours": "days",
    "mois": "months",
    "an": "years",
    "ans": "years",
  };
  const unit = unitMap[match[2].toLowerCase()] || match[2];

  return { period, unit };
}

/**
 * Extract job description to object (sepcific to optioncarriere.tn/jobad/{id})
 * shape of returned object:
 * {
 *   title: string | null,
 *   company: string | null,
 *   location: string | null,
 *   contract: string | null,
 *   workTime: string | null,
 *   posted: string | null,
 *   description: string | null,
 *   source: string | null,
 *   applyUrl: string | null
 * }
 */

export async function extractJobFromJobDetails(html: string, version: number = 0) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc) return null;

  const root = doc.querySelector("article#job");
  if (!root) return null;

  const text = (el: Element | null) =>
    el?.textContent.replace(/\s+/g, " ").trim() ?? null;

  const title = text(root.querySelector("h1"));
  const company = text(root.querySelector("p.company"));
  const location = text(root.querySelector("ul.details li span"));
  const contract = text(root.querySelector("ul.details li:nth-child(2)"));
  const workTime = text(root.querySelector("ul.details li:nth-child(3)"));
  const postedTag = text(root.querySelector("ul.tags span"));
  const description = text(root.querySelector("section.content"));
  const source = text(root.querySelector("p.source"));
  const posted = parsePeriodTag(postedTag || "");
  const applyUrl =
    root.querySelector("a.btn-apply")?.getAttribute("href") ?? null;
  const object = {
    title,
    company,
    location,
    contract,
    workTime,
    posted: postedTag,
    description,
    source,
    applyUrl,
    postedSince: posted,
    collectedAt: new Date().toISOString(),
    version 
  };
  const hashCalculated = await hashCalculatored(JSON.stringify(object));
  
  return { ...object, hash: hashCalculated  };
}



const hashCalculatored = async (objectAsString: string)  => {
    const encodedText = new TextEncoder().encode(objectAsString);
    const hashBuffer = (await crypto.subtle.digest("SHA-256", encodedText));
    return encodeHex(hashBuffer);
}