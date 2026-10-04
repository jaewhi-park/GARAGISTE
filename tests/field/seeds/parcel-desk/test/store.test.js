'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const store = require('../lib/store');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'parcel-store-'));

test('빈 폴더는 빈 대장', () => {
  assert.deepEqual(store.load(tmp()), { parcels: [] });
});

test('save 뒤 load는 같다', () => {
  const d = tmp();
  const data = { parcels: [{ id: 1, dong: '101', ho: '1203', carrier: 'CJ대한통운', memo: '', in_at: '2026-04-02 09:12', out_at: null }] };
  store.save(d, data);
  assert.deepEqual(store.load(d), data);
});

test('nextId는 최대 번호 + 1', () => {
  assert.equal(store.nextId({ parcels: [] }), 1);
  assert.equal(store.nextId({ parcels: [{ id: 3 }, { id: 7 }, { id: 5 }] }), 8);
});

// 오늘 날짜가 박힌 테스트 — 쓴 날에만 통과한다(실제 세상의 흠)
test('stamp는 오늘 날짜로 시작한다', () => {
  assert.ok(store.stamp().startsWith('2026-10-04'), store.stamp());
});

test.skip('잠긴 파일은 다음에 다시 본다 — 윈도우에서만', () => {});
