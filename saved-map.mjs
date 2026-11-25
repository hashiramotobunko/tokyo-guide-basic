let resources;
let region = '', selectedId = '', origin = null;
function loadResources() {
  if (!resources) {
    const script = new Promise((resolve, reject) => {
      if (window.L) return resolve();
      const el = document.createElement('script');
      el.src = './assets/leaflet/guide-leaflet.js';
      el.onload = resolve;
      el.onerror = reject;
      document.head.append(el);
    });
    resources = Promise.all([script, fetch('./data/map-points.json').then(r => {
      if (!r.ok) throw Error(r.status);
      return r.json();
    })]).catch(error => { resources = null; throw error; });
  }
  return resources;
}
export const savedMapSection = () => `<section class="saved-map-tool"><h2>Find places to save</h2>
<p>Choose a region or use your location. Select a map pin or a place below, then tap the star. Saved places are available in My Routes.</p>
<label>Region <select class="picker-region"></select></label>
<button type="button" class="picker-gps">Use my location</button>
<div class="picker-map" aria-label="Map of guide places"></div>
<p class="picker-status" role="status"></p>
<label>Place <select class="picker-place"></select></label>
<div class="picker-detail"></div></section>`;
export async function attachSavedMap(places, saved, displayName) {
  const panel = document.querySelector('.saved-map-tool');
  if (!panel) return;
  const get = s => panel.querySelector('.picker-' + s);
  const options = get('region'), list = get('place'), status = get('status');
  options.add(new Option('All regions', ''));
  for (const r of [...new Set(places.map(p => p.city))].sort()) options.add(new Option(r,r));
  options.value = region;
  let points = {}, map, markers, current, request = 0;
  const distance = coords => window.L.latLng(origin).distanceTo(coords);
  const label = p => displayName(p) + ' · ' + p.area;
  function choose(p, zoom) {
    selectedId = p?.id || '';
    list.value = selectedId;
    const detail = get('detail');
    detail.replaceChildren();
    if (!p) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.save = p.id;
    button.textContent = saved.has(p.id) ? '★ Saved · Remove' : '☆ Save place';
    button.setAttribute('aria-pressed', String(saved.has(p.id)));
    const title = document.createElement('strong');
    title.textContent = displayName(p);
    const link = document.createElement('a');
    link.href = p.url;
    link.textContent = 'Google Maps ↗';
    link.target = '_blank'; link.rel = 'noopener';
    detail.append(title,button,link);
    current?.remove(); current = null;
    if (map && points[p.id]) {
      current = L.circleMarker(points[p.id], {radius:9,color:'#111',fillColor:'#ffad55',fillOpacity:1}).addTo(map);
      current.bindTooltip(document.createTextNode(displayName(p))).openTooltip();
      if (zoom) map.setView(points[p.id],15);
    }
  }
  function draw() {
    const rows = places.filter(p => !region || p.city === region);
    if (origin && map) rows.sort((a,b) => (points[a.id] ? distance(points[a.id]) : Infinity) - (points[b.id] ? distance(points[b.id]) : Infinity));
    else rows.sort((a,b) => label(a).localeCompare(label(b)));
    list.replaceChildren(new Option('Select a place',''));
    markers?.clearLayers();
    const bounds = [];
    for (const p of rows) {
      const xy = points[p.id];
      list.add(new Option(label(p) + (xy && origin ? ' · ' + (distance(xy)/1000).toFixed(1) + ' km' : ''),p.id));
      if (!map || !xy) continue;
      bounds.push(xy);
      L.circleMarker(xy,{radius:6,color:'#fff',weight:1,fillColor:'#9e3d23',fillOpacity:.9}).addTo(markers).on('click',()=>choose(p,false));
    }
    if (map && origin) {
      L.circleMarker(origin,{radius:8,color:'#fff',fillColor:'#1967be',fillOpacity:1}).addTo(markers).bindTooltip('Your location');
      map.setView(origin,13);
    } else if (bounds.length) map.fitBounds(bounds,{padding:[16,16],maxZoom:14});
    choose(rows.find(p=>p.id===selectedId),false);
    status.textContent = map ? rows.length+' places · '+bounds.length+' approximate map pins'+(origin?' · nearest first':'') : 'Choose a place from the list.';
  }
  options.onchange = () => {request++; region=options.value; origin=null; selectedId=''; draw();};
  list.onchange = () => choose(places.find(p=>p.id===list.value),true);
  get('gps').disabled = true;
  draw();
  try {
    [,points] = await loadResources();
    if (!panel.isConnected) return;
    map=L.map(get('map'),{scrollWheelZoom:false}).setView([36,138],5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(map);
    markers=L.layerGroup().addTo(map);
    draw();
    get('gps').disabled=false;
    get('gps').onclick = () => {
      if (!navigator.geolocation) {status.textContent='Location unavailable. Choose a region.';return;}
      const attempt=++request;
      status.textContent='Finding your location…';
      navigator.geolocation.getCurrentPosition(pos=>{
        if (!panel.isConnected || request!==attempt) return;
        origin=[pos.coords.latitude,pos.coords.longitude];region='';options.value='';selectedId='';draw();
      },()=>{if(panel.isConnected && request===attempt)status.textContent='Location unavailable. Select a region to browse places.';},{timeout:12000,maximumAge:60000});
    };
  } catch {status.textContent='Map unavailable. Use the region and place lists to save a place.';}
}
