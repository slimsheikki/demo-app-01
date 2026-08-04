# Markup — Image Review

**Live app: https://slimsheikki.github.io/demo-app-01/standalone.html**

A browser-based tool for marking up photos and sending the notes straight back to the person who shot them. No accounts, no install, no build step — drop an image in, draw on it, write a comment, and share a link.

## What it's for

A review loop between whoever is giving notes on a photo (an art director, a photo editor, a client) and whoever is going to act on them (a photographer, a retoucher):

1. Drop one or more photos onto the canvas — each becomes its own **artboard**.
2. Draw directly on an image and attach a comment to the marks.
3. Hit **Share** to get a link. Anyone with it can open a read-only viewer — pan and zoom, read every note, no editing tools.
4. The photographer uploads a revised version (**v2**) of any image from that same link.
5. Either side drags a **before/after slider** to compare the original against the revision.

Shared links expire automatically after 8 hours — this is meant for a quick round of notes, not long-term storage.

## Features

- Freehand annotation tool with a custom colour picker and adjustable brush size
- Named, commentable annotations with a layers panel (show/hide, rename, delete)
- Unlimited undo/redo
- Multi-image projects on an infinite canvas: drag artboards freely, snap them into alignment with live guides, arrange them into a row or column, or select several with a marquee and move them together
- Per-image **hide** (kept local, excluded from anything you share) and **approve** (a status that *is* shared, so a photographer can see what's already signed off)
- Before/after comparison slider for reviewing a v2 against the original
- Read-only share links via Supabase, with the remaining time before expiry shown up front
- Copy an image to your system clipboard, or paste one in from anywhere
- Light and dark themes that follow your system setting, with a manual switch
- Full keyboard control (see below) and native trackpad gestures — pinch to zoom, two-finger scroll to pan

## Keyboard shortcuts

Press **`?`** in the app any time for the full, current list. As of this writing:

| Action | Shortcut |
|---|---|
| Pan tool | `Space` (hold) or middle-drag |
| Draw tool | click the toolbar, or draw with the pen selected |
| Selection tool — marquee, move several artboards together | `V` |
| Zoom tool — click to step, drag to scrub | `Z` (hold `Alt` to reverse) |
| Zoom to pointer / pan canvas | pinch / two-finger scroll |
| Fit to screen | double-click |
| Focus one artboard, then return | `F` |
| Approve the active artboard | `A` |
| Brush smaller / bigger | `Q` / `E` |
| Cancel a drawing or selection | `Esc` |
| Rename an artboard | double-click its name |
| Select all artboards | `Ctrl`/`Cmd` + `A` |
| Arrange artboards in a row / column | `1` / `2` |
| Copy the active image | `Ctrl`/`Cmd` + `C` |
| Paste image(s) from the clipboard | `Ctrl`/`Cmd` + `V` |
| Undo / redo | `Ctrl`/`Cmd` + `Z` / `Ctrl`/`Cmd` + `Shift` + `Z` |
| Confirm / discard a comment | `Ctrl`/`Cmd` + `Enter` / `Esc` |

## How it's built

- **`standalone.html`** is the entire application — one file, no build step, Konva.js for the canvas, zero other dependencies.
- **Supabase** provides sharing: a `sessions` table for annotation data and a storage bucket for images, called directly with `fetch` (no SDK). The anon key in the source is intentionally public; Row Level Security is what actually restricts access, and the unguessable share ID is the access gate.
- An hourly **Supabase Edge Function** deletes sessions and their images once they pass the 8-hour expiry.
- Deployment is **GitHub Pages**, served straight from `main` with no build step.

See `SUPABASE_SETUP.md` for how the backend is configured, and `PROJECT_STATE.md` for a more detailed architecture and status log.

## Running it yourself

There's nothing to build. Open `standalone.html` directly in a browser, or serve the folder with any static file server. Sharing links requires pointing it at your own Supabase project — see `SUPABASE_SETUP.md`.
