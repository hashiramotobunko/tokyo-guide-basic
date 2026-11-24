import { readPersonalRoutes, writePersonalRoutes } from './route-library.mjs';
import {collectionArt} from './genre-art.mjs';
import {GROUPS,readState,stateURL,matchPlaces,genreCats,mapURL} from './core.mjs';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=u=>/^https?:\/\//i.test(u||'')?esc(u):'#';
let personalRoutes = readPersonalRoutes();
let routeDraft = { id: '', name: '', stops: [] };
let places,genres,routes,state=readState(location.search),saved=new Set,limit=36,timer;
try{const a=JSON.parse(localStorage.getItem('shakedown-basic-saved-v1')||'[]');if(Array.isArray(a))saved=new Set(a.filter(x=>typeof x==='string'))}catch{}
const link=(url,text)=>`<a href="${safe(url)}" target="_blank" rel="noopener noreferrer">${esc(text)} ↗</a>`;
const option=(v,label,current)=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(label)}</option>`;
const unique=a=>[...new Set(a)].sort((a,b)=>a.localeCompare(b,'ja'));
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>$('#toast').classList.remove('visible'),2500)}
function go(patch,reset=false){state=reset?readState(''):{...state};Object.assign(state,patch);state.place=patch.place||'';limit=36;history.pushState(null,'',stateURL(state));render();}
function ui(english, japanese) {
  return esc(english) + (japanese && state.page !== 'saved' && state.page !== 'about' ? `<small class="ui-ja" lang="ja">${esc(japanese)}</small>` : '');
}

const genreJapanese = {
  activity: '体験', bakery: 'パン屋', 'bakery-cafe': 'ベーカリーカフェ',
  bar: 'バー', 'bar-music': '音楽バー', 'bar-sake': '日本酒バー',
  'bar-whisky': 'ウイスキーバー', 'bar-wine': 'ワインバー', 'bistro-french': 'ビストロ・フレンチ',
  burger: 'ハンバーガー', cafe: 'カフェ', 'cafe-hotel-bar': 'カフェ・ホテルバー',
  'cafe-tea': '喫茶・お茶', chinese: '中華料理', 'chinese-gyoza': '中華・餃子',
  curry: 'カレー', 'diner-teishoku': '食堂・定食', 'event-venue': 'イベント会場',
  hotel: 'ホテル', indian: 'インド料理', italian: 'イタリア料理', izakaya: '居酒屋',
  japanese: '和食', jingisukan: 'ジンギスカン', kaiseki: '懐石料理', landmark: '名所',
  'live-house': 'ライブハウス', monument: '記念碑', museum: '美術館・博物館',
  onsen: '温泉', 'park-garden': '公園・庭園', ramen: 'ラーメン', 'restaurant-bar': 'レストランバー',
  sento: '銭湯', shopping: '買い物', 'shopping-street': '商店街', shrine: '神社',
  sightseeing: '観光', soba: 'そば', steak: 'ステーキ', 'street-food': '屋台料理',
  'sukiyaki-shabu': 'すき焼き・しゃぶしゃぶ', sushi: '寿司', sweets: '甘味',
  temple: '寺院', tempura: '天ぷら', thai: 'タイ料理', tonkatsu: 'とんかつ',
  tsukemen: 'つけ麺', unagi: 'うなぎ', yakiniku: '焼肉', yakitori: '焼き鳥', yoshoku: '洋食',
};

const placeCount = count => `${count} ${count === 1 ? 'place' : 'places'}`;
const displayName = place => place.en || place.details?.nameEn || place.name;
const placeTitle = place => ui(displayName(place), displayName(place) === place.name ? '' : place.name);
const saveLabel = (place, isSaved) => `${isSaved ? 'Remove' : 'Save'} ${displayName(place)}${isSaved ? ' from Saved' : ''}`;

function search(){return `<form class="search-form" id="search"><label>${ui('Keyword', '店名・キーワード')}<input name="q" type="search" value="${esc(state.q)}" placeholder="Search places, genres or areas"></label><label>${ui('Region', '地域')}<select name="region">${option('','All regions',state.region)}${unique(places.map(p=>p.city)).map(x=>option(x,x,state.region)).join('')}</select></label><button type="submit">${ui('Search', '検索')}</button></form>`}
function areaOptions(region, area = '') {
  const areas = unique(places.filter(place => !region || place.city === region).map(place => place.area).filter(Boolean));
  return option('', 'All areas', area) + areas.map(name => option(name, name, area)).join('');
}

function homeSearch() {
  const regions = unique(places.map(place => place.city));
  return `<form class="home-search" id="search" data-home-search>
    <label class="home-query">${ui('Keyword', '店名・キーワード')}
      <input name="q" type="search" placeholder="Places, neighborhoods, things to do">
    </label>
    <label>${ui('Region', '地域')}
      <select name="region">${option('', 'All regions', state.region)}${regions.map(name => option(name, name, state.region)).join('')}</select>
    </label>
    <label>${ui('Area', 'エリア')}
      <select name="area">${areaOptions(state.region)}</select>
    </label>
    <label>${ui('Genre', 'ジャンル')}
      <select name="cat">${option('', 'All genres', '')}${genres.map(genre => option(genre.name, genre.name, '')).join('')}</select>
    </label>
    <button type="submit">${ui('Search', '検索')}</button>
  </form>`;
}

function cards(){return GROUPS.map(g=>{const n=matchPlaces(places,{genre:g.id,region:state.region},genres).length;return `<a class="genre-card" href="${stateURL({genre:g.id,region:state.region})}"><div class="genre-art"><svg viewBox="${g.crop.join(' ')}" role="img" aria-label="${esc(g.name)} illustration"><image href="assets/images/genre-cards/reference.png" width="1536" height="1024"/></svg></div><h2>${ui(g.name, g.ja)}</h2><p>${placeCount(n)}</p></a>`}).join('')}
function illustratedGenres(){
  const counts = new Map();
  for (const place of places) {
    if (state.region && place.city !== state.region) continue;
    counts.set(place.cat, (counts.get(place.cat) || 0) + 1);
  }
  return genres.filter(genre => collectionArt.has(genre.id)).map(genre => {
    const { sheet, x, y, width, height } = collectionArt.get(genre.id);
    const href = stateURL({ genre: 'category:' + genre.id, region: state.region });
    const frame = [
      'aspect-ratio:' + width + '/' + height,
      '--sheet-width:' + (1086 / width * 100) + '%',
      '--sheet-left:' + (-x / width * 100) + '%',
      '--sheet-top:' + (-y / height * 100) + '%',
    ].join(';');
    return `<a class="genre-card" href="${href}">
      <div class="collection-art" style="${frame}">
        <img src="assets/images/genre-cards/collection-${sheet}.webp" alt="" loading="lazy" decoding="async">
      </div>
      <h3>${ui(genre.name, genreJapanese[genre.id])}</h3><p>${placeCount(counts.get(genre.name) || 0)}</p>
    </a>`;
  }).join('');
}
function genreLinks(){return genres.map(g=>{const n=places.filter(p=>p.cat===g.name&&(!state.region||p.city===state.region)).length;return `<a class="chip" href="${stateURL({genre:'category:'+g.id,region:state.region})}">${ui(g.name,genreJapanese[g.id])} <small>${n}</small></a>`}).join('')}
function home(){return homeSearch()+`<div class="section-top"><h1>${ui('EXPLORE BY GENRE','ジャンルから探す')}</h1><p>${state.region||'21 regions'} / ${places.filter(p=>!state.region||p.city===state.region).length} places</p></div><div class="genre-grid">${cards()}</div><section class="genre-collection"><div class="section-top"><h2>${ui('MORE GENRES','ほかのジャンル')}</h2><p>${collectionArt.size} illustrated genres</p></div><div class="genre-grid">${illustratedGenres()}</div></section><details class="all-genres"><summary>${ui('Browse all ' + genres.length + ' genres','すべてのジャンルから探す')}</summary><div class="genre-links">${genreLinks()}</div></details><div class="explore-all"><a class="text-link" href="${stateURL({page:'explore',region:state.region})}">${ui('View all places →','すべてのお店・スポットを見る')}</a></div>`}
const fieldNames = {
  hours: ['Opening hours','営業時間'], closed: ['Closed','定休日'],
  reservation: ['Reservations','予約'], address: ['Address','住所'],
  payment: ['Payment','支払い'], tip: ['Notes','メモ'], price: ['Price','料金'],
  access: ['Access','アクセス'], english: ['Language support','言語対応'],
};

function facts(place) {
  const fields = (place.details?.fields || []).filter(field =>
    field.v && ['official','secondary','conflict'].includes(field.stat)
  );
  if (!fields.length) return '';
  return `<details class="facts">
    <summary>${ui('Details and sources','調査済み情報・出典')}</summary>
    <dl>${fields.map(field => `<dt>${ui(...(fieldNames[field.t] || [field.t]))}</dt>
      <dd>${esc(field.v)}
        ${field.stat === 'conflict' ? ui('Sources disagree. Confirm before visiting.','情報に相違あり・要確認') : ''}
        ${field.alt ? `<p>${esc(typeof field.alt === 'string' ? field.alt : JSON.stringify(field.alt))}</p>` : ''}
        <small>${field.stat === 'official' ? 'Official source' : 'Reference'} · Checked ${esc(field.chk || 'date unavailable')} ${field.src ? link(field.src,'Source') : ''}</small>
      </dd>`).join('')}</dl>
    <p>${ui('Check opening hours with the venue before visiting.','訪問前に営業時間をご確認ください。')}</p>
  </details>`;
}

function placeCard(p){const isSaved=saved.has(p.id);const tip=p.note?.en||p.desc||(p.details?.fields||[]).find(f=>f.t==='tip'&&f.v&&['official','secondary'].includes(f.stat))?.v;return `<article class="place ${state.place===p.id?'selected':''}" data-place="${esc(p.id)}"><button class="save" data-save="${esc(p.id)}" aria-pressed="${isSaved}" aria-label="${esc(saveLabel(p,isSaved))}">${isSaved?'★':'☆'}</button><p class="category">${esc(p.cat)}</p><h3>${placeTitle(p)}</h3><p class="location">${esc(p.city)} / ${esc(p.area)}</p>${tip?`<p class="note">${esc(tip)}${p.note?.source?' '+link(p.note.source,'Story source'):''}</p>`:''}<div class="links">${link(p.url,'Google Maps')}${p.details?.website?link(p.details.website,'Official website'):''}${p.instagram?.u?link('https://www.instagram.com/'+p.instagram.u+'/',p.instagram.t==='brand'?'Instagram (brand)':'Instagram'):''}<button data-map="${esc(p.id)}">${ui('View on map','地図で見る')}</button></div>${facts(p)}</article>`}
function hero(){const exact=genres.find(g=>g.id===state.genre.replace(/^category:/,'')&&(!state.cat||g.name===state.cat));const group=!state.cat&&GROUPS.find(g=>g.id===state.genre);const title=group?.name||exact?.name||'Explore';const image=group?.hero||exact?.hero;const ja=group?.ja||genreJapanese[exact?.id];return image?`<section class="genre-hero"><img src="assets/images/genre-heroes/${image}.webp" alt="Original illustration for ${esc(title)}" width="960" height="1200"><div><span class="eyebrow">EXPLORE / ${esc(title.toUpperCase())}</span><h1>${ui(title,ja)}</h1><small>${group?.id==='cafes'?'Artwork: Café / Tea':'Original artwork'}</small><p><a class="text-link" href="#results">${ui('View places ↓','お店・スポットを見る')}</a></p></div></section>`:`<h1 class="page-heading">${esc(state.page==='saved'?'Saved':title)}</h1>`}
function filters(){const base=matchPlaces(places,{genre:state.genre,region:state.region,page:state.page,cat:state.cat},genres,saved);const cats=genreCats(state,genres);return `<div class="filters"><label>${ui('Area', 'エリア')}<select data-filter="area">${option('','All areas',state.area)}${unique([...base.map(p=>p.area),...(state.area?[state.area]:[])]).map(x=>option(x,x,state.area)).join('')}</select></label><label>${ui('Genre', 'ジャンル')}<select data-filter="cat">${option('','All genres',state.cat)}${genres.filter(g=>!cats||cats.includes(g.name)).map(g=>option(g.name,g.name,state.cat)).join('')}</select></label><label>${ui('Sort by', '並び替え')}<select data-filter="sort">${option('','Name (A–Z)',state.sort)}${option('name-desc','Name (Z–A)',state.sort)}${option('area','Region and area',state.sort)}</select></label></div>`}
function conditions(){return `<div class="conditions" aria-label="Active filters">${['region','area','cat','q'].filter(k=>state[k]).map(k=>`<button data-clear="${k}" aria-label="Clear ${esc(state[k])} filter">${esc(state[k])} ×</button>`).join('')}${['region','area','cat','q'].some(k=>state[k])?`<button data-clear="filters">${ui('Clear filters','絞り込みを解除')}</button>`:''}</div>`}
function results(){const matches=matchPlaces(places,state,genres,saved),selected=matches.find(p=>p.id===state.place)||matches[0];let html=`<a class="back" href="./">${ui('← Explore','ジャンル選択に戻る')}</a>${hero()}${state.page === 'saved' ? savedInstructions() + personalRouteSection() : ''}${search()}${filters()}${conditions()}<section id="results"><div class="results-bar"><h2>${ui(placeCount(matches.length), `${matches.length}件のお店・スポット`)}</h2><div class="switch" aria-label="View mode"><button data-view="list" aria-pressed="${state.view!=='map'}">${ui('List','一覧')}</button><button data-view="map" aria-pressed="${state.view==='map'}">${ui('Map','地図')}</button></div></div>`;
 if(!matches.length)return html+`<div class="empty"><h3>${state.page==='saved'&&!saved.size?'No saved places yet':ui('No matching places','条件に合う場所が見つかりません')}</h3><p>${state.page==='saved'&&!saved.size?'Explore the guide and tap a star to start your list.':ui('Try a different keyword or filter.','キーワードや絞り込み条件を変えてお試しください。')}</p><a class="text-link" href="./">${ui('Browse genres →','ジャンルから探す')}</a></div></section>`;
 const list=`<div><div class="places">${matches.slice(0,limit).map(placeCard).join('')}</div>${matches.length>limit?`<button class="more" id="more">${ui(`Show more (${Math.min(limit,matches.length)} / ${matches.length})`,'さらに表示')}</button>`:''}</div>`;
 if(state.view==='map')html+=`<div class="map-layout">${list}<aside class="map-panel"><iframe src="${esc(mapURL(selected))}" title="Map of ${esc(displayName(selected))}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe><div class="map-caption"><h3>${esc(displayName(selected))}</h3><p>${ui('Choose View on map on another card to switch places.','別のカードの「地図で見る」で場所を切り替えられます。')}${selected.url.includes('!1s')?'':ui('This map shows a search result for the place.','この地図は施設名での検索結果を表示しています。')}</p>${link(selected.url,'Open in Google Maps')}</div></aside></div>`;else html+=list;return html+'</section>'}
