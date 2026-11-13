# Preorder rewards sample

A small web app that unlocks a feature for users who backed a particular reward of your preorder campaign. It demonstrates [Preorder rewards](https://thangs3d.github.io/thangs-api-examples/preorder-rewards) in the guide.

The feature unlocks when the user backed the reward set in `REWARD_ID` and its feature item set in `FEATURE_ITEM_ID` is `available`. The item ID is the same for every backer, and across every reward that includes the item. Depending on how you set up the feature, that is from backing or once Thangs delivers the reward; see [When to grant a feature](https://thangs3d.github.io/thangs-api-examples/preorder-rewards#when-to-grant-a-feature).

## How it works

1. The user clicks **Connect your Thangs account**. The server [initiates the authorization](https://thangs3d.github.io/thangs-api-examples/plans-and-memberships#initiate-the-authorization), saves the `verifierCode`, and the page opens the `authenticateUrl` in a popup.
2. While the user allows access, the page polls the server, which [verifies the authorization](https://thangs3d.github.io/thangs-api-examples/plans-and-memberships#verify-user-authorization) until it gets a `userToken`.
3. The server [gets the user's preorder rewards](https://thangs3d.github.io/thangs-api-examples/preorder-rewards#get-a-user-s-preorder-rewards) and tells the page whether to unlock the feature.

If the Thangs API returns a `403` because the user token is no longer valid, the server verifies again with the saved `verifierCode` to get a new token.

The API key stays on the server. The page only calls the sample's own server.

The sample keeps sessions in memory, so they are lost when it restarts. In your application, save the `verifierCode` and `userToken` with your own user record.

## Run it

Requires Node.js 26 or later. Your API key needs Delegated auth access; see [Get an API key](https://thangs3d.github.io/thangs-api-examples/getting-started#get-an-api-key).

```bash
cp .env.example .env
```

Fill in `THANGS_API_KEY`, `REWARD_ID` and `FEATURE_ITEM_ID` in `.env`, then start the server. `THANGS_API_HOST` defaults to `https://production-api.thangs.com`.

```bash
npm start
```

Open <http://localhost:3000>.

## Files

- [`src/thangs.ts`](src/thangs.ts): calls the Thangs API.
- [`src/server.ts`](src/server.ts): the sample's server, with the authorization flow and the unlock check.
- [`public/index.html`](public/index.html): the page.
