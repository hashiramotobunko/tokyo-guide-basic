import {collectionArt} from './genre-art.mjs';
import {GROUPS,readState,stateURL,matchPlaces,genreCats,mapURL} from './core.mjs';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=u=>/^https?:\/\//i.test(u||'')?esc(u):'#';
let places,genres,routes,state=readState(location.search),saved=new Set,limit=36,timer;
try{const a=JSON.parse(localStorage.getItem('shakedown-basic-saved-v1')||'[]');if(Array.isArray(a))saved=new Set(a.filter(x=>typeof x==='string'))}catch{}
const link=(url,text)=>`<a href="${safe(url)}" target="_blank" rel="noopener noreferrer">${esc(text)} ↗</a>`;
const option=(v,label,current)=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(label)}</option>`;
const unique=a=>[...new Set(a)].sort((a,b)=>a.localeCompare(b,'ja'));
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>$('#toast').classList.remove('visible'),2500)}
function go(patch,reset=false){state=reset?readState(''):{...state};Object.assign(state,patch);state.place=patch.place||'';limit=36;history.pushState(null,'',stateURL(state));render();}
function search(){return `<form class="search-form" id="search"><label>店名・キーワード<input name="q" type="search" value="${esc(state.q)}" placeholder="店名、ジャンル、エリアから探す"></label><label>地域<select name="region">${option('','全国・すべての地域',state.region)}${unique(places.map(p=>p.city)).map(x=>option(x,x,state.region)).join('')}</select></label><button type="submit">検索</button></form>`}
function areaOptions(region, area = '') {
  const areas = unique(places.filter(place => !region || place.city === region).map(place => place.area).filter(Boolean));
  return option('', 'すべてのエリア', area) + areas.map(name => option(name, name, area)).join('');
}

function homeSearch() {
  const regions = unique(places.map(place => place.city));
  return `<form class="home-search" id="search" data-home-search>
    <label class="home-query">店名・キーワード
      <input name="q" type="search" placeholder="店名、街、気になるもの">
    </label>
    <label>地域
      <select name="region">${option('', '全国', state.region)}${regions.map(name => option(name, name, state.region)).join('')}</select>
    </label>
    <label>エリア
      <select name="area">${areaOptions(state.region)}</select>
    </label>
    <label>ジャンル
      <select name="cat">${option('', 'すべてのジャンル', '')}${genres.map(genre => option(genre.name, genre.name, '')).join('')}</select>
    </label>
    <button type="submit">検索する <span aria-hidden="true">↗</span></button>
  </form>`;
}

function cards(){return GROUPS.map(g=>{const n=matchPlaces(places,{genre:g.id,region:state.region},genres).length;return `<a class="genre-card" href="${stateURL({genre:g.id,region:state.region})}"><div class="genre-art"><svg viewBox="${g.crop.join(' ')}" role="img" aria-label="${esc(g.ja)}のイラスト"><image href="assets/images/genre-cards/reference.png" width="1536" height="1024"/></svg></div><h2>${g.name}</h2><p>${g.ja} · ${n} places</p></a>`}).join('')}
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
      <h3>${esc(genre.name)}</h3><p>${counts.get(genre.name) || 0} places</p>
    </a>`;
  }).join('');
}
function genreLinks(){return genres.map(g=>{const n=places.filter(p=>p.cat===g.name&&(!state.region||p.city===state.region)).length;return `<a class="chip" href="${stateURL({genre:'category:'+g.id,region:state.region})}">${esc(g.name)} <small>${n}</small></a>`}).join('')}
function home(){return homeSearch()+`<div class="section-top"><h1>EXPLORE BY GENRE</h1><p>${state.region||'21 regions'} / ${places.filter(p=>!state.region||p.city===state.region).length} places</p></div><div class="genre-grid">${cards()}</div><section class="genre-collection"><div class="section-top"><h2>MORE GENRES</h2><p>${collectionArt.size} illustrated genres</p></div><div class="genre-grid">${illustratedGenres()}</div></section><details class="all-genres"><summary>すべてのジャンルから探す — ${genres.length} genres</summary><div class="genre-links">${genreLinks()}</div></details><div class="explore-all"><a class="text-link" href="${stateURL({page:'explore',region:state.region})}">すべてのお店・スポットを見る →</a></div>`}
const fieldNames={hours:'営業時間',closed:'定休日',reservation:'予約',address:'住所',payment:'支払い',tip:'メモ',price:'料金',access:'アクセス',english:'言語対応'};
function facts(p){const fields=(p.details?.fields||[]).filter(f=>f.v&&['official','secondary','conflict'].includes(f.stat));if(!fields.length)return '';return `<details class="facts"><summary>調査済み情報・出典を見る</summary><dl>${fields.map(f=>`<dt>${esc(fieldNames[f.t]||f.t)}</dt><dd>${esc(f.v)}${f.stat==='conflict'?'<strong>（情報に相違あり・要確認）</strong>':''}${f.alt?`<p>${esc(typeof f.alt==='string'?f.alt:JSON.stringify(f.alt))}</p>`:''}<small>${f.stat==='official'?'公式情報':'参考情報'} · 確認日 ${esc(f.chk||'記録なし')} ${f.src?link(f.src,'出典'):''}</small></dd>`).join('')}</dl><p>営業時間・営業状況は訪問前に公式情報をご確認ください。</p></details>`}
function placeCard(p){const isSaved=saved.has(p.id);const tip=p.note?.en||p.desc||(p.details?.fields||[]).find(f=>f.t==='tip'&&f.v&&['official','secondary'].includes(f.stat))?.v;return `<article class="place ${state.place===p.id?'selected':''}" data-place="${esc(p.id)}"><button class="save" data-save="${esc(p.id)}" aria-pressed="${isSaved}" aria-label="${esc(p.name)}を${isSaved?'保存から削除':'保存'}">${isSaved?'★':'☆'}</button><p class="category">${esc(p.cat)}</p><h3>${esc(p.name)}</h3><p class="location">${esc(p.city)} / ${esc(p.area)}</p>${tip?`<p class="note">${esc(tip)}${p.note?.source?' '+link(p.note.source,'紹介文の出典'):''}</p>`:''}<div class="links">${link(p.url,'Google Maps')}${p.details?.website?link(p.details.website,'公式サイト'):''}${p.instagram?.u?link('https://www.instagram.com/'+p.instagram.u+'/',p.instagram.t==='brand'?'Instagram（ブランド）':'Instagram'):''}<button data-map="${esc(p.id)}">地図で見る</button></div>${facts(p)}</article>`}
function hero(){const exact=genres.find(g=>g.id===state.genre.replace(/^category:/,'')&&(!state.cat||g.name===state.cat));const group=!state.cat&&GROUPS.find(g=>g.id===state.genre);const title=group?.name||exact?.name||'Explore';const image=group?.hero||exact?.hero;const ja=group?.ja||'街で出会う、お気に入りの場所';return image?`<section class="genre-hero"><img src="assets/images/genre-heroes/${image}.webp" alt="${esc(title)}のオリジナルイラスト" width="960" height="1200"><div><span class="eyebrow">EXPLORE / ${esc(title.toUpperCase())}</span><h1>${esc(title)}</h1><p>${esc(ja)}</p><small>${group?.id==='cafes'?'Artwork: Café / Tea':'Original artwork'}</small><p><a class="text-link" href="#results">お店・スポットを見る ↓</a></p></div></section>`:`<h1 class="page-heading">${esc(state.page==='saved'?'Saved':title)}</h1>`}
function filters(){const base=matchPlaces(places,{genre:state.genre,region:state.region,page:state.page,cat:state.cat},genres,saved);const cats=genreCats(state,genres);return `<div class="filters"><label>エリア<select data-filter="area">${option('','すべてのエリア',state.area)}${unique([...base.map(p=>p.area),...(state.area?[state.area]:[])]).map(x=>option(x,x,state.area)).join('')}</select></label><label>ジャンル<select data-filter="cat">${option('','ジャンル内すべて',state.cat)}${genres.filter(g=>!cats||cats.includes(g.name)).map(g=>option(g.name,g.name,state.cat)).join('')}</select></label><label>並び替え<select data-filter="sort">${option('','店名順（あいうえお・A–Z）',state.sort)}${option('name-desc','店名順（逆順）',state.sort)}${option('area','地域・エリア順',state.sort)}</select></label></div>`}
function conditions(){return `<div class="conditions" aria-label="現在の検索条件">${['region','area','cat','q'].filter(k=>state[k]).map(k=>`<button data-clear="${k}" aria-label="${esc(state[k])}の条件を解除">${esc(state[k])} ×</button>`).join('')}${['region','area','cat','q'].some(k=>state[k])?'<button data-clear="filters">絞り込みを解除</button>':''}</div>`}
function results(){const matches=matchPlaces(places,state,genres,saved),selected=matches.find(p=>p.id===state.place)||matches[0];let html=`<a class="back" href="./">← ジャンル選択に戻る</a>${hero()}${search()}${filters()}${conditions()}<section id="results"><div class="results-bar"><h2>${matches.length}件のお店・スポット${state.page==='saved'?' · 保存済み':''}</h2><div class="switch" aria-label="表示方法"><button data-view="list" aria-pressed="${state.view!=='map'}">一覧</button><button data-view="map" aria-pressed="${state.view==='map'}">地図</button></div></div>`;
 if(!matches.length)return html+`<div class="empty"><h3>${state.page==='saved'&&!saved.size?'まだ保存した場所はありません':'条件に合う場所が見つかりません'}</h3><p>${state.page==='saved'&&!saved.size?'気になるお店の ☆ を押すと、ここに保存できます。':'地域・エリア・キーワードを変更してお試しください。'}</p><a class="text-link" href="./">ジャンルから探す →</a></div></section>`;
 const list=`<div><div class="places">${matches.slice(0,limit).map(placeCard).join('')}</div>${matches.length>limit?`<button class="more" id="more">さらに表示（${Math.min(limit,matches.length)} / ${matches.length}）</button>`:''}</div>`;
 if(state.view==='map')html+=`<div class="map-layout">${list}<aside class="map-panel"><iframe src="${esc(mapURL(selected))}" title="${esc(selected.name)}の地図" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe><div class="map-caption"><h3>${esc(selected.name)}</h3><p>一覧の「地図で見る」で表示する場所を切り替えられます。${selected.url.includes('!1s')?'':'この店舗は元データの検索条件による候補を表示します。'}</p>${link(selected.url,'Google Mapsで開く')}</div></aside></div>`;else html+=list;return html+'</section>'}