function walks(){return `<a class="back" href="./">← Explore</a><h1 class="page-heading">Walks</h1><p class="notice">${ui('Ten routes to explore on foot. The routes are map-checked drafts. Check opening hours and access before setting out.','街を歩く10のルート。出発前に営業状況や通行条件をご確認ください。')}</p><div class="walks">${routes.map(r=>`<article class="walk"><span class="eyebrow">${esc(r.city)} / ${esc(r.area)}</span><h2>${esc(r.title)}</h2><p>${esc(r.intro)}</p><ol>${r.stops.map(name=>{const p=places.find(p=>p.city===r.city&&p.name===name);return `<li>${p?link(p.url,name):esc(name)}</li>`}).join('')}</ol><a class="text-link" href="${stateURL({page:'explore',region:r.city,area:r.area})}">${ui('Explore this area →','このエリアを探す')}</a></article>`).join('')}</div>`}
function about() {
  return `<a class="back" href="./">← Explore</a>
    <article class="prose about-copy">
      <h1 class="page-heading">About Shakedown Street</h1>
      <p>A city is never just one story. Change the person looking at it, and a familiar street becomes something new.</p>
      <p>Shakedown Street is an independent culture and discovery platform exploring Japan through the people, places, and stories that give its cities character.</p>
      <h2>Beyond the Obvious</h2>
      <p>Walk through the same neighbourhood with a photographer, a musician, an architect, or someone who has lived there for decades, and you will discover entirely different worlds.</p>
      <p>We are interested in more than famous landmarks and popular restaurants. We are curious about the little bookshop down a side street, the café someone has visited for thirty years, the music that fills a neighbourhood at night, and the new generation of people reshaping the places they call home.</p>
      <h2>A Guide Is Only the Start</h2>
      <p>Read about someone's favourite neighbourhood. Follow a route through the places they love. Find a corner of Japan you never knew existed.</p>
      <p>Take the long way. Read the small sign. Walk one street farther than you planned.</p>
    </article>`;
}

