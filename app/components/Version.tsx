import packageJson from '../../package.json'

// As in Unleash's footer: the build when there is one, otherwise the version.
// Vercel sets VERCEL_GIT_COMMIT_SHA to the commit it deployed.
const build = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)
const { version } = packageJson

export const Version = () => (
  <span title={build ? `${version}+${build}` : version}>
    {build ? `build ${build}` : version}
  </span>
)
