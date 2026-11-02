export const errorPage = (message: string) =>
  new Response(
    `<!doctype html><meta charset="utf-8"><title>Unleash App for Slack</title>
<body style="font-family:system-ui,sans-serif;max-width:36rem;margin:4rem auto;padding:0 1rem;color:#1a4049">
<h1 style="font-size:1.4rem">Could not connect to Slack</h1>
<p>${message}</p></body>`,
    { status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } }
  )
