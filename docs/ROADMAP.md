# viveSticker — Geliştirme Yol Haritası

Tarih: 2026-11-27 · Temel: `main` @ `6589454`

## 0. Mevcut durum (koddan okunan)

- **Yığın:** SvelteKit 3 + Svelte 5 (runes), Tailwind v4 (`@theme` tokenları), adapter-static,
  GitHub Pages `/viveSticker` alt yolu, PWA (service worker + share target), Vitest + Playwright
  (iPhone/iPad WebKit + Desktop Chromium).
- **Özellik derinliği güçlü:** GIF/APNG/animasyonlu WebP çözücüler, WebP mux, boyut limitine
  oturtan kodlayıcı (worker), MediaPipe arka plan silme (lazy import), IndexedDB kitaplık,
  `.wastickers` paket çıktısı. Mimari: dikey dilim (`src/lib/features/<x>/`) — korunacak.
- **Eksikler (bu planın gerekçesi):**
  - SEO neredeyse yok: canonical, Open Graph, Twitter kartı, OG görseli, `robots.txt`,
    `sitemap.xml`, JSON-LD, hreflang yok. Ana sayfa H1'i "Yeni çıkartma" — arama niyetine
    karşılık gelmiyor. Taranabilir metin içeriği yok (sayfa = araç).
  - Dil yalnızca istemcide (`localStorage` + `navigator.language`); prerender HTML her zaman TR.
    İngilizce sürüm arama motoruna hiç görünmüyor.
  - `github.io` alt yolu: alan adı otoritesi paylaşımlı, marka sinyali zayıf.
  - Google Fonts üçüncü taraf ve render-blocking (4 aile; Anton/Caveat yalnızca metin aracında
    lazım). "Hiçbir şey cihazdan çıkmaz" vaadini de zayıflatıyor.
  - Karanlık tema yok. `theme-color` (`#FAFAF7`) arka planla (`#f7f7fb`) uyuşmuyor. Logo renkleri
    favicon (`#2F5BEA`) ile başlık logosu (mor→mavi gradyan) arasında farklı. `bg-brand` ve
    `AppShell.svelte` içinde ham hex.
  - `EditorScreen` ana sayfada statik import ediliyor → editör kodu ilk yüklemede iniyor.
  - Editöre girmek URL/geçmiş değiştirmiyor → Android geri tuşu uygulamadan çıkarıyor.
  - Service worker `skipWaiting()` ile sessiz güncelleniyor → düzenleme ortasında sürüm değişebilir.
  - CI/CD yok (`.github/` yok); deploy elle.
  - Kitaplık yalnızca WebP saklıyor; çıkartma yeniden düzenlenemiyor, yedeklenemiyor.

> Not: Bu oturumda `pnpm install/test/build` çalıştırılamadı (komut izni verilmedi). Faz 0'ın
> ilk işi bu taban ölçümü.

---

## Faz 0 — Taban ve güvenlik ağı · Risk: Tier 3 (CI) · onay gerekir

1. `pnpm install --frozen-lockfile && pnpm check && pnpm lint && pnpm test && pnpm exec playwright test`
   — sonuçları kaydet; kırık test varsa önce onlar.
2. Bundle ölçümü: `vite-bundle-visualizer`; ilk JS (gzip) < 200 KB hedefi için sayı al.
3. `.github/workflows/ci.yml`: check + lint + vitest + playwright (3 proje), `pnpm audit`.
   Actions SHA ile pinlenir, `permissions:` en dar.
4. `.github/workflows/deploy.yml`: build → `actions/deploy-pages` (OIDC, token yok).
5. Lighthouse CI bütçesi (mobil): Performans ≥ 95, Erişilebilirlik 100, En iyi uygulamalar 100, SEO 100.
6. Dependabot (haftalık, gruplanmış).

**Kabul:** PR'da tüm kontroller yeşil; main'e merge otomatik yayınlar.

---

## Faz 1 — Teknik SEO temeli · Risk: Tier 2

