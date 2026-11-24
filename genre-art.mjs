// Artwork bounds exclude the captions baked into the four review sheets.
const columns = [[24, 326], [380, 326], [738, 325]];
const sheets = [
  {
    rows: [[25, 311], [390, 306], [750, 293], [1101, 291]],
    genres: [
      'activity', 'bakery', 'bakery-cafe',
      'bar-music', 'bar-sake', 'bar-whisky',
      'bar-wine', 'bistro-french', 'burger',
      'cafe-hotel-bar', 'cafe-tea', 'chinese',
    ],
  },
  {
    rows: [[25, 309], [390, 305], [749, 294], [1097, 296]],
    genres: [
      'chinese-gyoza', 'curry', 'diner-teishoku',
      'event-venue', 'hotel', 'indian',
      'italian', 'izakaya', 'japanese',
      'jingisukan', 'kaiseki', 'landmark',
    ],
  },
  {
    rows: [[25, 311], [390, 305], [749, 294], [1097, 295]],
    genres: [
      'live-house', 'monument', 'museum',
      'onsen', 'park-garden', 'restaurant-bar',
      'shopping-street', 'shrine', 'sightseeing',
      'soba', 'steak', 'street-food',
    ],
  },
  {
    rows: [[25, 311], [389, 305], [749, 293], [1097, 294]],
    genres: [
      'sukiyaki-shabu', 'sweets', 'temple',
      'tempura', 'thai', 'tonkatsu',
      'tsukemen', 'unagi', 'yakiniku',
      'yakitori', 'yoshoku',
    ],
  },
];

export const collectionArt = new Map(sheets.flatMap(({ rows, genres }, sheetIndex) =>
  genres.map((id, index) => {
    const [x, width] = columns[index % columns.length];
    const [y, height] = rows[Math.floor(index / columns.length)];
    return [id, { sheet: sheetIndex + 1, x, y, width, height }];
  })
));
