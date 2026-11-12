# Plans and user memberships

Use these endpoints to read the plans you offer on Thangs and to check which of them a given user subscribes to. You can read your plans at any time with just your API key. Reading a user's memberships needs their authorization first, which takes these calls in order:

1. [Initiate the authorization](#initiate-the-authorization) and open the returned URL for the user.
2. [Verify the authorization](#verify-user-authorization) to get a user token.
3. [Get the user's memberships](#get-a-user-s-memberships) with that token.

## Get your plans

With your API key you can make a `GET` request to `/public/plans` to get the list of plans you have defined on Thangs. You can cache this in your application, since it changes only when you change your plan configurations in Thangs. Use the `id` field of each Plan to match these plans against a specific user's memberships later.

This endpoint is also a good first test of calling the Thangs API from your application. If you get a response, you have likely configured things properly. If you encounter errors:

- Verify that you have provided the correct API key.
- Check that your `Accept` and `Content-Type` headers are correct.
- Verify that you have the correct URL.

These are not the only errors that can occur, but they are the most obvious places to start.

|                    |                                                                       |
| :----------------- | :-------------------------------------------------------------------- |
| Endpoint           | `GET /public/plans`                                                   |
| Request body       | None.                                                                 |
| Response (success) | `200 OK` with a JSON body containing a `plans` array of Plan objects. |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                         |

Each Plan object has these fields:

| Field                   | Type    | Description                                                        |
| :---------------------- | :------ | :----------------------------------------------------------------- |
| `id`                    | number  | The plan's ID. Use it to match a user's memberships to your plans. |
| `name`                  | string  | The plan's name.                                                   |
| `description`           | string  | The plan's description.                                            |
| `monthlyPrice`          | number  | The monthly price.                                                 |
| `annualPrice`           | number  | The annual price.                                                  |
| `published`             | boolean | Whether the plan is published.                                     |
| `downloadLimit`         | number  | The download limit per month.                                      |
| `allowsCommercialReuse` | boolean | Whether the plan allows commercial reuse.                          |
| `memberLimit`           | number  | The member limit.                                                  |

## Initiate the authorization

This is the first step to getting access to user data. The response contains a URL and a code that you use in the next two operations: one lets the user authorize your application, the other confirms that they did.

To initiate authorization, make a `POST` request to `/public/auth/initiate`. No body or query-string parameters are required. Save the `verifierCode` from the response for later, and note the URL in the `authenticateUrl` property. Use these with only one user in your application. If you reuse them across multiple users, you will run into problems matching each Thangs user to the right user of your application.

|                    |                                                                                                                                                                |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint           | `POST /public/auth/initiate`                                                                                                                                   |
| Request body       | None.                                                                                                                                                          |
| Response (success) | `200 OK` with a JSON body containing `authenticateUrl` (string), the URL to open for the user, and `verifierCode` (string), the code to save for verification. |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                                                                                                                  |

Example success response:

```json
{
  "authenticateUrl": "...",
  "verifierCode": "..."
}
```

Open the `authenticateUrl` in a new browser window from your application. Thangs shows the user an authorization screen with your application's name, or an option to log in if they are not currently logged in to Thangs. When the user clicks the **Allow** button, the window closes. At this point the user has authorized your application to access Thangs on their behalf. Before you can do so, you must verify that authorization and get a user token.

## Verify user authorization

Once the user has authorized your access, make a `GET` request to `/public/auth/access-grant/{verifierCode}/check`, substituting the `verifierCode` you saved in the previous step. The response contains a `userToken` property that you use to access the user's data.

This token can be cached and has a long lifetime, but should not be considered permanent. Save the `verifierCode` too, so you can come back for a new token whenever your cache or the token expires. If the user has not authorized your application yet, you get a `404`.

|                    |                                                                                                                                             |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| Endpoint           | `GET /public/auth/access-grant/{verifierCode}/check`                                                                                        |
| Path parameters    | `verifierCode` (string, required): the `verifierCode` returned by `POST /public/auth/initiate`.                                             |
| Request body       | None.                                                                                                                                       |
| Response (success) | `200 OK` with a JSON body containing `userId` (string), the Thangs user's ID, and `userToken` (string), the token for accessing their data. |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                                                                                               |
| Response (error)   | `404 Not Found` if the user has not authorized your application.                                                                            |

Example success response:

```json
{
  "userId": "...",
  "userToken": "..."
}
```

## Get a user's memberships

Now that you have both your API key and a token for a single user, make a `GET` request to `/public/user/memberships` to get the list of plans that user is subscribed to for your account. This request needs your API key in the `Authorization` header and the user token in the `x-thangs-user-token` header.

As long as the user token is valid, you get back the user's active memberships to your plans. If they have never subscribed, you receive an empty list. If the user token is no longer valid, you get a `403`; return to [Verify user authorization](#verify-user-authorization) with the saved `verifierCode` to get a fresh token.

|                    |                                                                                                                                           |
| :----------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint           | `GET /public/user/memberships`                                                                                                            |
| Headers            | `Authorization: Bearer {your-api-key}` and `x-thangs-user-token: {userToken}`                                                             |
| Request body       | None.                                                                                                                                     |
| Response (success) | `200 OK` with a JSON body containing a `userPlans` array of Membership objects. The array is empty if the user has no active memberships. |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                                                                                             |
| Response (error)   | `403 Forbidden` if the user token is no longer valid.                                                                                     |

Each Membership object has these fields:

| Field                  | Type               | Description                                                                                              | Required |
| :--------------------- | :----------------- | :------------------------------------------------------------------------------------------------------- | :------- |
| `id`                   | number             | The plan's ID, matching the `id` of a Plan from `GET /public/plans`.                                     | Yes      |
| `subscriptionInterval` | string             | How often the subscription renews, either `"month"` or `"year"`.                                         | Yes      |
| `status`               | string             | The subscription status, either `"active"` or `"inactive"`.                                              | Yes      |
| `startDate`            | string (date-time) | When the subscription started.                                                                           | Yes      |
| `periodEnd`            | string (date-time) | The date the user has paid through. It moves forward each time the subscription renews.                  | Yes      |
| `endDate`              | string (date-time) | When the user cancelled the subscription, present only if they have. This is not when their access ends. | No       |

### periodEnd and endDate

Use `periodEnd`, not `endDate`, to decide whether a user should have access. `periodEnd` is the date the user has paid through, and Thangs uses it for its own access checks. Each renewal moves it forward.

`endDate` only records when the user cancelled. Cancelling does not end access immediately: a cancelled subscription stays active until `periodEnd`, plus a short grace period, and then stops renewing. So a membership can have an `endDate` and still be active, as in the second entry of the example below.

| Situation                       | `endDate`           | `periodEnd`                     | What it means                                                        |
| :------------------------------ | :------------------ | :------------------------------ | :------------------------------------------------------------------- |
| Active and renewing             | Absent              | Next renewal date               | The user keeps access and is billed again at `periodEnd`.            |
| Cancelled, paid period not over | When they cancelled | End of the period they paid for | The user keeps access until `periodEnd`, then the subscription ends. |

Example success response:

```json
{
  "userPlans": [
    {
      "id": 42,
      "subscriptionInterval": "month",
      "status": "active",
      "startDate": "2026-01-15T00:00:00Z",
      "periodEnd": "2026-11-15T00:00:00Z"
    },
    {
      "id": 43,
      "subscriptionInterval": "year",
      "status": "active",
      "startDate": "2025-12-01T00:00:00Z",
      "periodEnd": "2026-12-01T00:00:00Z",
      "endDate": "2026-10-02T14:30:00Z"
    }
  ]
}
```

With these calls, your application can retrieve your plans and securely check each user's memberships once they grant authorization.
