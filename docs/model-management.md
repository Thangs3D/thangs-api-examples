# Model management

With your API key you can manage your own 3D models on Thangs from your service layer. The API exposes three resources: [Models](#models) hold the metadata that describes a model, [Parts](#parts) are the 3D files that make it up, and [Attachments](#attachments) are the images shown with it. Parts and attachments have their own endpoints rather than being embedded in the model.

Publishing a model takes these steps:

1. [Look up the categories and licenses](#look-up-categories-and-licenses) you can apply to the model.
2. [Create the model](#create-a-new-model) with at least its name.
3. [Request upload URLs for its part files](#request-upload-urls-for-model-parts) and upload each file (see [Uploading files to signed URLs](#uploading-files-to-signed-urls)).
4. [Set the model's parts](#set-the-parts-for-a-model) from those uploads.
5. [Request upload URLs for its images](#request-upload-urls-for-attachments), upload them, and [set the model's attachments](#set-the-attachments-for-a-model).
6. [Check the model's upload status](#get-a-model-s-upload-status) until processing is ready.

The model is not visible to end users until its required fields are populated and it has at least one part.

## Look up categories and licenses

Before you create a model, fetch the values its `categories` and `license` fields accept. Both lists change rarely, so you can cache them.

A `GET` request to `/public/categories` returns the category names you can apply to a model.

|                    |                                                                                        |
| :----------------- | :------------------------------------------------------------------------------------- |
| Endpoint           | `GET /public/categories`                                                               |
| Request body       | None.                                                                                  |
| Response (success) | `200 OK` with a JSON body containing a `categories` array of category names (strings). |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                                          |

Example success response:

```json
{ "categories": ["3D Printing", "Art", "Design"] }
```

A `GET` request to `/public/licenses` returns the licenses configured on your Thangs account. Each license's `id` is a valid value for a model's `license` field. To use a license of your own, [upload it](#licenses) first.

|                    |                                                                             |
| :----------------- | :-------------------------------------------------------------------------- |
| Endpoint           | `GET /public/licenses`                                                      |
| Request body       | None.                                                                       |
| Response (success) | `200 OK` with a JSON body containing a `licenses` array of License objects. |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                               |

Each License object has these fields:

| Field  | Type   | Description                                 | Required |
| :----- | :----- | :------------------------------------------ | :------- |
| `id`   | number | The ID to use in a model's `license` field. | Yes      |
| `name` | string | The license's name, for your convenience.   | Yes      |
| `url`  | string | The URL of the full license text.           | Yes      |

## Models

### Model data structure

These are the model-level fields you send when creating or updating a model, and receive when you read one. Parts and attachments are not part of this structure.

| Field              | Type             | Description                                                                                                                                                                      |
| :----------------- | :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modelId`          | number           | The model's ID. Returned by Thangs; ignored if you send it.                                                                                                                      |
| `name`             | string           | The model's name. Max 255 characters.                                                                                                                                            |
| `description`      | string           | A detailed description of the model. Max 100,000 characters.                                                                                                                     |
| `categories`       | array of strings | Categories to apply to the model, each one returned by `GET /public/categories`. Max 2.                                                                                          |
| `tags`             | array of strings | Tags to apply to the model. Max 20.                                                                                                                                              |
| `visibility`       | string           | Either `"public"` or `"private"`.                                                                                                                                                |
| `plans`            | array of objects | The plans the model belongs to, each as `{ "id": number }` with an `id` from `GET /public/plans`. Can be empty. Max 10.                                                          |
| `license`          | number or null   | A license `id` from `GET /public/licenses`, or `null` for none.                                                                                                                  |
| `isAiGenerated`    | boolean          | Declares that you used AI tooling to help generate this model.                                                                                                                   |
| `marketplacePrice` | number or null   | The per-download price in USD, minimum 3. Setting a price lists the model on the marketplace, and customers must pay it to download the model. `null` leaves the model unlisted. |

### Create a new model

To start a model, make a `POST` request to `/public/models` with at least its `name`. Any other field from the [model data structure](#model-data-structure) can be included now or set later with an update. The response gives you the new model's `modelId`, which every other model endpoint takes in its URL.

|                    |                                                                       |
| :----------------- | :-------------------------------------------------------------------- |
| Endpoint           | `POST /public/models`                                                 |
| Request body       | A partial model definition (JSON). Only `name` is required.           |
| Response (success) | `201 Created` with a JSON body containing the new `modelId` (number). |
| Response (error)   | `400 Bad Request` if the request body is invalid.                     |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                         |

Example request body:

```json
{ "name": "Adjustable Shelf Bracket", "visibility": "private" }
```

Example success response:

```json
{ "modelId": 123456 }
```

### Get an existing model

A `GET` request to `/public/models/{modelId}` returns the model's metadata. Every field is always present, and the body can be sent back unchanged as the body of an update, so reading first is the easiest way to change one field. Parts and attachments are not included; use their list endpoints to retrieve them.

|                    |                                                                      |
| :----------------- | :------------------------------------------------------------------- |
| Endpoint           | `GET /public/models/{modelId}`                                       |
| Path parameters    | `modelId` (number, required): the model's ID.                        |
| Request body       | None.                                                                |
| Response (success) | `200 OK` with the full model definition (JSON), including `modelId`. |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                        |
| Response (error)   | `404 Not Found` if the `modelId` does not exist.                     |

### Update an existing model

To change a model's metadata, make a `PUT` request to `/public/models/{modelId}` with the complete model definition, including fields that are not changing. Leaving out a required field returns a `400` rather than clearing it. To unlist a model from the marketplace, send `marketplacePrice` as `null`. This endpoint does not change parts or attachments.

|                    |                                                                                                                                                                                                                          |
| :----------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint           | `PUT /public/models/{modelId}`                                                                                                                                                                                           |
| Path parameters    | `modelId` (number, required): the model's ID.                                                                                                                                                                            |
| Request body       | The complete model definition (JSON). Required: `name`, `description`, `categories`, `tags`, `visibility`, `marketplacePrice`, `plans` and `license`. `isAiGenerated` is optional; if omitted, the stored value is kept. |
| Response (success) | `200 OK` with the updated model definition (JSON).                                                                                                                                                                       |
| Response (error)   | `400 Bad Request` if the request body is invalid.                                                                                                                                                                        |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                                                                                                                                                                            |
| Response (error)   | `404 Not Found` if the `modelId` does not exist.                                                                                                                                                                         |

Example request body:

```json
{
  "name": "Adjustable Shelf Bracket",
  "description": "A printable bracket for 18 mm shelves.",
  "categories": ["3D Printing"],
  "tags": ["shelf", "bracket"],
  "visibility": "public",
  "marketplacePrice": 5,
  "plans": [{ "id": 42 }],
  "license": 7,
  "isAiGenerated": false
}
```

### List models

A `GET` request to `/public/models` returns a page of the models you own, most recently updated first.

|                    |                                                                                                                                                                            |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint           | `GET /public/models`                                                                                                                                                       |
| Query parameters   | `page` (number, optional, default 0): the page to fetch, starting at 0. `pageSize` (number, optional, default 25, max 100): the number of models per page.                 |
| Response (success) | `200 OK` with a JSON body containing `items` (an array of model definitions, each with an `updatedAt` field), `total` (the total number of models), `page` and `pageSize`. |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                                                                                                                              |

### Get a model's upload status

After you set a model's parts, Thangs processes them, including generating its thumbnail images. A `GET` request to `/public/models/{modelId}/upload-status` tells you where that processing stands, so poll it until the status is `ready` or `error`.

|                    |                                                        |
| :----------------- | :----------------------------------------------------- |
| Endpoint           | `GET /public/models/{modelId}/upload-status`           |
| Path parameters    | `modelId` (number, required): the model's ID.          |
| Request body       | None.                                                  |
| Response (success) | `200 OK` with a JSON body containing a `status` field. |
| Response (error)   | `401 Unauthorized` if the API key is invalid.          |
| Response (error)   | `404 Not Found` if the `modelId` does not exist.       |

| `status`     | Meaning                                        |
| :----------- | :--------------------------------------------- |
| `pending`    | The model has no parts yet.                    |
| `queued`     | The parts are waiting in the processing queue. |
| `processing` | The parts are being processed.                 |
| `ready`      | Processing has finished successfully.          |
| `error`      | Processing failed.                             |

### Check the processing queue

Processing runs through a shared queue, so a model can stay `queued` for a while. A `GET` request to `/public/processing-queue` shows how much of your work is waiting or in progress, and roughly how much is ahead of it. Use it to judge how long a model will take and how often to poll its upload status.

|                    |                                                                          |
| :----------------- | :----------------------------------------------------------------------- |
| Endpoint           | `GET /public/processing-queue`                                           |
| Request body       | None.                                                                    |
| Response (success) | `200 OK` with a JSON body describing your share of the processing queue. |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                            |

| Field             | Type           | Description                                                                                                                                    | Required |
| :---------------- | :------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- | :------- |
| `queued`          | object         | Your work waiting to be submitted for processing, as `models` (number) and `parts` (number).                                                   | Yes      |
| `processing`      | object         | Your work submitted for processing and not yet finished, as `models` (number) and `parts` (number).                                            | Yes      |
| `oldestQueuedAt`  | string or null | When your oldest queued part entered the queue, or `null`.                                                                                     | Yes      |
| `partsAheadOfYou` | number         | Other users' queued parts that entered the queue before your oldest queued part. The queue interleaves users, so treat this as an upper bound. | Yes      |

Example success response:

```json
{
  "queued": { "models": 2, "parts": 5 },
  "processing": { "models": 1, "parts": 3 },
  "oldestQueuedAt": "2026-10-19T14:02:00Z",
  "partsAheadOfYou": 40
}
```

### Delete an existing model

A `DELETE` request to `/public/models/{modelId}` removes the model from Thangs.

|                    |                                                  |
| :----------------- | :----------------------------------------------- |
| Endpoint           | `DELETE /public/models/{modelId}`                |
| Path parameters    | `modelId` (number, required): the model's ID.    |
| Request body       | None.                                            |
| Response (success) | `204 No Content`.                                |
| Response (error)   | `401 Unauthorized` if the API key is invalid.    |
| Response (error)   | `404 Not Found` if the `modelId` does not exist. |

## Parts

Parts are the 3D files that make up a model, and each part belongs to exactly one model. Adding a part is a two-step exchange: first you ask Thangs for a signed upload URL and upload the file's bytes to it, then you attach the uploaded file to the model by its `gcsPath`.

Each time you change a model's parts, Thangs creates a new version of the model. [Set the parts for a model](#set-the-parts-for-a-model) explains what that means for you.

### Request upload URLs for model parts

Make a `POST` request to `/public/models/upload-urls` describing each file you are about to upload. Thangs returns one signed URL per file, in the same order as your request. The URLs point at Google Cloud Storage (`storage.googleapis.com`); see [Uploading files to signed URLs](#uploading-files-to-signed-urls) for how to send the bytes. Each grant also returns a `gcsPath`, which you pass as `uploadedFrom` when you set the model's parts.

|                    |                                                                                                                                                                                                                                                                                                                                                              |
| :----------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint           | `POST /public/models/upload-urls`                                                                                                                                                                                                                                                                                                                            |
| Request body       | A JSON object with a `files` array of 1 to 50 entries, each describing one file: `filename` (string, required), the original file name including its extension; `sizeBytes` (integer, minimum 1), the file's size in bytes.                                                                                                                                  |
| Response (success) | `200 OK` with a JSON body containing a `grants` array, one entry per requested file in request order. Each entry has `uploadUrl`, `gcsPath`, `contentType` and `expiresAt` (all strings). `contentType` is inferred from the file extension and must be sent as the `Content-Type` header of the upload; for 3D part files it is `application/octet-stream`. |
| Response (error)   | `400 Bad Request` if the request body is invalid.                                                                                                                                                                                                                                                                                                            |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                                                                                                                                                                                                                                                                                                                |
| Response (error)   | `413 Payload Too Large` if any declared `sizeBytes` exceeds the per-file limit.                                                                                                                                                                                                                                                                              |

Example request body:

```json
{
  "files": [
    { "filename": "bracket.stl", "sizeBytes": 1048576 },
    { "filename": "base.3mf", "sizeBytes": 524288 }
  ]
}
```

Example success response:

```json
{
  "grants": [
    {
      "uploadUrl": "https://storage.googleapis.com/...signed-1...",
      "gcsPath": "...path-1...",
      "contentType": "application/octet-stream",
      "expiresAt": "2026-04-16T18:00:00Z"
    },
    {
      "uploadUrl": "https://storage.googleapis.com/...signed-2...",
      "gcsPath": "...path-2...",
      "contentType": "application/octet-stream",
      "expiresAt": "2026-04-16T18:00:00Z"
    }
  ]
}
```

### Set the parts for a model

Once your files are uploaded, make a `PUT` request to `/public/models/{modelId}/parts` with the full set of parts the model should have. How Thangs reads each entry depends on which identifiers it carries:

- `partIdentifier` only: keeps that existing part, applying any new name or primary flag.
- `uploadedFrom` only: adds the uploaded file as a new part.
- Both: replaces the file of that existing part with the uploaded file.
- Neither: the request is rejected with a `400`.

Any existing part you leave out of the request is removed from the model. At most one part may be marked primary.

Every `PUT` to this endpoint creates a new version of the model, saving its current state as a new downloadable zip file. If your model has several part files, send them all in one request. If the model is already public, splitting them across requests produces downloadable zips with an incomplete set of parts until the processing of parts in the final `PUT` completes.

|                    |                                                                                                                                                                                                                                                                                                                                                                                     |
| :----------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint           | `PUT /public/models/{modelId}/parts`                                                                                                                                                                                                                                                                                                                                                |
| Path parameters    | `modelId` (number, required): the model's ID.                                                                                                                                                                                                                                                                                                                                       |
| Request body       | A JSON object with a `parts` array of up to 50 entries. Each entry has: `partIdentifier` (string, optional), the identifier of an existing part on this model; `uploadedFrom` (string, optional), the `gcsPath` from a part upload grant; `name` (string, required, max 255), the part's display name; `primary` (boolean, optional), `true` to make this the model's primary part. |
| Response (success) | `200 OK` with a JSON body containing the resulting `parts` array of Part objects.                                                                                                                                                                                                                                                                                                   |
| Response (error)   | `400 Bad Request` if the request body is invalid, if an entry has neither `partIdentifier` nor `uploadedFrom`, if more than one entry is marked primary, or if an `uploadedFrom` does not reference a successful upload.                                                                                                                                                            |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                                                                                                                                                                                                                                                                                                                                       |
| Response (error)   | `404 Not Found` if the `modelId` does not exist.                                                                                                                                                                                                                                                                                                                                    |

Example request body:

```json
{
  "parts": [
    {
      "partIdentifier": "prt_01HXYZ...",
      "name": "Main Bracket",
      "primary": true
    },
    {
      "uploadedFrom": "...path-2...",
      "name": "Support Strut"
    }
  ]
}
```

### List parts on a model

A `GET` request to `/public/models/{modelId}/parts` returns the parts currently on the model, in order.

|                    |                                                                       |
| :----------------- | :-------------------------------------------------------------------- |
| Endpoint           | `GET /public/models/{modelId}/parts`                                  |
| Path parameters    | `modelId` (number, required): the model's ID.                         |
| Request body       | None.                                                                 |
| Response (success) | `200 OK` with a JSON body containing a `parts` array of Part objects. |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                         |
| Response (error)   | `404 Not Found` if the `modelId` does not exist.                      |

Each Part object has these fields:

| Field            | Type    | Description                                                  | Required |
| :--------------- | :------ | :----------------------------------------------------------- | :------- |
| `partIdentifier` | string  | The part's unique identifier within its model.               | Yes      |
| `name`           | string  | The part's display name.                                     | Yes      |
| `filename`       | string  | The original file name of the part, including its extension. | Yes      |
| `isPrimary`      | boolean | `true` if this is the model's primary part.                  | Yes      |

Example success response:

```json
{
  "parts": [
    {
      "partIdentifier": "prt_01HXYZ...",
      "name": "Main Bracket",
      "filename": "bracket.stl",
      "isPrimary": true
    },
    {
      "partIdentifier": "prt_01HABC...",
      "name": "Base Plate",
      "filename": "base.3mf",
      "isPrimary": false
    }
  ]
}
```

## Attachments

Attachments are the images shown with a model; only images are supported. Each attachment belongs to exactly one model and has a display order. Adding one follows the same two-step exchange as parts: request a signed upload URL, upload the image, then attach it to the model by its `gcsPath`.

### Request upload URLs for attachments

Make a `POST` request to `/public/attachments/upload-urls` describing each image you are about to upload. It works exactly like the [part upload URLs](#request-upload-urls-for-model-parts), except that every file must be an image.

|                    |                                                                                                                                                                                                                                                                                                          |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint           | `POST /public/attachments/upload-urls`                                                                                                                                                                                                                                                                   |
| Request body       | A JSON object with a `files` array of 1 to 50 entries, each describing one image: `filename` (string, required), the original file name including its extension; `sizeBytes` (integer, minimum 1), the image's size in bytes.                                                                            |
| Response (success) | `200 OK` with a JSON body containing a `grants` array, one entry per requested file in request order. Each entry has `uploadUrl`, `gcsPath`, `contentType` and `expiresAt` (all strings). `contentType` is inferred from the file extension and must be sent as the `Content-Type` header of the upload. |
| Response (error)   | `400 Bad Request` if the request body is invalid, or if a declared file is not an image.                                                                                                                                                                                                                 |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                                                                                                                                                                                                                                                            |
| Response (error)   | `413 Payload Too Large` if any declared `sizeBytes` exceeds the per-file limit.                                                                                                                                                                                                                          |

Example request body:

```json
{
  "files": [
    { "filename": "hero.png", "sizeBytes": 204800 },
    { "filename": "detail.jpg", "sizeBytes": 153600 }
  ]
}
```

Example success response:

```json
{
  "grants": [
    {
      "uploadUrl": "https://storage.googleapis.com/...signed-1...",
      "gcsPath": "...path-1...",
      "contentType": "image/png",
      "expiresAt": "2026-04-16T18:00:00Z"
    },
    {
      "uploadUrl": "https://storage.googleapis.com/...signed-2...",
      "gcsPath": "...path-2...",
      "contentType": "image/jpeg",
      "expiresAt": "2026-04-16T18:00:00Z"
    }
  ]
}
```

### Set the attachments for a model

Once your images are uploaded, make a `PUT` request to `/public/models/{modelId}/attachments` with the full set of images the model should have. An entry with an `id` keeps that existing image, optionally changing its order or type. An entry with an `uploadedFrom` adds a new image. Any existing image you leave out is removed from the model.

Give every new image an `imageType`. If you leave it out, Thangs uses the type it detects, but the field will become required. For existing images, an omitted or `null` `imageType` keeps the stored type, so you can send back the entries from [List attachments](#list-attachments-on-a-model) as they are.

|                    |                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint           | `PUT /public/models/{modelId}/attachments`                                                                                                                                                                                                                                                                                                                                                                                        |
| Path parameters    | `modelId` (number, required): the model's ID.                                                                                                                                                                                                                                                                                                                                                                                     |
| Request body       | A JSON object with an `attachments` array of up to 50 entries. A new image has `uploadedFrom` (string, required), the `gcsPath` from an attachment upload grant. An existing image has `id` (integer, required), its attachment ID. Either may also have `order` (integer, optional, minimum 0), its display position, defaulting to its position in the array, and `imageType` (string, optional), one of the image types below. |
| Response (success) | `200 OK` with a JSON body containing the resulting `attachments` array of Attachment objects.                                                                                                                                                                                                                                                                                                                                     |
| Response (error)   | `400 Bad Request` if the request body is invalid, or if an `uploadedFrom` does not reference a successful upload.                                                                                                                                                                                                                                                                                                                 |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                                                                                                                                                                                                                                                                                                                                                                                     |
| Response (error)   | `404 Not Found` if the `modelId` does not exist.                                                                                                                                                                                                                                                                                                                                                                                  |

Example request body:

```json
{
  "attachments": [
    { "id": 12345, "order": 1 },
    { "uploadedFrom": "...path-2...", "order": 0, "imageType": "render" }
  ]
}
```

| `imageType`    | Use it for                                             |
| :------------- | :----------------------------------------------------- |
| `real_photo`   | A photograph of the real object.                       |
| `render`       | A rendered image of the model.                         |
| `ai_generated` | An image generated with AI.                            |
| `graphic`      | Instructions, diagrams and other informational images. |

### List attachments on a model

A `GET` request to `/public/models/{modelId}/attachments` returns the images on the model in display order.

|                    |                                                                                                                 |
| :----------------- | :-------------------------------------------------------------------------------------------------------------- |
| Endpoint           | `GET /public/models/{modelId}/attachments`                                                                      |
| Path parameters    | `modelId` (number, required): the model's ID.                                                                   |
| Request body       | None.                                                                                                           |
| Response (success) | `200 OK` with a JSON body containing an `attachments` array of Attachment objects, sorted by ascending `order`. |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                                                                   |
| Response (error)   | `404 Not Found` if the `modelId` does not exist.                                                                |

Each Attachment object has these fields:

| Field       | Type           | Description                                               | Required |
| :---------- | :------------- | :-------------------------------------------------------- | :------- |
| `id`        | integer        | The attachment's unique ID.                               | Yes      |
| `imageUrl`  | string         | The URL of the image.                                     | Yes      |
| `order`     | integer        | The image's display position on the model, starting at 0. | Yes      |
| `imageType` | string or null | The image's type, or `null` when none has been set.       | Yes      |

Example success response:

```json
{
  "attachments": [
    {
      "id": 12345,
      "imageUrl": "https://...",
      "order": 0,
      "imageType": "render"
    },
    { "id": 67890, "imageUrl": "https://...", "order": 1, "imageType": null }
  ]
}
```

## Licenses

Besides the licenses already on your Thangs account, you can upload your own license file and apply it to your models. Adding a license takes the same two steps as a part: request a signed upload URL, upload the file, then add it by its `uploadUrl`.

### Request upload URLs for licenses

Make a `POST` request to `/public/licenses/upload-urls` describing each license file you are about to upload. A license file must be a PDF (`.pdf`), plain text (`.txt`) or Markdown (`.md`) file, and file names must be unique within the request, ignoring case.

|                    |                                                                                                                                                                                                                                                                                                                             |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint           | `POST /public/licenses/upload-urls`                                                                                                                                                                                                                                                                                         |
| Request body       | A JSON object with a `files` array of 1 to 10 entries, each describing one file: `filename` (string, required), the original file name including its extension; `sizeBytes` (integer, minimum 1), the file's size in bytes.                                                                                                 |
| Response (success) | `200 OK` with a JSON body containing a `grants` array, one entry per requested file in request order. Each entry has `uploadUrl`, `gcsPath`, `contentType` and `expiresAt` (all strings). `contentType` is `application/pdf`, `text/plain` or `text/markdown`, and must be sent as the `Content-Type` header of the upload. |
| Response (error)   | `400 Bad Request` if the request body is invalid, if a file is not a `.pdf`, `.txt` or `.md` file, or if two files have the same name.                                                                                                                                                                                      |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                                                                                                                                                                                                                                                                               |
| Response (error)   | `413 Payload Too Large` if any declared `sizeBytes` exceeds 50 MB.                                                                                                                                                                                                                                                          |

Example request body:

```json
{
  "files": [{ "filename": "my-license.pdf", "sizeBytes": 204800 }]
}
```

Upload the file to the `uploadUrl` as described in [Uploading files to signed URLs](#uploading-files-to-signed-urls).

### Add a license

Once the file is uploaded, make a `POST` request to `/public/licenses` with the grant's `uploadUrl` as `uploadedFrom`. Each upload URL can be used for one license only.

The response is a License object. Set its `id` as the `license` field when you [update a model](#update-an-existing-model) to apply the license to it. The new license also appears in `GET /public/licenses`.

|                    |                                                                                                                                            |
| :----------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint           | `POST /public/licenses`                                                                                                                    |
| Request body       | A JSON object with `uploadedFrom` (string, required): the `uploadUrl` of a license upload grant.                                           |
| Response (success) | `201 Created` with a JSON body containing a License object.                                                                                |
| Response (error)   | `400 Bad Request` if the URL is unknown or expired, is not a license upload, has already been used, or if the file was not uploaded to it. |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                                                                                              |

Example request body:

```json
{ "uploadedFrom": "https://storage.googleapis.com/...signed..." }
```

Example success response:

```json
{ "id": 42, "name": "my-license.pdf", "url": "..." }
```

### Delete a license

Make a `DELETE` request to `/public/licenses/{licenseId}` to remove one of your licenses. You cannot delete a license that a model still uses: the `409` response lists those models in `modelIds`, so set another license, or `null`, as `license` on each of them first.

|                    |                                                                                                                  |
| :----------------- | :--------------------------------------------------------------------------------------------------------------- |
| Endpoint           | `DELETE /public/licenses/{licenseId}`                                                                            |
| Path parameters    | `licenseId` (number, required): the license's `id`.                                                              |
| Request body       | None.                                                                                                            |
| Response (success) | `204 No Content`.                                                                                                |
| Response (error)   | `401 Unauthorized` if the API key is invalid.                                                                    |
| Response (error)   | `404 Not Found` if the license does not exist or is not yours.                                                   |
| Response (error)   | `409 Conflict` if a model uses the license. The body has `message` (string) and `modelIds` (array of model IDs). |

Example conflict response:

```json
{
  "message": "License 42 is used by 2 model(s). Remove it from them first.",
  "modelIds": [101, 102]
}
```

## Uploading files to signed URLs

The upload URLs returned for parts, attachments and licenses point at Google Cloud Storage (`storage.googleapis.com`). Your service is responsible for sending each file's bytes to its URL before the URL expires. Once the upload succeeds, pass the grant's `gcsPath` as `uploadedFrom` when you set the model's parts or attachments.

### Performing the upload

Send an HTTP `PUT` request to the `uploadUrl` with the raw file bytes as the body. Do not send your API key: the signed URL carries its own authorization. Google Cloud Storage checks the request against the parameters the URL was signed with, so follow these rules exactly:

- Use the `PUT` method.
- Send the raw file bytes as the body. Do not base64-encode or multipart-wrap them.
- Set the `Content-Length` header to the exact size of the file in bytes, matching the `sizeBytes` you declared.
- Set the `Content-Type` header to the `contentType` returned for this file. The upload is rejected if it does not match.
- Do not include an `Authorization` header or any other extra headers.
- Complete the upload before `expiresAt`. After that, request a new URL from the same upload-urls endpoint.

Example upload request:

```http
PUT https://storage.googleapis.com/...signed...
Content-Length: 1048576
Content-Type: application/octet-stream

<raw bytes of the file>
```

### Successful upload

A `2xx` response from `storage.googleapis.com` (typically `200 OK`) means the upload succeeded. You can now use the grant's `gcsPath` as `uploadedFrom`.

### Retrying failed uploads

If a `PUT` fails with a `5xx` response or a network error, retry it against the same signed URL as long as it has not expired. If it has expired, request a new one from the appropriate upload-urls endpoint.
