// request-to-file.ts
// request-to-file.ts

import { authenticatedHeader } from "./authenticated-headers.ts";
import { extractDataFromHtml, fetchWithRetries, waitRandom } from "./utils/utils.ts";

const targetUrl = "https://www.optioncarriere.tn/emploi?s=&l=Tunisie";
const index = 1;
const dataOutput = `./res/data${index}.json`;
const maxPageNumber = 100; // after this number we will get access forbidden

const getPage = (pageNumber: number) => `https://www.optioncarriere.tn/emploi?s=&l=Tunisie&p=${pageNumber}`



console.log(`Data saved to ${dataOutput}`);

if(import.meta.main) { 
  /**
   * If this module is run directly, execute the main function.
   */
  let jobs  = [];
  for (let index = 1; index < maxPageNumber; index++) {
    try {
      const pageUrl = getPage(index);
      console.log(`Fetching page ${index}: ${pageUrl}`);

      /**
       * wait random delay
       * @params min, max in seconds defaults 1 to 2
       */
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
  }
}
