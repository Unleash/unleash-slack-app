# Unleash App for Slack

Add Unleash to your Slack workspace by using Unleash's official App for Slack.

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, install dependencies with yarn, which reads `.yarnrc` and so runs no install scripts:

```bash
yarn install
```

Then, create a `.env.local` file with the following contents:

```bash
# .env.local
NEXT_PUBLIC_SCOPE=your-client-scope # from: https://api.slack.com/apps/A05GLH2TPT3/oauth
NEXT_PUBLIC_CLIENT_ID=your-client-id # from: https://api.slack.com/apps/A05GLH2TPT3/general
CLIENT_SECRET=your-client-secret # from: https://api.slack.com/apps/A05GLH2TPT3/general
# For Install & connect from Unleash (see below):
PUBLIC_URL=your-public-url # this site's HTTPS address, such as https://app-for-slack.getunleash.io
```

`NEXT_PUBLIC_*` values are built into the pages, so set them before `next build`. Install & connect checks all four settings on each request, and fails with the name of any that is missing. Under `next dev` it also accepts an Unleash on `http://localhost`.

Then, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

`yarn test` runs the tests.

## Install & connect from Unleash

Unleash connects to Slack without anyone copying the token:

1. Unleash keeps the pending connection and sends the admin to `/connect` with its own address (`return_to`), a one-off 3072-bit RSA public key (`public_key`) and the connection's id (`state`).
2. `/connect/confirm` shows where the token will go. Continuing records the confirmation in the `__Host-slack_connect` cookie and sends the admin to Slack. The cookie is signed with a key derived from `CLIENT_SECRET`, and the Continue button only works once the page has been in front, with focus, for a moment.
3. Slack sends the admin back to `/callback`, which refuses a connection that wasn't confirmed. It exchanges the code with `CLIENT_SECRET`, seals the token to the public key (RSA-OAEP with SHA-256, Node's `publicEncrypt`, which fits at most 318 bytes) and sends the admin to `return_to` + `/integrations/connected/slack-app`, with the state and the sealed token in the URL fragment.
4. That Unleash page posts them to the instance, which opens the token with the connection's private key, saves the integration and deletes the connection.

This site stores nothing. The token only exists in `/callback`'s memory between the exchange and the sealing. The browser only sees ciphertext, and the fragment keeps even that out of every server and proxy log.

The Slack app needs `${PUBLIC_URL}/callback` among its redirect URLs, or under one of them. PKCE stays off.

### The contract with Unleash

Unleash's side is `src/lib/addons/slack-app-install-service.ts` in [Unleash/unleash](https://github.com/Unleash/unleash); change both together.

| | What | Checked by |
|---|---|---|
| In | `GET /connect?return_to=…&public_key=…&state=…` | `startConnection` |
| `return_to` | The instance's address: HTTPS, no credentials, query or fragment. Plain HTTP only on localhost under `next dev` | `parseReturnTo` |
| `public_key` | A one-off 3072-bit RSA key, base64url SPKI DER | `isSealingKey` |
| `state` | 8–200 of `A-Za-z0-9_.-`; Unleash sends the connection's id | `isUnleashState` |
| Out | `302` to `return_to` + `/integrations/connected/slack-app#state=…&sealed_connection=…`, or `#state=…&error=…` | `finishConnection` |
| `sealed_connection` | `{ accessToken, team: { id, name } }` as JSON, encrypted to `public_key` with RSA-OAEP and SHA-256, base64url; at most 318 bytes | `sealForInstance` |
| `error` | Slack's error, such as `access_denied`, or the broker's own: `no_code`, `slack_unreachable`, `no_bot_token`, `unknown_error`, `sealing_failed` | `sealedConnection` |

### Production settings

- `CLIENT_SECRET` only in Vercel's Production environment. The repository is public, so preview builds of pull requests must never see it.
- In the Slack app, only `${PUBLIC_URL}/callback` as a redirect URL once the copy-the-token page is gone.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