function walks(){return `<a class="back" href="./">← Explore</a><h1 class="page-heading">Walks</h1><p class="notice">街を歩く10のルート。元のガイドの記録を引き継いでいます。現地踏査済みではないため、営業状況や通行条件は出発前にご確認ください。</p><div class="walks">${routes.map(r=>`<article class="walk"><span class="eyebrow">${esc(r.city)} / ${esc(r.area)}</span><h2>${esc(r.title)}</h2><p>${esc(r.intro)}</p><ol>${r.stops.map(name=>{const p=places.find(p=>p.city===r.city&&p.name===name);return `<li>${p?link(p.url,name):esc(name)}</li>`}).join('')}</ol><a class="text-link" href="${stateURL({page:'explore',region:r.city,area:r.area})}">このエリアを探す →</a></article>`).join('')}</div>`}
function about(){return `<a class="back" href="./">← Explore</a><div class="prose"><span class="eyebrow">STAY CURIOUS. STAY HUNGRY.</span><h1 class="page-heading">SHAKEDOWN STREET</h1><p>日本の街、食、音楽、文化、歴史、暮らし。好奇心を頼りに、自分に合うお店や場所を見つけるビジュアル・ガイドマップです。</p><p>526件の店舗・スポット、21の地域、53のジャンル。イラストを入口に、地域とエリアで絞り込み、気になる場所を保存して街へ出かけてください。</p><p>ジャンルの作品は街を楽しむためのイラストであり、個々の店舗の写真ではありません。営業時間などは既存の調査記録と出典を表示しています。新しい情報は公式サイトなどでご確認ください。</p><p>お気に入りはこのブラウザに保存されます。別の端末との同期はありません。地図を表示するとGoogle Mapsへ接続します。</p></div>`}
function render(){const isHome=!state.page&&!state.genre&&!state.q&&!state.area&&!state.cat;document.body.classList.toggle('home-page',isHome);$('#main').innerHTML=state.page==='walks'?walks():state.page==='about'?about():isHome?home():results();$('#saved-count').textContent=saved.size;document.querySelectorAll('nav a').forEach(a=>{const p=new URL(a.href).searchParams.get('page')||'';if(p===(state.page==='walks'||state.page==='about'||state.page==='saved'?state.page:''))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});document.title=(state.page==='saved'?'Saved':state.genre?GROUPS.find(g=>g.id===state.genre)?.name||genres.find(g=>g.id===state.genre.replace(/^category:/,''))?.name||'Explore':state.page==='walks'?'Walks':'Explore')+' — SHAKEDOWN STREET';}
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
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.save){const id=b.dataset.save;saved.has(id)?saved.delete(id):saved.add(id);try{localStorage.setItem('shakedown-basic-saved-v1',JSON.stringify([...saved]));toast(saved.has(id)?'お気に入りに保存しました':'保存から削除しました')}catch{toast('ブラウザへの保存に失敗しました。この画面内でのみ保持します')}if(state.page==='saved')render();else{b.setAttribute('aria-pressed',saved.has(id));b.textContent=saved.has(id)?'★':'☆';b.setAttribute('aria-label',places.find(p=>p.id===id).name+'を'+(saved.has(id)?'保存から削除':'保存'));$('#saved-count').textContent=saved.size}}else if(b.dataset.map){go({view:'map',place:b.dataset.map});$('.map-panel')?.scrollIntoView({block:'start',behavior:'smooth'})}else if(b.dataset.view){go({view:b.dataset.view});$('#results')?.scrollIntoView({block:'start'})}else if(b.dataset.clear){const k=b.dataset.clear;go(k==='filters'?{q:'',region:'',area:'',cat:''}:{[k]:'',...(k==='region'?{area:''}:{})})}else if(b.id==='more'){limit+=36;const y=scrollY;render();scrollTo(0,y)}});
window.addEventListener('popstate',()=>{state=readState(location.search);limit=36;render()});
try{[places,genres,routes]=await Promise.all(['places','genres','routes'].map(async f=>{const r=await fetch('./data/'+f+'.json');if(!r.ok)throw Error(r.status);return r.json()}));render()}catch(e){$('#main').innerHTML='<div class="error"><h1>データを読み込めませんでした</h1><p>接続を確認して、ページを再読み込みしてください。</p><button onclick="location.reload()">再読み込み</button></div>';console.error(e)}
