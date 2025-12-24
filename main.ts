// request-to-file.ts
// request-to-file.ts

import { authenticatedHeader } from "./authenticated-headers.ts";
import { GlobalConfig } from "./global-config.ts";
import { extractNextPageUrlOptioncarriere } from "./utils/extractors.ts";
import { extractDataFromHtml, fetchJobWithExtractorAndByNextUrl, hashCalculator, stableStringify } from "./utils/utils.ts";

const keywords = ["mobile", "développeur", "informatique", "base de données", "systemes embarqués", "cloud", "devops", "full stack", "frontend", "backend"];

const searchKeyword = keywords[4];
const targetUrl = `https://www.optioncarriere.tn/emploi?s=&l=Tunisie&s=${encodeURIComponent(searchKeyword)}`;
const dataOutput = `./res/data-${searchKeyword.replaceAll(" ", "-")}.json`;
const maxPageNumber = 100; // after this number we will get access forbidden



if(import.meta.main) { 
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

}
