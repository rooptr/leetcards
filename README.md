# Leetcards

Leetcards is an editorial systems-learning application covering C, C++, Linux
internals, computer architecture, electronics, embedded systems,
STM32F446RE, RTOS concepts, debugging, testing, Git, networking, and selected
data-structure and algorithm patterns.

## Local development

Requirements:

- Node.js 22
- npm

```sh
npm ci
npm test
npm run build
npm run dev
```

The application is entirely static. It has no backend, analytics service,
authentication system, advertising SDK, or client-side API credentials.

## STM32 lab target

College MCU labs target the NUCLEO-F446RE with STM32CubeF4 HAL. Each lab also
documents the peripheral contract, timing calculation, hardware dependencies,
and verification procedure needed to port it to another controller.

## Deployment

Pushes to `main` run tests, audit production dependencies, build the locked
source, and deploy `dist/` through GitHub Pages. The workflow grants source
read permission only to the build job and Pages/OpenID permissions only to the
deployment job.

## Security

Do not commit `.env` files, credentials, certificates, private keys, generated
build output, or local logs. See [SECURITY.md](SECURITY.md) for reporting and
release-check guidance.
