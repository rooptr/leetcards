# Security policy

## Supported version

Security fixes are applied to the current `main` branch.

## Reporting

Do not open a public issue containing credentials, private data, or an
unpatched exploit. Report the problem privately to the repository owner
through GitHub.

## Release checks

Before publishing:

1. Scan the complete source tree for credentials and private-key material.
2. Confirm `.env`, dependency folders, generated builds, logs, and editor
   settings are ignored.
3. Run `npm audit`, `npm test`, and `npm run build`.
4. Inspect the exact staged file list before committing.
5. Verify the GitHub Pages workflow completed successfully before announcing
   a live release.

## Architecture

Leetcards is a static React application. It does not collect credentials,
store personal information, execute user-supplied HTML or JavaScript, or send
lesson/search data to a server. React renders curriculum text through escaped
text nodes.
