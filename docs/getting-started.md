# Getting started

## Get an API key

We will need a name for your application. When a user authorizes your application to access data on their behalf, the site will show them your application's name, so whatever you provide should be accurate and explain to the user who you are. By default, we will use your username.

We then provide you with an API key to use for your requests to the Thangs API. Tell us which parts of the API you plan to use, because a key is granted access area by area:

| Access area              | What it unlocks                                                      |
| :----------------------- | :------------------------------------------------------------------- |
| Delegated auth           | Authorizing users and reading their memberships and preorder rewards |
| Plans                    | Listing your plans, and looking up preorder rewards by OAuth `sub`   |
| Model management (read)  | Reading your models, parts, attachments, licenses and categories     |
| Model management (write) | Creating, updating and deleting models, parts and attachments        |

The distinction between the areas may also require changes to our revenue agreement, or may only be provided to users at a certain sales volume.

## Make requests from your service layer

Make every request to the Thangs API from your service layer. Never make them from JavaScript in the browser: you **must** keep the API key secret, or anyone with access to it can act as you with the Thangs API.

All requests go to the host `https://production-api.thangs.com`. In the rest of this guide, we assume that host as the prefix wherever a URL is given. This is a JSON over HTTP (REST) API, so set the `Accept` and `Content-Type` headers to `application/json` where appropriate.

Every request requires your API key as a Bearer token in the `Authorization` header, in the form `Bearer {your-api-key}`. If your API key is not valid, every endpoint returns a `401` before performing any action.

```http
GET /public/plans HTTP/1.1
Host: production-api.thangs.com
Authorization: Bearer {your-api-key}
Accept: application/json
```

## Errors

When a request fails for another reason, the response body is a JSON object with a single `message` property explaining what went wrong:

```json
{ "message": "A description of the error" }
```

These are the error responses you will see across the API:

| Status                  | Meaning                                                                           |
| :---------------------- | :-------------------------------------------------------------------------------- |
| `400 Bad Request`       | The request body or a parameter is invalid.                                       |
| `401 Unauthorized`      | The API key is missing or invalid.                                                |
| `403 Forbidden`         | The user token is no longer valid.                                                |
| `404 Not Found`         | The resource does not exist, or the user has not yet authorized your application. |
| `413 Payload Too Large` | A file you declared for upload exceeds the per-file size limit.                   |
