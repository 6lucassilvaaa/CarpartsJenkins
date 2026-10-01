import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
let failed = false;
for (const directory of ['src', 'scripts', 'test']) {
  for (const file of readdirSync(directory).filter(file => file.endsWith('.js'))) {
    const result = spawnSync(process.execPath, ['--check', `${directory}/${file}`], { stdio: 'inherit' });
    failed ||= result.status !== 0;
  }
}
process.exitCode = failed ? 1 : 0;