1. **Alan adı:** özel alan adı + `static/CNAME`, `BASE_PATH=''`. ✅ `sticker.vivepdf.com` (2026-11-27)
2. **URL tabanlı dil:** TR kökte (`/`), EN `/en/` altında. Her iki dil prerender edilir.
   - `<html lang>` build sırasında doğru basılır (`hooks.server.ts` → `transformPageChunk`
     ile `app.html` içindeki yer tutucu değiştirilir).
   - Dil düğmesi karşı URL'ye gider; tarayıcı dili yalnızca **öneri bandı** gösterir,
     otomatik yönlendirme yapılmaz (Googlebot EN sayfayı da görmeli).
   - Mevcut `i18n` kataloğu korunur; kaynak `localStorage` yerine route parametresi olur.
3. **`<Seo>` bileşeni** (`src/lib/components/Seo.svelte`): her route kendi
   `title` (≤ 60 kr), `description` (≤ 155 kr), canonical, `hreflang` (tr, en, x-default),
   `og:*`, `twitter:card=summary_large_image`, `og:locale` + `og:locale:alternate`.
4. **OG görselleri:** dil × sayfa başına 1200×630 PNG (statik, build öncesi üretilir).
5. **`robots.txt`** ve prerender edilen **`sitemap.xml`** (route listesinden, `lastmod` ile, iki dil).
6. **JSON-LD:** `WebApplication` (ücretsiz `Offer`, `applicationCategory: MultimediaApplication`,
   `featureList`, `inLanguage`), `Organization`, içerik sayfalarında `BreadcrumbList`.
   `FAQPage`/`HowTo` yalnızca AEO (yapay zekâ yanıtları) için — Google 2023'ten beri bu
   zengin sonuçları genel sitelere göstermiyor; görsel getiri beklenmez.
7. **Hijyen:** `theme-color` light/dark `media` ile düzeltilir; `404.html` `noindex`;
   `?share=1` gibi parametreli URL'ler canonical ile köke bağlanır; manifest `lang`/`description`
   dil başına.

**Test:** `tests/e2e/seo.spec.ts` — her route için tek H1, benzersiz title/description,
canonical mutlak URL, hreflang çiftleri karşılıklı, JSON-LD `JSON.parse` geçer, sitemap tüm
route'ları içerir, `<html lang>` doğru.

---

## Faz 2 — İçerik ve arama niyeti sayfaları (asıl SEO kaldıracı) · Risk: Tier 2

Araç sayfası tek başına sıralama almaz; niyet başına **benzersiz** içerikli sayfa gerekir.

1. **Ana sayfa:** araç ekranın üstünde kalır (araç-önce), altında taranabilir içerik:
   H1 "WhatsApp Çıkartması Yap" + ilk paragraf soruyu doğrudan yanıtlar (AEO) →
   3 adımda nasıl çalışır → özellikler → WhatsApp limitleri tablosu → gizlilik → SSS.
2. **Niyet sayfaları** (her biri aracı uygun ön ayarla gömer; TR + EN eşleri):
   - `/gif-ten-whatsapp-cikartmasi` · `/videodan-cikartma` · `/fotograftan-cikartma`
   - `/arka-plan-silerek-cikartma` · `/hareketli-cikartma` · `/yazili-cikartma`
   - `/wastickers-paket-olusturma`
3. **Rehberler** (`/rehber/...`): WhatsApp'a çıkartma ekleme (Android / iPhone ayrı),
   çıkartma boyut ve limitleri, X/Twitter GIF'ini çıkartma yapma.
4. **Kurumsal:** `/gizlilik` (KVKK aydınlatma dahil), `/hakkinda`, `/sss`.
5. **Kurallar:** her sayfa ≥ 400 kelime özgün metin, kendi örnek görselleri, kendi SSS'i;
   ince/kopya sayfa yok. Anahtar kelime hacimleri Search Console + Keyword Planner'dan
   alınır, tahmin edilmez.
