## Morpho Blue Envio

This is the indexer for Morpho Blue
### Run

```bash
pnpm dev
```

Set `ENVIO_API_TOKEN` in `.env` before running locally.

For the first local run after migrating an existing V2 database, use:

```bash
pnpm dev -r
```

Visit http://localhost:8080 to see the GraphQL Playground, local password is `testing`.

### Generate files from `config.yaml` or `schema.graphql`

```bash
pnpm codegen
```

### Pre-requisites

- [Node.js (use v22 or newer)](https://nodejs.org/en/download/current)
- [pnpm (use v8 or newer)](https://pnpm.io/installation)
- [Docker desktop](https://www.docker.com/products/docker-desktop/)