function savedInstructions() {
  return `<section class="saved-instructions" aria-labelledby="saved-help">
    <h2 id="saved-help">How to use Saved</h2>
    <ol>
      <li>Find a place in <a href="./">Explore</a> and tap the outline star (☆) on its card.</li>
      <li>Open <strong>Saved</strong> from the navigation to see your list. Tap a filled star (★) to remove a place from the list.</li>
      <li>In <strong>My Routes</strong>, add saved places as stops, put them in order, and choose <strong>Save route</strong>. Select a route by name to reopen it.</li>
    </ol>
    <p>Your places and routes stay in this browser on this device. No account is needed. They do not sync across devices. Clearing this site's browser data removes them.</p>
  </section>`;
}

function personalRouteSection() {
  return `<section class="personal-routes" id="my-routes" aria-labelledby="routes-title">
    <h2 id="routes-title">My Routes</h2>
    <div class="route-workspace">${routeWorkspace()}</div>
  </section>`;
}

function routeWorkspace() {
  const byId = new Map(places.map(place => [place.id, place]));
  const choices = [...saved].filter(id => byId.has(id) && !routeDraft.stops.includes(id));
  const existing = personalRoutes.map(route =>
    `<li><button type="button" data-route-open="${esc(route.id)}"
      aria-pressed="${route.id === routeDraft.id}">${esc(route.name)} · ${route.stops.length} stops</button></li>`
  ).join('');
  const stops = routeDraft.stops.map((id, index) => {
    const place = byId.get(id);
    const name = place ? displayName(place) : 'Unavailable place';
    return `<li><div class="route-stop-name"><strong>${esc(name)}</strong>
      ${place ? link(place.url, 'Google Maps') : ''}</div>
      <div class="route-stop-controls">
        <button type="button" data-route-move="-1" data-index="${index}"
          aria-label="Move ${esc(name)} up" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" data-route-move="1" data-index="${index}"
          aria-label="Move ${esc(name)} down" ${index === routeDraft.stops.length - 1 ? 'disabled' : ''}>↓</button>
        <button type="button" data-route-remove="${index}" aria-label="Remove ${esc(name)} from route">Remove</button>
      </div></li>`;
  }).join('');

  return `<div class="route-picker">
    ${existing ? `<ul aria-label="Saved routes">${existing}</ul>` : '<p>No routes saved yet.</p>'}
    <button type="button" data-route-new>New route</button>
  </div>
  <form id="route-editor" class="route-editor">
    <label>Route name<input name="routeName" required maxlength="80"
      value="${esc(routeDraft.name)}" placeholder="e.g. A Saturday in Shibuya"></label>
    <label>Add a saved place<select name="routeStop" ${choices.length ? '' : 'disabled'}>
      ${option('', choices.length ? 'Choose a place' : 'No more saved places to add', '')}
      ${choices.map(id => option(id, displayName(byId.get(id)), '')).join('')}
    </select></label>
    <button type="button" data-route-add disabled>Add stop</button>
    ${stops ? `<ol class="route-stops">${stops}</ol>` : '<p class="route-empty">Save a place in Explore, then add it here as a stop.</p>'}
    <div class="route-actions">
      <button class="route-submit" type="submit" ${stops ? '' : 'disabled'}>Save route</button>
      ${routeDraft.id ? '<button type="button" data-route-delete>Delete route</button>' : ''}
    </div>
  </form>`;
}

