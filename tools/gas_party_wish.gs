/* ================= 動画同時視聴 → やりたいことの「みたいもの」に入れる =================
 * キコハウスのGAS（api.gs）に貼る。合言葉なし（動画同時視聴のページはログインしないため）。
 *
 * 貼り方：
 *  1. このファイルの中身を api.gs のいちばん下に貼る
 *  2. doPost の「if (req && /^__widget/ ...」の行の上に、次の1行を足す
 *       if (req && req.fn === 'party_wish') return apiOut_(partyWish_(req));
 *  3. 「デプロイを管理」→ APIのデプロイ（config.json の api_url のもの）を「新しいバージョン」で更新
 *
 * いたずらよけ：YouTubeの動画だけ・題名はYouTubeから取り直す・同じ動画は1回だけ・1日30本まで
 */
const PARTY_WISH_CAT_ = ['watch', 'みたいもの', 'do'];
function partyWish_(req) {
  const raw = String((req && req.url) || '').slice(0, 300);
  const m = raw.match(/^[\w-]{11}$/) ? [0, raw] : raw.match(/(?:youtu\.be\/|[?&]v=|\/(?:shorts|live|embed)\/)([\w-]{11})/);
  if (!m) return { error: 'YouTubeの動画ではありません' };
  const vid = m[1], url = 'https://www.youtube.com/watch?v=' + vid;
  const cache = CacheService.getScriptCache(), ck = 'pwish_' + jst_('yyyyMMdd'), n = Number(cache.get(ck) || 0);
  if (n >= 30) return { error: '今日はもう入れられません' };
  // 入れた人：動画同時視聴の名前がふたりの名前と同じならその人、ちがえば はまもと
  const nm = String((req && req.name) || '').trim();
  let by = 'owner';
  for (const k in NAMES) if (NAMES[k] && nm && (nm === NAMES[k] || nm.indexOf(NAMES[k]) >= 0)) by = k;
  const title = (watchTitle_(url) || 'YouTubeの動画').slice(0, 100);
  const ss = shareSs_();
  if (!ss) return { error: '保存先がありません' };
  const sh = sheet_(ss, ITEM_SHEET, ITEM_HEADER);
  let dup = false, id = '';
  withLock_(() => {
    const rows = readRows_(sh, 3);
    let catRow = 0, cats = null;
    rows.forEach((r, i) => {
      if (String(r[0]) === 'wishes') {
        try { const w = JSON.parse(r[2]); if (!w.done && String(w.url || '').indexOf(vid) >= 0) dup = true; } catch (e) {}
      } else if (String(r[0]) === 'kv' && String(r[1]) === 'wcats') {
        catRow = i + 2; try { cats = JSON.parse(r[2]); } catch (e) {}
      }
    });
    if (dup) return;
    const now = new Date();
    // 「みたいもの」の分類がまだなければ足す
    if (!Array.isArray(cats)) cats = [];
    if (!cats.some(c => Array.isArray(c) && c[0] === PARTY_WISH_CAT_[0])) {
      cats.push(PARTY_WISH_CAT_);
      if (catRow) sh.getRange(catRow, 3, 1, 3).setValues([[JSON.stringify(cats), now, by]]);
      else sh.appendRow(['kv', 'wcats', JSON.stringify(cats), now, by]);
    }
    const ts = Date.now();
    id = 'w' + ts;
    const w = { id: id, name: title, by: by, cat: PARTY_WISH_CAT_[0], url: url, memo: '動画同時視聴から', place: '', photo: '', done: false, doneTs: 0, ts: ts };
    sh.appendRow(['wishes', id, JSON.stringify(w), now, by]);
  });
  if (dup) return { ok: true, dup: true };
  cache.put(ck, String(n + 1), 21600);
  // 相手に通知（いばやしさんの勤務中は、勤務終了30分後にまとめて）
  try {
    const other = by === 'owner' ? 'partner' : 'owner';
    const body = (NAMES[by] || '') + 'がみたいものに『' + title.slice(0, 60) + '』を追加しました';
    const until = pushHoldUntil_(other);
    if (until) pushHold_(other, body, 'wish/' + id, until); else pushTo_(other, 'キコハウス', body, 'wish/' + id);
  } catch (e) {}
  return { ok: true, title: title };
}
