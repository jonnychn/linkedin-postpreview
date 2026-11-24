(function(){
'use strict';
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const LS_STATE = 'lpp.state.v1', LS_PROFILES = 'lpp.profiles.v1';

const SAMPLE_TEXT = '"Priority" has no plural. The moment you have 5, you have a to-do list\n\nHere\'s why. By the time you finish your one priority, the rest might not matter anymore. Markets move. Customers change their minds. Your team learns something new.\n\nSo stop ranking five things.\n\nPick one. Do it. Then pick again.\n\n#leadership #focus';

const DEFAULT = {
  mode:'basic',
  profileId:'', mockupId:'', groupId:'',
  profile:{first:'Jonny', last:'Chan', photo:'', bio:'B2B Marketer, ex-Coalition, ex-Meta. Building demand gen & revenue engine', badge:'premium', degree:'You', cta:''},
  post:{format:'text', text:SAMPLE_TEXT, image:'', videoThumb:'', duration:'1:24', time:'2h', edited:false},
  rs:{name:'FoundersHK', photo:'', bio:'', time:'3w', text:'Getting into Southeast Asia is one thing - winning customers and scaling across it is another.', image:''},
  eng:{reactions:301, comments:21, reposts:1},
  view:{device:'desktop', mobileWidth:390, expanded:false},
  fold:{linesText:3, linesMedia:2, shortOn:true, shortChars:250}
};
// The parts of the state that make up one mockup.
const MOCKUP_KEYS = ['profile','post','rs','eng','view','fold'];

function clone(o){ return JSON.parse(JSON.stringify(o)); }
function merge(base, over){
  const out = clone(base);
  if (!over || typeof over !== 'object') return out;
  for (const k of Object.keys(base)){
    if (over[k] === undefined) continue;
    if (base[k] && typeof base[k] === 'object') out[k] = Object.assign(out[k], over[k]);
    else out[k] = over[k];
  }
  return out;
}
function lsGet(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } }
function lsSet(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch(e){ return false; } }
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

let S = merge(DEFAULT, lsGet(LS_STATE));
let profiles = lsGet(LS_PROFILES) || [];
let saveTimer = null, warnedQuota = false;
function persist(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (!lsSet(LS_STATE, S)){
      const lite = clone(S); lite.post.image = ''; lite.post.videoThumb = ''; lite.rs.image = '';
      if (!lsSet(LS_STATE, lite) && !warnedQuota){ warnedQuota = true; toast('Browser storage is full; draft will not be remembered'); }
    }
  }, 300);
}

function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2400);
}
function busy(msg){
  $('#busy').classList.toggle('show', !!msg);
  if (msg) $('#busyMsg').textContent = msg;
}

/* ---------- small dialog (text input, choice, or confirm) ---------- */
function ask({title, value='', options=null, confirm=false, hint='', ok='OK'}){
  return new Promise(resolve => {
    const d = $('#dlg'), t = $('#dlgText'), s = $('#dlgSelect');
    $('#dlgTitle').textContent = title;
    $('#dlgHint').textContent = hint; $('#dlgHint').style.display = hint ? 'block' : 'none';
    $('#dlgOk').textContent = ok;
    t.style.display = (!options && !confirm) ? 'block' : 'none';
    s.style.display = options ? 'block' : 'none';
    t.value = value;
    if (options){ s.innerHTML = options.map(o => `<option value="${esc(o.v)}">${esc(o.l)}</option>`).join(''); s.value = value; }
    d.returnValue = '';
    d.onclose = () => {
      if (d.returnValue !== 'ok') return resolve(null);
      resolve(confirm ? true : options ? s.value : t.value.trim());
    };
    d.showModal();
    if (!options && !confirm){ t.focus(); t.select(); }
  });
}

/* ---------- image upload with downscale ---------- */
function readImage(file, maxSide, quality){
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,w,h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
function bindImage(inputId, thumbId, clearId, get, set, maxSide){
  const inp = $('#'+inputId), th = $('#'+thumbId);
  const sync = () => { const v = get(); th.src = v || 'data:image/gif;base64,R0lGODlhAQABAAAAACw='; th.style.visibility = v ? 'visible' : 'hidden'; };
  inp.addEventListener('change', async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    try { set(await readImage(f, maxSide, 0.88)); } catch(e){ toast('Could not read that image'); }
    inp.value = ''; sync(); update();
  });
  $('#'+clearId).addEventListener('click', () => { set(''); sync(); update(); });
  return sync;
}

