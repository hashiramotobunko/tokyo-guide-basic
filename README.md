# SHAKEDOWN STREET — tokyo-guide-basic

Independent static guide for GitHub Pages. The original `hashiramotobunko/tokyo-guide` repository and website are not modified.

- 526 original places, 21 regions, 53 exact categories and 10 walking routes preserved.
- Six illustrated genre entrances use the user's supplied reference image, unchanged, through SVG viewports. No style unification or generated replacements.
- 40 original Box WebP illustrations are stored locally, with source filenames and SHA-256 checksums in `data/artwork.json`. 32 downloaded from folder 437537990018 match the previously imported originals byte-for-byte. Folder 437459634113's 15 source PNGs were visually reviewed; the corresponding finished WebPs from folder 437459113243 were selected for sushi, ramen, Chinese food, izakaya, hotel, museum and temple. Rooftop lounge supplies the Bar artwork.
- `data/genres.json` maps exact categories to genre hero files. The six broad entry groups are defined in `core.mjs`. Unavailable genre art is not replaced by unrelated work. The Cafés group labels its tea illustration explicitly.
- Filters are conjunctive, URL-addressable and history-aware. Saved places persist locally in the current browser; there is no cross-device synchronization.
- Map view shows the selected place next to the filtered list. 522 records use their existing Google Maps CID; 4 retain the original search query. It is not an all-pins map. No coordinates are invented. Google supplies embedded maps and any map ratings.
- Original official links, Instagram assignments, research records, verification dates and conflicts remain available. Unknown facts are not fabricated. Walks are not represented as field-verified.

## Development

Node 20+; no package installation or build step required.

```
npm run dev -- --host 127.0.0.1 --port 4173
npm test
```

Publish `main` / repository root using GitHub Pages. Keep `.nojekyll`.

## Data provenance

`data/original.json` is the original `DATA` structure. `data/places.json` retains all source fields and attaches existing research via stable map IDs. `data/migration.json` records source HTML SHA-256 and record counts. All source research JSON and route verification data are also copied. `scripts/migrate.mjs` documents the extraction; run only against a read-only checkout at `../source-readonly`. Artwork additions are maintained in `data/artwork.json` and `data/genres.json`.

## Validation

`npm test`: 10 checks cover record preservation, exact categories, six group boundaries, combined search, saved filtering, URL round trip, map identities, all route stops, detail/Instagram joins, original artwork hashes and source checksum. Browser QA covers desktop home/hero, region+area+keyword search, saved persistence after reload, live Google Maps rendering and 390px/320px mobile layouts.
