// request-to-file.ts
// request-to-file.ts

import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.56/deno-dom-wasm.ts";
import { authenticatedHeader } from "./authenticated-headers.ts";
import { GlobalConfig } from "./global-config.ts";
import { extractJobFromJobDetails, extractNextPageUrlOptioncarriere } from "./utils/extractors.ts";
import { logger } from "./utils/logger.ts";
import { extractJobFromTanijobDetails, extractListJobsTanijob, extractTanitJob, nextPageExtractorTanijob, taniJobAuthenticatedHeader } from "./utils/tanijob-extractor.ts";
import { extractDataFromHtml, fetchJobWithExtractorAndByNextUrl, fetchJobWithExtractorList, hashCalculator, stableStringify } from "./utils/utils.ts";
import { expandGlob } from "https://deno.land/std/fs/mod.ts";


const keywords = ["mobile", "développeur", "informatique", "base de données", "systemes embarqués", "cloud", "devops", "full stack", "frontend", "backend"];

const searchKeyword = keywords[4];
const targetUrl = `https://www.optioncarriere.tn/emploi?s=&l=Tunisie&s=${encodeURIComponent(searchKeyword)}`;
const dataOutput = `./res/data-${searchKeyword.replaceAll(" ", "-")}.json`;
const maxPageNumber = 100; // after this number we will get access forbidden

const Websites = {
  /**
   * scraper for optioncarriere website
   */
  scrapeOptionCarriere: async () => {
    /**
     * Test extraction of a single job detail from saved HTML file
     * here we have already the nedpoints
     */
    const allEndpointsFile = Deno.readTextFile("./res/optioncarriere-endpoints.json");
    const endpoints: string[] = JSON.parse(await allEndpointsFile);
    const fullEndpoints = endpoints.map(ep => `https://www.optioncarriere.tn${ep}`);

    const jobs_ = await fetchJobWithExtractorList(fullEndpoints, { headers: authenticatedHeader }, extractJobFromJobDetails, "./res/optioncarriere-detailed-jobs.json")
    await Deno.writeFile("./res/optioncarriere-detailed-jobs.json", new TextEncoder().encode(JSON.stringify({ jobs: jobs_, version: GlobalConfig.CURRENT_VERSION, hash: await hashCalculator(stableStringify(jobs_)) }, null, 2)));
    logger.info("Extracted detailed jobs saved to optioncarriere-detailed-jobs.json with length", jobs_.length);
  },

  /**
   * Scraper for tanijob website
   */
  tanijob: {
    scrapeListJobs: async () => {
    /**
     * step 1: get all list of jobs possible and put it into a file
     */
    /**
     * examples of urls
     *  This search with filter by city [Ariana, Tunis, Sfax]
     *  https://www.tanitjobs.com/jobs/?searchId=1766740867.3536&action=refine&Location_City[multi_like_and][]=Ariana,Tunis,Sfax
     * 
     *  This search by keyword "développeur" support only one keyword at a time
     *  https://www.tanitjobs.com/jobs/?listing_type%5Bequal%5D=Job&searchId=1766740966.9314&action=search&keywords%5Ball_words%5D=developpeur
     * 
     * description of parameters:
     *   * we can: specify muliple areas, but only one keyword at a time 
     */
    const TANIJOB_REQUEST_BASE_URL = `https://www.tanitjobs.com/jobs/?listing_type%5Bequal%5D=Job`;
    const keyword: string | undefined = "informatique";
    const areas: string[] | undefined = ["Tunis", "Ariana", "Ariana Charguia 2", "LAC 3 Z I KHEIREDDINE LE KRAM"];
    const pathToSave = `./res/tanijobs-jobs/tanijob${keyword && '-' + keyword }${areas && '-' + areas.join("-").replaceAll(" ", "-")}-jobs.json`;

    const getUrl = (page?: number, keyword?: string, areas?: string[]) => `${TANIJOB_REQUEST_BASE_URL}&action=search${keyword ? `&keywords%5Ball_words%5D=${encodeURIComponent(keyword)}` : ""}${areas && areas.length > 0 ? `&Location_City[multi_like_and][]=${encodeURIComponent(areas.join(","))}` : ""}${page && page > 1 ? `&page=${page}` : ""}`;
    const jobs = await fetchJobWithExtractorAndByNextUrl(
      getUrl(undefined, keyword, areas),
      nextPageExtractorTanijob
      ,
      { headers: taniJobAuthenticatedHeader },
      extractListJobsTanijob,
      pathToSave,
      { maxRetry: 3, retryDelay: 1000 },
      maxPageNumber
    );
    if(jobs.length > 0) {
      await Deno.writeFile(pathToSave, new TextEncoder().encode(JSON.stringify({ jobs, version: GlobalConfig.CURRENT_VERSION, hash: await hashCalculator(stableStringify(jobs)), keyword: keyword, areas: areas, platform: "tanijob" }, null, 2)));
      console.log(`Data saved to ${pathToSave}, total jobs collected: ${jobs.length}`);
    }else {
      console.log(`No jobs found for the given criteria.`);
    }
  },

    scrapeJobDetails: async () => {
      /**
       * Glob generator
       */
      const setOfUrls = new Set<string>();
      for await (const file of expandGlob("res/tanijobs-jobs/*.json")) {
        // read file content of Json array 
        const fileContent = await Deno.readTextFile(file.path);
        const jsonData: { jobs: { id: number; jobUrl: string }[] } = JSON.parse(fileContent);
        for (const job of jsonData.jobs) {
          const fullUrl = job.jobUrl;
          // unique urls
          setOfUrls.add(fullUrl);
        }
      }
      const detailedJobs = await fetchJobWithExtractorList([...setOfUrls], { headers: taniJobAuthenticatedHeader }, extractJobFromTanijobDetails, "./res/tanijob-detailed-jobs.json")
      await Deno.writeFile("./res/tanijob-detailed-jobs.json", new TextEncoder().encode(JSON.stringify({ jobs: detailedJobs, version: GlobalConfig.CURRENT_VERSION, hash: await hashCalculator(stableStringify(detailedJobs)) }, null, 2)));
      logger.info("Extracted detailed jobs saved to tanijob-detailed-jobs.json with length", detailedJobs.length);
    }
  },

  scrapeX: () => {
    
  }
}



