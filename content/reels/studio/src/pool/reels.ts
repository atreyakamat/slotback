import { relatable } from "./ideas-1-relatable";
import { education } from "./ideas-2-education";
import { product } from "./ideas-3-product";
import { founder } from "./ideas-4-founder";
import { goa } from "./ideas-5-goa";
import { trends } from "./ideas-6-trends";
import { borrowed } from "./ideas-8-borrowed";
import { PoolReel } from "./types";

// Test pool: 5 scripts for each idea in the Reel ideas bank, for Atreya to pick from.
// Pillar 7 (proof), C4, C6 and #94 wait for real pilots.
export const poolReels: PoolReel[] = [...relatable, ...education, ...product, ...founder, ...goa, ...trends, ...borrowed];
