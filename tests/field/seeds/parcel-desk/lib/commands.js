'use strict';
const store = require('./store');

function fmt(p) {
  const memo = p.memo ? `  ${p.memo}` : '';
  const out = p.out_at ? `  수령 ${p.out_at}` : '';
  return `${String(p.id).padStart(3, ' ')}  ${p.dong}동 ${p.ho}호  ${p.carrier}  ${p.in_at}${memo}${out}`;
}

function run(cmd, args, dir) {
  const data = store.load(dir);
  if (cmd === 'in') {
    const [dong, ho, carrier, ...memo] = args;
    if (!dong || !ho || !carrier) return { code: 2, out: '사용법: parcel in <동> <호> <택배사> [메모]' };
    const p = { id: store.nextId(data), dong, ho, carrier, memo: memo.join(' '), in_at: store.stamp(), out_at: null };
    data.parcels.push(p);
    store.save(dir, data);
    return { code: 0, out: `접수 ${p.id}: ${dong}동 ${ho}호 ${carrier}` };
  }
  if (cmd === 'out') {
    const id = Number(args[0]);
    const p = data.parcels.find((x) => x.id === id);
    if (!p) return { code: 1, out: `없는 번호: ${args[0] === undefined ? '(없음)' : args[0]}` };
    if (p.out_at) return { code: 1, out: `이미 수령: ${id} (${p.out_at})` };
    p.out_at = store.stamp();
    store.save(dir, data);
    return { code: 0, out: `수령 ${id}: ${p.dong}동 ${p.ho}호` };
  }
  if (cmd === 'list') {
    const kept = data.parcels.filter((x) => !x.out_at);
    return { code: 0, out: kept.length ? kept.map(fmt).join('\n') : '보관 중인 택배 없음' };
  }
  if (cmd === 'find') {
    const [dong, ho] = args;
    if (!dong || !ho) return { code: 2, out: '사용법: parcel find <동> <호>' };
    const hit = data.parcels.filter((x) => x.dong === dong && x.ho === ho);
    return { code: 0, out: hit.length ? hit.map(fmt).join('\n') : `${dong}동 ${ho}호: 택배 없음` };
  }
  return { code: 2, out: '사용법: parcel in|out|list|find' };
}

module.exports = { run, fmt };
