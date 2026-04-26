# borght-dev.github.io

Personal site at [koenvdborght.nl](https://koenvdborght.nl) (canonical) — also reachable at [borght-dev.github.io](https://borght-dev.github.io). Built with [Astro 5](https://astro.build), authored from phone via [Obsidian](https://obsidian.md).

## Quick start (laptop)

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
```

## Where to write

All content lives in `content/`:

```
content/
├── pages/         # about.md, contact.md
├── posts/         # standalone blog posts
├── projects/      # project portfolio
└── series/
    ├── ai-generated-platform/
    │   ├── index.md           # series description
    │   ├── 01-the-claim-and-the-setup.md
    │   ├── 02-the-reference-code-pattern.md
    │   └── ...
    ├── borgdock/
    ├── multi-worktree-dotnet/
    └── ai-native-engineering/
```

### Publishing an episode

Open the file. Change `draft: true` → `draft: false`. Add `date: 2026-04-25`. Commit + push. Done.

### Adding a new post

Create `content/posts/my-post.md` with frontmatter:

```yaml
---
title: "My Post"
date: 2026-04-25
tags: ["tag1", "tag2"]
---
```

## Phone setup → see [OBSIDIAN_SETUP.md](./OBSIDIAN_SETUP.md)

## Legacy Hugo site

Archived in `_legacy_hugo/` for reference. Not deployed.
