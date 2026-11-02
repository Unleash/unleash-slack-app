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
# For Install & connect from Unleash:
PUBLIC_URL=https://app-for-slack.getunleash.io # this site's address
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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
