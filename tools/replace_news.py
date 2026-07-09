import re, sys

with open(r'C:\Users\red_w\WorkBuddy\2026-07-08-17-35-06\app.js','r',encoding='utf-8') as f:
    s = f.read()

idx = s.find('// --- NEWS ---')
if idx < 0:
    print('NOT FOUND')
    sys.exit(1)
# Find the matching closing brace for the function block at end of timeAgo
end_marker = "return (state.lang==='zh' ? dd+' 天前' : dd+'d ago');\n}"
end_idx = s.find(end_marker, idx)
if end_idx < 0:
    print('end marker NOT FOUND')
    sys.exit(1)
end_idx = end_idx + len(end_marker)
print('replacing', idx, 'to', end_idx, 'length', end_idx-idx)

new_block = '''// --- NEWS --- (live data via RSS aggregator with images + AI summary + AI ranking + voting)
function renderNews(root) {
  root.innerHTML = `
    <h2 class="section-title">${t('homeNews')}</h2>
    <p class="text-soft" style="margin-bottom:16px" id="newsStatus">${state.lang==='zh'?'AI 正在为您筛选实时新闻…':'AI is curating live news for you…'}</p>
    <div class="news-toolbar">
      <button class="chip ${state.newsTab==='all'?'active':''}" data-ntab="all">${state.lang==='zh'?'为您推荐':'For you'}</button>
      <button class="chip ${state.newsTab==='latest'?'active':''}" data-ntab="latest">${state.lang==='zh'?'最新':'Latest'}</button>
      <button class="chip ${state.newsTab==='top'?'active':''}" data-ntab="top">${state.lang==='zh'?'热门':'Top'}</button>
    </div>
    <div class="auto-grid news-grid" id="newsGrid">
      ${[1,2,3,4,5].map(() => `<div class="card news-card"><div class="news-img" style="background:linear-gradient(135deg,var(--primary),var(--cta))"></div><div class="news-title">…</div><div class="news-sum">${state.lang==='zh'?'加载中':'loading'}</div></div>`).join('')}
    </div>`;
  (async () => {
    const grid = document.getElementById('newsGrid');
    const status = document.getElementById('newsStatus');
    if (!grid) return;
    const items = await window.LiveData.fetchDailyDigest();
    if (!items.length) {
      if (status) status.textContent = state.lang==='zh'?'暂时无法获取新闻':'News unavailable right now';
      grid.innerHTML = '<div class="card" style="grid-column:1/-1;text-align:center;color:var(--muted-app);padding:40px">'+ (state.lang==='zh'?'请检查网络连接后刷新':'Check your network and try again') +'</div>';
      return;
    }
    // Apply AI ranking
    const tab = state.newsTab || 'all';
    let ranked = rankArticles(items);
    if (tab === 'latest') {
      ranked = [...items].sort((a,b) => new Date(b.pubDate) - new Date(a.pubDate));
    } else if (tab === 'top') {
      ranked = [...items].sort((a,b) => {
        const va = newsVoting[a.id] || {up:0,down:0};
        const vb = newsVoting[b.id] || {up:0,down:0};
        return (vb.up - vb.down) - (va.up - va.down);
      });
    }
    if (status) {
      const t2 = new Date().toLocaleTimeString(state.lang==='zh'?'zh-CN':'en-US',{hour:'2-digit',minute:'2-digit'});
      const tip = tab === 'all' ? (state.lang==='zh' ? 'AI 智能排序' : 'AI ranked') : '';
      status.innerHTML = state.lang==='zh'
        ? `实时新闻 · ${ranked.length} 篇 · ${tip} · 更新于 ${t2}`
        : `Live news · ${ranked.length} articles · ${tip} · updated ${t2}`;
    }
    ranked.forEach(n => markNewsSeen(n.id));
    grid.innerHTML = ranked.map(n => {
      const v = n._votes || {up:0,down:0,voted:0};
      const upActive = v.voted === 1 ? 'voted' : '';
      const downActive = v.voted === -1 ? 'voted' : '';
      const aiPick = n._score > 1.0 ? '<span class="news-ai-badge">AI</span>' : '';
      return `
      <div class="card news-card" data-news-id="${n.id}" data-topic="${n.topic}" data-full-summary="${escapeAttr(n.summary||'')}">
        <div class="news-img-wrap">
          <img class="news-img" src="${n.image}" alt="" loading="lazy" onerror="this.style.display='none'">
          <span class="news-topic">${escapeHtml(n.topicLabel)}</span>
          ${aiPick}
        </div>
        <div class="news-body">
          <div class="news-title">${escapeHtml(n.title)}</div>
          <div class="news-ai"><span class="ai-tag">AI</span> ${escapeHtml(n.aiSummary || n.summary || '')}</div>
          <div class="news-meta">
            <span class="src">${escapeHtml(n.src)} · ${escapeHtml(timeAgo(n.pubDate))}</span>
          </div>
          <div class="news-actions">
            <button class="vote-btn up ${upActive}" data-vote="up" data-nid="${n.id}" data-topic="${n.topic}" title="${state.lang==='zh'?'喜欢':'Like'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 11v9M4 11l3-8c.4-1 1-1 1.5-1s1.1 0 1.5 1l3 8M20 11v8a1 1 0 01-1 1h-5l-1-4v-5a1 1 0 011-1h4a2 2 0 011.7 1l1.3 1.5"/></svg>
              <span>${v.up||0}</span>
            </button>
            <button class="vote-btn down ${downActive}" data-vote="down" data-nid="${n.id}" data-topic="${n.topic}" title="${state.lang==='zh'?'不喜欢':'Dislike'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 13V4M20 13l-3 8c-.4 1-1 1-1.5 1s-1.1 0-1.5-1l-3-8M4 13V5a1 1 0 011-1h5l1 4v5a1 1 0 01-1 1H6a2 2 0 01-1.7-1L3 11.5"/></svg>
              <span>${v.down||0}</span>
            </button>
            <button class="read-btn" data-title="${escapeAttr(n.title)}" data-sum="${escapeAttr(n.aiSummary||n.summary||'')}">${ICON.vol}<span>${state.lang==='zh'?'朗读':'Read'}</span></button>
            <button class="deepdive-btn" data-nid="${n.id}" data-ntitle="${escapeAttr(n.title)}" data-ai="${escapeAttr(n.aiSummary||'')}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 7h7l-5.5 4 2 8L12 17l-6.5 4 2-8L2 9h7z"/></svg>
              <span>${state.lang==='zh'?'深入':'Dive in'}</span>
            </button>
          </div>
        </div>
      </div>
    `}).join('');
    grid.querySelectorAll('.vote-btn').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      voteNews(+b.dataset.nid, b.dataset.topic, b.dataset.vote === 'up' ? 1 : -1);
    });
    grid.querySelectorAll('[data-title]').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      speak(b.dataset.title+'. '+b.dataset.sum);
      const orig = b.innerHTML;
      b.innerHTML = `${ICON.stop}<span>${state.lang==='zh'?'停止':'Stop'}</span>`;
      setTimeout(() => { b.innerHTML = orig; }, 6000);
    });
    grid.querySelectorAll('.deepdive-btn').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      openNewsDetail(+b.dataset.nid, b.dataset.ntitle, b.dataset.ai);
    });
    grid.querySelectorAll('.news-card').forEach(c => c.onclick = () => {
      const title = c.querySelector('.news-title').textContent;
      const ai = c.querySelector('.news-ai').textContent.replace(/^AI\\s*/,'');
      openNewsDetail(+c.dataset.newsId, title, ai);
    });
    root.querySelectorAll('[data-ntab]').forEach(b => b.onclick = () => {
      state.newsTab = b.dataset.ntab;
      render();
    });
  })();
}
function escapeAttr(s) { return String(s).replace(/"/g,'&quot;'); }
function timeAgo(pub) {
  if (!pub) return '';
  const d = new Date(pub);
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return state.lang==='zh'?'刚刚':'just now';
  if (m < 60) return (state.lang==='zh' ? m+' 分钟前' : m+'m ago');
  const h = Math.floor(m/60);
  if (h < 24) return (state.lang==='zh' ? h+' 小时前' : h+'h ago');
  const dd = Math.floor(h/24);
  return (state.lang==='zh' ? dd+' 天前' : dd+'d ago');
}
function openNewsDetail(id, title, aiSummary) {
  markNewsSeen(id);
  const mask = document.getElementById('dialogMask');
  const dlg = document.getElementById('dialog');
  dlg.innerHTML = `
    <div class="news-detail">
      <h3>${escapeHtml(title)}</h3>
      <div class="news-detail-ai">
        <span class="ai-tag">AI</span> ${escapeHtml(aiSummary || '...')}
      </div>
      <div class="news-detail-actions">
        <button class="big-btn secondary" id="ndChat" style="font-size:1rem;padding:12px 16px">${ICON.ai}<span>${state.lang==='zh'?'用 AI 深入探讨':'Dive deeper with AI'}</span></button>
        <button class="big-btn ghost" id="ndClose" style="font-size:1rem;padding:12px 16px">${state.lang==='zh'?'关闭':'Close'}</button>
      </div>
      <div id="ndChatArea" class="nd-chat-area" style="display:none"></div>
    </div>`;
  dlg.classList.add('news-detail-dialog');
  mask.classList.add('open');
  document.getElementById('ndClose').onclick = () => mask.classList.remove('open');
  document.getElementById('ndChat').onclick = () => {
    const area = document.getElementById('ndChatArea');
    area.style.display = 'block';
    area.innerHTML = `
      <div class="nd-bubble ai">${state.lang==='zh'?'要深入了解这篇文章，您想从哪个角度入手？':'To dive deeper, which angle interests you?'}</div>
      <div class="nd-quick-row">
        <button class="chip" data-angle="why">${state.lang==='zh'?'为什么这件事重要？':'Why does this matter?'}</button>
        <button class="chip" data-angle="context">${state.lang==='zh'?'背景是什么？':'What is the context?'}</button>
        <button class="chip" data-angle="next">${state.lang==='zh'?'接下来会怎样？':'What happens next?'}</button>
        <button class="chip" data-angle="me">${state.lang==='zh'?'对我有什么影响？':'How does this affect me?'}</button>
      </div>
    `;
    area.querySelectorAll('[data-angle]').forEach(b => b.onclick = () => {
      const reply = diveDeeper(title, aiSummary, b.dataset.angle);
      const div = document.createElement('div');
      div.className = 'nd-bubble user';
      div.textContent = b.textContent;
      area.insertBefore(div, area.querySelector('.nd-quick-row'));
      setTimeout(() => {
        const r = document.createElement('div');
        r.className = 'nd-bubble ai';
        r.textContent = reply;
        area.insertBefore(r, area.querySelector('.nd-quick-row'));
        area.scrollTop = area.scrollHeight;
        speak(reply);
      }, 400);
    });
  };
}
function diveDeeper(title, summary, angle) {
  const isZh = state.lang === 'zh';
  const prompts = {
    why:     isZh ? `关于《${title}》，这件事之所以重要，是因为它直接影响到您的日常生活。建议您留意后续的政策细节和本地实施细则。` :
                  `Why "${title}" matters: this directly affects daily life. Watch for follow-up policy details and local implementation.`,
    context: isZh ? `背景速览：${summary} 您可以在新闻原文链接中查看更详细的历史脉络。` :
                  `Background: ${summary} Visit the original article for fuller history.`,
    next:    isZh ? `接下来一周左右，预计会有跟进报道。AI 会继续为您筛选。` :
                  `In the next week, expect follow-up coverage. The AI will keep filtering.`,
    me:      isZh ? `对您个人的影响：如果这条新闻和您的城市/行业相关，建议您留意社区通知或行业群消息。` :
                  `Personal impact: if this is related to your city or industry, watch for community notices.`,
  };
  return prompts[angle] || summary;
}'''

s = s[:idx] + new_block + s[end_idx:]
with open(r'C:\Users\red_w\WorkBuddy\2026-07-08-17-35-06\app.js','w',encoding='utf-8') as f:
    f.write(s)
print('REPLACED')
