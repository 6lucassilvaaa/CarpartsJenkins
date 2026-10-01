import { createServer } from './app.js';

const port = Number(process.env.PORT || 3000);
const server = createServer();
server.listen(port, '0.0.0.0', () => console.log(`Carparts na porta ${port}`));
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
