# viveSticker

Turn photos, GIFs and videos into high-quality WhatsApp stickers — right in your browser. Nothing is uploaded: every file is processed on your device.

**Status:** early development. Importing media works; the editor and export are in progress.

## Planned features

- Drop, pick or paste a photo, GIF or video (MP4, MOV, WebM, GIF, WebP, PNG, JPG, HEIC)
- Crop, rotate and zoom on a 512×512 canvas
- Trim video and GIFs on a timeline, control frame rate and speed
- Automatic quality tuning that fits WhatsApp's limits (static ≤100 KB, animated ≤500 KB, ≤10 s)
- AI background removal, white sticker outline, captions, drawing and emoji
- Export a single WebP or a `.wastickers` pack
- Turkish and English interface

## Development

Requires Node 22.17+ and pnpm.

```sh
pnpm install
pnpm dev
pnpm test
pnpm check
pnpm lint
BASE_PATH=viveSticker pnpm build
```

## License

[MIT](LICENSE)