6. **Teknik:** içerik Svelte sayfaları + paylaşılan içerik bileşenleri (yeni bağımlılık yok).
   mdsvex istenirse Faz 2 başında bağımlılık denetimiyle karar verilir.
7. İç bağlantı: footer'da site haritası, sayfalar arası "ilgili" blokları, breadcrumb.

---

## Faz 3 — Tasarım sistemi v2 · Risk: Tier 1–2

1. **Karanlık tema:** tüm tokenlar `:root[data-theme=dark]` ve
   `@media (prefers-color-scheme: dark)` altında yeniden tanımlanır; damalı arka plan dahil.
   `app.html`'de boyamadan önce çalışan küçük satır içi betik (yanıp sönme yok).
   Başlıkta 3 durumlu seçim: Sistem / Açık / Koyu.
2. **Ham hex temizliği:** `bg-brand` → `--color-brand-from/--color-brand-to`;
   `AppShell.svelte` logo `stop-color` tokenlara. (`doc.ts` mürekkep paleti içerik rengidir, istisna.)
3. **Fontlar kendi sunucumuzdan:** Instrument Sans değişken woff2 (latin + latin-ext — ğ ş ı İ),
   `preload` + `font-display: swap`. Anton/Caveat yalnızca metin aracı açılınca `FontFace`
   ile yüklenir; canvas çizimi `document.fonts.load()` bekler. Google Fonts kalkar →
   README gizlilik bölümü ve SW `FONTS` önbelleği güncellenir.
4. **Tek marka kaynağı:** ana logo SVG → favicon.svg, 32 px ico, apple-touch, maskable, OG şablonu
   aynı renklerden üretilir.
5. **UI primitifleri** (`src/lib/components/ui/`): `Button`, `IconButton`, `SegmentedControl`
   (şu an AppShell ve StickerShelf'te kopya sınıflar), `Card`, `Icon` (tekrarlanan satır içi SVG'ler).
6. **Hareket:** import→editör ve sayfa geçişlerinde View Transitions API; raf öğelerinde
   50 ms kademeli giriş (en fazla 8 öğe); `prefers-reduced-motion` mevcut kuralı korunur.
7. **Vitrin:** ana sayfa içerik bölümünde önce/sonra örnek çıkartmalar (küçük WebP, lazy,
   ekran altı). LCP öğesi H1 metni kalır.
8. **Durum denetimi:** her veri bileşeninde yükleniyor (iskelet) / boş (ikon+başlık+açıklama+CTA) /
   hata (mesaj+yeniden dene) — PackScreen ve Editor dahil.
9. Erişilebilirlik: `@axe-core/playwright` ile her route (bağımlılık denetimi sonrası),
   kontrast hem açık hem koyu temada.

---

## Faz 4 — Ürün ve UX · Risk: Tier 2 (4.4 Tier 3 — IndexedDB şeması)

