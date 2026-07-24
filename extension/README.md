# Leetcards Safe Capture

This optional Manifest V3 extension captures only the active LeetCode problem
after the user clicks the toolbar action. It has no persistent host access and
does not request cookie, history, network-interception, file, or incognito
permissions.

## Install locally

1. Open `chrome://extensions` or `edge://extensions`.
2. Turn on Developer mode.
3. Choose **Load unpacked**.
4. Select this `extension` directory.

After solving a problem, leave its LeetCode problem page open and click the
Leetcards extension. The extension reads the title, slug, difficulty, visible
tags, URL, and capture time. It sends that small payload in the URL fragment to
Leetcards. URL fragments are not sent to the GitHub Pages server.

The main app validates the payload and stores the solved marker in local
IndexedDB. When a reliable authored explanation exists, the capture links to
it. Otherwise the solved marker remains visible and is clearly labeled
`Explanation not available`; Leetcards does not generate an unverified answer.

## Security boundary

- `activeTab` grants temporary access only after the user clicks the extension.
- `scripting` is used only to read the current tab in an isolated world.
- There are no `host_permissions`.
- Submitted code, account details, cookies, session tokens, and passwords are
  not read.
- No remote JavaScript is loaded by the extension.
