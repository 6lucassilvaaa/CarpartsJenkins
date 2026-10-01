import http from 'node:http';

export const parts = Object.freeze([
  { sku: 'CP-001', name: 'Filtro de óleo', priceCents: 3590, stock: 120 },
  { sku: 'CP-002', name: 'Pastilha de freio', priceCents: 12990, stock: 48 },
  { sku: 'CP-003', name: 'Correia dentada', priceCents: 8990, stock: 75 }
]);

// Catálogo demonstrativo; nenhuma conexão com ERP ou dado real de cliente.
export function createServer({ commit = process.env.APP_COMMIT || 'local' } = {}) {
  return http.createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'no-store');
    const reply = (status, body) => {
      response.writeHead(status);
      response.end(JSON.stringify(body));
    };
    const path = new URL(request.url, 'http://localhost').pathname;
    if (request.method === 'GET' && path === '/health') {
      return reply(200, { status: 'ok', service: 'carparts', commit });
    }
    if (request.method === 'GET' && path === '/api/parts') {
      return reply(200, { items: parts, currency: 'BRL', demo: true });
    }
    if (request.method === 'POST' && path === '/api/quote') {
      if (!request.headers['content-type']?.startsWith('application/json')) {
        return reply(415, { error: 'Use application/json' });
      }
      try {
        let body = '';
        for await (const chunk of request) {
          body += chunk;
          if (Buffer.byteLength(body) > 8192) {
            return reply(413, { error: 'Corpo excede 8 KB' });
          }
        }
        const { sku, quantity } = JSON.parse(body);
        const part = parts.find(item => item.sku === sku);
        if (!part || !Number.isInteger(quantity) || quantity < 1 || quantity > part.stock) {
          return reply(400, { error: 'SKU ou quantidade inválida' });
        }
        return reply(200, { sku, quantity, totalCents: part.priceCents * quantity, currency: 'BRL', demo: true });
      } catch {
        return reply(400, { error: 'JSON inválido' });
      }
    }
    return reply(404, { error: 'Rota não encontrada' });
  });
}
