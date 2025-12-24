export const GlobalConfig: {
    BASE_URL: string;
    JOB_LISTING_URL?: string;
    JOB_DESCRIPTION_URL?: (endpoint: string) => string;
    RESULTS_PER_PAGE?: number;
    MAX_PAGES?: number;
    CURRENT_VERSION?: number;
} = {
    BASE_URL: "https://www.optioncarriere.tn",
    CURRENT_VERSION: 1
}