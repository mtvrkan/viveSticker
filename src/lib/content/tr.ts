import type { SiteCopy } from './types.ts';

export const trCopy: SiteCopy = {
	home: {
		title: 'WhatsApp Çıkartma Yapma: Fotoğraf, GIF, Video | viveSticker',
		description:
			'Fotoğraf, GIF ve videodan ücretsiz WhatsApp çıkartması yap. Arka planı sil, yazı ekle, paketi indir. Kayıt yok, dosyaların cihazından çıkmaz.',
		intro: {
			heading: 'Tarayıcında WhatsApp çıkartması yap',
			paragraphs: [
				'viveSticker; fotoğraf, GIF ve videoları WhatsApp’ın istediği 512×512 WebP biçimine dönüştürür. Sabit çıkartmalar 100 KB, hareketli çıkartmalar 500 KB ve 10 saniye sınırına otomatik sığdırılır.',
				'Uygulama indirmen ya da hesap açman gerekmez. Bütün işlem tarayıcında yapılır; dosyaların hiçbir sunucuya yüklenmez.'
			]
		},
		stepsHeading: 'Üç adımda çıkartma',
		steps: [
			{
				title: 'Dosyanı seç',
				text: 'Fotoğraf, GIF ya da video seç, sürükle bırak veya bir bağlantı yapıştır.'
			},
			{
				title: 'Düzenle',
				text: 'Şekil seç, arka planı tek dokunuşla sil, yazı ve çizim ekle. Videoda istediğin aralığı kes.'
			},
			{
				title: 'İndir ya da paketle',
				text: 'WebP olarak indir ya da kaydettiğin çıkartmalardan 3–30 çıkartmalık bir paket hazırla.'
			}
		],
		featuresHeading: 'Neler yapabilirsin',
		features: [
			{
				title: 'Yapay zekâ ile arka plan silme',
				text: 'Kişiyi otomatik ayır ya da tutmak istediğin nesneye dokun; model cihazında çalışır.'
			},
			{
				title: 'Hareketli çıkartma',
				text: 'GIF ve videolardan 10 saniyeye kadar hareketli çıkartma; boyut 500 KB altına otomatik iner.'
			},
			{
				title: 'Yazı, emoji ve çizim',
				text: 'Dört yazı tipi, kontur, renkler ve serbest çizimle çıkartmanı kişiselleştir.'
			},
			{
				title: 'Boyut göstergesi',
				text: 'Çıkartmanın WhatsApp sınırına sığıp sığmadığını indirmeden önce görürsün.'
			},
			{
				title: 'Çevrimdışı çalışır',
				text: 'Bir kez açtıktan sonra internet olmadan da kullanabilir, ana ekrana ekleyebilirsin.'
			},
			{
				title: 'Gizli kalır',
				text: 'Dosyaların ve çıkartmaların yalnızca bu cihazda, tarayıcının deposunda durur.'
			}
		],
		faq: [
			{
				q: 'viveSticker ücretsiz mi?',
				a: 'Evet. Tüm özellikler ücretsizdir; kayıt, filigran ya da reklam yoktur.'
			},
			{
				q: 'Dosyalarım bir sunucuya yükleniyor mu?',
				a: 'Hayır. Dönüştürme, arka plan silme ve paketleme tarayıcında yapılır. Yalnızca bir bağlantıdan dosya getirmek istediğinde o adrese istek gönderilir.'
			},
			{
				q: 'Hangi dosya türlerini kullanabilirim?',
				a: 'PNG, JPG, WebP, GIF, HEIC, MP4, MOV ve WebM. Dosya en fazla 200 MB olabilir.'
			},
			{
				q: 'Çıkartmayı WhatsApp’a nasıl eklerim?',
				a: 'Tek çıkartmayı WebP olarak indirip WhatsApp’ın çıkartma oluşturucusunda kullanabilirsin. Paket için indirdiğin .wastickers dosyasını Android’de bir çıkartma içe aktarma uygulamasıyla açarsın. Ayrıntılar rehberde.'
			}
		],
		guidesHeading: 'Rehberler',
		guides: ['guide', 'limits', 'cutout', 'animated', 'faq', 'privacy']
	},
	library: {
		title: 'Paketlerim: WhatsApp Çıkartma Paketi Hazırla | viveSticker',
		description:
			'Kaydettiğin çıkartmalardan 3–30 çıkartmalık WhatsApp paketi hazırla ve .wastickers dosyası olarak indir.'
	},
	pages: {
		gif: {
			label: 'GIF’ten çıkartma',
			title: 'GIF’ten WhatsApp Çıkartması Yap (Ücretsiz) | viveSticker',
			description:
				'GIF’i hareketli WhatsApp çıkartmasına dönüştür. Aralığı kes, arka planı sil, yazı ekle; boyut 500 KB altına otomatik iner. Kayıt gerekmez.',
			heading: 'GIF’ten WhatsApp çıkartması yap',
			lead: 'GIF dosyanı aşağıya bırak: viveSticker onu 512×512 boyutunda, 500 KB ve 10 saniye sınırına uyan hareketli bir WebP çıkartmaya dönüştürür. Her şey tarayıcında yapılır.',
			tool: true,
			sections: [
				{
					heading: 'GIF nasıl çıkartma olur?',
					paragraphs: [
						'WhatsApp hareketli çıkartmaları GIF olarak değil, hareketli WebP olarak kabul eder. viveSticker GIF’in karelerini çözer, istediğin bölümü alır ve WhatsApp’ın kurallarına uyan bir WebP dosyası üretir.'
					],
					steps: [
						'GIF’i seç, sürükle bırak ya da bağlantısını yapıştır.',
						'Zaman çizelgesinde tutmak istediğin aralığı seç; uzun GIF’lerde birden çok aralık ekleyebilirsin.',
						'Şekil, yazı ya da arka plan silme ekle ve hareketli çıkartmayı oluştur.'
					]
				},
				{
					heading: 'Boyut sınırı nasıl tutturuluyor?',
					paragraphs: [
						'Hareketli çıkartmalar en fazla 500 KB olabilir. viveSticker kare sayısını ve kaliteyi dengeleyerek dosyayı bu sınıra sığdırır; ekrandaki gösterge son boyutu indirmeden önce gösterir.'
					]
				}
			],
			faq: [
				{
					q: 'GIF’im 10 saniyeden uzunsa ne olur?',
					a: 'WhatsApp en fazla 10 saniyeye izin verir. Düzenleyicide uygun bir aralık seçersin; istersen uzun GIF’i birden çok çıkartmaya bölebilirsin.'
				},
				{
					q: 'Saydam GIF’ler korunuyor mu?',
					a: 'Evet. Saydam alanlar WebP’de de saydam kalır. Gerekirse arka planı ayrıca silebilirsin.'
				},
				{
					q: 'X (Twitter) gönderisindeki GIF’i kullanabilir miyim?',
					a: 'Evet. Gönderi bağlantısını yapıştırman yeterli; gönderideki medya alınır. Bunun için bağlantı FxTwitter servisine sorulur.'
				}
			],
			related: ['video', 'animated', 'limits']
		},
		video: {
			label: 'Videodan çıkartma',
			title: 'Videodan WhatsApp Çıkartması Yap: MP4, MOV | viveSticker',
			description:
				'MP4, MOV ya da WebM videodan hareketli WhatsApp çıkartması yap. İstediğin saniyeleri kes, kişiyi arka plandan ayır. Ücretsiz ve kayıtsız.',
			heading: 'Videodan WhatsApp çıkartması yap',
			lead: 'Videonu seç, en sevdiğin anı kes: viveSticker o bölümü 10 saniyeyi ve 500 KB’ı aşmayan hareketli bir WhatsApp çıkartmasına dönüştürür. Video cihazından çıkmaz.',
			tool: true,
			sections: [
				{
					heading: 'Videodan çıkartma adımları',
					paragraphs: [
						'Telefonla çektiğin MP4 ya da iPhone’un MOV videoları doğrudan açılır. Kesmek istediğin aralığı zaman çizelgesinde seçersin.'
					],
					steps: [
						'Videoyu seç ya da sayfaya sürükle.',
						'Başlangıç ve bitiş tutamaçlarıyla en fazla 10 saniyelik bir aralık seç.',
						'“Kişiyi otomatik ayır” ile arka planı sil, yazı ekle ve çıkartmayı oluştur.'
					]
				},
				{
					heading: 'Kalite ve boyut',
					paragraphs: [
						'Video 512×512 kareye yerleştirilir. Hareketli çıkartmalar için sınır 500 KB olduğundan kısa ve sade sahneler en iyi sonucu verir; gösterge sınıra ne kadar yakın olduğunu canlı olarak gösterir.'
					]
				}
			],
			faq: [
				{
					q: 'Hangi video biçimleri destekleniyor?',
					a: 'MP4, MOV ve WebM. Dosya en fazla 200 MB olabilir; tarayıcının çözebildiği her kodek çalışır.'
				},
				{
					q: 'Ses çıkartmaya ekleniyor mu?',
					a: 'Hayır. WhatsApp çıkartmaları sessizdir; yalnızca görüntü kullanılır.'
				},
				{
					q: 'Bir videodan birden çok çıkartma yapabilir miyim?',
					a: 'Evet. Birden çok aralık ekleyebilirsin; her aralık ayrı bir çıkartma olur.'
				}
			],
			related: ['gif', 'cutout', 'animated']
		},
		photo: {
			label: 'Fotoğraftan çıkartma',
			title: 'Fotoğraftan WhatsApp Çıkartması Yap | viveSticker',
			description:
				'Fotoğrafını kalp, daire ya da serbest şekilde kes, arka planı sil, yazı ekle ve 100 KB altı WhatsApp çıkartması olarak indir. Ücretsiz.',
			heading: 'Fotoğraftan WhatsApp çıkartması yap',
			lead: 'Bir fotoğraf seç; viveSticker onu 512×512 boyutunda, 100 KB sınırına uyan şeffaf arka planlı bir WebP çıkartmaya dönüştürür. HEIC dahil tüm yaygın biçimler açılır.',
			tool: true,
			sections: [
				{
					heading: 'Fotoğrafı çıkartmaya çevirme',
					paragraphs: [
						'Dikdörtgen, daire, kalp, yıldız ya da konuşma balonu şekillerinden birini seçebilir veya kesmek istediğin alanı parmağınla serbestçe çizebilirsin.'
					],
					steps: [
						'Fotoğrafı seç; iPhone’un HEIC fotoğrafları da olur.',
						'Şekli seç, yakınlaştır, döndür ve konumla.',
						'İstersen arka planı sil, kontur ve yazı ekle; ardından WebP olarak indir.'
					]
				},
				{
					heading: 'Neden kenar payı bırakılıyor?',
					paragraphs: [
						'WhatsApp, çıkartmanın kenarlara değmemesini önerir. viveSticker varsayılan olarak 16 piksellik bir kenar payı bırakır; istersen kapatabilirsin.'
					]
				}
			],
			faq: [
				{
					q: 'Fotoğrafın kalitesi düşüyor mu?',
					a: '“Otomatik” kalite, 100 KB’a sığan en yüksek kaliteyi seçer. Birçok fotoğraf kayıpsız sığar.'
				},
				{
					q: 'Ekran görüntüsünden çıkartma yapabilir miyim?',
					a: 'Evet. Görseli kopyalayıp “Yapıştır” düğmesine basman ya da Ctrl+V / ⌘V kullanman yeterli.'
				},
				{
					q: 'Arka planı şeffaf yapabilir miyim?',
					a: 'Evet. Arka plan sekmesinde kişiyi otomatik ayırabilir ya da tutmak istediğin nesneye dokunabilirsin.'
				}
			],
			related: ['cutout', 'pack', 'limits']
		},
		cutout: {
			label: 'Arka plan silme',
			title: 'Çıkartma İçin Arka Plan Silme (Yapay Zekâ) | viveSticker',
			description:
				'Fotoğraf ve videolarda arka planı yapay zekâ ile sil, şeffaf WhatsApp çıkartması yap. Model cihazında çalışır; dosyan yüklenmez.',
			heading: 'Çıkartma için arka plan silme',
			lead: 'viveSticker’ın arka plan silme aracı, kişiyi ya da dokunduğun nesneyi ayırıp geri kalanı şeffaf yapar. Yapay zekâ modeli tarayıcında çalışır; fotoğrafın hiçbir sunucuya gitmez.',
			tool: true,
			sections: [
				{
					heading: 'İki yöntem',
					paragraphs: ['Düzenleyicinin “Arka plan” sekmesinde iki seçenek bulunur:'],
					bullets: [
						'Kişiyi otomatik ayır: Fotoğrafta ya da videonun her karesinde kişi bulunur, arka plan silinir.',
						'Nesneye dokun: Tutmak istediğin nesneye dokunursun; birden çok dokunuşla parçaları birleştirebilirsin.'
					]
				},
				{
					heading: 'Daha iyi sonuç için',
					paragraphs: [
						'Konu ile arka plan arasında belirgin bir renk ya da ışık farkı olduğunda sonuç daha temiz olur. Sildikten sonra beyaz bir kontur eklemek, çıkartmayı sohbette daha okunur kılar.'
					]
				}
			],
			faq: [
				{
					q: 'Arka plan silme ücretli mi?',
					a: 'Hayır. Model ilk kullanımda bir kez indirilir, sonra cihazında saklanır ve ücretsiz çalışır.'
				},
				{
					q: 'Videoda da çalışıyor mu?',
					a: 'Evet. “Kişiyi otomatik ayır” seçeneği hareketli çıkartmalarda her kare için uygulanır.'
				},
				{
					q: 'Silinen alanı geri getirebilir miyim?',
					a: 'Evet. “Arka planı geri getir” ile ya da Geri al düğmesiyle önceki hâline dönebilirsin.'
				}
			],
			related: ['photo', 'video', 'privacy']
		},
		animated: {
			label: 'Hareketli çıkartma',
			title: 'Hareketli WhatsApp Çıkartması Nasıl Yapılır? | viveSticker',
			description:
				'Hareketli WhatsApp çıkartması kuralları: 512×512 WebP, en fazla 500 KB ve 10 saniye. GIF ya da videodan kurallara uygun çıkartma yap.',
			heading: 'Hareketli WhatsApp çıkartması yap',
			lead: 'Hareketli WhatsApp çıkartması; 512×512 piksel, en fazla 500 KB ve 10 saniye süren hareketli bir WebP dosyasıdır. viveSticker GIF ve videolarını bu kurallara uyan çıkartmalara otomatik dönüştürür.',
			tool: true,
			sections: [
				{
					heading: 'Hareketli çıkartmanın kuralları',
					paragraphs: ['WhatsApp’ın hareketli çıkartmalar için istediği başlıca koşullar:'],
					bullets: [
						'Boyut: tam 512×512 piksel.',
						'Dosya boyutu: en fazla 500 KB.',
						'Süre: en fazla 10 saniye; her kare en az 8 ms.',
						'Paketler: aynı pakette sabit ve hareketli çıkartmalar karışamaz.'
					]
				},
				{
					heading: 'Akıcı ve küçük çıkartma için ipuçları',
					paragraphs: [
						'Kısa ve döngüye uygun bir an seçmek, gereksiz arka planı silmek ve geniş düz renk alanlarından kaçınmak dosyayı küçültür. viveSticker kalan işi kare hızını ve kaliteyi ayarlayarak yapar.'
					]
				}
			],
			faq: [
				{
					q: 'Hareketli çıkartma GIF olarak gönderilebilir mi?',
					a: 'Hayır. WhatsApp çıkartmaları WebP biçimindedir; GIF’ler sohbette çıkartma değil GIF olarak görünür.'
				},
				{
					q: 'Hareketli ve sabit çıkartmalar aynı pakette olabilir mi?',
					a: 'Hayır. WhatsApp bir paketteki tüm çıkartmaların aynı türde olmasını ister; viveSticker paketi buna göre denetler.'
				},
				{
					q: 'Çıkartmam neden 500 KB’ı aşıyor?',
					a: 'Uzun, büyük hareketli ya da çok renkli sahneler daha fazla yer kaplar. Aralığı kısaltmak ya da arka planı silmek genellikle yeterlidir.'
				}
			],
			related: ['gif', 'video', 'limits']
		},
		pack: {
			label: 'Çıkartma paketi',
			title: 'WhatsApp Çıkartma Paketi Yap (.wastickers) | viveSticker',
			description:
				'Kendi WhatsApp çıkartma paketini hazırla: 3–30 çıkartma seç, adını yaz, .wastickers dosyası olarak indir. Ücretsiz ve kayıtsız.',
			heading: 'WhatsApp çıkartma paketi yap',
			lead: 'viveSticker’da yaptığın çıkartmalar cihazındaki kütüphanede birikir. 3 ile 30 arasında çıkartma seçip pakete bir ad verdiğinde paketi tek bir .wastickers dosyası olarak indirirsin.',
			tool: true,
			sections: [
				{
					heading: 'Paket hazırlama',
					paragraphs: [],
					steps: [
						'Çıkartmalarını yap ve kütüphaneye kaydet.',
						'Kütüphanede paket yapmak istediğin çıkartmalara dokun ve “Paket yap”ı seç.',
						'Paket adını ve yayıncı adını yaz, ardından .wastickers dosyasını indir.'
					]
				},
				{
					heading: 'Paket kuralları',
					paragraphs: ['viveSticker paketi indirmeden önce WhatsApp’ın kurallarını denetler:'],
					bullets: [
						'En az 3, en fazla 30 çıkartma.',
						'Tüm çıkartmalar ya sabit ya da hareketli olmalı.',
						'Paket simgesi 96×96 piksel ve en fazla 50 KB; viveSticker onu ilk seçtiğin çıkartmadan üretir.',
						'Paket ve yayıncı adı en fazla 128 karakter.'
					]
				}
			],
			faq: [
				{
					q: '.wastickers dosyasını nasıl açarım?',
					a: 'WhatsApp web sitelerinden doğrudan paket eklemeye izin vermez. Dosyayı Android’de bir çıkartma içe aktarma uygulamasıyla açarsın; adımlar rehberde.'
				},
				{
					q: 'Paketlerim nerede saklanıyor?',
					a: 'Yalnızca bu cihazda, tarayıcının deposunda. Tarayıcı verilerini silersen kütüphane de silinir.'
				},
				{
					q: 'Bir pakete sonradan çıkartma ekleyebilir miyim?',
					a: 'Evet. Kayıtlı paketini açıp çıkartmaları değiştirerek yeni bir dosya indirebilirsin.'
				}
			],
			related: ['guide', 'animated', 'limits']
		},
		guide: {
			label: 'WhatsApp’a ekleme',
			title: 'Çıkartma WhatsApp’a Nasıl Eklenir? Adım Adım | viveSticker',
			description:
				'Yaptığın çıkartmayı ya da .wastickers paketini WhatsApp’a eklemenin yolları: tek çıkartma, paket ve WhatsApp Web için adım adım rehber.',
			heading: 'Çıkartma WhatsApp’a nasıl eklenir?',
			lead: 'Tek bir çıkartmayı WebP olarak indirip WhatsApp’ın çıkartma oluşturucusunda kullanabilir, bir paketin tamamını ise .wastickers dosyasını Android’de bir çıkartma içe aktarma uygulamasıyla açarak ekleyebilirsin.',
			tool: false,
			sections: [
				{
					heading: 'Tek çıkartma ekleme',
					paragraphs: [
						'WhatsApp’ın güncel sürümlerinde sohbetteki çıkartma bölümünde kendi çıkartmanı oluşturma seçeneği bulunur. viveSticker’dan indirdiğin WebP dosyasını orada görsel olarak seçebilirsin. Menü adları sürüme ve cihaza göre değişebilir.'
					],
					steps: [
						'viveSticker’da çıkartmanı düzenle ve “WebP indir”e dokun.',
						'WhatsApp’ta bir sohbet aç, çıkartmalar bölümüne geç ve oluştur seçeneğini aç.',
						'İndirdiğin dosyayı seç ve çıkartmayı gönder; sohbette yıldızlayarak sık kullanılanlara ekleyebilirsin.'
					]
				},
				{
					heading: 'Paket ekleme (Android)',
					paragraphs: [
						'WhatsApp, tarayıcıdan doğrudan paket eklenmesine izin vermez. Paketler, WhatsApp’ın resmi çıkartma arayüzünü kullanan bir uygulama üzerinden eklenir.'
					],
					steps: [
						'viveSticker’da paketini hazırla ve .wastickers dosyasını indir.',
						'Google Play’den .wastickers dosyalarını açabilen bir çıkartma içe aktarma uygulaması kur.',
						'İndirilen dosyayı o uygulamayla aç ve “WhatsApp’a ekle”yi onayla.'
					]
				},
				{
					heading: 'iPhone’da durum',
					paragraphs: [
						'iOS’ta .wastickers paketlerini açabilen uygulama seçenekleri sınırlıdır. iPhone’da en güvenilir yol, çıkartmaları tek tek WhatsApp’ın çıkartma oluşturucusuyla eklemektir.'
					]
				}
			],
			faq: [
				{
					q: 'Neden doğrudan “WhatsApp’a ekle” düğmesi yok?',
					a: 'WhatsApp, paketlerin yalnızca cihazdaki uygulamalar aracılığıyla eklenmesine izin verir. Web siteleri bu arayüze erişemez.'
				},
				{
					q: 'Çıkartmam sohbette fotoğraf gibi görünüyor, neden?',
					a: 'Dosya bir görsel olarak gönderildiyse WhatsApp onu fotoğraf sayar. Çıkartma oluşturucusunu ya da bir paket kullan.'
				},
				{
					q: 'Eklediğim paket görünmüyor, ne yapmalıyım?',
					a: 'WhatsApp’ı tamamen kapatıp yeniden aç. Paket kurallara uymuyorsa (ör. 3’ten az çıkartma) içe aktarma uygulaması hata verir; viveSticker indirmeden önce bunları denetler.'
				}
			],
			related: ['pack', 'limits', 'faq']
		},
		limits: {
			label: 'Çıkartma boyutları',
			title: 'WhatsApp Çıkartma Boyutu ve Sınırları (2026) | viveSticker',
			description:
				'WhatsApp çıkartma ölçüleri: 512×512 WebP, sabit 100 KB, hareketli 500 KB ve 10 saniye, kapak 96×96 ve 50 KB, paket 3–30 çıkartma.',
			heading: 'WhatsApp çıkartma boyutu ve sınırları',
			lead: 'WhatsApp çıkartmaları 512×512 piksel WebP dosyalarıdır. Sabit çıkartmalar en fazla 100 KB, hareketli çıkartmalar en fazla 500 KB ve 10 saniye olabilir; bir paket 3 ile 30 arasında çıkartma içerir.',
			tool: false,
			sections: [
				{
					heading: 'Çıkartma ölçüleri',
					paragraphs: [],
					bullets: [
						'Boyut: tam 512×512 piksel, şeffaf arka plan desteklenir.',
						'Biçim: WebP (sabit ya da hareketli).',
						'Sabit çıkartma: en fazla 100 KB.',
						'Hareketli çıkartma: en fazla 500 KB, en fazla 10 saniye, her kare en az 8 ms.',
						'Önerilen kenar payı: her yandan 16 piksel.'
					]
				},
				{
					heading: 'Paket ölçüleri',
					paragraphs: [],
					bullets: [
						'Çıkartma sayısı: en az 3, en fazla 30.',
						'Kapak (tepsi) görseli: 96×96 piksel PNG, en fazla 50 KB.',
						'Tür: bir paketteki tüm çıkartmalar ya sabit ya da hareketli olmalı.',
						'Paket ve yayıncı adı: en fazla 128 karakter.'
					]
				},
				{
					heading: 'viveSticker bu sınırları nasıl uygular?',
					paragraphs: [
						'Her çıkartma 512×512 kareye yerleştirilir; “Otomatik” kalite, sınıra sığan en yüksek kaliteyi seçer. Boyut göstergesi sonucu indirmeden önce gösterir ve paket, kurallara uymuyorsa indirilmeden önce uyarı verir.'
					]
				}
			],
			faq: [
				{
					q: 'Çıkartma neden 512×512 olmak zorunda?',
					a: 'WhatsApp çıkartmaları bu sabit kare boyutta bekler. Farklı boyuttaki dosyalar paketlerde reddedilir.'
				},
				{
					q: 'PNG çıkartma kullanılabilir mi?',
					a: 'Çıkartmalar WebP olmalıdır; yalnızca paket kapağı PNG’dir. viveSticker dönüşümü otomatik yapar.'
				},
				{
					q: 'Bu sınırlar değişebilir mi?',
					a: 'WhatsApp kurallarını zaman zaman günceller. viveSticker resmi çıkartma kurallarını izler ve sınırları uygulama içinde tek bir yerden günceller.'
				}
			],
			related: ['animated', 'pack', 'guide']
		},
		faq: {
			label: 'Sıkça sorulan sorular',
			title: 'Sıkça Sorulan Sorular | viveSticker',
			description:
				'viveSticker hakkında merak edilenler: ücretsiz mi, dosyalar nereye gidiyor, hangi biçimler destekleniyor, çıkartma WhatsApp’a nasıl eklenir?',
			heading: 'Sıkça sorulan sorular',
			lead: 'viveSticker, fotoğraf, GIF ve videolardan tarayıcıda WhatsApp çıkartması yapan ücretsiz bir araçtır. Aşağıda en çok sorulan soruların yanıtlarını bulabilirsin.',
			tool: false,
			sections: [],
			faq: [
				{
					q: 'viveSticker ücretsiz mi?',
					a: 'Evet. Tüm özellikler ücretsizdir; hesap, filigran ya da reklam yoktur.'
				},
				{
					q: 'Dosyalarım bir sunucuya yükleniyor mu?',
					a: 'Hayır. Tüm işlem tarayıcında yapılır. Bir bağlantıdan dosya getirdiğinde yalnızca o adrese istek gönderilir; X gönderilerinde bağlantı FxTwitter servisine sorulur.'
				},
				{
					q: 'Hangi cihazlarda çalışır?',
					a: 'Güncel Chrome, Safari, Edge ve Firefox ile telefon, tablet ve bilgisayarda çalışır. Ana ekrana ekleyip uygulama gibi kullanabilirsin.'
				},
				{
					q: 'İnternet olmadan kullanabilir miyim?',
					a: 'Evet. Bir kez açtıktan sonra uygulama çevrimdışı çalışır. Arka plan silme modeli ilk kullanımda indirilir.'
				},
				{
					q: 'Hangi dosya türleri destekleniyor?',
					a: 'PNG, JPG, WebP, GIF, HEIC, MP4, MOV ve WebM; en fazla 200 MB.'
				},
				{
					q: 'Çıkartmalarım nerede saklanıyor?',
					a: 'Bu cihazdaki tarayıcı deposunda. Başka cihazlarla eşitlenmez; tarayıcı verilerini silersen kaybolur.'
				},
				{
					q: 'Paketi WhatsApp’a nasıl eklerim?',
					a: 'İndirdiğin .wastickers dosyasını Android’de bir çıkartma içe aktarma uygulamasıyla açarsın. Tek çıkartmaları WhatsApp’ın çıkartma oluşturucusunda kullanabilirsin.'
				},
				{
					q: 'viveSticker WhatsApp’a mı ait?',
					a: 'Hayır. viveSticker bağımsız bir araçtır; WhatsApp veya Meta ile bağlantılı değildir.'
				}
			],
			related: ['guide', 'limits', 'privacy']
		},
		privacy: {
			label: 'Gizlilik',
			title: 'Gizlilik: Dosyaların Cihazından Çıkmaz | viveSticker',
			description:
				'viveSticker dosyalarını yüklemez: dönüştürme, arka plan silme ve paketleme tarayıcında yapılır. Hangi verilerin nerede tutulduğunu öğren.',
			heading: 'Gizlilik',
			lead: 'viveSticker’da seçtiğin fotoğraf, GIF ve videolar cihazından çıkmaz. Dönüştürme, arka plan silme ve paketleme tamamen tarayıcında yapılır; hesap, çerez tabanlı takip ya da reklam yoktur.',
			tool: false,
			sections: [
				{
					heading: 'Cihazında tutulanlar',
					paragraphs: [
						'Kaydettiğin çıkartmalar ve paketler tarayıcının deposunda (IndexedDB) yalnızca bu cihazda tutulur. Dil seçimin de tarayıcıda saklanır. Bunları tarayıcı ayarlarından istediğin zaman silebilirsin.'
					]
				},
				{
					heading: 'Ağa giden istekler',
					paragraphs: ['viveSticker yalnızca şu durumlarda ağ isteği yapar:'],
					bullets: [
						'Sayfanın kendisini ve arka plan silme modelini bu siteden indirmek için.',
						'Bir bağlantıdan dosya getirmek istediğinde, o bağlantının adresine.',
						'Bir X (Twitter) gönderisi bağlantısında, medyayı bulmak için FxTwitter servisine (api.fxtwitter.com).'
					]
				},
				{
					heading: 'Barındırma',
					paragraphs: [
						'Site GitHub Pages üzerinde barındırılır. GitHub, hizmeti sunmak için ziyaretçilerin IP adresi gibi teknik bilgileri işleyebilir; bu verilere viveSticker erişmez.'
					]
				}
			],
			faq: [
				{
					q: 'Analiz ya da reklam aracı kullanılıyor mu?',
					a: 'Hayır. Sitede reklam, takip çerezi ya da üçüncü taraf analiz aracı yoktur.'
				},
				{
					q: 'Verilerimi nasıl silerim?',
					a: 'Tarayıcının site ayarlarından bu sitenin verilerini temizlemen yeterli; kütüphane ve tercihlerin silinir.'
				}
			],
			related: ['faq', 'cutout', 'guide']
		}
	}
};
