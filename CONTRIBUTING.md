# Contributing

## This repository is public

Everything here is visible to everyone, including commit history. Keep internal references out of commits, pull requests, branch names, code and docs. That includes:

- links to AI assistant sessions
- internal issue tracker IDs and links
- internal hostnames and URLs
- links to internal documents
- API keys, tokens and other secrets

Describe changes in terms of what they do, not the internal ticket that asked for them.

## Before you open a pull request

```bash
npm run lint
```

```bash
npm run typecheck
```

CI runs both on every pull request.

## Adding a sample

Put each sample in its own directory under `samples/`. See [`samples/README.md`](samples/README.md) for what a sample needs.

## Releases

Release tags match the guide version (`v1`, `v2`, …). Tag a release when the guide and the samples for that version are complete.
