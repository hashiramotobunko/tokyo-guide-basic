# V2 data

`data/places.json` is the canonical public dataset. Its `id` matches the Excel public facility ID. `data/instagram-links.json` mirrors verified Instagram entries. `data/tokyo-takeout-link-review.json` records the review of the 54 Takeout additions. Null means no posting-ready link was identified. Keep the original Maps URL and ID when expanding the data, compare by ID, and validate changes with `npm test` before publishing.
