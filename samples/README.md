# Samples

Each sample is a standalone project in its own directory, with:

- a `README.md` that links to the guide section it demonstrates
- an `.env.example` listing the variables it needs, such as `THANGS_API_KEY`
- a `tsconfig.json` that extends [`../tsconfig.base.json`](../tsconfig.base.json)

Keep your API key on the server. Browser code should call only the sample's own backend, never the Thangs API directly.

| Sample                                 | Guide section                                   |
| :------------------------------------- | :---------------------------------------------- |
| [`preorder-rewards`](preorder-rewards) | [Preorder rewards](../docs/preorder-rewards.md) |
