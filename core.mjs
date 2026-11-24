export const GROUPS=[
 {id:'sushi',name:'Sushi',ja:'寿司',cats:['Sushi'],hero:'sushi',crop:[110,225,418,304]},
 {id:'ramen',name:'Ramen',ja:'ラーメン',cats:['Ramen'],hero:'ramen',crop:[560,225,417,304]},
 {id:'cafes',name:'Cafés',ja:'カフェ・喫茶',cats:['Café','Café / Tea','Bakery / Café','Café / Hotel Bar'],hero:'tea-cafe',crop:[1009,225,417,304]},
 {id:'bars',name:'Bars',ja:'バー',cats:['Bar','Bar / Music','Bar / Sake','Bar / Whisky','Bar / Wine','Restaurant / Bar','Café / Hotel Bar'],hero:'bar',crop:[110,615,418,308]},
 {id:'baths',name:'Baths',ja:'銭湯・温泉',cats:['Sento','Onsen'],hero:'sento',crop:[560,615,417,308]},
 {id:'shopping',name:'Shopping',ja:'買い物・商店街',cats:['Shopping','Shopping Street'],hero:'shopping-street',crop:[1009,615,417,308]}
];
export const norm=s=>String(s||'').normalize('NFKC').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export const keys=['page','genre','region','area','cat','q','sort','view','place'];
export function readState(search=''){const p=new URLSearchParams(search);return Object.fromEntries(keys.map(k=>[k,p.get(k)||'']))}
export function stateURL(s){const p=new URLSearchParams;for(const k of keys)if(s[k])p.set(k,s[k]);return './'+(p.size?'?'+p:'')}
export function genreCats(s,genres){if(!s.genre)return null;if(s.genre.startsWith('category:'))return genres.filter(g=>g.id===s.genre.slice(9)).map(g=>g.name);if(s.cat&&genres.some(g=>g.id===s.genre&&g.name===s.cat))return [s.cat];return GROUPS.find(g=>g.id===s.genre)?.cats||genres.filter(g=>g.id===s.genre).map(g=>g.name)}
export function matchPlaces(places,s,genres,saved=new Set){const cats=genreCats(s,genres),terms=norm(s.q).split(/\s+/).filter(Boolean);return places.filter(p=>(s.page!=='saved'||saved.has(p.id))&&(!cats||cats.includes(p.cat))&&(!s.region||p.city===s.region)&&(!s.area||p.area===s.area)&&(!s.cat||p.cat===s.cat)&&terms.every(t=>norm([p.name,p.area,p.city,p.cat,p.details?.nameEn,p.note?.en].join(' ')).includes(t))).sort((a,b)=>s.sort==='area'?a.city.localeCompare(b.city)||a.area.localeCompare(b.area)||a.name.localeCompare(b.name,'ja'):(s.sort==='name-desc'?-1:1)*a.name.localeCompare(b.name,'ja'))}
export function mapURL(p){const cid=p.url.match(/!1s0x[\da-f]+:(0x[\da-f]+)/i)?.[1];if(cid)return 'https://maps.google.com/maps?cid='+BigInt(cid).toString()+'&output=embed';const u=new URL(p.url);return 'https://maps.google.com/maps?q='+encodeURIComponent(u.searchParams.get('query')||p.name+' '+p.city)+'&output=embed'}
