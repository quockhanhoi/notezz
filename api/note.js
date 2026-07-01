const fs = require('fs');
const path = require('path');

const notesDir = path.join(__dirname, '../note');

if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true });
}

module.exports = {
    info: {
        path: '/note/:UUID',
        title: 'Note API',
        desc: 'API for creating and retrieving notes',
        example_url: [
            { method: 'GET', query: '/note/:UUID', desc: 'Retrieve a note' },
            { method: 'PUT', query: '/note/:UUID', desc: 'Create or update a note' }
        ]
    },
    methods: {
        get: (req, res) => {
            const uuid = req.params.UUID;

            if (!uuid || uuid === ':UUID' || uuid.length > 36) {
                res.redirect(`./${require('uuid').v4()}`);
                return;
            }

            const filePath = path.join(notesDir, `${uuid}.txt`);
            const text = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';

            if (fs.existsSync(filePath + '.raw')) {
                const rawFilePath = fs.readFileSync(filePath + '.raw', 'utf8');
                
                if (fs.existsSync(rawFilePath)) {
                    res.set('content-type', 'text/plain');
                    res.end(fs.readFileSync(rawFilePath, 'utf8'));
                    return;
                } else {
                    res.status(404).end();
                    return;
                }
            }

            if (req.query.raw == 'true' || !/^Mozilla/.test(req.headers['user-agent'])) {
                res.set('content-type', 'text/plain');
                res.end(text);
                return;
            }

            res.set('content-type', 'text/html');
            res.end(`<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Note · ${uuid.slice(0, 8)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#FBF3F0; --surface:#FFFFFF; --ink:#3A2A2E; --muted:#9C8388;
    --accent:#E2657B; --accent-soft:#F6D9DF; --line:#EFD9DD; --gutter:#C98E9B;
    --shadow: 0 18px 40px -22px rgba(58,42,46,.35);
  }
  html[data-theme="blue"]{
    --bg:#EEF3F8; --surface:#FFFFFF; --ink:#1F2D3D; --muted:#7D93A8;
    --accent:#3B6FA0; --accent-soft:#D6E4F0; --line:#DCE6EF; --gutter:#7FA0C0;
    --shadow: 0 18px 40px -22px rgba(31,45,61,.35);
  }
  html[data-theme="black"]{
    --bg:#15151A; --surface:#1D1D24; --ink:#ECE9E6; --muted:#7A7A85;
    --accent:#E0B454; --accent-soft:#2C2A22; --line:#2B2B33; --gutter:#5C5C68;
    --shadow: 0 18px 40px -22px rgba(0,0,0,.6);
  }
  *{box-sizing:border-box;}
  body{
    margin:0; min-height:100vh; background:var(--bg);
    font-family:'Inter',sans-serif; color:var(--ink);
    transition: background .35s ease, color .35s ease;
    display:flex; flex-direction:column;
  }
  header{
    display:flex; align-items:center; justify-content:space-between;
    padding:16px 22px; gap:12px; flex-wrap:wrap;
  }
  .brand{display:flex; align-items:baseline; gap:10px;}
  .brand h1{
    font-family:'Fraunces',serif; font-weight:600; font-size:21px; margin:0;
    letter-spacing:.2px;
  }
  .brand .id{
    font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--muted);
  }
  .status{
    font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--muted);
    display:flex; align-items:center; gap:6px;
  }
  .status .dot{
    width:6px; height:6px; border-radius:50%; background:var(--muted);
    transition: background .2s ease;
  }
  .status.saving .dot{ background:var(--accent); animation:pulse 1s infinite ease-in-out; }
  .status.saved .dot{ background:#5FAE7A; }
  @keyframes pulse{ 0%,100%{opacity:1} 50%{opacity:.35} }

  .toolbar{ display:flex; align-items:center; gap:14px; }
  .themes{ display:flex; gap:7px; padding:5px; background:var(--surface); border-radius:99px; box-shadow:var(--shadow); }
  .themes button{
    width:22px; height:22px; border-radius:50%; border:2px solid transparent; cursor:pointer;
    padding:0; position:relative; transition: transform .15s ease, border-color .15s ease;
  }
  .themes button:hover{ transform:scale(1.12); }
  .themes button[data-t="pink"]{ background:#E2657B; }
  .themes button[data-t="blue"]{ background:#3B6FA0; }
  .themes button[data-t="black"]{ background:#15151A; border-color:#3a3a42; }
  .themes button.active{ border-color: var(--ink); }

  .copy-btn{
    font-family:'Inter',sans-serif; font-size:12px; font-weight:600;
    background:var(--surface); color:var(--ink); border:1px solid var(--line);
    padding:7px 13px; border-radius:99px; cursor:pointer; box-shadow:var(--shadow);
    transition: border-color .15s ease, color .15s ease;
  }
  .copy-btn:hover{ border-color:var(--accent); color:var(--accent); }

  main{ flex:1; padding:0 22px 22px; display:flex; }
  .sheet{
    flex:1; background:var(--surface); border-radius:18px; box-shadow:var(--shadow);
    display:flex; overflow:hidden; border:1px solid var(--line);
  }
  .lines{
    font-family:'JetBrains Mono',monospace; font-size:13px; line-height:1.65;
    color:var(--gutter); text-align:right; padding:20px 12px; user-select:none;
    background: color-mix(in srgb, var(--accent-soft) 55%, transparent);
    min-width:46px; white-space:pre;
  }
  textarea{
    flex:1; border:none; outline:none; resize:none;
    font-family:'JetBrains Mono',monospace; font-size:13px; line-height:1.65;
    padding:20px 18px; background:transparent; color:var(--ink); white-space:pre;
    caret-color: var(--accent);
  }
  textarea::placeholder{ color:var(--muted); }
  footer{
    text-align:center; font-family:'JetBrains Mono',monospace; font-size:10.5px;
    color:var(--muted); padding:0 0 14px;
  }
  .back-link{
    font-family:'Inter',sans-serif;font-size:12px;color:var(--muted);
    text-decoration:none;display:flex;align-items:center;gap:4px;
    transition:color .15s;
  }
  .back-link:hover{color:var(--ink);}
  .del-note-btn{
    font-family:'Inter',sans-serif;font-size:12px;font-weight:600;
    background:none;color:var(--muted);border:1px solid var(--line);
    padding:7px 13px;border-radius:99px;cursor:pointer;box-shadow:var(--shadow);
    transition:color .15s,border-color .15s;
  }
  .del-note-btn:hover{color:#E2657B;border-color:#E2657B;}
  @media (max-width:560px){
    .lines{ min-width:32px; padding:16px 8px; }
    textarea{ padding:16px 12px; }
  }
</style>
</head>
<body>
  <header>
    <div class="brand">
      <a class="back-link" href="/">← Danh sách</a>
      <h1>Note</h1>
      <span class="id">#${uuid.slice(0, 8)}</span>
    </div>
    <div class="toolbar">
      <div class="status saved" id="status"><span class="dot"></span><span id="statusText">Đã lưu</span></div>
      <button class="copy-btn" id="copyBtn">Sao chép liên kết</button>
      <button class="del-note-btn" id="delNoteBtn">Xóa ghi chú</button>
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
      <textarea id="editor" placeholder="Bắt đầu ghi chú..." spellcheck="false"></textarea>
    </div>
  </main>
  <footer>Tự động lưu sau 1 giây ngừng gõ</footer>

<script>
(function(){
  const saved = localStorage.getItem('note-theme') || 'pink';
  document.documentElement.setAttribute('data-theme', saved);
  document.querySelectorAll('#themes button').forEach(b => {
    if (b.dataset.t === saved) b.classList.add('active');
    b.addEventListener('click', () => {
      document.documentElement.setAttribute('data-theme', b.dataset.t);
      localStorage.setItem('note-theme', b.dataset.t);
      document.querySelectorAll('#themes button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
    });
  });
})();

const textarea = document.getElementById('editor');
const lines = document.getElementById('lines');
const statusEl = document.getElementById('status');
const statusText = document.getElementById('statusText');
const copyBtn = document.getElementById('copyBtn');

const update_lines = (texts = textarea.value.split('\\n')) => {
  if (texts.length === 1 || texts.length !== lines.innerHTML.split('<br>').length) {
    lines.innerHTML = texts.map((e, i) => (i + 1)).join('<br>');
  }
};

const setStatus = (state) => {
  statusEl.className = 'status ' + state;
  statusText.textContent = state === 'saving' ? 'Đang lưu...' : 'Đã lưu';
};

const put = () => {
  setStatus('saving');
  fetch(location.href, {
    method: 'PUT',
    headers: { 'content-type': 'text/plain; charset=utf-8' },
    body: textarea.value,
  }).then(() => setStatus('saved'));
};

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(location.href.split('?')[0]).then(() => {
    const old = copyBtn.textContent;
    copyBtn.textContent = 'Đã sao chép!';
    setTimeout(() => copyBtn.textContent = old, 1400);
  });
});

let putt;
const u = new URL(location.href);
u.searchParams.append('raw', 'true');

fetch(u.href, { method: 'GET', headers: { 'user-agent': 'fetch' } })
  .then(r => r.text())
  .then(t => {
    textarea.value = t;
    update_lines();
    textarea.addEventListener('input', function () {
      if (putt) clearTimeout(putt);
      setStatus('saving');
      putt = setTimeout(put, 1000);
      update_lines();
    });
  });

document.getElementById('delNoteBtn').addEventListener('click', async () => {
  if (!confirm('Xóa ghi chú này? Hành động không thể hoàn tác.')) return;
  await fetch(location.href, { method: 'DELETE' });
  window.location.href = '/';
});
</script>
</body>
</html>
`)
        },
        put: async (req, res) => {
            const chunks = [];

            req.on('data', chunk => chunks.push(chunk));
            await new Promise(resolve => req.on('end', resolve));

            const uuid = req.params.UUID;
            const filePath = path.join(notesDir, `${uuid}.txt`);

            if (req.query.raw) {
                if (!fs.existsSync(filePath + '.raw')) {
                    fs.writeFileSync(filePath + '.raw', path.join(notesDir, `${req.query.raw}.txt`));
                }
            } else {
                fs.writeFileSync(filePath, Buffer.concat(chunks));
            }

            res.end();
        },
        delete: (req, res) => {
            const uuid = req.params.UUID;
            if (!uuid || uuid.length > 36) return res.status(400).json({ error: 'UUID không hợp lệ' });

            const filePath = path.join(notesDir, `${uuid}.txt`);
            if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Không tìm thấy note' });

            fs.unlinkSync(filePath);
            const rawPath = filePath + '.raw';
            if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);

            res.json({ ok: true, uuid });
        },
    },
};