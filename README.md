<div align="center">

<img src="static/icons/icon-192.png" width="96" height="96" alt="viveSticker icon">

# viveSticker

**WhatsApp stickers from any photo, GIF or video, on your own device.**

A free, open-source sticker maker that runs in the browser. Crop, cut out, trim, decorate and pack stickers that fit WhatsApp's limits; your files are never uploaded.

**English** · [Türkçe](README.tr.md)

[Website](https://sticker.vivepdf.com/en/) · [Add stickers to WhatsApp](https://sticker.vivepdf.com/en/add-stickers-to-whatsapp) · [Sticker sizes](https://sticker.vivepdf.com/en/whatsapp-sticker-size) · [FAQ](https://sticker.vivepdf.com/en/faq) · [Discussions](https://github.com/mtvrkan/viveSticker/discussions)

[![CI](https://github.com/mtvrkan/viveSticker/actions/workflows/ci.yml/badge.svg)](https://github.com/mtvrkan/viveSticker/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/mtvrkan/viveSticker)](LICENSE)
![Any modern browser · installable](https://img.shields.io/badge/platform-any%20modern%20browser%20%C2%B7%20installable-5B45F5)

<img src="static/og/en-home.png" width="800" alt="viveSticker: WhatsApp stickers from photos, GIFs and videos">

</div>

## Why viveSticker

- **Nothing leaves your device.** Encoding, background removal and pack building all run in the browser. No account, no analytics, no uploads.
- **Made for WhatsApp's rules.** Every sticker is 512×512 and is squeezed under the size and length limits automatically, so it is accepted the first time.
- **Free and open.** MIT-licensed, works offline once opened, and installs to the home screen like an app.

## Features

- **Import** a photo, GIF, animated WebP/PNG or video by dropping, picking, pasting or linking it, including X (Twitter) post links. On Android, share a file into the installed app.
- **Crop and position** on a 512×512 canvas: rectangle (any aspect, rounded corners), circle, heart, star, speech bubble, or a freehand cut with a soft edge. Pinch, drag, rotate, snap to centre, undo/redo and a hold-to-compare view.
- **Trim motion**: pick start and end on a timeline, change speed (0.5×–2×) and cut several ranges from one video, each its own sticker.
- **Remove the background** with on-device AI: tap the objects to keep in a photo, or cut out people in every frame of a GIF or video.
- **Decorate** with an outline, text in four styles, emoji and freehand drawing.
- **Fit WhatsApp's limits automatically**: still stickers stay under 100 KB (lossless when possible), animated ones under 500 KB and 10 s by lowering quality first and frame rate second. A manual quality slider is there when you want it.
- **Library and packs**: every sticker you make is saved on your device. Pick 3–30 of the same kind on _My packs_, name the pack and download a `.wastickers` file with its 96×96 tray icon.
- **Interface** in Turkish (`/`) and English (`/en/`), with a guide page for each way of making a sticker, a tools menu in the header, and light and dark themes that follow the system.

## Adding stickers to WhatsApp

WhatsApp does not let websites add sticker packs directly.

- **Single sticker:** download the WebP and use it with any app or tool that accepts WhatsApp sticker files.
- **Pack:** download the `.wastickers` file and open it with a sticker importer app. These apps are mainly available on Android.

The [step-by-step guide](https://sticker.vivepdf.com/en/add-stickers-to-whatsapp) covers both.

## WhatsApp limits used

|                  | Limit                                       |
| ---------------- | ------------------------------------------- |
| Size             | 512×512 px                                  |
| Still sticker    | ≤ 100 KB                                    |
| Animated sticker | ≤ 500 KB, ≤ 10 s, frames ≥ 8 ms             |
| Tray icon        | 96×96 PNG, ≤ 50 KB                          |
| Pack             | 3–30 stickers, still and animated not mixed |

## Privacy

- Images, videos and stickers never leave your device.
- Your library lives in the browser's IndexedDB storage. Clearing site data removes it.
- Fonts and background-removal models are served from the site itself; no third-party font or analytics requests are made. Fetching media from a link contacts the site you entered. For X (Twitter) post links, the post ID is sent to the public FxTwitter API to find the media file, which is then downloaded from X's media servers.

## Development

Stack: SvelteKit (static) · Svelte 5 · Tailwind CSS v4 · TypeScript · libwebp and MediaPipe compiled to WebAssembly.

Prerequisites: Node 22.18+ and pnpm.

```sh
pnpm install
pnpm dev
```

Tests: `pnpm test` (unit) · `pnpm check` · `pnpm lint` · `pnpm test:e2e` (Chromium and WebKit on phone, tablet and desktop; run `pnpm exec playwright install chromium webkit` once). `pnpm build` builds the static site and `pnpm og` redraws the Open Graph cards in `static/og` after a page heading changes.

## Website

The site at https://sticker.vivepdf.com is this repository, built fully static with adapter-static.

- Routes: `src/routes/[[lang=lang]]/` (home), `…/pack` (My packs) and `…/[slug=page]` (guide pages). Turkish lives at the root, English under `/en/`; the URL decides the language.
- Page copy is in `src/lib/content/tr.ts` and `en.ts`; slugs, the site URL and page IDs are in `src/lib/seo/site.ts`.
- Every page renders its own title, description, canonical URL, `hreflang` alternates, Open Graph card and JSON-LD. `sitemap.xml` and `robots.txt` are generated at build time.

`.github/workflows/ci.yml` runs check, lint, format, unit tests, build and the browser tests on every pull request and push to `main`. `scripts/deploy-site.sh` builds the site into the `gh-pages` branch for GitHub Pages; add `--push` to publish it. `static/CNAME` holds the domain; set `BASE_PATH` only when serving from a sub-path.

## Contributing and support

Bug reports go to [Issues](https://github.com/mtvrkan/viveSticker/issues), questions and ideas to [Discussions](https://github.com/mtvrkan/viveSticker/discussions). Pull requests are welcome; please run the tests above first. Security problems: please [report them privately](https://github.com/mtvrkan/viveSticker/security/advisories/new) instead of opening a public issue.

## License

MIT — see [LICENSE](LICENSE). Third-party components:

| Component                                                                                                             | Licence                          |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| [@jsquash/webp](https://github.com/jamsinclair/jSquash) (libwebp compiled to WebAssembly)                             | Apache-2.0, libwebp BSD-3-Clause |
| [MediaPipe Tasks Vision](https://github.com/google-ai-edge/mediapipe) and its Magic Touch and Selfie Segmenter models | Apache-2.0                       |
| Instrument Sans, JetBrains Mono, Anton and Caveat via Fontsource                                                      | SIL Open Font License 1.1        |
| SvelteKit, Svelte, Vite, Tailwind CSS                                                                                 | MIT                              |
