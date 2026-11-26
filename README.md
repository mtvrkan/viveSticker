# viveSticker

Turn photos, GIFs and videos into high-quality WhatsApp stickers, right in your browser. Nothing is uploaded: every file is processed on your device.

## Features

- **Import** a photo, GIF, animated WebP/PNG or video by dropping, picking, pasting or linking it. On Android, share a file into the installed app.
- **Crop and position** on a 512×512 canvas: rectangle (any aspect, rounded corners), circle, heart, star, speech bubble, or a freehand cut with a soft edge. Pinch, drag, rotate, snap to centre, undo/redo and a hold-to-compare view.
- **Trim motion**: pick start and end on a timeline, change speed (0.5×–2×) and cut several ranges from one video, each its own sticker.
- **Remove the background** with on-device AI: tap the objects to keep in a photo, or cut out people in every frame of a GIF or video.
- **Decorate** with an outline, text in four styles, emoji and freehand drawing.
- **Fit WhatsApp's limits automatically**: still stickers stay under 100 KB (lossless when possible), animated ones under 500 KB and 10 s by lowering quality first and frame rate second. A manual quality slider is there when you want it.
- **Library and packs**: every sticker you make is saved on your device. Pick 3–30 of the same kind on _My packs_, name the pack and download a `.wastickers` file with its 96×96 tray icon.
- **Works offline** once it has been opened, and can be installed to the home screen.
- Turkish and English interface.

## Adding stickers to WhatsApp

WhatsApp does not let websites add sticker packs directly.

- **Single sticker:** download the WebP and use it with any app or tool that accepts WhatsApp sticker files.
- **Pack:** download the `.wastickers` file and open it with a sticker importer app. These apps are mainly available on Android.

## WhatsApp limits used

|                  | Limit                                       |
| ---------------- | ------------------------------------------- |
| Size             | 512×512 px                                  |
| Still sticker    | ≤ 100 KB                                    |
| Animated sticker | ≤ 500 KB, ≤ 10 s, frames ≥ 8 ms             |
| Tray icon        | 96×96 PNG, ≤ 50 KB                          |
| Pack             | 3–30 stickers, still and animated not mixed |

## Privacy

- Images, videos and stickers never leave your device. Encoding, background removal and pack building all run in the browser.
- Your library lives in the browser's IndexedDB storage. Clearing site data removes it.
- Fonts are loaded from Google Fonts, so Google sees the request for the font files. Fetching media from a link contacts the site you entered. For X (Twitter) post links, the post ID is sent to the public FxTwitter API to find the media file, which is then downloaded from X's media servers.

## Development

Requires Node 22.17+ and pnpm.

```sh
pnpm install
pnpm dev
pnpm test
pnpm check
pnpm lint
pnpm exec playwright test
BASE_PATH=viveSticker pnpm build
```

The site is fully static (SvelteKit with adapter-static) and is served from the `viveSticker` sub-path on GitHub Pages.

## Credits

| Component                                                                                                             | Licence                          |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| [@jsquash/webp](https://github.com/jamsinclair/jSquash) (libwebp compiled to WebAssembly)                             | Apache-2.0, libwebp BSD-3-Clause |
| [MediaPipe Tasks Vision](https://github.com/google-ai-edge/mediapipe) and its Magic Touch and Selfie Segmenter models | Apache-2.0                       |
| Instrument Sans, JetBrains Mono, Anton and Caveat via Google Fonts                                                    | SIL Open Font License 1.1        |
| SvelteKit, Svelte, Vite, Tailwind CSS                                                                                 | MIT                              |

## License

[MIT](LICENSE)
