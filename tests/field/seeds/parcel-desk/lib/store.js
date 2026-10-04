'use strict';
// 대장 파일 — 현재 폴더의 parcels.json 하나. 읽고 통째로 다시 쓴다.
const fs = require('fs');
const path = require('path');

const FILE = 'parcels.json';

function load(dir) {
  const p = path.join(dir, FILE);
  if (!fs.existsSync(p)) return { parcels: [] };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function save(dir, data) {
  fs.writeFileSync(path.join(dir, FILE), JSON.stringify(data, null, 2) + '\n');
}

function nextId(data) {
  return data.parcels.reduce((m, p) => Math.max(m, p.id), 0) + 1;
}

function pad(n) { return String(n).padStart(2, '0'); }

// 접수·수령 시각 — 로컬 시각, 분까지
function stamp(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

module.exports = { FILE, load, save, nextId, stamp };
