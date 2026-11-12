# Thangs API Integration Guide

Version 1

This guide walks you through integrating your application with the Thangs API. It covers obtaining an API key, making authenticated requests from your service layer, getting a user's authorization to access their data, and managing your 3D models, their parts, and their images. It also covers checking the rewards your preorder campaign backers are owed.

The guide has four parts:

- [Getting started](./getting-started.md) covers what every request needs.
- [Plans and user memberships](./plans-and-memberships.md) covers reading your plans and checking which of them a user subscribes to.
- [Model management](./model-management.md) covers creating and updating your models, their parts and their images.
- [Preorder rewards](./preorder-rewards.md) covers checking which backers of your preorder campaigns are owed a feature you provide.

The last three parts are independent of each other, so use any of them, except that Preorder rewards can reuse the user authorization from Plans and user memberships. Where calls within a part must happen in order, that part says so. Each endpoint has a reference table with its exact inputs and outputs.
