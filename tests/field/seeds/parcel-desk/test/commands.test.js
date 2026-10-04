'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { run } = require('../lib/commands');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'parcel-cmd-'));

test('in → list → out → list 왕복', () => {
  const d = tmp();
  assert.deepEqual(run('in', ['101', '1203', 'CJ대한통운', '문 앞'], d), { code: 0, out: '접수 1: 101동 1203호 CJ대한통운' });
  assert.deepEqual(run('in', ['102', 'B01', '한진'], d), { code: 0, out: '접수 2: 102동 B01호 한진' });
  const list = run('list', [], d);
  assert.equal(list.code, 0);
  assert.equal(list.out.split('\n').length, 2);
  assert.match(list.out, /1  101동 1203호  CJ대한통운  \d{4}-\d{2}-\d{2} \d{2}:\d{2}  문 앞/);
  assert.deepEqual(run('out', ['1'], d), { code: 0, out: '수령 1: 101동 1203호' });
  assert.equal(run('list', [], d).out.split('\n').length, 1);
  assert.equal(run('out', ['1'], d).code, 1, '두 번 수령은 거부');
});

test('find는 수령된 것도 보여 준다, 없으면 한 줄', () => {
  const d = tmp();
  run('in', ['101', '1203', '우체국'], d);
  run('out', ['1'], d);
  assert.match(run('find', ['101', '1203'], d).out, /우체국.*수령 \d{4}/);
  assert.deepEqual(run('find', ['103', '101'], d), { code: 0, out: '103동 101호: 택배 없음' });
});

test('잘못된 입력은 사용법과 0이 아닌 코드', () => {
  const d = tmp();
  assert.equal(run('in', ['101'], d).code, 2);
  assert.equal(run('out', ['99'], d).code, 1);
  assert.equal(run('find', [], d).code, 2);
  assert.equal(run('wat', [], d).code, 2);
});