if (import.meta.main) {
  /**
   * If this module is run directly, execute the main function.
  let jobs  = [];
  for (let index = 1; index < maxPageNumber; index++) {
    try {
      const pageUrl = getPage(index);
      console.log(`Fetching page ${index}: ${pageUrl}`);

       * wait random delay
       * @params min, max in seconds defaults 1 to 2
      await waitRandom()
      const response = await fetchWithRetries(pageUrl, { headers: authenticatedHeader });

      // Read body as text
      const body = await response.text();
      const jsonResponse = JSON.parse(body);
      const content_ = jsonResponse.m as string; // Extract the HTML content from the "m" field
      const cleanedContent = content_.replace(/\\n|\\/g, ""); // remove all sort of new lines and escape characters
      const extractData = extractDataFromHtml(cleanedContent);
      jobs.push(...extractData);
    }catch(e) {
        console.error(`Error fetching page ${index}:`, e);
    }finally {
      await Deno.writeTextFile(dataOutput, JSON.stringify(jobs));
    }

    const jobs = await fetchJobWithExtractorAndByNextUrl(
      targetUrl,
      extractNextPageUrlOptioncarriere,
      { headers: authenticatedHeader },
      extractDataFromHtml,
      dataOutput,
      { maxRetry: 3, retryDelay: 1000 },
      maxPageNumber
    );
    await Deno.writeTextFile(dataOutput, JSON.stringify({jobs, version: GlobalConfig.CURRENT_VERSION, hash: await hashCalculator(stableStringify(jobs)), keyword: searchKeyword, platform: "optioncarriere"}, null, 2));
    console.log(`Data saved to ${dataOutput}, total jobs collected: ${jobs.length}`);
   */


  /**
   *  Extract all unique job endpoints from existing data files
  const endpoints = new Set();
  for await (const file of expandGlob("./res/data-*")) {
    console.log(`Processing file: ${file.path}`);
    const content = await Deno.readTextFile(file.path);
    const jsonData = JSON.parse(content);
    const jobs = jsonData.jobs;
    for (const job of jobs) {
    console.log(`Found ${JSON.stringify(job.job.url)} `);
      const url = job.job.url;
      console.log(`Extracted URL: ${url}`);
      if (url) {
        endpoints.add(url);
      }
    }
  }
  await Deno.writeFile("./res/optioncarriere-endpoints.json", new TextEncoder().encode(JSON.stringify([...endpoints], null, 2)));
  console.log(`Extracted ${endpoints.size} unique endpoints to optioncarriere-endpoints.json`);
   */

  await Websites.tanijob.scrapeJobDetails();

}
