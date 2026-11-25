import { mapURL } from './core.mjs?v=regional-order';

const regionViews = {"Tokyo":[35.685,139.735,12],"Aichi":[35.1,137,9],"Okinawa":[26.45,127.85,9],"Chiba":[35.6,140.1,9],"Fukuoka":[33.58,130.42,10],"Hokkaido":[43.3,142.4,7],"Hyogo":[34.73,135.23,10],"Ibaraki":[36.1,140.15,8],"Iwate":[39.3,141.5,8],"Kanagawa":[35.43,139.5,10],"Kumamoto":[32.8,130.71,10],"Kyoto":[35.01,135.76,11],"Mie":[34.49,136.71,9],"Miyazaki":[31.91,131.42,10],"Nagano":[36.43,137.99,8],"Nagasaki":[33.02,129.78,9],"Osaka":[34.68,135.5,11],"Tochigi":[36.65,139.82,8],"Toyama":[36.69,137.21,10],"Yamanashi":[35.61,138.65,9],"Yokohama":[35.45,139.63,12]};

let region = '', selectedId = new URLSearchParams(location.search).get('place') || '';
export const savedMapSection = () => `<section class="saved-map-tool"><h2>Find places on Google Maps</h2>
<p>Tap a guide pin to see the place name. Follow “Save or add to route” to open that place in Saved. You can also choose a place below.</p>
<label>Region <select class="picker-region"></select></label>
<label>Place <select class="picker-place"></select></label>
<button type="button" class="picker-gps">Show my location</button>
<div class="picker-map"></div><p role="status" class="picker-status"></p>
<div class="picker-detail"></div></section>`;

export function attachSavedMap(places, saved, displayName) {
  const panel = document.querySelector('.saved-map-tool');
  if (!panel) return;
  const get = key => panel.querySelector('.picker-' + key);
  const regions = get('region'), list = get('place'), detail = get('detail'), status = get('status');
  const frame = document.createElement('iframe');
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.allowFullscreen = true;
  get('map').append(frame);
  let request = 0;
  function showMap(src, title) {
    frame.title = title;
    frame.src = src;
  }
  function showPlace() {
    request++;
    detail.replaceChildren();
    selectedId = list.value;
    const p = places.find(place => place.id === selectedId);
    if (!p) {
      const view = regionViews[region];
      const camera = view ? `&ll=${view[0]},${view[1]}&z=${view[2]}` : '';
      showMap('https://www.google.com/maps/d/embed?mid=1OiqXdSmKEXvIjmeYprKMvLYoLpPwodA' + camera, 'SHAKEDOWN STREET guide places');
      status.textContent = 'Tap a pin to explore the guide.';
      return;
    }
    showMap(mapURL(p), 'Google Maps: ' + displayName(p));
    const title = document.createElement('strong');
    title.textContent = [...new Set([displayName(p),p.name])].join(' · ') + ' — ' + p.area;
    const link = document.createElement('a');
    link.href = p.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Open in Google Maps to save ↗';
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.save = p.id;
    button.setAttribute('aria-pressed', String(saved.has(p.id)));
    button.textContent = saved.has(p.id) ? '★ Saved to My Routes' : '☆ Save for My Routes';
    const route = document.createElement('button');
    route.type='button';
    route.dataset.pickStop=p.id;
    route.textContent='+ Add to route';
    detail.append(title,link,button,route);
    status.textContent = p.url.includes('!1s') ? '' : 'Google Maps search result. Check the place name and address before saving.';
  }
  function fillPlaces() {
    const rows = places.filter(p => !region || p.city === region)
      .sort((a,b)=>displayName(a).localeCompare(displayName(b)));
    list.replaceChildren(new Option('Select a place',''));
    for (const p of rows) list.add(new Option(displayName(p)+' · '+p.area,p.id));
    list.value = rows.some(p=>p.id===selectedId) ? selectedId : '';
    showPlace();
  }
  regions.add(new Option('All regions',''));
  for (const r of [...new Set(places.map(p=>p.city))].sort()) regions.add(new Option(r,r));
  regions.value = region;
  regions.onchange = () => { region = regions.value; selectedId = ''; fillPlaces(); };
  list.onchange = showPlace;
  get('gps').onclick = () => {
    const attempt = ++request;
    if (!navigator.geolocation) { status.textContent = 'Location unavailable. Choose a region.'; return; }
    status.textContent = 'Finding your location…';
    navigator.geolocation.getCurrentPosition(pos=>{
      if (!panel.isConnected || attempt !== request) return;
      selectedId = list.value = ''; detail.replaceChildren();
      const point = pos.coords.latitude + ',' + pos.coords.longitude;
      showMap('https://www.google.com/maps/d/embed?mid=1OiqXdSmKEXvIjmeYprKMvLYoLpPwodA&z=15&ll='+encodeURIComponent(point),'Google Maps around your location');
      status.textContent = 'Explore Google Maps around you, or select a guide place above.';
    },()=>{if(panel.isConnected && request===attempt)status.textContent='Location unavailable. Choose a region and a place.';},{timeout:12000,maximumAge:60000});
  };
  fillPlaces();
}
