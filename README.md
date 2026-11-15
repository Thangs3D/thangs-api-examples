# thangs-api-examples

Documentation and example code for the Thangs API.

- [`docs/`](docs/index.md) — the API integration guide, published at <https://thangs3d.github.io/thangs-api-examples/>
- [`samples/`](samples) — small, standalone sample apps, one per part of the guide

## Development

Requires Node.js 26 or later.

```bash
npm install
```

```bash
npm run lint
```

```bash
npm run typecheck
```

`npm run format` fixes formatting.

### Docs site

The guide is a [VitePress](https://vitepress.dev) site built from the Markdown in `docs/`. Pushes to `main` deploy it to GitHub Pages.

```bash
npm run docs:dev
```

```bash
npm run docs:build
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
