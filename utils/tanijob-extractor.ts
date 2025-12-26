import { DOMParser, Element, HTMLDocument, Node, Text } from "https://deno.land/x/deno_dom@v0.1.56/deno-dom-wasm.ts";
import { hashCalculator, stableStringify } from "./utils.ts";
import { logger } from "./logger.ts";
import { bold } from "jsr:@std/internal@^1.0.12/styles";

export const taniJobAuthenticatedHeader = {
  "accept": "*/*",
  "accept-language": "en-US,en;q=0.7",
  "priority": "u=1, i",
  "referer":
    "https://www.tanitjobs.com/jobs/?listing_type%5Bequal%5D=Job&searchId=1766741499.8185&action=search&keywords%5Ball_words%5D=informatique+developpeur+info",

  "sec-ch-ua": `"Brave";v="143", "Chromium";v="143", "Not A(Brand";v="24"`,
  "sec-ch-ua-arch": `"x86"`,
  "sec-ch-ua-bitness": `"64"`,
  "sec-ch-ua-full-version-list":
    `"Brave";v="143.0.0.0", "Chromium";v="143.0.0.0", "Not A(Brand";v="24.0.0.0"`,
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-model": `""`,
  "sec-ch-ua-platform": `"Linux"`,
  "sec-ch-ua-platform-version": `"6.16.3"`,

  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "sec-gpc": "1",

  "user-agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",

  "x-requested-with": "XMLHttpRequest",

  "cookie":
    "cf_clearance=0rtyNc9tD1QiBi8vamLW.X9Ii7wc58akRR5_G.Nc9Y4-1766740759-1.2.1.1-L2oajzhwZPXyYP21XSniUobJ4ws0qgpXDx_WUvjtiFI2u.usM8ChEPNOeDhCIA679ZwCvyqAo3d3wRoT_Fs9dMfI9ThV1jETZGj4z0ElSDWI1Noglsvrz0IZgE4y1DdJcl4_1iCS4ybq_RA53.cJ4pS8TjY4c00zen0F7wHqdfegKG9e3BjqN9rIVenmcu0LdqO65cwgLtYOTvjpD7t8eVchVXttAEsvCt2bBGvnT0M; PHPSESSID=bd7d1bifjg5c5a0usac9shak0p; cf_chl_rc_ni=1",
};


/**
 * function extractor for tanijob website
 */

export async function extractTanitJob(article: Element) {
  const text = (selector: string) =>
    article.querySelector(selector)?.textContent?.trim() ?? null;

  const attr = (selector: string, name: string) =>
    article.querySelector(selector)?.getAttribute(name) ?? null;

  const normalizeCompany = (value: string | null) =>
    value ? value.replace(/\s*-\s*$/, "").trim() : null;

  const data = {
    id: article.id ? Number(article.id) : null,

    title: text(".listing-item__title a"),

    company: normalizeCompany(text(".listing-item-info-company")),

    location: text(".listing-item-info-location"),

    description: text(".listing-item__desc.hidden-sm.hidden-xs"),

    shortDescription: text(".listing-item__desc.visible-sm.visible-xs"),

    postedDate: text(".listing-item__date"),

    jobUrl: attr(".listing-item__title a", "href"),

    createdAt: new Date().toISOString(),
  };
  const hash = await hashCalculator(stableStringify(data));
  return {hash, ...data};
}

/**
 * @abstract extract the next page 
 * @param previousPageNumber 
 * @param html 
 * @param previousUrl 
 * @returns 
 */
export const nextPageExtractorTanijob = (previousPageNumber: number, html: string, previousUrl: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) return null;
    const nextBtns = doc.querySelectorAll('#list_nav > span.pad_right_small a');
    if (!nextBtns) return null;
    for (const button of nextBtns) {
        const pageNumber = parseInt((button.textContent || button.getAttribute("href")?.match(/page=(\d+)/)?.[1] || ''));
        if (pageNumber === previousPageNumber + 1) {
            return previousUrl.includes("page=") ? previousUrl.replace(/page=\d+/g, `page=${pageNumber}`) : previousUrl + `&page=${pageNumber}`;
        }
    }
    return null;
}

/**
 * @abstract extract list of jobs from tanijob listing page   
 * @param html html content
 * @returns 
 */

export const extractListJobsTanijob = async (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) return [];
    const articles = doc.querySelectorAll("article.listing-item__jobs");
    const jobs = await Promise.all(Array.from(articles).map(extractTanitJob));
    return jobs;
}
/**
 * 
 * @param html text content
 * @param version scraping version 
 * @returns 
 */
export function extractJobDetailSections(root: HTMLDocument) {
    const sections: any[] = [];

    const titles = root.querySelectorAll(
        ".details-body__title"
    );

    titles.forEach((titleEl) => {
        let contentEl: Element | null = titleEl.nextElementSibling;

        // Skip non-content nodes until we find the content block
        while (
            contentEl &&
            !contentEl.classList.contains("details-body__content")
        ) {
            contentEl = contentEl.nextElementSibling;
        }

        if (!contentEl) return;
        /**
         * work with the innerhtml of contentEl
         */

        const blocks: any[] = [];
        console.log(contentEl.children);
        Array.from(contentEl.children).forEach((node) => {
            // PARAGRAPH
            if (node.tagName === "P") {
                const strong = node.querySelector("strong");
                const title = strong?.textContent?.trim() ?? null;

                // Remove <strong> text from paragraph body
                let text = node.textContent?.trim() ?? null;
                if (title && text) {
                    text = text.replace(title, "").trim();
                }

                if (title || text) {
                    blocks.push({
                        type: "paragraph",
                        title,
                        text: text || null,
                    });
                }
            }

            // LIST
            if (node.tagName === "UL") {
                const items = Array.from(node.querySelectorAll("li"))
                    .map(li => li.textContent?.trim())
                    .filter(Boolean) as string[];

                if (items.length) {
                    blocks.push({
                        type: "list",
                        items,
                    });
                }
            }

            sections.push({
                title: titleEl.textContent?.trim() ?? "",
                content: blocks,
            });

        });
        return sections;
    });
}