1. **Geri tuşu:** editöre girerken `pushState`; geri = editörü kapat, kaydedilmemiş iş varsa onay.
2. **"Örnekle dene"** düğmesi: dosyası olmayan ziyaretçi için hazır örnek görsel.
3. **Paylaş:** mobilde `navigator.share({ files })` ile WebP'yi doğrudan paylaşma
   (WhatsApp'ın bunu çıkartma olarak alıp almadığı cihazlarda test edilecek).
4. **Yeniden düzenlenebilir çıkartma:** kitaplığa WebP yanında düzenleme belgesi + kaynak
   saklanır; DB sürüm yükseltme + geçiş (eski kayıtlar yalnızca-WebP olarak kalır).
   Yeniden adlandır / çoğalt / sil.
5. **Toplu içe aktarma:** birden çok dosya → kuyruk.
6. **Kalıcı depolama:** `navigator.storage.persist()` isteği + kullanılan alan göstergesi.
7. **Yedek:** kitaplığı zip olarak dışa/içe aktar (mevcut `zip.ts` kullanılır).
8. **Güncelleme:** SW `skipWaiting` sessiz değil — "Yeni sürüm hazır, yenile" bildirimi.
9. **WhatsApp'a ekleme sihirbazı:** indirmeden sonra platforma göre adım adım yönlendirme.

---

## Faz 5 — Performans · Risk: Tier 1

1. `EditorScreen` lazy import (ana sayfa ilk JS'inden çıkar).
2. Kitaplık: 128 px küçük resim sakla (her karoda 512 px WebP çözme yok); > 50 öğede
   sayfalama/sanallaştırma.
3. Kritik font `preload`, LCP metni için render-blocking CSS yok.
4. Bütçeler CI'da: ilk JS < 200 KB gz, route başı < 100 KB, CSS < 50 KB; LCP < 2.5 s,
   CLS < 0.1, INP < 200 ms.

---

## Faz 6 — Güvenlik ve gizlilik · Risk: Tier 3 (barındırma/başlıklar)

1. **CSP:** SvelteKit `kit.csp` (prerender için hash modu). GitHub Pages HTTP başlığı
   veremez → `<meta>` CSP ile sınırlı; gerçek başlıklar (HSTS, `X-Content-Type-Options`,
   `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors`) için Cloudflare Pages önerilir.
2. **Bağlantıdan yükleme:** `AbortController` zaman aşımı, akış sırasında 200 MB sınırı
   uygulama, yönlendirme sayısı sınırı, FxTwitter kesintisinde anlaşılır hata.
3. İndirme dosya adlarını temizleme; paket adı/yayıncı uzunluk sınırları.
4. `pnpm audit` CI'da; yeni bağımlılıkta denetim zorunlu.

---

## Faz 7 — Ölçüm ve lansman · Risk: Tier 1

1. Google Search Console + Bing Webmaster; sitemap gönderimi; IndexNow.
2. Çerezsiz analitik (Cloudflare Web Analytics veya kendi barındırılan Umami); olaylar:
   içe aktarma, dışa aktarma, paket oluşturma. KVKK uyumu hukuken teyit edilir.
3. Core Web Vitals saha verisi (`web-vitals` → analitik).
4. Lansman: GitHub README'den bağlantı, alternativeto/PWA dizinleri, Türk teknoloji toplulukları.

---

## Öncelik sırası

| #   | İş                                                              | Etki                   | Boyut |
| --- | --------------------------------------------------------------- | ---------------------- | ----- |
| 1   | Faz 0 taban + CI/deploy                                         | Temel                  | M     |
| 2   | Alan adı + URL tabanlı dil + `<Seo>` + sitemap/robots + JSON-LD | Çok yüksek             | M     |
| 3   | Ana sayfa içerik bölümü + H1                                    | Çok yüksek             | S     |
| 4   | Fontları kendi sunucuya al + EditorScreen lazy                  | Yüksek (LCP, gizlilik) | S     |
| 5   | Karanlık tema + token temizliği + UI primitifleri               | Yüksek (tasarım)       | M     |
| 6   | Niyet sayfaları + rehberler                                     | Çok yüksek (trafik)    | L     |
| 7   | Geri tuşu, örnekle dene, paylaş, SW güncelleme bildirimi        | Yüksek (UX)            | M     |
| 8   | Yeniden düzenlenebilir kitaplık + yedek                         | Orta                   | L     |
| 9   | CSP/başlıklar, analitik, lansman                                | Orta                   | S–M   |

## Kararlar (2026-11-27 durumu)

1. ✅ Özel alan adı: `sticker.vivepdf.com`.
2. ⏳ Barındırma: şimdilik GitHub Pages (varsayılan). Cloudflare Pages, güvenlik başlıkları için Faz 9'da yeniden değerlendirilecek.
3. ✅ Dil yapısı: TR kökte + `/en/` (uygulandı).
4. ⏳ Analitik: şimdilik yok (varsayılan). İstenirse çerezsiz bir araç eklenir.
5. ⏳ İçerik metinleri taslaklandı (`src/lib/content/tr.ts`, `en.ts`); kullanıcı onayı bekleniyor.
