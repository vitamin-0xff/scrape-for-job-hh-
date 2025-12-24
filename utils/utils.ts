import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { logger } from "./logger.ts";
import { extractJobNodetailedJob } from "./extractors.ts";
import { encodeHex } from "jsr:@std/encoding/hex";
import { GlobalConfig } from "../global-config.ts";

export const extractDataFromHtml = async (html: string) => {

  /**
   * Parse HTML content from OptionCarriere response and extract job data.
   */
  const jsonResponse = JSON.parse(html);
  const content_ = jsonResponse.m as string; // Extract the HTML content from the "m" field
  const cleanedContent = content_.replace(/\\n|\\/g, ""); // remove all sort of new lines and escape characters

  // Parse HTML
  const doc = new DOMParser().parseFromString(cleanedContent, "text/html");
  if (!doc) throw new Error("Failed to parse HTML");

  // Get the article
  const article = doc.querySelectorAll("article.job");
  if (!article) throw new Error("No job article found");
  const jobs = [];
  for (const art of article) {
    const job = extractJobNodetailedJob(art);
    const bundledData = {job, hash: await hashCalculator(stableStringify(job)), version: GlobalConfig.CURRENT_VERSION};
    jobs.push(bundledData);
  }
  return jobs;
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
      logger.error(`Fetch attempt ${attempt + 1} failed:`, error)
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

/**
 * 
 * @param url target website uri
 * @param options options of request often you need authentication headers 
 * @param instanceExtractor extractor callback
 * @param retryOptions retry option on failed {maxRetry: number, retryDelay} 
 * @returns 
 */
export async function fetchJobWithExtractor<T>(url: string, options: RequestInit = {}, instanceExtractor: (html: string) => T, retryOptions: { maxRetry: number, retryDelay: number } = { maxRetry: 3, retryDelay: 1000 }): Promise<T> {
  const response = await fetchWithRetries(url, options, retryOptions.maxRetry, retryOptions.retryDelay);
  const content = await response.text();
  const data = instanceExtractor(content);
  return data;
}

/**
 * 
 * @param url target website uri list (often list of pages)
 * @param options options of request often you need authentication headers 
 * @param instanceExtractor extractor callback
 * @param retryOptions retry option on failed {maxRetry: number, retryDelay} 
 * @param onFailedLocalBackupPath path the file when request failed we save the collected instances until now 
 * @returns T[]
 */

export async function fetchJobWithExtractorList<T>(urls: string[], options: RequestInit = {}, instanceExtractor: (html: string) => T, onFailedLocalBackupPath: string | null = null, retryOptions: { maxRetry: number, retryDelay: number } = { maxRetry: 3, retryDelay: 1000 }) {
  const results: T[] = [];
  for (let urlIndex = 0; urlIndex < urls.length; urlIndex++) {
    try {
      logger.info("Collecting", urlIndex, "Data: ", urls[urlIndex]);
      await waitRandom(1, 3); // wait between 1 to 3 seconds
      const data = await fetchJobWithExtractor<T>(urls[urlIndex], options, instanceExtractor, retryOptions);
      logger.info("Data Collected", data);
      results.push(data);
    } catch (e) {
      if (onFailedLocalBackupPath) {
        await Deno.writeFile(onFailedLocalBackupPath, new TextEncoder().encode(JSON.stringify(results, null, 2)))
        logger.error(`Loading local backup from ${onFailedLocalBackupPath}, collected instances ${urlIndex + 1}`);
      }
      logger.error(`Error fetching URL ${urls[urlIndex]}, in job description index ${urlIndex}:`, e);
    }
  }
  return results;
}

export async function fetchJobWithExtractorAndByNextUrl<T>(initialUrl: string, nextUrl: (previousPageNumber: number, previousContent: string, previousUrl: string) => string | null, options: RequestInit = {}, instanceExtractor: (html: string) => T[] | Promise<T[]>, onFailedLocalBackupPath: string | null = null, retryOptions: { maxRetry: number, retryDelay: number } = { maxRetry: 3, retryDelay: 1000 }, maxIterations: number = -1) {
  const results: T[] = [];
  let currentUrl: string | null = initialUrl;
  let counter = 0;
  while (currentUrl && (maxIterations < 0 || counter < maxIterations)) {
    try {
      counter++;
      logger.info("Collecting", counter, "Data: ", currentUrl);
      await waitRandom(1, 2); // wait between 1 to 2 seconds
      const response = await fetchWithRetries(currentUrl, options, retryOptions.maxRetry, retryOptions.retryDelay);
      const content = await response.text();

      // Extract data from the current content
      const data = await instanceExtractor(content);
      results.push(...data);
      currentUrl = nextUrl(counter, content, currentUrl);

    } catch (e) {
      if (onFailedLocalBackupPath) {
        await Deno.writeFile(onFailedLocalBackupPath, new TextEncoder().encode(JSON.stringify(results, null, 2)))
        logger.error(`Loading local backup from ${onFailedLocalBackupPath}, collected instances ${counter}`);
      }
      logger.error(`Error fetching URL ${currentUrl}, in job description index ${counter}:`, e);
    }
  }
  return results;
}

/**
 * calculate sha256 hash of a string and return it as hex string
 */
export
const hashCalculator = async (objectAsString: string) => {
  const encodedText = new TextEncoder().encode(objectAsString);
  const hashBuffer = (await crypto.subtle.digest("SHA-256", encodedText));
  return encodeHex(hashBuffer);
}


/**
 * @abstract unified stable stringify function that sort the object keys before stringifying 
 * @param obj 
 * @returns string of the object with sorted keys
 */
export function stableStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj)

  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']'
  }

  return '{' + Object.keys(obj).sort().map(
    k => JSON.stringify(k) + ':' + stableStringify(obj[k])
  ).join(',') + '}'
}