/* ---------- icons (simple original drawings) ---------- */
const ICON = {
  globe:'<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 107 7 7 7 0 00-7-7zm4.87 6h-2.4a11.6 11.6 0 00-.9-4A5 5 0 0112.87 7zM8 13c-.6 0-1.4-1.7-1.6-4h3.2c-.2 2.3-1 4-1.6 4zM6.4 7C6.6 4.7 7.4 3 8 3s1.4 1.7 1.6 4zM6.43 3a11.6 11.6 0 00-.9 4h-2.4a5 5 0 013.3-4zM3.13 9h2.4a11.6 11.6 0 00.9 4 5 5 0 01-3.3-4zm6.44 4a11.6 11.6 0 00.9-4h2.4a5 5 0 01-3.3 4z"/></svg>',
  dots:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
  x:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  plus:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',
  caret:'<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M3 6l5 5 5-5z"/></svg>',
  like:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M7 10v10H4V10zM7 10l4-7c1.4 0 2.3 1 2 2.4L12.4 9H19a2 2 0 012 2.3l-1.3 7A2 2 0 0117.7 20H7"/></svg>',
  comment:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  repost:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3l3 3-3 3"/><path d="M20 6H8a3 3 0 00-3 3v2"/><path d="M7 21l-3-3 3-3"/><path d="M4 18h12a3 3 0 003-3v-2"/></svg>',
  send:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M21 3L3 10.5l7 3 3 7.5z"/><path d="M10 13.5L21 3"/></svg>',
  play:'<svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>',
  premium:'<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="3" fill="#c37d16"/><path fill="#fff" d="M3.5 6.2h1.9V12H3.5zM4.45 3.3a1.05 1.05 0 110 2.1 1.05 1.05 0 010-2.1zM6.6 6.2h1.8V7c.3-.5.9-1 1.9-1 1.9 0 2.3 1.2 2.3 2.9V12h-1.9V9.3c0-.7 0-1.5-1-1.5s-1.1.7-1.1 1.5V12H6.6z"/></svg>',
  verified:'<svg width="16" height="16" viewBox="0 0 16 16"><path fill="#56687a" d="M8 1l5.5 2v4.2c0 3.5-2.4 6.3-5.5 7.8-3.1-1.5-5.5-4.3-5.5-7.8V3z"/><path fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M5.4 8.1l1.8 1.8 3.5-3.6"/></svg>'
};
const CHIP = {
  like:'<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#378fe9"/><path fill="#fff" d="M4.3 7.2h1.5v4.6H4.3zM6.4 7.2l1.9-3c.6 0 1 .5.9 1.1l-.3 1.5h2.6c.6 0 1 .5.9 1.1l-.6 3c-.1.5-.5.9-1 .9H6.4z"/></svg>',
  celebrate:'<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#44712e"/><path fill="#fff" d="M5 12.5l1.6-6.3 4.7 4.7zM9.4 3.2l.5 1.4M12.6 5.4l-1.4.6M11.3 3.6l-.9 1.2" stroke="#fff" stroke-width="1" stroke-linecap="round"/></svg>',
  love:'<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#df704d"/><path fill="#fff" d="M8 12.2S3.8 9.6 3.8 6.9A2.1 2.1 0 018 6a2.1 2.1 0 014.2.9c0 2.7-4.2 5.3-4.2 5.3z"/></svg>'
};

