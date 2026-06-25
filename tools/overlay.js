/* myAnalyst click-to-comment overlay (injected only by the local edit server) */
(function () {
  'use strict';
  if (window.__maeLoaded) return;
  window.__maeLoaded = true;

  // ---------------------------------------------------------------- state
  let mode = false;            // comment mode on/off
  let comments = [];           // loaded from server
  let pending = null;          // locator being commented on (popover open)

  // map current pathname -> source html file
  function currentPage() {
    let p = location.pathname;
    if (p === '/' || p === '') return 'index.html';
    p = p.replace(/^\//, '');
    if (p.endsWith('/')) p += 'index.html';
    if (!/\.[a-z0-9]+$/i.test(p)) p += '.html';
    return p;
  }
  const PAGE = currentPage();

  // ------------------------------------------------------------ utilities
  function el(tag, props, kids) {
    const n = document.createElement(tag);
    if (props) for (const k in props) {
      if (k === 'class') n.className = props[k];
      else if (k === 'text') n.textContent = props[k];
      else if (k === 'html') n.innerHTML = props[k];
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), props[k]);
      else n.setAttribute(k, props[k]);
    }
    (kids || []).forEach((c) => n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return n;
  }
  function isOurs(node) { return node && node.closest && node.closest('#mae-root'); }

  // Build a reasonably stable CSS selector path to an element.
  function cssPath(node) {
    if (!node || node.nodeType !== 1) return '';
    if (node.id) return '#' + CSS.escape(node.id);
    const parts = [];
    let cur = node;
    while (cur && cur.nodeType === 1 && cur !== document.body && parts.length < 6) {
      let part = cur.tagName.toLowerCase();
      if (cur.id) { parts.unshift('#' + CSS.escape(cur.id)); break; }
      const cls = Array.from(cur.classList).filter((c) => !c.startsWith('mae-')).slice(0, 2);
      if (cls.length) part += '.' + cls.map((c) => CSS.escape(c)).join('.');
      let i = 1, sib = cur;
      while ((sib = sib.previousElementSibling)) if (sib.tagName === cur.tagName) i++;
      part += ':nth-of-type(' + i + ')';
      parts.unshift(part);
      cur = cur.parentElement;
    }
    return parts.join(' > ');
  }

  // Capture everything Claude Code needs to find this exact spot in source.
  function locate(node) {
    const text = (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 200);
    const attrs = {};
    ['href', 'src', 'alt', 'aria-label', 'title', 'placeholder', 'value', 'data-year', 'name'].forEach((a) => {
      if (node.hasAttribute && node.hasAttribute(a)) attrs[a] = node.getAttribute(a);
    });
    let heading = '';
    let p = node;
    while (p && p !== document.body) {
      const h = p.querySelector && p.querySelector('h1,h2,h3');
      if (h && h.innerText) { heading = h.innerText.replace(/\s+/g, ' ').trim().slice(0, 120); break; }
      p = p.parentElement;
    }
    const r = node.getBoundingClientRect();
    return {
      page: PAGE,
      url: location.pathname,
      selector: cssPath(node),
      tag: node.tagName.toLowerCase(),
      elemId: node.id || '',
      classes: Array.from(node.classList).filter((c) => !c.startsWith('mae-')).join(' '),
      text: text,
      attrs: attrs,
      outerHTML: (node.outerHTML || '').replace(/\s+/g, ' ').slice(0, 600),
      nearbyHeading: heading,
      rect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
      viewport: { w: innerWidth, h: innerHeight },
    };
  }

  function findNode(c) {
    if (!c.selector) return null;
    try { return document.querySelector(c.selector); } catch { return null; }
  }

  // ------------------------------------------------------------------ API
  async function load() {
    try { comments = await (await fetch('/__edit/comments')).json(); }
    catch { comments = []; }
    render();
  }
  async function save(loc, txt) {
    const item = Object.assign({}, loc, { comment: txt });
    const res = await fetch('/__edit/comments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item),
    });
    const saved = await res.json();
    comments.push(saved);
    render();
  }
  async function patch(id, changes) {
    await fetch('/__edit/comments', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ id }, changes)),
    });
    const c = comments.find((x) => x.id === id);
    if (c) Object.assign(c, changes);
    render();
  }
  async function remove(id) {
    await fetch('/__edit/comments?id=' + encodeURIComponent(id), { method: 'DELETE' });
    comments = comments.filter((x) => x.id !== id);
    render();
  }

  // --------------------------------------------------------------- DOM refs
  const root = el('div', { id: 'mae-root' });
  const hi = el('div', { id: 'mae-highlight' });
  const tip = el('div', { id: 'mae-tip' });
  const pinLayer = el('div', { id: 'mae-pins' });
  root.appendChild(hi); root.appendChild(tip); root.appendChild(pinLayer);

  const bar = el('div', { id: 'mae-bar' });
  const toggleBtn = el('button', { id: 'mae-toggle', class: 'mae-btn', onclick: () => setMode(!mode) });
  const countPill = el('span', { id: 'mae-count', class: 'mae-pill' });
  const panelBtn = el('button', { class: 'mae-btn mae-ghost', text: 'List', onclick: () => togglePanel() });
  const copyBtn = el('button', { class: 'mae-btn mae-ghost', text: 'Copy for Claude', onclick: copyForClaude });
  bar.appendChild(toggleBtn); bar.appendChild(countPill); bar.appendChild(panelBtn); bar.appendChild(copyBtn);
  root.appendChild(bar);

  const panel = el('div', { id: 'mae-panel', class: 'mae-hidden' });
  root.appendChild(panel);

  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(root));
  if (document.body) document.body.appendChild(root);

  // --------------------------------------------------------------- mode
  function setMode(on) {
    mode = on;
    document.documentElement.classList.toggle('mae-active', on);
    toggleBtn.textContent = on ? '● Commenting — click an element' : '✎ Comment mode';
    toggleBtn.classList.toggle('mae-on', on);
    if (!on) { hi.style.display = 'none'; tip.style.display = 'none'; }
  }

  // hover highlight
  document.addEventListener('mousemove', (e) => {
    if (!mode || pending) return;
    const t = e.target;
    if (isOurs(t)) { hi.style.display = 'none'; tip.style.display = 'none'; return; }
    const r = t.getBoundingClientRect();
    hi.style.display = 'block';
    hi.style.left = r.left + 'px'; hi.style.top = r.top + 'px';
    hi.style.width = r.width + 'px'; hi.style.height = r.height + 'px';
    tip.style.display = 'block';
    tip.textContent = t.tagName.toLowerCase() + (t.id ? '#' + t.id : '') +
      (t.className && typeof t.className === 'string' ? '.' + t.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '');
    tip.style.left = Math.min(r.left, innerWidth - 240) + 'px';
    tip.style.top = Math.max(0, r.top - 22) + 'px';
  }, true);

  // click to comment
  document.addEventListener('click', (e) => {
    if (!mode || pending) return;
    if (isOurs(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    openPopover(e.target, e.clientX, e.clientY);
  }, true);

  // ESC closes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closePopover(); if (mode) setMode(false); }
    if (e.key.toLowerCase() === 'c' && (e.metaKey || e.ctrlKey) && e.shiftKey) { e.preventDefault(); setMode(!mode); }
  });

  // ----------------------------------------------------------- popover
  let pop = null;
  function openPopover(node, x, y) {
    closePopover();
    pending = locate(node);
    hi.style.display = 'block';
    const r = node.getBoundingClientRect();
    hi.style.left = r.left + 'px'; hi.style.top = r.top + 'px';
    hi.style.width = r.width + 'px'; hi.style.height = r.height + 'px';
    tip.style.display = 'none';

    const ta = el('textarea', { id: 'mae-input', placeholder: 'What should change here? (e.g. "make this headline shorter and bold")' });
    const meta = el('div', { class: 'mae-pop-meta', text: pending.tag + (pending.classes ? '.' + pending.classes.split(' ')[0] : '') + (pending.text ? ' — “' + pending.text.slice(0, 48) + '”' : '') });
    const saveB = el('button', { class: 'mae-btn', text: 'Save comment', onclick: () => commit(ta.value) });
    const cancelB = el('button', { class: 'mae-btn mae-ghost', text: 'Cancel', onclick: closePopover });
    pop = el('div', { id: 'mae-pop' }, [meta, ta, el('div', { class: 'mae-pop-actions' }, [saveB, cancelB])]);
    root.appendChild(pop);
    const px = Math.min(x, innerWidth - 340), py = Math.min(y, innerHeight - 200);
    pop.style.left = Math.max(8, px) + 'px';
    pop.style.top = Math.max(8, py) + 'px';
    ta.focus();
    ta.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) commit(ta.value);
    });
  }
  function commit(txt) {
    txt = (txt || '').trim();
    if (!txt) { closePopover(); return; }
    save(pending, txt);
    closePopover();
  }
  function closePopover() {
    if (pop) { pop.remove(); pop = null; }
    pending = null;
    if (!mode) hi.style.display = 'none';
  }

  // ------------------------------------------------------------- pins
  function pageComments() { return comments.filter((c) => c.page === PAGE); }
  function relocate() {
    pinLayer.querySelectorAll('.mae-pin').forEach((pin) => {
      const c = comments.find((x) => x.id === pin.dataset.id);
      const node = c && findNode(c);
      if (!node) { pin.style.display = 'none'; return; }
      const r = node.getBoundingClientRect();
      pin.style.display = 'flex';
      pin.style.left = (r.left + r.width - 10) + 'px';
      pin.style.top = (r.top - 10) + 'px';
    });
  }
  function renderPins() {
    pinLayer.innerHTML = '';
    pageComments().forEach((c, i) => {
      const pin = el('div', {
        class: 'mae-pin' + (c.status === 'applied' ? ' mae-done' : ''),
        'data-id': c.id, text: c.status === 'applied' ? '✓' : String(i + 1),
        title: c.comment,
        onclick: () => { showPanel(); highlightRow(c.id); },
      });
      pinLayer.appendChild(pin);
    });
    relocate();
  }
  addEventListener('scroll', () => requestAnimationFrame(relocate), true);
  addEventListener('resize', () => requestAnimationFrame(relocate));

  // ------------------------------------------------------------- panel
  let panelOpen = false;
  function togglePanel() { panelOpen ? hidePanel() : showPanel(); }
  function showPanel() { panelOpen = true; panel.classList.remove('mae-hidden'); render(); }
  function hidePanel() { panelOpen = false; panel.classList.add('mae-hidden'); }
  function highlightRow(id) {
    const row = panel.querySelector('[data-row="' + id + '"]');
    if (row) { row.scrollIntoView({ block: 'center' }); row.classList.add('mae-flash'); setTimeout(() => row.classList.remove('mae-flash'), 1200); }
  }

  function renderPanel() {
    panel.innerHTML = '';
    const head = el('div', { class: 'mae-panel-head' }, [
      el('strong', { text: 'Edit requests · ' + PAGE }),
      el('button', { class: 'mae-x', text: '✕', onclick: hidePanel }),
    ]);
    panel.appendChild(head);

    const list = pageComments();
    if (!list.length) {
      panel.appendChild(el('div', { class: 'mae-empty', text: 'No comments on this page yet. Turn on Comment mode and click an element.' }));
    }
    list.forEach((c, i) => {
      const row = el('div', { class: 'mae-row' + (c.status === 'applied' ? ' mae-row-done' : ''), 'data-row': c.id });
      const num = el('span', { class: 'mae-rownum', text: c.status === 'applied' ? '✓' : String(i + 1) });
      const body = el('div', { class: 'mae-rowbody' }, [
        el('div', { class: 'mae-rowsel', text: c.tag + (c.classes ? '.' + c.classes.split(' ')[0] : '') + (c.text ? ' · ' + c.text.slice(0, 40) : '') }),
        el('div', { class: 'mae-rowtext', text: c.comment }),
      ]);
      const del = el('button', { class: 'mae-x', text: '🗑', title: 'Delete', onclick: () => remove(c.id) });
      row.appendChild(num); row.appendChild(body); row.appendChild(del);
      row.addEventListener('mouseenter', () => { const n = findNode(c); if (n) { const r = n.getBoundingClientRect(); hi.style.display = 'block'; hi.style.left = r.left + 'px'; hi.style.top = r.top + 'px'; hi.style.width = r.width + 'px'; hi.style.height = r.height + 'px'; } });
      row.addEventListener('mouseleave', () => { if (!mode && !pending) hi.style.display = 'none'; });
      panel.appendChild(row);
    });
  }

  // ----------------------------------------------------- copy for Claude
  function copyForClaude() {
    const open = comments.filter((c) => c.status !== 'applied');
    if (!open.length) { flash(copyBtn, 'Nothing to copy'); return; }
    const byPage = {};
    open.forEach((c) => { (byPage[c.page] = byPage[c.page] || []).push(c); });
    let md = 'Process these site edit requests. For each one, find the element in the source HTML using the selector/text/attributes, make the change, then mark it applied in tools/comments.json.\n\n';
    Object.keys(byPage).forEach((pg) => {
      md += '## ' + pg + '\n\n';
      byPage[pg].forEach((c, i) => {
        md += (i + 1) + '. **' + c.comment + '**\n';
        md += '   - id: `' + c.id + '`\n';
        md += '   - selector: `' + c.selector + '`\n';
        if (c.text) md += '   - text: "' + c.text.slice(0, 100) + '"\n';
        if (c.attrs && Object.keys(c.attrs).length) md += '   - attrs: `' + JSON.stringify(c.attrs) + '`\n';
        if (c.nearbyHeading) md += '   - section: "' + c.nearbyHeading + '"\n';
        md += '\n';
      });
    });
    navigator.clipboard.writeText(md).then(() => flash(copyBtn, 'Copied ✓'), () => flash(copyBtn, 'Copy failed'));
  }
  function flash(btn, msg) { const t = btn.textContent; btn.textContent = msg; setTimeout(() => (btn.textContent = t), 1400); }

  // --------------------------------------------------------------- render
  function render() {
    const open = comments.filter((c) => c.status !== 'applied').length;
    countPill.textContent = open + (open === 1 ? ' note' : ' notes');
    countPill.classList.toggle('mae-hidden', comments.length === 0);
    renderPins();
    if (panelOpen) renderPanel();
  }

  // ------------------------------------------------------------ live reload
  try {
    const es = new EventSource('/__edit/events');
    es.addEventListener('reload', () => location.reload());
  } catch {}

  setMode(false);
  load();
})();
