# Publishing PATCH to npm

## Pre-flight Checklist

Before publishing, make sure you have:

- [ ] Node.js 18+ installed
- [ ] An npm account (create one at https://www.npmjs.com/signup)
- [ ] Git installed

---

## Step 1: Check the package name

The name `patchui` might already be taken. Check first:

```bash
npm view patchui
```

If it's taken, update the `name` field in `package.json` to something else.
Some alternatives: `@yourusername/patchui`, `patch-ui-react`, `patchcontrols`.

---

## Step 2: Set up your GitHub repo

```bash
cd patchui

# Initialize git
git init
git add .
git commit -m "initial commit — patchui v0.1.0"

# Create the repo on GitHub first (via github.com or gh cli)
gh repo create patchui --public --source=. --push

# Or manually:
git remote add origin https://github.com/YOUR_USERNAME/patchui.git
git branch -M main
git push -u origin main
```

Update the `repository.url` in `package.json` to match your actual GitHub URL.

---

## Step 3: Log in to npm

```bash
npm login
```

This opens your browser to authenticate. Follow the prompts.

Verify you're logged in:

```bash
npm whoami
```

---

## Step 4: Build

```bash
npm run build
```

This runs `tsup`, generating:
- `dist/index.js` — ESM bundle
- `dist/index.cjs` — CommonJS bundle
- `dist/index.d.ts` — TypeScript declarations
- `dist/index.d.cts` — CTS declarations
- `dist/styles.css` — Stylesheet

---

## Step 5: Dry run

See exactly what will be published:

```bash
npm pack --dry-run
```

You should see roughly 10 files, ~67 kB packed size. No `src/`, no `node_modules/`.

---

## Step 6: Publish

```bash
npm publish
```

If you're using a scoped name like `@yourusername/patchui`, you need:

```bash
npm publish --access public
```

---

## Step 7: Verify

```bash
npm view patchui
```

Visit `https://www.npmjs.com/package/patchui` to see your live package page.

---

## Updating

When you push changes:

1. Update the version in `package.json` (or use `npm version`):

```bash
# Patch: 0.1.0 → 0.1.1 (bug fixes)
npm version patch

# Minor: 0.1.0 → 0.2.0 (new features)
npm version minor

# Major: 0.1.0 → 1.0.0 (breaking changes)
npm version major
```

2. Build and publish:

```bash
npm run build
npm publish
```

3. Push the version tag:

```bash
git push --follow-tags
```

---

## If the name is taken

Option A — Use a scoped package:

```json
{
  "name": "@yourusername/patchui"
}
```

Then publish with `npm publish --access public`.

Users install with `npm install @yourusername/patchui`.

Option B — Pick a different name. Update `name` in `package.json`, 
the import paths in `README.md`, and publish.

---

## Quick Reference

| Command | What it does |
|---------|-------------|
| `npm run build` | Build ESM + CJS + types + CSS |
| `npm run dev` | Watch mode rebuild |
| `npm run typecheck` | Check types without building |
| `npm pack --dry-run` | Preview what gets published |
| `npm publish` | Publish to npm |
| `npm version patch` | Bump patch version |
| `npm version minor` | Bump minor version |
| `npm deprecate patchui "message"` | Deprecate a version |
| `npm unpublish patchui@0.1.0` | Remove a specific version (within 72h) |

---

## Optional: GitHub Actions CI

Create `.github/workflows/publish.yml` to auto-publish on tags:

```yaml
name: Publish
on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org
      - run: npm ci
      - run: npm run build
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Add your npm token as `NPM_TOKEN` in GitHub repo settings → Secrets.

Then to publish: `npm version patch && git push --follow-tags`

That's it. Your package is live.
