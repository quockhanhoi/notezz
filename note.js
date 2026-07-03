const fs = require('fs');
const path = require('path');

const notesDir = path.join(__dirname, '../note');
if (!fs.existsSync(notesDir)) fs.mkdirSync(notesDir, { recursive: true });

// ── UUID validation ──────────────────────────────────────────────────────────
const VALID_UUID = /^[a-zA-Z0-9_-]{1,36}$/;

module.exports = {
    info: {
        path: '/note/:UUID',
        title: 'Note API',
        desc: 'Create, read, update, delete notes',
        example_url: [
            { method: 'GET',    query: '/note/:UUID',        desc: 'View note (HTML) or raw text (?raw=true)' },
            { method: 'PUT',    query: '/note/:UUID',        desc: 'Save note content' },
            { method: 'DELETE', query: '/note/:UUID',        desc: 'Delete note' },
        ]
    },
    methods: {
        // ── GET ───────────────────────────────────────────────────────────────
        get: (req, res) => {
            const uuid = req.params.UUID;

            // Redirect invalid/missing UUID to a new one
            if (!uuid || uuid === ':UUID' || !VALID_UUID.test(uuid)) {
                res.redirect('./' + require('uuid').v4());
                return;
            }

            const filePath = path.join(notesDir, `${uuid}.txt`);

            // Handle .raw symlink (shared/alias notes)
            if (fs.existsSync(filePath + '.raw')) {
                const rawTarget = fs.readFileSync(filePath + '.raw', 'utf8');
                if (fs.existsSync(rawTarget)) {
                    res.set('content-type', 'text/plain; charset=utf-8');
                    res.end(fs.readFileSync(rawTarget, 'utf8'));
                } else {
                    res.status(404).end('Not found');
                }
                return;
            }

            const text = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';

            // Raw mode: API clients or ?raw=true
            const isRaw = req.query.raw === 'true' || !/^Mozilla/.test(req.headers['user-agent'] || '');
            if (isRaw) {
                res.set('content-type', 'text/plain; charset=utf-8');
                res.set('cache-control', 'no-store');
                res.end(text);
                return;
            }

            // ── HTML page ────────────────────────────────────────────────────
            const shortId = uuid.slice(0, 8);
            res.set('content-type', 'text/html; charset=utf-8');
            res.end(`<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#FBF3F0" id="themeColor">
<title>Note · ${shortId}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#FFF0F6;--surface:#fff;--ink:#5A2A45;--muted:#C288AC;
  --accent:#FF6FA8;--soft:#FFDCEC;--line:#FFDCEC;--gutter:#F0A8C6;
  --shadow:0 18px 40px -22px rgba(255,111,168,.4);
}
html[data-theme="blue"]{
  --bg:#EEF3F8;--surface:#fff;--ink:#1F2D3D;--muted:#7D93A8;
  --accent:#3B6FA0;--soft:#D6E4F0;--line:#DCE6EF;--gutter:#7FA0C0;
  --shadow:0 18px 40px -22px rgba(31,45,61,.32);
}
html[data-theme="black"]{
  --bg:#15151A;--surface:#1D1D24;--ink:#ECE9E6;--muted:#7A7A85;
  --accent:#E0B454;--soft:#2C2A22;--line:#2B2B33;--gutter:#5C5C68;
  --shadow:0 18px 40px -22px rgba(0,0,0,.55);
}
*{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--bg);color:var(--ink);font-family:'Inter',sans-serif;min-height:100vh;display:flex;flex-direction:column;transition:background .3s,color .3s;}
header{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;gap:10px;flex-wrap:wrap;}
.brand{display:flex;align-items:center;gap:8px;}
.back{font-size:12px;color:var(--muted);text-decoration:none;display:flex;align-items:center;gap:3px;transition:color .15s;flex-shrink:0;}
.back:hover{color:var(--ink);}
.brand h1{font-family:'Fraunces',serif;font-size:19px;font-weight:600;}
.nid{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--muted);}
.toolbar{display:flex;align-items:center;gap:7px;flex-wrap:wrap;}
.status{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted);display:flex;align-items:center;gap:5px;min-width:70px;}
.dot{width:6px;height:6px;border-radius:50%;background:var(--muted);transition:background .2s;}
.saving .dot{background:var(--accent);animation:pulse 1s infinite;}
.saved .dot{background:#5FAE7A;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.tbtn{font-family:'Inter',sans-serif;font-size:12px;font-weight:600;background:var(--surface);color:var(--ink);border:1px solid var(--line);padding:6px 12px;border-radius:99px;cursor:pointer;box-shadow:var(--shadow);transition:border-color .15s,color .15s;white-space:nowrap;}
.tbtn:hover{border-color:var(--accent);color:var(--accent);}
.tbtn.danger:hover{border-color:#FF6FA8;color:#FF6FA8;}
.themes{display:flex;gap:5px;padding:4px;background:var(--surface);border-radius:99px;box-shadow:var(--shadow);}
.themes button{width:20px;height:20px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;transition:transform .15s,border-color .15s;}
.themes button:hover{transform:scale(1.12);}
.themes button[data-t="pink"]{background:#FF6FA8;}
.themes button[data-t="blue"]{background:#3B6FA0;}
.themes button[data-t="black"]{background:#15151A;border-color:#444;}
.themes button.active{border-color:var(--ink);}

main{flex:1;padding:0 16px 10px;display:flex;flex-direction:column;gap:8px;}
.sheet{flex:1;background:var(--surface);border-radius:20px;box-shadow:var(--shadow);display:flex;overflow:hidden;border:1px solid var(--line);min-height:0;}
.lines{font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.65;color:var(--gutter);text-align:right;padding:18px 10px;user-select:none;background:color-mix(in srgb,var(--soft) 55%,transparent);min-width:42px;overflow:hidden;}
textarea{flex:1;border:none;outline:none;resize:none;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.65;padding:18px 16px;background:transparent;color:var(--ink);caret-color:var(--accent);overflow-y:auto;}
textarea::placeholder{color:var(--muted);}
.statusbar{display:flex;justify-content:flex-end;gap:14px;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--muted);padding:0 4px 2px;}

/* Delete modal */
.overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.36);align-items:center;justify-content:center;z-index:200;backdrop-filter:blur(4px);}
.overlay.show{display:flex;}
.modal{background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:26px 28px;max-width:290px;width:90%;box-shadow:var(--shadow);text-align:center;}
.modal h2{font-family:'Fraunces',serif;font-size:18px;margin-bottom:7px;}
.modal p{font-size:12.5px;color:var(--muted);line-height:1.6;margin-bottom:20px;}
.modal-btns{display:flex;gap:9px;justify-content:center;}
.modal-btns button{font-family:'Inter',sans-serif;font-size:13px;font-weight:600;padding:9px 20px;border-radius:99px;cursor:pointer;transition:filter .15s;}
#dmCancel{background:var(--surface);color:var(--ink);border:1px solid var(--line);}
#dmConfirm{background:#FF6FA8;color:#fff;border:none;}

@media(max-width:520px){
  .nid{display:none;}
  .tbtn span{display:none;}
  header{padding:10px 14px;}
}
</style>
</head>
<body>
<header>
  <div class="brand">
    <a class="back" href="/">← Danh sách</a>
    <h1>🎀 Note</h1>
    <span class="nid">#${shortId}</span>
  </div>
  <div class="toolbar">
    <div class="status saved" id="status"><span class="dot"></span><span id="statusTxt">Đã lưu</span></div>
    <button class="tbtn" id="copyBtn">Sao chép<span> liên kết</span></button>
    <button class="tbtn danger" id="delBtn">Xóa<span> ghi chú</span></button>
    <div class="themes" id="themes">
      <button data-t="pink" title="Hồng"></button>
      <button data-t="blue" title="Xanh"></button>
      <button data-t="black" title="Đen"></button>
    </div>
  </div>
</header>

<main>
  <div class="sheet">
    <div class="lines" id="lines">1</div>
    <textarea id="ed" placeholder="Bắt đầu ghi chú..." spellcheck="false"></textarea>
  </div>
  <div class="statusbar">
    <span id="sbChars">0 ký tự</span>
    <span id="sbLines">1 dòng</span>
  </div>
</main>

<!-- Delete modal (phải đặt TRƯỚC script dùng nó) -->
<div class="overlay" id="delOverlay">
  <div class="modal">
    <h2>Xóa ghi chú?</h2>
    <p>Hành động này không thể hoàn tác.</p>
    <div class="modal-btns">
      <button id="dmCancel">Hủy</button>
      <button id="dmConfirm">Xóa</button>
    </div>
  </div>
</div>

<script>
// ── Theme ──────────────────────────────────────────────────────────────────
const THEME_COLORS = {pink:'#FBF3F0',blue:'#EEF3F8',black:'#15151A'};
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('themeColor').content = THEME_COLORS[t] || THEME_COLORS.pink;
  localStorage.setItem('note-theme', t);
  document.querySelectorAll('#themes button').forEach(b => b.classList.toggle('active', b.dataset.t === t));
}
applyTheme(localStorage.getItem('note-theme') || 'pink');
document.querySelectorAll('#themes button').forEach(b => b.addEventListener('click', () => applyTheme(b.dataset.t)));

// ── Elements ───────────────────────────────────────────────────────────────
const ed       = document.getElementById('ed');
const linesEl  = document.getElementById('lines');
const statusEl = document.getElementById('status');
const statusTx = document.getElementById('statusTxt');
const sbChars  = document.getElementById('sbChars');
const sbLines  = document.getElementById('sbLines');
const delOverlay = document.getElementById('delOverlay');

// ── Line numbers (sync scroll) ─────────────────────────────────────────────
let lastLineCount = 0;
function updateLines() {
  const n = (ed.value.match(/\\n/g)||[]).length + 1;
  if (n !== lastLineCount) {
    lastLineCount = n;
    linesEl.innerHTML = Array.from({length:n},(_,i)=>i+1).join('<br>');
  }
  // sync scroll
  linesEl.scrollTop = ed.scrollTop;
}
ed.addEventListener('scroll', () => { linesEl.scrollTop = ed.scrollTop; });

// ── Status bar ─────────────────────────────────────────────────────────────
function updateStatusBar() {
  const chars = ed.value.length;
  const lines = (ed.value.match(/\\n/g)||[]).length + 1;
  sbChars.textContent = chars.toLocaleString('vi-VN') + ' ký tự';
  sbLines.textContent = lines.toLocaleString('vi-VN') + ' dòng';
}

// ── Save ───────────────────────────────────────────────────────────────────
function setStatus(s) {
  statusEl.className = 'status ' + s;
  statusTx.textContent = s === 'saving' ? 'Đang lưu...' : 'Đã lưu';
}
let saveTimer, isDirty = false;
function save() {
  isDirty = false;
  setStatus('saving');
  fetch(location.href, {
    method:'PUT', headers:{'content-type':'text/plain;charset=utf-8'}, body:ed.value
  }).then(() => setStatus('saved')).catch(() => setStatus('saved'));
}
ed.addEventListener('input', () => {
  isDirty = true;
  setStatus('saving');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 1000);
  updateLines();
  updateStatusBar();
});

// Cảnh báo khi đóng tab nếu đang lưu
window.addEventListener('beforeunload', e => {
  if (isDirty) { e.preventDefault(); e.returnValue = ''; }
});

// ── Tab key → 2 spaces ────────────────────────────────────────────────────
ed.addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const s = ed.selectionStart, end = ed.selectionEnd;
    ed.value = ed.value.slice(0,s) + '  ' + ed.value.slice(end);
    ed.selectionStart = ed.selectionEnd = s + 2;
    ed.dispatchEvent(new Event('input'));
  }
});

// ── Copy link ─────────────────────────────────────────────────────────────
document.getElementById('copyBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(location.origin + location.pathname).then(() => {
    const btn = document.getElementById('copyBtn');
    const old = btn.innerHTML;
    btn.innerHTML = '💗 Đã sao chép';
    setTimeout(() => btn.innerHTML = old, 1500);
  });
});

// ── Delete modal ───────────────────────────────────────────────────────────
document.getElementById('delBtn').addEventListener('click', () => delOverlay.classList.add('show'));
document.getElementById('dmCancel').addEventListener('click', () => delOverlay.classList.remove('show'));
delOverlay.addEventListener('click', e => e.target === delOverlay && delOverlay.classList.remove('show'));
document.getElementById('dmConfirm').addEventListener('click', async () => {
  delOverlay.classList.remove('show');
  setStatus('saving');
  await fetch(location.href, { method:'DELETE' }).catch(()=>{});
  location.href = '/';
});

// ── Keyboard shortcuts ────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (delOverlay.classList.contains('show')) { delOverlay.classList.remove('show'); return; }
    location.href = '/';
  }
});

// ── Load content ──────────────────────────────────────────────────────────
(async () => {
  try {
    const u = new URL(location.href);
    u.searchParams.set('raw', 'true');
    const r = await fetch(u.href, { headers:{'user-agent':'fetch'} });
    ed.value = await r.text();
  } catch(_) {}
  updateLines();
  updateStatusBar();
})();
</script>
</body>
</html>
`);
        },

        // ── PUT ───────────────────────────────────────────────────────────────
        put: async (req, res) => {
            const uuid = req.params.UUID;
            if (!VALID_UUID.test(uuid)) return res.status(400).end('Invalid UUID');

            const chunks = [];
            req.on('data', c => chunks.push(c));
            await new Promise(r => req.on('end', r));

            const filePath = path.join(notesDir, `${uuid}.txt`);
            if (req.query.raw) {
                if (!fs.existsSync(filePath + '.raw'))
                    fs.writeFileSync(filePath + '.raw', path.join(notesDir, `${req.query.raw}.txt`));
            } else {
                fs.writeFileSync(filePath, Buffer.concat(chunks));
            }
            res.set('cache-control', 'no-store');
            res.end();
        },

        // ── DELETE ────────────────────────────────────────────────────────────
        delete: (req, res) => {
            const uuid = req.params.UUID;
            if (!VALID_UUID.test(uuid)) return res.status(400).json({ error: 'UUID không hợp lệ' });

            const filePath = path.join(notesDir, `${uuid}.txt`);
            if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Không tìm thấy note' });

            fs.unlinkSync(filePath);
            if (fs.existsSync(filePath + '.raw')) fs.unlinkSync(filePath + '.raw');
            res.json({ ok: true, uuid });
        },
    },
};
