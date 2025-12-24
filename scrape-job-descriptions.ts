/**
 * collect job descriptions from optioncarriere.tn
 */

import { authenticatedHeader } from "./authenticated-headers.ts";
import { GlobalConfig } from "./global-config.ts";
import { fetchJobWithExtractorList } from "./utils/utils.ts";
import jobs from './res/data1.json' with { type: "json" }
import { extractJobFromJobDetails } from "./utils/extractors.ts";
import { logger } from "./utils/logger.ts";


if(import.meta.main) {
    const urls = jobs.map((it) => `${GlobalConfig.BASE_URL}${it.url}`)
    logger.info("URLS EXTRACTED:", urls.length);
    const jobsDetailsData = await fetchJobWithExtractorList(urls, {headers: authenticatedHeader} , extractJobFromJobDetails, "jobs-description.json");
    await Deno.writeFile("jobs-description.json", new TextEncoder().encode(JSON.stringify(jobsDetailsData, null, 2)));
    logger.info("DONE collecting data ", jobsDetailsData.length);
}