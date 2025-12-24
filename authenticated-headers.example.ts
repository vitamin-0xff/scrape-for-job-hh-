export const authenticatedHeader = {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.5",
    "priority": "u=1, i",
    "referer": "https://www.careerjet.com/jobs?s=&l=",
    "sec-ch-ua": `"Brave";v="143", "Chromium";v="143", "Not A(Brand";v="24"`,
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": `"Linux"`,
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "sec-gpc": "1",
    "user-agent":
      "your use agent string here",
    "x-requested-with": "XMLHttpRequest",

    // cookies must be sent as a single header
    "cookie":
      "s=_your s token; " +
      "u=your u token; " +
      "wpa=0; " +
      "su19hd7=your token; " +
      "bc=your token; " +
      "t=your token; " +
      "session=your session id here"
}