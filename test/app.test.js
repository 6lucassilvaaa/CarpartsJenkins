import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../src/app.js';

const server = createServer({ commit: 'test-commit' });
let base;
before(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
test('health identifica exatamente o commit publicado', async () => {
  const response = await fetch(`${base}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', service: 'carparts', commit: 'test-commit' });
});
test('catálogo tem preço inteiro em centavos e nenhuma credencial', async () => {
  const response = await fetch(`${base}/api/parts`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.items.length, 3);
  assert.ok(body.items.every(part => Number.isInteger(part.priceCents) && part.stock >= 0));
  assert.equal(body.currency, 'BRL');
});
test('cotação calcula valor sem erro de ponto flutuante', async () => {
  const response = await fetch(`${base}/api/quote`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sku: 'CP-001', quantity: 3 }) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).totalCents, 10770);
});
for (const quantity of [0, -1, 1.5, 121, '3']) {
  test(`cotação rejeita quantidade ${JSON.stringify(quantity)}`, async () => {
    const response = await fetch(`${base}/api/quote`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sku: 'CP-001', quantity }) });
    assert.equal(response.status, 400);
  });
}
test('cotação rejeita JSON malformado', async () => {
  const response = await fetch(`${base}/api/quote`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' });
  assert.equal(response.status, 400);
});
test('cotação limita tamanho do corpo', async () => {
  const response = await fetch(`${base}/api/quote`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: 'x'.repeat(9000) }) });
  assert.equal(response.status, 413);
});
test('rota inexistente retorna 404', async () => {
  assert.equal((await fetch(`${base}/missing`)).status, 404);
});