function refreshRouteEditor(focusSelector) {
  const workspace = $('#my-routes .route-workspace');
  if (!workspace) return;
  workspace.innerHTML = routeWorkspace();
  if (focusSelector) workspace.querySelector(focusSelector)?.focus();
}

document.addEventListener('input', event => {
  if (event.target.name === 'routeName') routeDraft.name = event.target.value;
});

document.addEventListener('change', event => {
  if (event.target.name === 'routeStop') {
    $('[data-route-add]').disabled = !event.target.value;
  }
});

document.addEventListener('click', event => {
  const button = event.target.closest('#my-routes button');
  if (!button) return;
  if (button.hasAttribute('data-route-delete')) {
    const route = personalRoutes.find(item => item.id === routeDraft.id);
    if (!route || !window.confirm(`Delete “${route.name}”?`)) return;
    const next = readPersonalRoutes().filter(item => item.id !== route.id);
    try {
      writePersonalRoutes(next);
    } catch {
      toast('The route could not be deleted. Check your browser storage settings.');
      return;
    }
    personalRoutes = next;
    routeDraft = { id: '', name: '', stops: [] };
    refreshRouteEditor('[data-route-new]');
    toast('Route deleted');
  } else if (button.hasAttribute('data-route-new')) {
    routeDraft = { id: '', name: '', stops: [] };
    refreshRouteEditor('[name="routeName"]');
  } else if (button.dataset.routeOpen) {
    const route = personalRoutes.find(item => item.id === button.dataset.routeOpen);
    if (!route) return;
    routeDraft = { ...route, stops: [...route.stops] };
    refreshRouteEditor('[name="routeName"]');
  } else if (button.hasAttribute('data-route-add')) {
    const id = $('[name="routeStop"]').value;
    if (!saved.has(id) || routeDraft.stops.includes(id)) return;
    routeDraft.stops.push(id);
    refreshRouteEditor('[name="routeStop"]:enabled, .route-submit');
  } else if (button.hasAttribute('data-route-remove')) {
    routeDraft.stops.splice(Number(button.dataset.routeRemove), 1);
    refreshRouteEditor('[name="routeStop"]:enabled, [name="routeName"]');
  } else if (button.dataset.routeMove) {
    const index = Number(button.dataset.index);
    const target = index + Number(button.dataset.routeMove);
    if (target < 0 || target >= routeDraft.stops.length) return;
    [routeDraft.stops[index], routeDraft.stops[target]] = [routeDraft.stops[target], routeDraft.stops[index]];
    refreshRouteEditor(`[data-index="${target}"]:enabled`);
  }
});

