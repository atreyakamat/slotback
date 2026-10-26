# Movie-dialogue reels (stock footage)

Four ~16s reels: free Pexels stock clips (credits in `../../stock/CREDITS.md`) with a famous film line as on-screen text. No film footage or film audio is used.

These posting files have sound effects only. Add the song in Instagram at the trim start below so the bass drop lands on the marked cut. Previews with the song baked in are in project files (`slotback-reels/movie/`), never in this public repo.

| File | Line | Song | IG trim start | Drop lands on |
| --- | --- | --- | --- | --- |
| m01-kitne-cancel-hue.mp4 | "Kitne cancel hue?" (Sholay) | STRUCT (Slowed) | 0:29.1 | the opening line |
| m02-picture-abhi-baaki-hai.mp4 | "Picture abhi baaki hai, mere dost" (Om Shanti Om) | PAIXÃO (Sped Up) | 0:46.3 | "End mein sab theek ho jaata hai" |
| m03-mogambo-khush-hua.mp4 | "Mogambo khush hua" (Mr. India) | Cavuca Funk | 0:32.0 | "One tap" |
| m04-houston-we-have-a-problem.mp4 | "Houston, we have a problem" (Apollo 13) | WINDOWS IN BRAZIL | 0:07.3 | "Houston, we have a problem" |

Source: `content/reels/studio/src/movie/` (scripts in `reels.ts`). Clips must be copied to `studio/public/stock/` before rendering.

## Batch 2 (m05–m14): motion graphics

Same setup, plus light leaks on the drop, hand-drawn circles, strikes and underlines on key words, a stamp slam, split screens (old way vs SlotBack), film-title openers and a ₹ counter (marked "Example numbers").

| File | Line | Song | IG trim start | Drop lands on |
| --- | --- | --- | --- | --- |
| m05-bade-bade-salons-mein.mp4 | "Bade bade salons mein…" (DDLJ) | STRUCT (Slowed) | 0:47.7 | "Bade bade salons mein…" |
| m06-mere-paas-waitlist-hai.mp4 | "Mere paas waitlist hai" (Deewaar) | Cavuca Funk | 0:46.5 | "Mere paas waitlist hai" |
| m07-naam-hai-slotback.mp4 | "Naam hai SlotBack" (Shahenshah) | WINDOWS IN BRAZIL | 0:31.6 | "Rishte mein toh hum…" |
| m08-pushpa-i-hate-empty-chairs.mp4 | "Pushpa, I hate empty chairs" (Amar Prem) | PAIXÃO (Sped Up) | 0:24.8 | "Pushpa, I hate empty chairs" |
| m09-all-is-well.mp4 | "All is well" (3 Idiots) | Cavuca Funk | 0:07.6 | "Aal izz well" |
| m10-namumkin-tha-ab-nahi.mp4 | "Mushkil hi nahi, namumkin" (Don) | STRUCT (Slowed) | 1:21.3 | "…namumkin hai" |
| m11-khaali-kursi-se-darr-lagta-hai.mp4 | "Khaali kursi se darr lagta hai" (Dabangg) | PAIXÃO (Sped Up) | 1:09.6 | "Cancel se darr nahi lagta sahab…" |
| m12-waitlist-wahi-se-shuru.mp4 | "Line wahi se shuru hoti hai" (Kaalia) | WINDOWS IN BRAZIL | 0:42.6 | "Hum jahan khade ho jaate hain…" |
| m13-ill-be-back.mp4 | "I'll be back" (The Terminator) | STRUCT (Slowed) | 0:08.0 | "I'll be back" |
| m14-show-me-the-money.mp4 | "Show me the money" (Jerry Maguire) | Cavuca Funk | 1:11.4 | "Show me the money!" |

Scripts: `content/reels/studio/src/movie/reels-02.ts`; layers in `fx.tsx`.
