# Contributing to use-freshchat

Thanks for your interest in contributing. This guide covers everything you need to get started.

## Setup

```bash
git clone https://github.com/ajmalhassan/use-freshchat.git
cd use-freshchat
npm install
```

## Development

```bash
npm run build          # Build ESM + CJS + types
npm test               # Run tests once
npm run test:watch     # Run tests in watch mode
```

The library is built with Vite in library mode. Output goes to `dist/` as ESM (`index.js`), CJS (`index.cjs`), and a single rolled-up declaration file (`index.d.ts`).

## Project Structure

```
src/
  components/
    FreshchatProvider.tsx   # Provider with login/logout state machine
  context/
    FreshchatContext.tsx     # React context
  hooks/
    useFreshchat.ts          # Full API surface
    useFreshchatUser.ts      # User state + auth actions
    useFreshchatWidget.ts    # Widget state + controls
    useFreshchatEvents.ts    # Declarative event subscriptions
  types/
    index.ts                 # All TypeScript interfaces + Window declaration
  utils/
    guards.ts                # SSR safety (isBrowser, getFcWidget)
    loader.ts                # Script loader (loads widget.js once)
  index.ts                   # Public re-exports
tests/
  hooks/                     # Hook tests
  utils/                     # Utility tests
```

## Making Changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Add or update tests if applicable
4. Run `npm test` and `npm run build` to verify nothing is broken
5. Open a pull request against `main`

## Code Conventions

- TypeScript strict mode is on -- no `any`, no implicit returns
- All `window.fcWidget` access must be guarded with `isBrowser` or use `getFcWidget()`
- Event listeners must be cleaned up -- always call `.off()` in cleanup functions
- Hooks must throw if used outside `<FreshchatProvider>` (the context returns `null` by default)
- The context value must be memoized to prevent unnecessary re-renders
- Callback props from the provider use refs to avoid stale closures

## Testing

Tests use Vitest with jsdom and @testing-library/react. Run them with:

```bash
npm test
```

When writing tests:

- Test hooks using `renderHook` from `@testing-library/react`
- Wrap hooks in a `FreshchatContext.Provider` with a mock value
- Test the "outside provider" error case for every hook
- Utility tests don't need React -- test them directly

## Build Invariants

These must hold. CI will catch violations.

1. `dist/index.js` must start with `'use client'`
2. `react` and `react/jsx-runtime` must not be bundled -- they are externalized
3. All types are rolled up into a single `dist/index.d.ts`
4. The package has zero runtime dependencies

## Releases

Releases are automated via GitHub Actions with npm Trusted Publishing (OIDC). To release:

1. Update the version in `package.json`
2. Commit, tag (`v*`), and push
3. Create a GitHub Release from the tag
4. The publish workflow handles the rest

Only maintainers can create releases.

## Reporting Issues

Use [GitHub Issues](https://github.com/ajmalhassan/use-freshchat/issues). Include:

- What you expected to happen
- What actually happened
- Your React version and framework (Next.js, Vite, etc.)
- A minimal reproduction if possible

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
