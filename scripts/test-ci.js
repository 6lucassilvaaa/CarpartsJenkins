import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
mkdirSync('reports', { recursive: true });
const result = spawnSync(process.execPath, ['--test', '--test-reporter=spec', '--test-reporter=junit', '--test-reporter-destination=stdout', '--test-reporter-destination=reports/junit.xml', 'test/app.test.js'], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;
