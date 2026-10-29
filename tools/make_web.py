"""GAS用の index.html から、GitHub Pages で動く app.html を作る。

使い方: python3 tools/make_web.py <GASのindex.html>
google.script.run などを、APIデプロイへの fetch に置き換える小さな部品を先頭に入れる。
"""
import sys, json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
cfg = json.loads((root / 'config.json').read_text(encoding='utf-8'))
src = Path(sys.argv[1]).read_text(encoding='utf-8')

boot_line = ('<script>window.__MODE=<?!= JSON.stringify(mode) ?>;window.__URL=<?!= JSON.stringify(url) ?>;'
             'window.__NAMES=<?!= JSON.stringify(names) ?>;</script>')
assert src.count(boot_line) == 1, 'boot line not found'

shim = (root / 'tools' / 'shim.js').read_text(encoding='utf-8').replace('__API_URL__', cfg['api_url'])
head = '\n'.join([
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    '<title>キコハウス</title>',
    '<meta name="theme-color" content="#cfc6c3" media="(prefers-color-scheme: light)">',
    '<meta name="theme-color" content="#1a1716" media="(prefers-color-scheme: dark)">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-title" content="キコハウス">',
    '<style>html:has(.phonev:not([hidden])),body:has(.phonev:not([hidden])){background:var(--desk)}</style>',
    '<link rel="manifest" href="manifest.webmanifest">',
    '<link rel="icon" href="icon-192.png">',
    '<link rel="apple-touch-icon" href="apple-touch-icon.png">',
    '<script>' + shim + '</script>',
    '<script src="https://www.gstatic.com/firebasejs/%s/firebase-app-compat.js"></script>' % cfg['firebase_sdk'],
    '<script src="https://www.gstatic.com/firebasejs/%s/firebase-messaging-compat.js"></script>' % cfg['firebase_sdk'],
    '<style>.ai.p-push{background:#fbf0cf}</style>',
])
out = src.replace(boot_line, head, 1)

# お金の計画の数字は公開の場所に置かず、ログインした人にだけAPIから渡す
a = out.index('  const TOTAL0=')
b = out.index('  const BUDGET={', a)
depth = 0
for i in range(out.index('{', b), len(out)):
    if out[i] == '{': depth += 1
    elif out[i] == '}':
        depth -= 1
        if depth == 0: break
end = out.index(';', i) + 1
block = out[a:end]
liv = "const PAYPLAN={},LIVING={'2026-10':"
k = out.index(liv); k2 = out.index('}', k + len(liv))
living0 = out[k + len(liv) - len("{'2026-10':"):k2 + 1]
js = block + '\nconsole.log(JSON.stringify({TOTAL0,RENT,GOAL,DUE_DAY,START,END,PLAN,RESERVE,BUDGET,LIVING0:' + living0 + '}));'
import subprocess
plan = json.loads(subprocess.run(['node', '-e', js], capture_output=True, text=True, check=True).stdout)
out = out[:k + len(liv) - len("{'2026-10':")] + 'Object.assign({},LIVING0)' + out[k2 + 1:]
out = out[:a] + '  const {TOTAL0,RENT,GOAL,DUE_DAY,START,END,PLAN,RESERVE,BUDGET,LIVING0}=window.__PLAN;' \
    + 'document.querySelectorAll("[data-plan]").forEach(e=>{e.textContent=Number(window.__PLAN[e.dataset.plan]).toLocaleString();});' + out[end:]
for num in [format(plan['TOTAL0'], ','), str(plan['TOTAL0'])]:
    out = out.replace(num, '')
for key in ['RENT', 'GOAL']:
    out = out.replace(format(plan[key], ',') + '円', '<span data-plan="' + key + '"></span>円')
(root / 'private').mkdir(exist_ok=True)
push = (root / 'tools' / 'push.js').read_text(encoding='utf-8').replace('__FIREBASE__', json.dumps(cfg['firebase'])).replace('__VAPID__', cfg['vapid'])
out = out.rstrip() + '\n<script>' + push + '</script>\n'
out += '<script>' + (root / 'tools' / 'ptr.js').read_text(encoding='utf-8') + '</script>\n'
assert '<?' not in out, 'scriptlet left'

# 画面の中身は公開の場所に読める形で置かない。鍵（private/）はAPIがログインした人にだけ渡す
import base64, os
key_file = root / 'private' / 'app.key'
if not key_file.exists(): key_file.write_text(base64.b64encode(os.urandom(32)).decode())
key = key_file.read_text().strip()
enc = subprocess.run(['node', '-e', '''
const c=require('crypto'),fs=require('fs');const k=Buffer.from(process.argv[1],'base64'),iv=c.randomBytes(12);
const x=c.createCipheriv('aes-256-gcm',k,iv);const ct=Buffer.concat([x.update(fs.readFileSync(0)),x.final()]);
process.stdout.write(Buffer.concat([iv,ct,x.getAuthTag()]));''', key], input=out.encode('utf-8'), capture_output=True, check=True).stdout
(root / 'app.bin').write_bytes(enc)
shell = (root / 'tools' / 'shell.html').read_text(encoding='utf-8').replace('__API_URL__', cfg['api_url'])
(root / 'app.html').write_text(shell, encoding='utf-8')
(root / 'private' / 'app-plain.html').write_text(out, encoding='utf-8')
print('app.bin', len(enc))

# APIで呼んでよい関数（アプリが実際に使うものだけ）
import re
d = out.replace('\\n', '\n')
allow = set(re.findall(r"call\('([A-Za-z]\w*)'", d))
allow |= set(re.findall(r"with(?:Failure|Success)Handler\([^()]*(?:\([^()]*\))?[^()]*\)\.([A-Za-z]\w*)\(", d))
km = re.search(r"\[([^\]]*)\]\.forEach\(k=>\{r\[k\]=\(\.\.\.a\)=>google\.script\.run[^;]*\['kiko_'\+k\]", d)
allow |= {'kiko_' + x for x in re.findall(r"'(\w+)'", km.group(1))}
for q in re.findall(r"\[('(?:set|delete)[A-Z]\w*','(?:set|delete)[A-Z]\w*')\]", d): allow |= set(re.findall(r"'(\w+)'", q))
allow |= set(re.findall(r"call\(own\(\)\?'(\w+)':'(\w+)'\)", d)[0])
allow = sorted(x for x in allow if not x.startswith('with') and not x.endswith('_'))

loader = (root / 'tools' / 'loader.html').read_text(encoding='utf-8')
loader = loader.replace('__LOGIN_URL__', cfg['login_url']).replace('__API_URL__', cfg['api_url'])
(root / 'index.html').write_text(loader, encoding='utf-8')
print('index.html', len(loader))

sw = (root / 'tools' / 'sw.js').read_text(encoding='utf-8').replace('__FIREBASE__', json.dumps(cfg['firebase'])).replace('__SDK__', cfg['firebase_sdk'])
(root / 'sw.js').write_text(sw, encoding='utf-8')
print('sw.js', len(sw))

plan_gs = ('/** 公開しない設定（tools/make_web.py が作る。手で直さない） */\nconst PLAN_DATA = '
           + json.dumps(plan, ensure_ascii=False) + ';\nconst APP_KEY = ' + json.dumps(key) + ';\nconst API_ALLOW = '
           + json.dumps(allow) + ';\n')
(root / 'private' / 'PlanData.gs').write_text(plan_gs, encoding='utf-8')
print('allow', len(allow))