/* ---------- helpers ---------- */
const fmt = n => Number(n || 0).toLocaleString('en-US');
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function rich(s){
  return esc(s).replace(/(https?:\/\/[^\s<]+|www\.[^\s<]+|(?:^|(?<=\s))[#@][\p{L}\p{N}_]+)/gu, '<span class="hl">$1</span>');
}
function initials(name){ return (name || '?').split(/\s+/).filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join(''); }
function avatar(photo, name){
  return photo ? `<div class="av"><img src="${photo}" alt=""></div>` : `<div class="av" style="background:#8a9bab">${esc(initials(name))}</div>`;
}
function badgeHtml(b){ return b === 'premium' ? `<span class="badge">${ICON.premium}</span>` : b === 'verified' ? `<span class="badge">${ICON.verified}</span>` : ''; }
function hasMedia(st){ const f = st.post.format; return f === 'photo' || f === 'video' || f === 'reshare'; }
function chipsFor(n){
  const kinds = n >= 50 ? ['like','celebrate','love'] : n >= 5 ? ['like','love'] : n > 0 ? ['like'] : [];
  return `<span class="chips">${kinds.map(k => CHIP[k]).join('')}</span>`;
}
const FORMAT_LABEL = {text:'Text', photo:'Photo', video:'Video', reshare:'Reshare'};
const slug = s => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'untitled';

/* ---------- the fold ---------- */
// Truncate `text` into `el` so text + "… more" fits in `lines` lines.
// Returns characters visible before the fold, or -1 if not truncated.
function fold(el, text, lines, st){
  el.innerHTML = rich(text);
  if (st.view.expanded || !text) return -1;
  if (st.fold.shortOn && text.length <= st.fold.shortChars) return -1;
  const cs = getComputedStyle(el);
  const lh = parseFloat(cs.lineHeight) || 20;
  const limit = lines * lh + (parseFloat(cs.paddingTop) || 0) + 2;
  if (el.offsetHeight <= limit) return -1;
  const tail = '<span class="dots">…</span><span class="more"> more</span>';
  const fits = n => { el.innerHTML = rich(text.slice(0, n).replace(/\s+$/, '')) + tail; return el.offsetHeight <= limit; };
  let lo = 0, hi = text.length;
  while (lo < hi){ const mid = (lo + hi + 1) >> 1; if (fits(mid)) lo = mid; else hi = mid - 1; }
  let n = lo; const sp = text.slice(0, n).search(/\s\S*$/);
  if (sp > n - 25 && sp > 0) n = sp;
  fits(n);
  return text.slice(0, n).replace(/\s+$/, '').length;
}

/* ---------- media box sizing (crop between 1.91:1 and 4:5 like the feed) ---------- */
function mediaHtml(src, isVideo, width, duration){
  if (!src){
    const h = Math.round(width / (isVideo ? 16/9 : 1.2));
    return `<div class="media" style="height:${h}px"><div class="ph">${isVideo ? 'Upload a video thumbnail' : 'Upload a photo'}</div>${isVideo ? `<div class="play"><i>${ICON.play}</i></div>` : ''}</div>`;
  }
  return `<div class="media" data-src="1" style="height:${Math.round(width/1.2)}px"><img src="${src}" alt="">${isVideo ? `<div class="play"><i>${ICON.play}</i></div>${duration ? `<span class="dur">${esc(duration)}</span>` : ''}` : ''}</div>`;
}
function sizeMedia(root){
  $$('.media[data-src] img', root).forEach(img => {
    const box = img.parentElement;
    const apply = () => {
      const w = box.clientWidth; if (!w || !img.naturalWidth) return;
      const r = Math.max(0.8, Math.min(1.91, img.naturalWidth / img.naturalHeight));
      box.style.height = Math.round(w / r) + 'px';
    };
    if (img.complete) apply(); else img.onload = apply;
  });
}
async function settleImages(root){
  await Promise.all($$('img', root).map(img => img.decode ? img.decode().catch(() => {}) : Promise.resolve()));
  sizeMedia(root);
}

/* ---------- render a state into a capture container ---------- */
function render(st, cap){
  const P = st.profile, post = st.post, E = st.eng, V = st.view;
  const mobile = V.device === 'mobile';
  const W = mobile ? Number(V.mobileWidth) : 555;
  const name = `${P.first} ${P.last}`.trim() || 'Your Name';
  const time = `${esc(post.time || 'now')}${post.edited ? ' • Edited' : ''} • `;
  const notSelf = P.degree !== 'You';

  let tools;
  if (mobile) tools = notSelf && P.degree !== '1st' && P.degree !== 'Following' ? `<span class="follow">${ICON.plus}Follow</span><span>${ICON.dots}</span>` : `<span>${ICON.dots}</span>`;
  else tools = `<span>${ICON.dots}</span>${notSelf ? `<span>${ICON.x}</span>` : ''}`;

  const header = `
    <div class="hd">
      ${avatar(P.photo, name)}
      <div class="who">
        <div class="nm"><b>${esc(name)}</b>${badgeHtml(P.badge)}<span class="deg"> • ${esc(P.degree)}</span></div>
        <div class="bio">${esc(P.bio)}</div>
        ${P.cta ? `<span class="cta">${esc(P.cta)}</span>` : ''}
        <div class="time">${time}${ICON.globe}</div>
      </div>
      <div class="tools">${tools}</div>
    </div>`;

  let body = `<div class="txt main-txt"></div>`;
  if (post.format === 'photo') body += mediaHtml(post.image, false, W);
  if (post.format === 'video') body += mediaHtml(post.videoThumb, true, W, post.duration);
  if (post.format === 'reshare'){
    const R = st.rs;
    body += `<div class="rs">
      <div class="hd">
        ${avatar(R.photo, R.name)}
        <div class="who">
          <div class="nm"><b>${esc(R.name || 'Original author')}</b></div>
          ${R.bio ? `<div class="bio">${esc(R.bio)}</div>` : ''}
          <div class="time">${esc(R.time || '1d')} • ${ICON.globe}</div>
        </div>
      </div>
      <div class="txt rs-txt"></div>
      ${R.image ? mediaHtml(R.image, false, W - 34) : '<div class="pad"></div>'}
    </div>`;
  }

  let eng;
  if (mobile){
    const right = [E.comments ? `${fmt(E.comments)} comment${E.comments == 1 ? '' : 's'}` : '', E.reposts ? `${fmt(E.reposts)} repost${E.reposts == 1 ? '' : 's'}` : ''].filter(Boolean).join(' • ');
    eng = `${(E.reactions || right) ? `<div class="cnt"><span class="l">${E.reactions ? chipsFor(E.reactions) + fmt(E.reactions) : ''}</span><span>${right}</span></div>` : '<div style="height:8px"></div>'}
      <div class="bar">
        <div>${ICON.like}Like</div><div>${ICON.comment}Comment</div><div>${ICON.repost}Repost</div><div>${ICON.send}Send</div>
      </div>`;
  } else {
    const n = v => v ? `<span>${fmt(v)}</span>` : '';
    eng = `<div class="eng">
      <div class="acts">
        <span class="me">${avatar(P.photo, name)}${ICON.caret}</span>
        <span class="act">${ICON.like}${n(E.reactions)}</span>
        <span class="act">${ICON.comment}${n(E.comments)}</span>
        <span class="act">${ICON.repost}${n(E.reposts)}</span>
        <span class="act">${ICON.send}</span>
      </div>
      ${chipsFor(E.reactions)}
    </div>`;
  }

  cap.className = 'capture ' + (mobile ? 'mobile' : 'desktop');
  cap.innerHTML = `<div class="li ${mobile ? 'mobile' : 'desktop'}" style="${mobile ? `width:${W}px` : ''}">${header}${body}${eng}<div class="pad-end"></div></div>`;

  const mainTxt = $('.main-txt', cap);
  const shown = fold(mainTxt, post.text, hasMedia(st) ? st.fold.linesMedia : st.fold.linesText, st);
  if (!post.text) mainTxt.style.display = 'none';
  if (post.format === 'reshare'){
    const rsTxt = $('.rs-txt', cap);
    fold(rsTxt, st.rs.text, st.rs.image ? st.fold.linesMedia : st.fold.linesText, st);
    if (!st.rs.text) rsTxt.style.display = 'none';
  }
  sizeMedia(cap);
  return {shown, width: W, mobile};
}

function renderMain(){
  const {shown, width, mobile} = render(S, $('#capture'));
  const text = S.post.text, len = text.length;
  const where = mobile ? `mobile (${width}px)` : 'desktop';
  let info;
  if (S.view.expanded) info = `Showing the full post as it looks after someone taps <b>…more</b>.`;
  else if (shown < 0) info = `Whole post is visible on ${where}. No <b>…more</b> fold.`;
  else info = `On ${where}, readers see <b>${shown}</b> characters before <b>…more</b> (${len - shown} hidden). The fold lands after: “${esc(text.slice(0, shown).split(/\s+/).slice(-6).join(' '))}”`;
  $('#foldInfo').innerHTML = info;
  $('#foldCount').textContent = shown < 0 ? 'No fold' : `${shown} chars above the fold`;
  const cc = $('#charCount');
  cc.textContent = `${fmt(len)} / 3,000`;
  cc.className = len > 3000 ? 'warn' : '';
}

/* ---------- form wiring ---------- */
function setSeg(id, v){ $$('#'+id+' button').forEach(b => b.classList.toggle('on', b.dataset.v === String(v))); }
function bindSeg(id, onPick){
  $$('#'+id+' button').forEach(b => b.addEventListener('click', () => { if (b.disabled) return; onPick(b.dataset.v); update(); }));
}
function bindField(id, obj, key, kind){
  const el = $('#'+id);
  const ev = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input';
  el.addEventListener(ev, () => {
    const o = obj();
    if (el.type === 'checkbox') o[key] = el.checked;
    else if (kind === 'num') o[key] = Math.max(0, parseInt(el.value, 10) || 0);
    else o[key] = el.value;
    update();
  });
}
function fillFields(){
  const P = S.profile, p = S.post, R = S.rs, F = S.fold;
  $('#first').value = P.first; $('#last').value = P.last; $('#bio').value = P.bio;
  $('#badge').value = P.badge; $('#degree').value = P.degree; $('#cta').value = P.cta;
  $('#text').value = p.text; $('#duration').value = p.duration; $('#time').value = p.time; $('#edited').checked = !!p.edited;
  $('#rsName').value = R.name; $('#rsTime').value = R.time; $('#rsBio').value = R.bio; $('#rsText').value = R.text;
  $('#linesText').value = F.linesText; $('#linesMedia').value = F.linesMedia; $('#shortOn').checked = !!F.shortOn; $('#shortChars').value = F.shortChars;
  $('#mobileWidth').value = String(S.view.mobileWidth);
  syncThumbs.forEach(f => f());
  syncSliders();
}

// log-scale sliders: position 0..1000 -> 0..100000
const toVal = p => p <= 0 ? 0 : Math.round(Math.pow(10, p / 1000 * 5));
const toPos = v => v <= 0 ? 0 : Math.round(Math.log10(Math.max(1, v)) / 5 * 1000);
function syncSliders(){
  $$('.slider').forEach(s => {
    const k = s.dataset.k;
    $('input[type=number]', s).value = S.eng[k];
    $('input[type=range]', s).value = toPos(S.eng[k]);
  });
}
$$('.slider').forEach(s => {
  const k = s.dataset.k, num = $('input[type=number]', s), rng = $('input[type=range]', s);
  rng.addEventListener('input', () => { S.eng[k] = toVal(+rng.value); num.value = S.eng[k]; update(); });
  num.addEventListener('input', () => { S.eng[k] = Math.max(0, parseInt(num.value, 10) || 0); rng.value = toPos(S.eng[k]); update(); });
});
$$('[data-preset]').forEach(b => b.addEventListener('click', () => {
  const [r, c, p] = b.dataset.preset.split(',').map(Number);
  Object.assign(S.eng, {reactions:r, comments:c, reposts:p}); syncSliders(); update();
}));

[['first','first'],['last','last'],['bio','bio'],['badge','badge'],['degree','degree'],['cta','cta']].forEach(([id,k]) => bindField(id, () => S.profile, k));
[['text','text'],['duration','duration'],['time','time'],['edited','edited']].forEach(([id,k]) => bindField(id, () => S.post, k));
[['rsName','name'],['rsTime','time'],['rsBio','bio'],['rsText','text']].forEach(([id,k]) => bindField(id, () => S.rs, k));
bindField('linesText', () => S.fold, 'linesText', 'num');
bindField('linesMedia', () => S.fold, 'linesMedia', 'num');
bindField('shortOn', () => S.fold, 'shortOn');
bindField('shortChars', () => S.fold, 'shortChars', 'num');
$('#mobileWidth').addEventListener('change', e => { S.view.mobileWidth = +e.target.value; update(); });

const syncThumbs = [
  bindImage('photo','photoThumb','photoClear', () => S.profile.photo, v => S.profile.photo = v, 256),
  bindImage('image','imageThumb','imageClear', () => S.post.image, v => S.post.image = v, 1600),
  bindImage('videoThumb','videoThumbImg','videoClear', () => S.post.videoThumb, v => S.post.videoThumb = v, 1600),
  bindImage('rsPhoto','rsPhotoThumb','rsPhotoClear', () => S.rs.photo, v => S.rs.photo = v, 256),
  bindImage('rsImage','rsImageThumb','rsImageClear', () => S.rs.image, v => S.rs.image = v, 1600)
];

bindSeg('modeSeg', v => { S.mode = v; if (v === 'basic' && (S.post.format === 'video' || S.post.format === 'reshare')) S.post.format = 'text'; });
bindSeg('formatSeg', v => { S.post.format = v; });
bindSeg('deviceSeg', v => { S.view.device = v; });
bindSeg('expandSeg', v => { S.view.expanded = v === '1'; });

function syncChrome(){
  const adv = S.mode === 'adv';
  document.body.classList.toggle('adv', adv);
  setSeg('modeSeg', S.mode); setSeg('formatSeg', S.post.format); setSeg('deviceSeg', S.view.device); setSeg('expandSeg', S.view.expanded ? '1' : '0');
  $$('#formatSeg .adv-btn').forEach(b => b.disabled = !adv);
  $('#advHint').style.display = adv ? 'none' : 'block';
  $('#photoBox').style.display = S.post.format === 'photo' ? 'block' : 'none';
  $('#videoBox').style.display = S.post.format === 'video' ? 'block' : 'none';
  $('#reshareSec').style.display = S.post.format === 'reshare' ? 'block' : 'none';
  $('#mobileWidth').style.display = S.view.device === 'mobile' ? 'inline-block' : 'none';
}
function update(){ syncChrome(); renderMain(); persist(); }

/* ---------- saved profiles ---------- */
function personName(p){ return `${p.first || ''} ${p.last || ''}`.trim(); }
function profileLabel(p){ return p.label || personName(p) || 'Unnamed'; }
function snapshotFrom(p){ return {first:p.first||'',last:p.last||'',photo:p.photo||'',bio:p.bio||'',badge:p.badge||'none',degree:p.degree||'You',cta:p.cta||''}; }
function refreshProfiles(){
  const sel = $('#profileSel');
  if (!profiles.some(p => p.id === S.profileId)) S.profileId = '';
  sel.innerHTML = `<option value="">— Unsaved —</option>` + profiles.map(p => `<option value="${esc(p.id)}">${esc(profileLabel(p))}${p.label && personName(p) && p.label !== personName(p) ? ` (${esc(personName(p))})` : ''}</option>`).join('');
  sel.value = S.profileId || '';
  const bp = $('#bProfile'), cur = bp.value;
  bp.innerHTML = `<option value="">Each mockup's own profile</option>` + profiles.map(p => `<option value="${esc(p.id)}">Everything as: ${esc(profileLabel(p))}</option>`).join('');
  bp.value = profiles.some(p => p.id === cur) ? cur : '';
}
function saveProfiles(){ if (!lsSet(LS_PROFILES, profiles)) toast('Could not save: browser storage is full'); }
$('#profileSel').addEventListener('change', e => {
  const p = profiles.find(x => x.id === e.target.value);
  S.profileId = p ? p.id : '';
  if (p){ S.profile = snapshotFrom(p); fillFields(); }
  update();
});
$('#pSaveNew').addEventListener('click', async () => {
  const label = await ask({title:'Save profile', value: personName(S.profile), hint:'Name it however helps you keep track, e.g. "Jianfeng - CEO voice".', ok:'Save'});
  if (label === null) return;
  const p = Object.assign({id: uid('p'), label: label || personName(S.profile)}, snapshotFrom(S.profile));
  profiles.push(p); saveProfiles(); S.profileId = p.id; refreshProfiles(); persist(); toast(`Saved “${profileLabel(p)}”`);
});
$('#pUpdate').addEventListener('click', () => {
  const i = profiles.findIndex(x => x.id === $('#profileSel').value);
  if (i < 0) { toast('Pick a saved profile first, or use Save as new'); return; }
  profiles[i] = Object.assign({id: profiles[i].id, label: profiles[i].label}, snapshotFrom(S.profile));
  saveProfiles(); refreshProfiles(); toast('Profile updated');
});
$('#pRename').addEventListener('click', async () => {
  const p = profiles.find(x => x.id === $('#profileSel').value);
  if (!p) { toast('Pick a saved profile to rename'); return; }
  const label = await ask({title:'Rename profile', value: profileLabel(p), hint:'This only changes the name in your list, not the name shown on the post.', ok:'Rename'});
  if (!label) return;
  p.label = label; saveProfiles(); refreshProfiles(); toast('Renamed');
});
$('#pDelete').addEventListener('click', async () => {
  const p = profiles.find(x => x.id === $('#profileSel').value);
  if (!p) { toast('Pick a saved profile to delete'); return; }
  if (!await ask({title:`Delete profile “${profileLabel(p)}”?`, confirm:true, hint:'Mockups that used it keep their own copy.', ok:'Delete'})) return;
  profiles = profiles.filter(x => x.id !== p.id); saveProfiles(); S.profileId = ''; refreshProfiles(); persist(); toast('Deleted');
});
function download(blob, name){
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
$('#pExport').addEventListener('click', () => {
  if (!profiles.length) { toast('No saved profiles to export'); return; }
  download(new Blob([JSON.stringify({type:'linkedin-post-preview-profiles', version:1, profiles}, null, 2)], {type:'application/json'}), 'linkedin-preview-profiles.json');
});
function importProfiles(list){
  let n = 0;
  (list || []).forEach(raw => {
    if (!raw || typeof raw !== 'object') return;
    const p = Object.assign({id: String(raw.id || uid('p')), label: typeof raw.label === 'string' ? raw.label : ''}, snapshotFrom(raw));
    if (p.photo && !/^data:image\//.test(p.photo)) p.photo = '';
    const i = profiles.findIndex(x => x.id === p.id);
    if (i >= 0) profiles[i] = p; else profiles.push(p);
    n++;
  });
  saveProfiles(); refreshProfiles();
  return n;
}
$('#pImportBtn').addEventListener('click', () => $('#pImport').click());
$('#pImport').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    const list = Array.isArray(data) ? data : data.profiles;
    if (!Array.isArray(list)) throw 0;
    const n = importProfiles(list); toast(`Imported ${n} profile${n === 1 ? '' : 's'}`);
  } catch(err){ toast('That file is not a profiles export'); }
});

/* ---------- library storage (IndexedDB; falls back to memory) ---------- */
const DB = (() => {
  let opening = null, failed = false;
  function open(){
    if (opening) return opening;
    opening = new Promise((res, rej) => {
      try {
        const r = indexedDB.open('linkedin-post-preview', 1);
        r.onupgradeneeded = () => {
          const db = r.result;
          if (!db.objectStoreNames.contains('groups')) db.createObjectStore('groups', {keyPath:'id'});
          if (!db.objectStoreNames.contains('mockups')) db.createObjectStore('mockups', {keyPath:'id'});
        };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      } catch(e){ rej(e); }
    });
    return opening;
  }
  function run(store, mode, fn){
    if (failed) return Promise.resolve(undefined);
    return open().then(db => new Promise((res, rej) => {
      const t = db.transaction(store, mode); const req = fn(t.objectStore(store));
      t.oncomplete = () => res(req ? req.result : undefined);
      t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    })).catch(e => {
      if (!failed){ failed = true; toast('Library storage is unavailable in this browser mode; saves last until you close the tab'); }
      console.error(e);
    });
  }
  return {
    all: store => run(store, 'readonly', s => s.getAll()),
    put: (store, v) => run(store, 'readwrite', s => s.put(v)),
    del: (store, id) => run(store, 'readwrite', s => s.delete(id))
  };
})();

let groups = [], mockups = [];
const curGroup = () => groups.find(g => g.id === S.groupId) || groups[0];
const inGroup = gid => mockups.filter(m => m.groupId === gid).sort((a, b) => a.createdAt - b.createdAt);
const currentMockup = () => mockups.find(m => m.id === S.mockupId);
function snapshotMockup(){ const o = {}; MOCKUP_KEYS.forEach(k => o[k] = clone(S[k])); return o; }
function defaultTitle(){
  const line = (S.post.text || '').split('\n').find(l => l.trim()) || FORMAT_LABEL[S.post.format] + ' post';
  return line.trim().slice(0, 60);
}

function refreshLibrary(){
  const g = curGroup();
  S.groupId = g ? g.id : '';
  $('#groupSel').innerHTML = groups.map(x => `<option value="${esc(x.id)}">${esc(x.name)} (${inGroup(x.id).length})</option>`).join('');
  $('#groupSel').value = S.groupId;
  $('#libCount').textContent = `${mockups.length} saved`;
  const m = currentMockup();
  const mg = m && groups.find(x => x.id === m.groupId);
  $('#editing').innerHTML = m ? `Editing <b>${esc(m.title)}</b>${mg ? ` in ${esc(mg.name)}` : ''}` : '';
  $('#mUpdate').disabled = !m;
  $('#mUpdate').style.opacity = m ? 1 : .45;

  const items = g ? inGroup(g.id) : [];
  $('#libList').innerHTML = items.map(x => {
    const st = x.state, who = personName(st.profile) || 'No name';
    const view = st.view.device === 'mobile' ? 'Mobile' : 'Desktop';
    return `<div class="lrow${x.id === S.mockupId ? ' cur' : ''}" data-id="${esc(x.id)}">
      <div class="t"><b title="${esc(x.title)}">${esc(x.title)}</b><small>${esc(who)} · ${FORMAT_LABEL[st.post.format] || 'Text'} · ${view}</small></div>
      <div class="a">
        <button class="btn sm" data-a="open" title="Open this mockup exactly as saved">Open</button>
        <button class="btn sm" data-a="use" title="Load this post onto the profile you have open now, as a new unsaved mockup">Use</button>
        <select data-a="more" title="More actions">
          <option value="">⋯</option>
          <option value="rename">Rename</option>
          <option value="dup">Duplicate</option>
          <option value="move">Move to group…</option>
          <option value="png">Download PNG</option>
          <option value="delete">Delete</option>
        </select>
      </div>
    </div>`;
  }).join('');
}

async function putMockup(m){ m.updatedAt = Date.now(); await DB.put('mockups', m); }

function loadMockup(m, asTemplate){
  const st = merge(DEFAULT, Object.assign({}, S, clone(m.state)));
  if (asTemplate){
    MOCKUP_KEYS.filter(k => k !== 'profile').forEach(k => S[k] = st[k]);
    S.mockupId = '';
    toast('Post loaded onto your current profile. Save it as a new mockup when ready.');
  } else {
    MOCKUP_KEYS.forEach(k => S[k] = st[k]);
    S.mockupId = m.id;
    const match = profiles.find(p => JSON.stringify(snapshotFrom(p)) === JSON.stringify(snapshotFrom(S.profile)));
    S.profileId = match ? match.id : '';
  }
  if (S.post.format === 'video' || S.post.format === 'reshare') S.mode = 'adv';
  fillFields(); refreshProfiles(); refreshLibrary(); update();
}

$('#libList').addEventListener('click', e => {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const m = mockups.find(x => x.id === b.closest('.lrow').dataset.id); if (!m) return;
  loadMockup(m, b.dataset.a === 'use');
});
$('#libList').addEventListener('change', async e => {
  const sel = e.target.closest('select[data-a=more]'); if (!sel) return;
  const action = sel.value; sel.value = '';
  const m = mockups.find(x => x.id === sel.closest('.lrow').dataset.id); if (!m) return;
  if (action === 'rename'){
    const t = await ask({title:'Rename mockup', value:m.title, ok:'Rename'});
    if (!t) return; m.title = t; await putMockup(m);
  } else if (action === 'dup'){
    const c = {id: uid('m'), groupId: m.groupId, title: m.title + ' (copy)', createdAt: Date.now(), state: clone(m.state)};
    mockups.push(c); await putMockup(c);
  } else if (action === 'move'){
    if (groups.length < 2){ toast('Create another group first'); return; }
    const gid = await ask({title:`Move “${m.title}” to`, value:m.groupId, options: groups.map(g => ({v:g.id, l:g.name})), ok:'Move'});
    if (!gid) return; m.groupId = gid; m.createdAt = Date.now(); await putMockup(m);
  } else if (action === 'png'){
    busy('Rendering…');
    try { const {blob, name} = await renderToPng(m.state, m.state.view.device, m.state.view.expanded, null, ''); download(blob, name); }
    catch(err){ console.error(err); toast('Export failed'); }
    busy('');
  } else if (action === 'delete'){
    if (!await ask({title:`Delete “${m.title}”?`, confirm:true, ok:'Delete'})) return;
    mockups = mockups.filter(x => x.id !== m.id); await DB.del('mockups', m.id);
    if (S.mockupId === m.id) S.mockupId = '';
  }
  refreshLibrary(); persist();
});

$('#groupSel').addEventListener('change', e => { S.groupId = e.target.value; refreshLibrary(); persist(); });
$('#gNew').addEventListener('click', async () => {
  const name = await ask({title:'New group', hint:'e.g. "WIZ - January", "Jianfeng drafts" or "Templates".', ok:'Create'});
  if (!name) return;
  const g = {id: uid('g'), name, createdAt: Date.now()};
  groups.push(g); await DB.put('groups', g); S.groupId = g.id; refreshLibrary(); persist();
});
$('#gRename').addEventListener('click', async () => {
  const g = curGroup(); if (!g) return;
  const name = await ask({title:'Rename group', value:g.name, ok:'Rename'});
  if (!name) return; g.name = name; await DB.put('groups', g); refreshLibrary();
});
$('#gDelete').addEventListener('click', async () => {
  const g = curGroup(); if (!g) return;
  if (groups.length === 1){ toast('You need at least one group'); return; }
  const n = inGroup(g.id).length;
  if (!await ask({title:`Delete group “${g.name}”?`, confirm:true, hint: n ? `This also deletes the ${n} mockup${n === 1 ? '' : 's'} in it.` : 'The group is empty.', ok:'Delete'})) return;
  for (const m of inGroup(g.id)){ await DB.del('mockups', m.id); if (S.mockupId === m.id) S.mockupId = ''; }
  mockups = mockups.filter(m => m.groupId !== g.id);
  groups = groups.filter(x => x.id !== g.id); await DB.del('groups', g.id);
  S.groupId = groups[0].id; refreshLibrary(); persist();
});
$('#mSave').addEventListener('click', async () => {
  const g = curGroup(); if (!g) return;
  const title = await ask({title:`Save to “${g.name}”`, value: defaultTitle(), hint:'Saves the profile, post, engagement and view together.', ok:'Save'});
  if (title === null) return;
  const m = {id: uid('m'), groupId: g.id, title: title || defaultTitle(), createdAt: Date.now(), state: snapshotMockup()};
  mockups.push(m); await putMockup(m);
  S.mockupId = m.id; refreshLibrary(); persist(); toast(`Saved to ${g.name}`);
});
$('#mUpdate').addEventListener('click', async () => {
  const m = currentMockup(); if (!m) return;
  m.state = snapshotMockup(); await putMockup(m); refreshLibrary(); toast(`Saved changes to “${m.title}”`);
});

/* ---------- PNG rendering ---------- */
async function renderToPng(state, device, expanded, profileOverride, prefix){
  const st = merge(DEFAULT, clone(state));
  st.view.device = device; st.view.expanded = expanded;
  if (profileOverride) st.profile = snapshotFrom(profileOverride);
  const host = $('#offstage'); host.innerHTML = '';
  const cap = document.createElement('div'); host.appendChild(cap);
  render(st, cap);
  await settleImages(cap);
  const blob = await window.htmlToImage.toBlob($('.li', cap), {pixelRatio: 3, backgroundColor: '#ffffff'});
  host.innerHTML = '';
  const who = slug(personName(st.profile) || 'post');
  const name = `${prefix}${prefix ? '' : 'linkedin-preview-'}${who}-${device}${expanded ? '-expanded' : ''}.png`;
  return {blob, name};
}

$('#download').addEventListener('click', async () => {
  if (!window.htmlToImage){ toast('Image export unavailable. Take a screenshot instead.'); return; }
  try {
    const {blob, name} = await renderToPng(snapshotMockup(), S.view.device, S.view.expanded, null, '');
    download(blob, name);
  } catch(e){ console.error(e); toast('Export failed. Try a screenshot instead.'); }
});

/* ---------- ZIP writer (stored, no compression: PNGs are already compressed) ---------- */
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++){ let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8){ let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function makeZip(files){
  const enc = new TextEncoder(), parts = [], central = [];
  const d = new Date();
  const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  let offset = 0;
  for (const f of files){
    const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true);
    lh.setUint32(18, size, true); lh.setUint32(22, size, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    parts.push(lh.buffer, name, f.data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
    ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true);
    ch.setUint32(20, size, true); ch.setUint32(24, size, true); ch.setUint16(28, name.length, true);
    ch.setUint32(42, offset, true);
    central.push(ch.buffer, name);
    offset += 30 + name.length + size;
  }
  const cdSize = central.reduce((a, b) => a + b.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end.buffer], {type: 'application/zip'});
}

$('#bGo').addEventListener('click', async () => {
  const g = curGroup(), items = g ? inGroup(g.id) : [];
  if (!items.length){ toast('This group has no mockups yet'); return; }
  if (!window.htmlToImage){ toast('Image export unavailable in this browser'); return; }
  const dv = $('#bDevice').value, ex = $('#bExpand').value;
  const prof = profiles.find(p => p.id === $('#bProfile').value) || null;
  const jobs = [];
  items.forEach((m, i) => {
    const devices = dv === 'both' ? ['desktop', 'mobile'] : dv === 'as' ? [m.state.view.device] : [dv];
    const exps = ex === 'both' ? [false, true] : ex === 'as' ? [!!m.state.view.expanded] : [ex === '1'];
    devices.forEach(d => exps.forEach(e => jobs.push({m, i, d, e})));
  });
  const files = [], used = new Set();
  try {
    for (let j = 0; j < jobs.length; j++){
      const {m, i, d, e} = jobs[j];
      busy(`Rendering ${j + 1} of ${jobs.length}…`);
      const prefix = `${String(i + 1).padStart(2, '0')}-${slug(m.title)}-`;
      const {blob} = await renderToPng(m.state, d, e, prof, prefix);
      let name = `${prefix}${d}${e ? '-expanded' : ''}.png`, k = 2;
      while (used.has(name)) name = name.replace(/(-\d+)?\.png$/, `-${k++}.png`);
      used.add(name);
      files.push({name, data: new Uint8Array(await blob.arrayBuffer())});
    }
    busy('Zipping…');
    download(makeZip(files), `${slug(g.name)}${prof ? '-' + slug(profileLabel(prof)) : ''}.zip`);
    $('#bStatus').textContent = `${files.length} image${files.length === 1 ? '' : 's'} downloaded`;
  } catch(err){
    console.error(err); toast('Bulk export failed partway. Try fewer mockups or a single PNG.');
  }
  busy('');
});

/* ---------- library backup / restore ---------- */
$('#libExport').addEventListener('click', () => {
  const data = {type:'linkedin-post-preview-library', version:1, exportedAt:new Date().toISOString(), groups, mockups, profiles};
  download(new Blob([JSON.stringify(data)], {type:'application/json'}), `linkedin-preview-library-${new Date().toISOString().slice(0,10)}.json`);
});
$('#libImportBtn').addEventListener('click', () => $('#libImport').click());
$('#libImport').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
  let data;
  try { data = JSON.parse(await f.text()); } catch(err){ toast('That file is not valid JSON'); return; }
  if (!data || data.type !== 'linkedin-post-preview-library'){ toast('That file is not a library backup'); return; }
  busy('Restoring…');
  let ng = 0, nm = 0;
  for (const raw of (data.groups || [])){
    if (!raw || !raw.id) continue;
    const g = {id: String(raw.id), name: String(raw.name || 'Imported'), createdAt: +raw.createdAt || Date.now()};
    const i = groups.findIndex(x => x.id === g.id); if (i >= 0) groups[i] = g; else groups.push(g);
    await DB.put('groups', g); ng++;
  }
  for (const raw of (data.mockups || [])){
    if (!raw || !raw.id || !raw.state) continue;
    const st = merge(DEFAULT, raw.state), state = {};
    MOCKUP_KEYS.forEach(k => state[k] = st[k]);
    const gid = groups.some(g => g.id === raw.groupId) ? String(raw.groupId) : groups[0].id;
    const m = {id: String(raw.id), groupId: gid, title: String(raw.title || 'Untitled'), createdAt: +raw.createdAt || Date.now(), state};
    const i = mockups.findIndex(x => x.id === m.id); if (i >= 0) mockups[i] = m; else mockups.push(m);
    await putMockup(m); nm++;
  }
  const np = importProfiles(data.profiles);
  busy(''); refreshLibrary();
  toast(`Restored ${ng} group${ng === 1 ? '' : 's'}, ${nm} mockup${nm === 1 ? '' : 's'}, ${np} profile${np === 1 ? '' : 's'}`);
});

/* ---------- boot ---------- */
async function boot(){
  refreshProfiles();
  fillFields();
  update();
  groups = (await DB.all('groups')) || [];
  mockups = (await DB.all('mockups')) || [];
  if (!groups.length){
    const g = {id:'g-default', name:'My mockups', createdAt: Date.now()};
    groups.push(g); await DB.put('groups', g);
  }
  groups.sort((a, b) => a.createdAt - b.createdAt);
  if (!currentMockup()) S.mockupId = '';
  refreshLibrary();
}
boot();
window.addEventListener('resize', () => renderMain());
})();
