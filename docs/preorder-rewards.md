# Preorder rewards

If you run preorder campaigns on Thangs, some rewards may include a feature that you provide yourself, outside Thangs or in your own application, such as access or an unlock in your app. Thangs does not deliver these features. Use these endpoints to find out which of your backers are owed one, and when they should have it.

There are two ways to look a user up:

- [With a user token](#get-a-user-s-preorder-rewards), after the user authorizes your application as described in [Plans and user memberships](./plans-and-memberships.md).
- [With an OAuth `sub`](#look-up-preorder-rewards-by-oauth-sub), one user at a time or [in batches](#look-up-preorder-rewards-for-many-subs) of up to 100.

Every lookup only covers campaigns you own, and return [Reward entitlement](#reward-entitlements) objects.

## Which pledges are returned

A reward is returned only if it includes at least one feature item. It is returned from the moment the user backs it, for these pledges:

- A pledge whose payment was collected. It has `captured: true`.
- A pledge that has not been charged yet. It has `captured: false`. This covers pledges whose charge failed or needs the backer to act, while the backer still has a chance to pay.

Pledges that are cancelled or expired are never returned. When a campaign closes without being funded, a backer cancels, or a pledge is cancelled because the payment never went through, the reward stops appearing on the next lookup. To revoke access, check the user again; Thangs does not notify you.

## Reward entitlements

Each Reward entitlement object has these fields:

| Field           | Type    | Description                                                                                                    |
| :-------------- | :------ | :------------------------------------------------------------------------------------------------------------- |
| `campaignId`    | number  | The ID of the campaign.                                                                                        |
| `campaignTitle` | string  | The title of the campaign.                                                                                     |
| `rewardId`      | number  | The ID of the reward the user backed.                                                                          |
| `rewardName`    | string  | The name of the reward.                                                                                        |
| `rewardItems`   | array   | The items the reward includes, as Reward item objects, in the order they were added to the campaign.           |
| `captured`      | boolean | Whether the payment was collected.                                                                             |
| `delivered`     | boolean | Whether Thangs has delivered the reward to its backers. It becomes `true` once, for all backers of the reward. |

Each Reward item object has these fields:

| Field   | Type   | Description                                                                                       |
| :------ | :----- | :------------------------------------------------------------------------------------------------ |
| `type`  | string | The item type: `"model"`, `"collection"`, `"print_sku"`, `"membership"` or `"feature"`.           |
| `id`    | number | The campaign item's ID. It stays the same across users, so use it to map an item to your feature. |
| `label` | string | The item's label, as shown on the campaign.                                                       |

A reward lists all its items, not only features. Thangs delivers every item except features. You only need to act on items with `type: "feature"`.

### When to grant a feature

You decide when a backer gets your feature:

- **On backing.** Grant the feature as soon as the reward is returned. The backer keeps it while the pledge stands, paid or not. If the pledge is cancelled, or the campaign closes without being funded, the reward stops being returned.
- **On release.** Grant the feature only once the campaign is funded and the backer has paid, and Thangs has delivered the reward: `captured: true` and `delivered: true`.

A pledge whose charge is still being retried keeps `captured: false`, also after the reward is delivered. If you grant on release, wait until the payment goes through.

| Situation                       | `captured` | `delivered` | Grant on backing | Grant on release |
| :------------------------------ | :--------- | :---------- | :--------------- | :--------------- |
| Backed, not charged yet         | `false`    | `false`     | Yes              | No               |
| Charged, not delivered          | `true`     | `false`     | Yes              | No               |
| Delivered, charge being retried | `false`    | `true`      | Yes              | No               |
| Charged and delivered           | `true`     | `true`      | Yes              | Yes              |

Example Reward entitlement:

```json
{
  "campaignId": 812,
  "campaignTitle": "Dragon Keep Terrain",
  "rewardId": 3051,
  "rewardName": "Backer Tier",
  "rewardItems": [
    {
      "type": "collection",
      "id": 9901,
      "label": "Dragon Keep STLs"
    },
    {
      "type": "feature",
      "id": 9902,
      "label": "Discord backer role"
    },
    {
      "type": "feature",
      "id": 9903,
      "label": "Name in the credits"
    }
  ],
  "captured": true,
  "delivered": false
}
```

## Get a user's preorder rewards

Make a `GET` request to `/public/user/preorder-rewards` with the user token in the `x-thangs-user-token` header. Your API key needs Delegated auth access. Rewards are listed oldest pledge first, and the list is empty if the user has backed no feature rewards on your campaigns.

|                    |                                                                                                               |
| :----------------- | :------------------------------------------------------------------------------------------------------------ |
| Endpoint           | `GET /public/user/preorder-rewards`                                                                           |
| Headers            | `Authorization: Bearer {your-api-key}` and `x-thangs-user-token: {userToken}`                                 |
| Request body       | None.                                                                                                         |
| Response (success) | `200 OK` with a JSON body containing a `rewards` array of [Reward entitlement](#reward-entitlements) objects. |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                                                                 |
| Response (error)   | `403 Forbidden` if the user token is no longer valid.                                                         |

Example success response:

```json
{
  "rewards": [
    {
      "campaignId": 812,
      "campaignTitle": "Dragon Keep Terrain",
      "rewardId": 3051,
      "rewardName": "Backer Tier",
      "rewardItems": [
        {
          "type": "feature",
          "id": 9902,
          "label": "Discord backer role"
        }
      ],
      "captured": true,
      "delivered": false
    }
  ]
}
```

## Look up preorder rewards by OAuth sub

If users sign in to your application with Thangs over OAuth, you can look them up by the `sub` claim in the tokens issued to your application. Your API key needs Plans access and must be linked to your OAuth client; ask us to link it. No user token is needed.

The response echoes the `sub` with a `status`. `"found"` means the user was found. `"unknown"` means the `sub` does not exist, belongs to a different OAuth client, or belongs to a deactivated account; these cases look the same by design, and `rewards` is always empty.

|                    |                                                                                                                                                                       |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint           | `GET /public/user/{sub}/preorder-rewards`                                                                                                                             |
| Path parameters    | `sub` (string, required): the `sub` claim from your OAuth tokens.                                                                                                     |
| Request body       | None.                                                                                                                                                                 |
| Response (success) | `200 OK` with a JSON body containing `sub` (string), `status` (`"found"` or `"unknown"`) and a `rewards` array of [Reward entitlement](#reward-entitlements) objects. |
| Response (error)   | `400 Bad Request` if the API key is not linked to an OAuth client.                                                                                                    |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                                                                                                                         |

Example success response:

```json
{
  "sub": "{sub}",
  "status": "found",
  "rewards": [
    {
      "campaignId": 812,
      "campaignTitle": "Dragon Keep Terrain",
      "rewardId": 3051,
      "rewardName": "Backer Tier",
      "rewardItems": [
        {
          "type": "feature",
          "id": 9902,
          "label": "Discord backer role"
        }
      ],
      "captured": true,
      "delivered": false
    }
  ]
}
```

## Look up preorder rewards for many subs

To check many users at once, for example on a schedule, make a `POST` request to `/public/user/preorder-rewards/batch` with up to 100 subs. It needs the same access as the single lookup. The response has one result per requested sub, in request order, duplicates included. Each result has the same shape as the single lookup's response.

|                    |                                                                                                                     |
| :----------------- | :------------------------------------------------------------------------------------------------------------------ |
| Endpoint           | `POST /public/user/preorder-rewards/batch`                                                                          |
| Request body       | `subs` (array of strings, required): 1 to 100 `sub` claims from your OAuth tokens.                                  |
| Response (success) | `200 OK` with a JSON body containing a `results` array of objects with `sub`, `status` and `rewards`.               |
| Response (error)   | `400 Bad Request` if the API key is not linked to an OAuth client, or `subs` is empty or has more than 100 entries. |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                                                                       |

Example request body:

```json
{ "subs": ["{sub-1}", "{sub-2}"] }
```

Example success response:

```json
{
  "results": [
    { "sub": "{sub-1}", "status": "found", "rewards": [] },
    { "sub": "{sub-2}", "status": "unknown", "rewards": [] }
  ]
}
```
