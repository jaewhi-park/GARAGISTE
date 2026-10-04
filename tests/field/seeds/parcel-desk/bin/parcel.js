#!/usr/bin/env node
'use strict';
const { run } = require('../lib/commands');

const [cmd, ...args] = process.argv.slice(2);
const r = run(cmd, args, process.cwd());
if (r.out) process.stdout.write(r.out + '\n');
process.exit(r.code);
