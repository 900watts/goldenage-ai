import re

with open(r'C:\Users\red_w\WorkBuddy\2026-07-08-17-35-06\app.js','r',encoding='utf-8') as f:
    s = f.read()

# Find the renderMap function block
pattern = re.compile(r'// --- MAP ---\nfunction renderMap\(root\) \{.*?root\.querySelectorAll\(\'\[data-f\]\'\)\.forEach\(b => b\.onclick = \(\) => \{ renderMap\._filter = b\.dataset\.f; render\(\); \}\);\n\}', re.DOTALL)
m = pattern.search(s)
if not m:
    print('PATTERN NOT FOUND')
    # Try simpler
    print('search for renderMap:')
    idx = s.find('// --- MAP ---')
    if idx >= 0:
        print('found at', idx)
        print('snippet around:')
        print(repr(s[idx:idx+200]))
else:
    new_block = '''// --- MAP --- (live data via OpenStreetMap Nominatim + Overpass API)
function renderMap(root) {
  const filter = renderMap._filter || 'hospital';
  root.innerHTML = `
    <h2 class="section-title">${t('mapTitle')}</h2>
    <div class="chip-row">
      <button class="chip ${filter==='hospital'?'active':''}" data-f="hospital">${ICON.hosp}${t('mapHosp')}</button>
      <button class="chip ${filter==='pharmacy'?'active':''}" data-f="pharmacy">${ICON.phar}${t('mapPhar')}</button>
      <button class="chip ${filter==='park'?'active':''}" data-f="park">${ICON.park}${t('mapPark')}</button>
      <button class="chip ${filter==='supermarket'?'active':''}" data-f="supermarket">${ICON.cart}${t('mapSup')}</button>
    </div>
    <div class="pc-split">
      <div>
        <div class="map-box">
          <div class="label" id="mapStatus">${t('mapLocating')}</div>
          <div class="map-pin"></div>
        </div>
      </div>
      <div class="poi-list" id="poiList">
        ${[1,2,3].map(() => '<div class="card-label card"><div class="card-icon" style="background:var(--muted-app)"></div><div class="card-text"><div class="card-title">'+t('mapLocating')+'</div></div></div>').join('')}
      </div>
    </div>`;
  root.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { renderMap._filter = b.dataset.f; render(); });
  // Live fetch
  (async () => {
    const list = document.getElementById('poiList');
    const status = document.getElementById('mapStatus');
    if (!list) return;
    if (status) status.textContent = state.lang==='zh'?'正在获取附近数据…':'Fetching nearby…';
    const items = await window.LiveData.fetchPOIs(renderMap._filter || 'hospital');
    if (!items || !items.length) {
      list.innerHTML = '<div class="card" style="text-align:center;color:var(--muted-app);padding:30px">'+ (state.lang==='zh'?'请检查网络后重试':'Check network and retry') +'</div>';
      if (status) status.textContent = state.lang==='zh'?'暂时无法获取':'Unavailable';
      return;
    }
    if (status) status.textContent = state.lang==='zh' ? items.length+' 个' : items.length+' nearby';
    list.innerHTML = items.map(p => `
      <div class="card-label card">
        <div class="card-icon" style="background:linear-gradient(135deg,var(--primary),var(--primary-dark))">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <div class="card-text">
          <div class="card-title">${escapeHtml(p.name[state.lang] || p.name.zh || p.name.en || 'POI')}</div>
          <div class="card-sub">${escapeHtml(p.addr[state.lang] || p.addr.zh || '')} · ${(p.dist/1000).toFixed(1)} km</div>
        </div>
      </div>
    `).join('');
  })();
}'''
    s = s[:m.start()] + new_block + s[m.end():]
    with open(r'C:\Users\red_w\WorkBuddy\2026-07-08-17-35-06\app.js','w',encoding='utf-8') as f:
        f.write(s)
    print('REPLACED')