document.addEventListener('submit', event => {
  if (event.target.id !== 'route-editor') return;
  event.preventDefault();
  const nameField = event.target.elements.routeName;
  const name = nameField.value.trim();
  if (!name) {
    nameField.value = '';
    nameField.reportValidity();
    return;
  }
  if (!routeDraft.stops.length) return;
  const route = { id: routeDraft.id || crypto.randomUUID(), name, stops: [...routeDraft.stops] };
  const next = readPersonalRoutes();
  const index = next.findIndex(item => item.id === route.id);
  if (index === -1) next.push(route);
  else next[index] = route;
  try {
    writePersonalRoutes(next);
  } catch {
    toast('The route could not be saved. Check your browser storage settings.');
    return;
  }
  personalRoutes = next;
  routeDraft = { ...route, stops: [...route.stops] };
  refreshRouteEditor('.route-submit');
  toast('Route saved');
});

function render(){const isHome=!state.page&&!state.genre&&!state.q&&!state.area&&!state.cat;document.body.classList.toggle('home-page',isHome);document.body.classList.toggle('english-only',['saved','about'].includes(state.page));$('#main').innerHTML=state.page==='walks'?walks():state.page==='about'?about():isHome?home():results();$('#saved-count').textContent=saved.size;document.querySelectorAll('nav a').forEach(a=>{const p=new URL(a.href).searchParams.get('page')||'';if(p===(state.page==='walks'||state.page==='about'||state.page==='saved'?state.page:''))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});document.title=(state.page==='saved'?'Saved':state.page==='about'?'About':state.genre?GROUPS.find(g=>g.id===state.genre)?.name||genres.find(g=>g.id===state.genre.replace(/^category:/,''))?.name||'Explore':state.page==='walks'?'Walks':'Explore')+' — SHAKEDOWN STREET';}
document.addEventListener('submit', event => {
  const form = event.target;
  if (form.id !== 'search') return;
  event.preventDefault();
  const data = new FormData(form);
  const q = data.get('q').trim();
  const region = data.get('region');
  if (form.hasAttribute('data-home-search')) {
    go({ page: 'explore', q, region, area: data.get('area'), cat: data.get('cat') });
    return;
  }
  go({
    q,
    region,
    area: region === state.region ? state.area : '',
    page: state.page === 'saved' ? 'saved' : state.genre ? '' : 'explore',
  });
});