export function extractTanitJobTopSection(root: HTMLDocument) {
  const text = (selector: string) =>
    root.querySelector(selector)?.textContent?.trim() ?? null;

  const attr = (selector: string, name: string) =>
    root.querySelector(selector)?.getAttribute(name) ?? null;

  const cleanCompany = (value: string | null) =>
    value ? value.replace(/\s*-\s*$/, "").trim() : null;

  const parseNumber = (value: string | null) => {
    if (!value) return null;
    const n = Number(value.replace(/\D+/g, ""));
    return Number.isNaN(n) ? null : n;
  };

  const applyHrefRaw = attr(".btn-apply", "data-href");

  return {
    title: text(".details-header__title"),

    company: cleanCompany(
      text(".listing-item__info--item-company")
    ),

    location: text(".listing-item__info--item-location"),

    postedAgo: text(".listing-item__info--item-date"),

    applyUrl: applyHrefRaw
      ? applyHrefRaw.trim()
      : null,

    listingId: (() => {
      if (!applyHrefRaw) return null;
      const match = applyHrefRaw.match(/listing_id=(\d+)/);
      return match ? Number(match[1]) : null;
    })(),

    applicantsCount: parseNumber(
      text(".applicants-num")
    ),

    vacanciesCount: parseNumber(
      text(".vacancies-num")
    ),
  };
}


export const extractJobFromTanijobDetails = async (html: string, version: number = 0) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) return null;
    const headingInfos = extractTanitJobTopSection(doc); 
    const queryRoot = doc.querySelector("div.detail-offre");
    if (!queryRoot) return {
        ...headingInfos
    };
    const parsedSections = parseDetailSections(queryRoot);
    const object = {
        ...headingInfos,
        sections: parsedSections,
        collectedAt: new Date().toISOString(),
        version
    };
    const hashCalculated = await hashCalculator(JSON.stringify(object));
    return { ...object, hash: hashCalculated };
}

/**
 * Here is the structure of sections:
 * h3.details-body__title
 * div.details-body__content content text
 * div.details-body__content content text
 *     *
 *     * 
 * h3.details-body__title (the same pattern repeat)
 * div.details-body__content content text
 * div.details-body__content content text
 * */

/**
 * each 
 * div.details-body__content content text
 * may contain:
 * - paragraphs <p> paragraphs may contain <strong> for titles
 * - lists <ul><li>
 */

/**
 * parse HTML details-body__content content-text node
 */

/**
 * @abstract text level functions
 */

function text(node: Element | null): string | null {
  return node?.textContent?.trim() ?? null;
}

function clean(value: string | null): string | null {
  return value && value.length ? value : null;
}
/**
 * @abstract block level functions
 */

export interface ParagraphBlock {
  type: "paragraph";
  title: string | null;
  text: string | null;
}

export interface TextBlock {
  type: "text";
  text: string;
}

export type ContentBlock = ParagraphBlock | ListBlock | TextBlock;

export function parseContentBlock(
  contentEl: Element
): ContentBlock[] {
  const blocks: ContentBlock[] = [];
    let hasStructuredChild = false;
  Array.from(contentEl.children).forEach((child) => {
    if (child.tagName === "P") {
      const p = parseParagraph(child);
      if (p) blocks.push(p);
      hasStructuredChild = true;
    }

    if (child.tagName === "UL") {
      const ul = parseList(child);
      if (ul) blocks.push(ul);
        hasStructuredChild = true;
    }
});

  if(!hasStructuredChild) {
    blocks.push({ 
        type: "text",
        text: contentEl.textContent?.trim() ?? "",
    });
  }

  return blocks;
}

export interface ListBlock {
  type: "list";
  items: string[];
}

export function parseList(ul: Element): ListBlock | null {
  const items = Array.from(ul.querySelectorAll("li"))
    .map(li => li.textContent?.trim())
    .filter(Boolean) as string[];

  return items.length
    ? { type: "list", items }
    : null;
}



export function parseParagraph(p: Element): ParagraphBlock | null {
  const strong = p.querySelector("strong");
  const title = clean(strong?.textContent ?? null);

  let body = clean(p.textContent ?? null);
  if (title && body) {
    body = clean(body.replace(title, ""));
  }

  if (!title && !body) return null;

  return {
    type: "paragraph",
    title,
    text: body,
  };
}

export interface JobDetailSection {
  title: string;
  blocks: any[];
}

export function parseDetailSections(root: Element): JobDetailSection[] {
  const sections: JobDetailSection[] = [];

  const children = Array.from(root.children);

  let currentSection: JobDetailSection | null = null;

  for (const el of children) {
    // SECTION TITLE
    if (el.matches("h3.details-body__title")) {
      currentSection = {
        title: text(el) ?? "",
        blocks: [],
      };
      sections.push(currentSection);
      continue;
    }

    // SECTION CONTENT (one or many)
    if (
      currentSection &&
      el.matches("div.details-body__content")
    ) {
      currentSection.blocks.push(
        ...parseContentBlock(el)
      );
    }
  }

  return sections;
}

