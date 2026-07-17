import type { Provider } from "../types.js";
import { bright } from "./bright.js";
import { browserbase } from "./browserbase.js";
import { contextDev } from "./context_dev.js";
import { decodo } from "./decodo.js";
import { firecrawl } from "./firecrawl.js";
import { nimble } from "./nimble.js";
import { oxylabs } from "./oxylabs.js";
import { scraperapi } from "./scraperapi.js";
import { scrapfly } from "./scrapfly.js";
import { scrapingant } from "./scrapingant.js";
import { scrapingbeeProvider } from "./scrapingbee.js";
import { scrapingdog } from "./scrapingdog.js";
import { string } from "./string.js";
import { zenrows } from "./zenrows.js";
import { zyte } from "./zyte.js";

/** Every benchmarkable provider. The CLI runs whichever ones have their env keys set. */
export const PROVIDERS: Provider[] = [
  bright,
  browserbase,
  contextDev,
  decodo,
  firecrawl,
  nimble,
  oxylabs,
  scraperapi,
  scrapfly,
  scrapingant,
  scrapingbeeProvider,
  scrapingdog,
  string,
  zenrows,
  zyte
];

export function getProvider(name: string): Provider | undefined {
  return PROVIDERS.find((p) => p.name.toLowerCase() === name.toLowerCase());
}
