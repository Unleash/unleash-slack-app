import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'
import { Confirmation } from './Confirmation'

const confirmationFor = (returnTo: string) =>
  renderToStaticMarkup(
    <Confirmation
      pending={{
        returnTo,
        unleashState: 'unleash-state-1',
        publicKey: 'public-key',
        slackState: 'slack-state-1',
        confirmToken: 'confirm-token-1',
        step: 'confirming'
      }}
    />
  )

test('shows the whole address the token will go to, path included', () => {
  const page = confirmationFor('https://unleash.example/acme')

  expect(page).toContain('>unleash.example/acme<')
})

test('starts with Continue disabled, so a click that lands as the page appears does nothing', () => {
  const page = confirmationFor('https://unleash.example')

  expect(page).not.toContain('/connect/continue')
})
