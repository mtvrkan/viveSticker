# Changelog

## [Unreleased]

### Added

- Home sticker shelf: browse saved stickers by kind, tap to select and jump straight into a pack with the selection kept [2026-11-27]
- Paste button on the home card that imports an image or video from the clipboard [2026-11-27]
- X (Twitter) post links in "Load from link": the photo, GIF or video in the post is fetched through the public FxTwitter API [2026-11-27]
- README covering features, adding stickers to WhatsApp, limits, privacy and third-party licences [2026-11-26]
- Installable app with icons and a web manifest; works offline after the first visit, and background-removal models are kept for offline use once downloaded [2026-11-26]
- Android share target: share a photo, GIF or video from another app straight into the import screen [2026-11-26]
- On-device sticker library: every downloaded or built sticker is saved automatically, with a "My packs" page to browse, select and delete them [2026-11-26]
- Pack builder that checks WhatsApp's rules (3–30 stickers, no mixing still and animated, name and publisher) and exports a `.wastickers` file with a 96×96 tray icon; packs can be saved, edited and deleted [2026-11-26]
- Background removal on-device: tap objects in a photo to keep them, or cut out people in every frame of a GIF or video (MediaPipe, models served from the site) [2026-11-26]
- Outline around the sticker with adjustable width and colour [2026-11-26]
- Text and emoji layers with four fonts, colours, edge styles, size, angle and drag-to-move, plus freehand drawing with brush colour and width [2026-11-26]
- Animated stickers from GIF, animated WebP, APNG and video: preview playback, trim with start and end handles, speed (0.5×–2×), and several ranges from one source, each its own sticker [2026-11-26]
- Animated WebP export that fits WhatsApp's 500 KB and 10 s limits by lowering quality first and frame rate second, with a live size estimate [2026-11-26]
- Static sticker editor: move, pinch-zoom and rotate the image on a 512×512 canvas with center and 45° snapping, undo/redo, and a hold-to-compare view [2026-11-26]
- Crop shapes: rectangle with aspect ratios and rounded corners, circle, heart, star, speech bubble, and a freehand cut with a soft edge [2026-11-26]
- Optional 16 px edge margin, on by default, following WhatsApp's sticker guidance [2026-11-26]
- WebP export that works in every browser, including Safari, and picks the highest quality that fits in 100 KB, with a manual quality override [2026-11-26]
- Live file size meter under the canvas showing the size against the WhatsApp limit [2026-11-26]
- Project skeleton: SvelteKit 3 static site for GitHub Pages, Tailwind v4 design tokens, Turkish/English interface. [2026-11-26]
- Media import screen: drag-drop, file picker, clipboard paste and link fetch, with loading, ready and error states. [2026-11-26]
- Detection of animated GIF, WebP and APNG files with frame count and duration, plus video metadata reading. [2026-11-26]
- Unit tests for media detection and browser tests on iPhone, iPad (WebKit) and desktop Chromium. [2026-11-26]

### Changed

- Modern vivid redesign: violet–blue gradient start card, pastel sticker tiles, pill buttons, soft shadows, segmented navigation and a one-tap language switch [2026-11-27]
- Editor layout: bottom icon bar for tools on phones, canvas beside a sticky tools column on tablets and desktops [2026-11-27]

### Fixed

- Importing failed with "file may be damaged" when the app was opened over plain http (for example from a phone on the local network); IDs no longer need a secure context [2026-11-27]
- The paste button and ⌘V / Ctrl+V now accept a copied link, including X post links, instead of only images [2026-11-27]
- A link to a web page now says it is a page, not a media file, instead of reporting an unsupported file type [2026-11-27]
- Videos whose length is only known after loading (common for recorded WebM clips) no longer fail to open [2026-11-26]
- Opening the editor no longer invalidates the imported file, which broke video editing [2026-11-26]