document.addEventListener('change', event => {
  const field = event.target;
  if (field.dataset.filter) {
    go({ [field.dataset.filter]: field.value });
  } else if (field.name === 'region') {
    if (field.form?.hasAttribute('data-home-search')) {
      field.form.elements.area.innerHTML = areaOptions(field.value);
    } else {
      go({ region: field.value, area: '' });
    }
  }
});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.save){const id=b.dataset.save;saved.has(id)?saved.delete(id):saved.add(id);try{localStorage.setItem('shakedown-basic-saved-v1',JSON.stringify([...saved]));toast(saved.has(id)?'Place saved':'Place removed from Saved')}catch{toast('Browser storage is unavailable. Changes will last for this visit only.')}if(state.page==='saved')render();else{b.setAttribute('aria-pressed',saved.has(id));b.textContent=saved.has(id)?'★':'☆';b.setAttribute('aria-label',saveLabel(places.find(p=>p.id===id),saved.has(id)));$('#saved-count').textContent=saved.size}}else if(b.dataset.map){go({view:'map',place:b.dataset.map});$('.map-panel')?.scrollIntoView({block:'start',behavior:'smooth'})}else if(b.dataset.view){go({view:b.dataset.view});$('#results')?.scrollIntoView({block:'start'})}else if(b.dataset.clear){const k=b.dataset.clear;go(k==='filters'?{q:'',region:'',area:'',cat:''}:{[k]:'',...(k==='region'?{area:''}:{})})}else if(b.id==='more'){limit+=36;const y=scrollY;render();scrollTo(0,y)}});
window.addEventListener('popstate',()=>{state=readState(location.search);limit=36;render()});
try{[places,genres,routes]=await Promise.all(['places','genres','routes'].map(async f=>{const r=await fetch('./data/'+f+'.json');if(!r.ok)throw Error(r.status);return r.json()}));render()}catch(e){$('#main').innerHTML=`<div class="error"><h1>${ui('Could not load the guide','ガイドを読み込めませんでした')}</h1><p>${ui('Check your connection and try again.','接続を確認して再試行してください。')}</p><button onclick="location.reload()">${ui('Try again','再試行')}</button></div>`;console.error(e)}
