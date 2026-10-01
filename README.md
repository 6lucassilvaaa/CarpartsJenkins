# Carparts + Jenkins + Azure

Laboratório de CI/CD com uma API B2B demonstrativa Node.js 24, sem dependências de terceiros e sem dados reais de ERP. A infraestrutura ainda depende de execução/validação em Docker e Azure; consulte o estado real em [Execução](docs/EXECUCAO.md).

```sh
npm ci
npm run lint
npm run test:ci
npm start
```

Endpoints:

- `GET /health`: status e commit da imagem.
- `GET /api/parts`: catálogo fictício em BRL, preços em centavos.
- `POST /api/quote`: `{ "sku": "CP-001", "quantity": 3 }`, cotação demonstrativa sem persistência.

```sh
docker build --build-arg APP_COMMIT=$(git rev-parse HEAD) -t carparts:local .
docker run --rm -p 127.0.0.1:3000:3000 carparts:local
SMOKE_URL=http://localhost:3000 EXPECTED_COMMIT=$(git rev-parse HEAD) npm run smoke
```

[Arquitetura E1](docs/ARQUITETURA.md) · [Execução e pendências E2–E6](docs/EXECUCAO.md)

`npm run lint` verifica sintaxe de todos os scripts; `test:ci` executa testes de comportamento HTTP e gera `reports/junit.xml`. O pipeline publica apenas main, identifica imagens por commit/build, resolve o digest, testa staging e exige aprovação antes de reutilizar o mesmo digest em produção.

Fontes oficiais: [Jenkins em Docker](https://www.jenkins.io/doc/book/installing/docker/), [JCasC](https://plugins.jenkins.io/configuration-as-code/), [Azure CLI Container Apps](https://learn.microsoft.com/en-us/cli/azure/containerapp), [Escala de Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/scale-app).
