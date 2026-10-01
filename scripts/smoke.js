import assert from 'node:assert/strict';
const base = process.env.SMOKE_URL;
if (!base) throw new Error('Defina SMOKE_URL');
const expected = process.env.EXPECTED_COMMIT;
let lastError;
for (let attempt = 1; attempt <= 20; attempt++) {
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/health`, { signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'ok');
    if (expected) assert.equal(body.commit, expected);
    console.log(JSON.stringify({ url: base, health: body, checkedAt: new Date().toISOString() }));
    process.exit(0);
  } catch (error) {
    lastError = error;
    if (attempt < 20) await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
throw lastError;
