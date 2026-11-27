import type { SiteCopy } from './types.ts';

export const enCopy: SiteCopy = {
	home: {
		title: 'WhatsApp Sticker Maker: Photos, GIFs, Videos | viveSticker',
		description:
			'Make free WhatsApp stickers from photos, GIFs and videos. Remove backgrounds, add text, download packs. No sign-up; files never leave your device.',
		intro: {
			heading: 'Make WhatsApp stickers in your browser',
			paragraphs: [
				'viveSticker turns photos, GIFs and videos into the 512×512 WebP format WhatsApp expects. Static stickers are fitted under 100 KB and animated stickers under 500 KB and 10 seconds, automatically.',
				'There is nothing to install and no account to create. Everything runs in your browser; your files are never uploaded to a server.'
			]
		},
		stepsHeading: 'A sticker in three steps',
		steps: [
			{ title: 'Pick a file', text: 'Choose a photo, GIF or video, drag it in, or paste a link.' },
			{
				title: 'Edit',
				text: 'Pick a shape, remove the background in one tap, add text and drawings. Trim videos to the moment you want.'
			},
			{
				title: 'Download or pack',
				text: 'Download a WebP, or build a pack of 3–30 stickers from the ones you saved.'
			}
		],
		featuresHeading: 'What you can do',
		features: [
			{
				title: 'AI background removal',
				text: 'Separate a person automatically or tap the object to keep; the model runs on your device.'
			},
			{
				title: 'Animated stickers',
				text: 'Animated stickers of up to 10 seconds from GIFs and videos, shrunk under 500 KB automatically.'
			},
			{
				title: 'Text, emoji and drawing',
				text: 'Personalise stickers with four fonts, outlines, colours and freehand drawing.'
			},
			{
				title: 'Size meter',
				text: 'See whether your sticker fits WhatsApp’s limit before you download it.'
			},
			{
				title: 'Works offline',
				text: 'After the first visit it works without a connection, and you can add it to your home screen.'
			},
			{
				title: 'Stays private',
				text: 'Your files and stickers stay on this device, in your browser’s storage.'
			}
		],
		faq: [
			{
				q: 'Is viveSticker free?',
				a: 'Yes. Every feature is free, with no sign-up, watermark or ads.'
			},
			{
				q: 'Are my files uploaded to a server?',
				a: 'No. Converting, background removal and packing happen in your browser. Only when you fetch a file from a link is a request sent to that address.'
			},
			{
				q: 'Which file types can I use?',
				a: 'PNG, JPG, WebP, GIF, HEIC, MP4, MOV and WebM, up to 200 MB.'
			},
			{
				q: 'How do I add a sticker to WhatsApp?',
				a: 'Download a single sticker as WebP and use it in WhatsApp’s sticker maker. For a pack, open the downloaded .wastickers file with a sticker importer app on Android. The guide has the details.'
			}
		],
		guidesHeading: 'Guides',
		guides: ['guide', 'limits', 'cutout', 'animated', 'faq', 'privacy']
	},
	library: {
		title: 'My packs: Build a WhatsApp Sticker Pack | viveSticker',
		description:
			'Build a WhatsApp pack of 3–30 stickers from the ones you saved and download it as a .wastickers file.'
	},
	pages: {
		gif: {
			label: 'GIF to sticker',
			title: 'GIF to WhatsApp Sticker Converter (Free) | viveSticker',
			description:
				'Turn a GIF into an animated WhatsApp sticker. Trim it, remove the background, add text; the size drops under 500 KB automatically. No sign-up.',
			heading: 'Turn a GIF into a WhatsApp sticker',
			lead: 'Drop your GIF below: viveSticker converts it into a 512×512 animated WebP sticker that fits WhatsApp’s 500 KB and 10 second limits. Everything happens in your browser.',
			tool: true,
			sections: [
				{
					heading: 'How does a GIF become a sticker?',
					paragraphs: [
						'WhatsApp accepts animated stickers as animated WebP, not GIF. viveSticker decodes the GIF’s frames, keeps the part you choose and writes a WebP file that follows WhatsApp’s rules.'
					],
					steps: [
						'Pick the GIF, drag it in or paste its link.',
						'Choose the range to keep on the timeline; long GIFs can have several ranges.',
						'Add a shape, text or background removal and create the animated sticker.'
					]
				},
				{
					heading: 'How is the size limit met?',
					paragraphs: [
						'Animated stickers can be at most 500 KB. viveSticker balances frame count and quality to fit, and the on-screen meter shows the final size before you download.'
					]
				}
			],
			faq: [
				{
					q: 'What if my GIF is longer than 10 seconds?',
					a: 'WhatsApp allows at most 10 seconds. You choose a range in the editor, and you can split a long GIF into several stickers.'
				},
				{
					q: 'Is transparency kept?',
					a: 'Yes. Transparent areas stay transparent in the WebP. You can also remove the background separately.'
				},
				{
					q: 'Can I use a GIF from an X (Twitter) post?',
					a: 'Yes. Paste the post link and its media is fetched. To do that, the link is looked up with the FxTwitter service.'
				}
			],
			related: ['video', 'animated', 'limits']
		},
		video: {
			label: 'Video to sticker',
			title: 'Video to WhatsApp Sticker: MP4, MOV, WebM | viveSticker',
			description:
				'Make an animated WhatsApp sticker from an MP4, MOV or WebM video. Trim the seconds you want and cut the person out. Free, no sign-up.',
			heading: 'Turn a video into a WhatsApp sticker',
			lead: 'Pick a video and trim your favourite moment: viveSticker turns it into an animated WhatsApp sticker of at most 10 seconds and 500 KB. The video never leaves your device.',
			tool: true,
			sections: [
				{
					heading: 'Steps',
					paragraphs: [
						'MP4 videos from your phone and iPhone MOV files open directly. You choose the range on the timeline.'
					],
					steps: [
						'Pick the video or drag it onto the page.',
						'Use the start and end handles to select up to 10 seconds.',
						'Use “Cut out person” to remove the background, add text and create the sticker.'
					]
				},
				{
					heading: 'Quality and size',
					paragraphs: [
						'The video is placed in a 512×512 square. Because the limit for animated stickers is 500 KB, short and simple scenes work best; the meter shows how close you are to the limit in real time.'
					]
				}
			],
			faq: [
				{
					q: 'Which video formats are supported?',
					a: 'MP4, MOV and WebM, up to 200 MB. Any codec your browser can decode works.'
				},
				{
					q: 'Is the sound included?',
					a: 'No. WhatsApp stickers are silent; only the picture is used.'
				},
				{
					q: 'Can I make several stickers from one video?',
					a: 'Yes. Add several ranges; each range becomes its own sticker.'
				}
			],
			related: ['gif', 'cutout', 'animated']
		},
		photo: {
			label: 'Photo to sticker',
			title: 'Photo to WhatsApp Sticker Maker | viveSticker',
			description:
				'Cut your photo into a heart, circle or freehand shape, remove the background, add text and download a WhatsApp sticker under 100 KB. Free.',
			heading: 'Turn a photo into a WhatsApp sticker',
			lead: 'Pick a photo and viveSticker turns it into a 512×512 WebP sticker with a transparent background that fits the 100 KB limit. Every common format opens, HEIC included.',
			tool: true,
			sections: [
				{
					heading: 'From photo to sticker',
					paragraphs: [
						'Choose a rectangle, circle, heart, star or speech bubble, or draw around the area you want with your finger.'
					],
					steps: [
						'Pick the photo; iPhone HEIC photos work too.',
						'Choose a shape, then zoom, rotate and position it.',
						'Optionally remove the background and add an outline or text, then download the WebP.'
					]
				},
				{
					heading: 'Why is there a margin?',
					paragraphs: [
						'WhatsApp recommends that stickers don’t touch the edges. viveSticker leaves a 16 pixel margin by default; you can turn it off.'
					]
				}
			],
			faq: [
				{
					q: 'Does the photo lose quality?',
					a: '“Auto” quality picks the highest quality that fits in 100 KB. Many photos fit losslessly.'
				},
				{
					q: 'Can I make a sticker from a screenshot?',
					a: 'Yes. Copy the image and press “Paste”, or use Ctrl+V / ⌘V.'
				},
				{
					q: 'Can I make the background transparent?',
					a: 'Yes. In the Background tab, cut out a person automatically or tap the object you want to keep.'
				}
			],
			related: ['cutout', 'pack', 'limits']
		},
		cutout: {
			label: 'Remove background',
			title: 'Remove Background for Stickers (AI, Free) | viveSticker',
			description:
				'Remove the background from photos and videos with AI and make transparent WhatsApp stickers. The model runs on your device; nothing is uploaded.',
			heading: 'Remove the background for stickers',
			lead: 'viveSticker’s background remover keeps the person or the object you tap and makes everything else transparent. The AI model runs in your browser; your photo never goes to a server.',
			tool: true,
			sections: [
				{
					heading: 'Two ways',
					paragraphs: ['The editor’s Background tab has two options:'],
					bullets: [
						'Cut out person: finds the person in the photo, or in every frame of a video, and removes the background.',
						'Tap the object: tap what you want to keep; tap several places to combine parts.'
					]
				},
				{
					heading: 'For a cleaner result',
					paragraphs: [
						'Results are cleaner when the subject clearly differs from the background in colour or light. Adding a white outline afterwards makes the sticker easier to read in a chat.'
					]
				}
			],
			faq: [
				{
					q: 'Is background removal paid?',
					a: 'No. The model downloads once on first use, stays on your device and runs for free.'
				},
				{
					q: 'Does it work on videos?',
					a: 'Yes. “Cut out person” is applied to every frame of animated stickers.'
				},
				{
					q: 'Can I bring the removed area back?',
					a: 'Yes. Use “Restore background” or Undo to go back.'
				}
			],
			related: ['photo', 'video', 'privacy']
		},
		animated: {
			label: 'Animated stickers',
			title: 'How to Make Animated WhatsApp Stickers | viveSticker',
			description:
				'Animated WhatsApp sticker rules: 512×512 WebP, at most 500 KB and 10 seconds. Make compliant stickers from GIFs or videos.',
			heading: 'Make animated WhatsApp stickers',
			lead: 'An animated WhatsApp sticker is a 512×512 animated WebP file of at most 500 KB and 10 seconds. viveSticker converts your GIFs and videos into stickers that follow these rules automatically.',
			tool: true,
			sections: [
				{
					heading: 'Rules for animated stickers',
					paragraphs: ['The main requirements WhatsApp sets for animated stickers:'],
					bullets: [
						'Size: exactly 512×512 pixels.',
						'File size: at most 500 KB.',
						'Duration: at most 10 seconds; each frame at least 8 ms.',
						'Packs: static and animated stickers can’t be mixed in one pack.'
					]
				},
				{
					heading: 'Tips for smooth, small stickers',
					paragraphs: [
						'Choosing a short, loopable moment, removing unneeded background and avoiding large flat areas keep the file small. viveSticker does the rest by tuning frame rate and quality.'
					]
				}
			],
			faq: [
				{
					q: 'Can an animated sticker be sent as a GIF?',
					a: 'No. WhatsApp stickers are WebP; a GIF shows up in the chat as a GIF, not a sticker.'
				},
				{
					q: 'Can animated and static stickers share a pack?',
					a: 'No. WhatsApp requires all stickers in a pack to be the same kind, and viveSticker checks the pack for you.'
				},
				{
					q: 'Why is my sticker over 500 KB?',
					a: 'Long, large-motion or very colourful scenes take more space. Shortening the range or removing the background usually does it.'
				}
			],
			related: ['gif', 'video', 'limits']
		},
		pack: {
			label: 'Sticker packs',
			title: 'Make a WhatsApp Sticker Pack (.wastickers) | viveSticker',
			description:
				'Build your own WhatsApp sticker pack: pick 3–30 stickers, name it and download a .wastickers file. Free, no sign-up.',
			heading: 'Make a WhatsApp sticker pack',
			lead: 'Stickers you make in viveSticker collect in a library on your device. Pick 3 to 30 of them, give the pack a name and download it as a single .wastickers file.',
			tool: true,
			sections: [
				{
					heading: 'Building a pack',
					paragraphs: [],
					steps: [
						'Make your stickers and save them to the library.',
						'Tap the stickers you want in the library and choose “Make pack”.',
						'Enter the pack name and publisher, then download the .wastickers file.'
					]
				},
				{
					heading: 'Pack rules',
					paragraphs: ['viveSticker checks WhatsApp’s rules before you download:'],
					bullets: [
						'At least 3 and at most 30 stickers.',
						'All stickers are either static or animated.',
						'The tray icon is 96×96 pixels and at most 50 KB; viveSticker makes it from the first sticker you pick.',
						'Pack and publisher names are at most 128 characters.'
					]
				}
			],
			faq: [
				{
					q: 'How do I open a .wastickers file?',
					a: 'WhatsApp doesn’t let websites add packs directly. Open the file with a sticker importer app on Android; the guide lists the steps.'
				},
				{
					q: 'Where are my packs stored?',
					a: 'Only on this device, in your browser’s storage. Clearing browser data clears the library too.'
				},
				{
					q: 'Can I add stickers to a pack later?',
					a: 'Yes. Open a saved pack, change its stickers and download a new file.'
				}
			],
			related: ['guide', 'animated', 'limits']
		},
		guide: {
			label: 'Add to WhatsApp',
			title: 'How to Add Stickers to WhatsApp: Step by Step | viveSticker',
			description:
				'How to add the stickers or .wastickers pack you made to WhatsApp: a step-by-step guide for single stickers, packs and WhatsApp Web.',
			heading: 'How to add stickers to WhatsApp',
			lead: 'Download a single sticker as WebP and use it in WhatsApp’s sticker maker, or add a whole pack by opening the .wastickers file with a sticker importer app on Android.',
			tool: false,
			sections: [
				{
					heading: 'Adding a single sticker',
					paragraphs: [
						'Recent WhatsApp versions have an option to create your own sticker in the chat’s sticker section. You can pick the WebP file you downloaded from viveSticker there as an image. Menu names vary by version and device.'
					],
					steps: [
						'Edit your sticker in viveSticker and tap “Download WebP”.',
						'In WhatsApp, open a chat, go to the sticker section and choose the create option.',
						'Pick the downloaded file and send the sticker; star it in the chat to add it to your favourites.'
					]
				},
				{
					heading: 'Adding a pack (Android)',
					paragraphs: [
						'WhatsApp doesn’t allow packs to be added straight from a browser. Packs are added through an app that uses WhatsApp’s official sticker interface.'
					],
					steps: [
						'Build your pack in viveSticker and download the .wastickers file.',
						'Install a sticker importer app from Google Play that opens .wastickers files.',
						'Open the downloaded file with that app and confirm “Add to WhatsApp”.'
					]
				},
				{
					heading: 'On iPhone',
					paragraphs: [
						'On iOS the choice of apps that open .wastickers packs is limited. The most reliable way on iPhone is to add stickers one by one with WhatsApp’s sticker maker.'
					]
				}
			],
			faq: [
				{
					q: 'Why is there no direct “Add to WhatsApp” button?',
					a: 'WhatsApp only lets packs be added through apps on the device. Websites can’t reach that interface.'
				},
				{
					q: 'My sticker shows up as a photo in the chat. Why?',
					a: 'If the file was sent as an image, WhatsApp treats it as a photo. Use the sticker maker or a pack instead.'
				},
				{
					q: 'The pack I added doesn’t appear. What now?',
					a: 'Fully close and reopen WhatsApp. If the pack breaks a rule (such as fewer than 3 stickers) the importer app shows an error; viveSticker checks these before you download.'
				}
			],
			related: ['pack', 'limits', 'faq']
		},
		limits: {
			label: 'Sticker sizes',
			title: 'WhatsApp Sticker Size and Limits (2026) | viveSticker',
			description:
				'WhatsApp sticker specs: 512×512 WebP, static 100 KB, animated 500 KB and 10 s, tray icon 96×96 and 50 KB, packs of 3–30 stickers.',
			heading: 'WhatsApp sticker size and limits',
			lead: 'WhatsApp stickers are 512×512 pixel WebP files. Static stickers can be at most 100 KB, animated stickers at most 500 KB and 10 seconds, and a pack holds 3 to 30 stickers.',
			tool: false,
			sections: [
				{
					heading: 'Sticker specs',
					paragraphs: [],
					bullets: [
						'Size: exactly 512×512 pixels; transparent backgrounds are supported.',
						'Format: WebP (static or animated).',
						'Static sticker: at most 100 KB.',
						'Animated sticker: at most 500 KB and 10 seconds, each frame at least 8 ms.',
						'Recommended margin: 16 pixels on each side.'
					]
				},
				{
					heading: 'Pack specs',
					paragraphs: [],
					bullets: [
						'Sticker count: at least 3, at most 30.',
						'Tray icon: 96×96 pixel PNG, at most 50 KB.',
						'Kind: all stickers in a pack are either static or animated.',
						'Pack and publisher names: at most 128 characters.'
					]
				},
				{
					heading: 'How viveSticker applies these limits',
					paragraphs: [
						'Every sticker is placed in a 512×512 square, and “Auto” quality picks the highest quality that fits. The size meter shows the result before you download, and packs that break a rule are flagged before download.'
					]
				}
			],
			faq: [
				{
					q: 'Why must a sticker be 512×512?',
					a: 'WhatsApp expects stickers in this fixed square size. Files of other sizes are rejected in packs.'
				},
				{
					q: 'Can I use PNG stickers?',
					a: 'Stickers must be WebP; only the pack tray icon is PNG. viveSticker converts for you.'
				},
				{
					q: 'Can these limits change?',
					a: 'WhatsApp updates its rules from time to time. viveSticker follows the official sticker requirements and keeps its limits in one place in the app.'
				}
			],
			related: ['animated', 'pack', 'guide']
		},
		faq: {
			label: 'FAQ',
			title: 'Frequently Asked Questions | viveSticker',
			description:
				'Common questions about viveSticker: is it free, where do files go, which formats work and how do I add stickers to WhatsApp?',
			heading: 'Frequently asked questions',
			lead: 'viveSticker is a free tool that makes WhatsApp stickers from photos, GIFs and videos in your browser. Here are answers to the most common questions.',
			tool: false,
			sections: [],
			faq: [
				{
					q: 'Is viveSticker free?',
					a: 'Yes. Every feature is free, with no account, watermark or ads.'
				},
				{
					q: 'Are my files uploaded to a server?',
					a: 'No. Everything runs in your browser. Fetching a file from a link sends a request only to that address; for X posts the link is looked up with the FxTwitter service.'
				},
				{
					q: 'Which devices does it work on?',
					a: 'Phones, tablets and computers with current Chrome, Safari, Edge and Firefox. You can add it to your home screen and use it like an app.'
				},
				{
					q: 'Can I use it offline?',
					a: 'Yes. After the first visit the app works offline. The background removal model downloads on first use.'
				},
				{
					q: 'Which file types are supported?',
					a: 'PNG, JPG, WebP, GIF, HEIC, MP4, MOV and WebM, up to 200 MB.'
				},
				{
					q: 'Where are my stickers stored?',
					a: 'In this browser’s storage on this device. They don’t sync to other devices and are lost if you clear browser data.'
				},
				{
					q: 'How do I add a pack to WhatsApp?',
					a: 'Open the downloaded .wastickers file with a sticker importer app on Android. Single stickers can be used in WhatsApp’s sticker maker.'
				},
				{
					q: 'Is viveSticker made by WhatsApp?',
					a: 'No. viveSticker is an independent tool and is not affiliated with WhatsApp or Meta.'
				}
			],
			related: ['guide', 'limits', 'privacy']
		},
		privacy: {
			label: 'Privacy',
			title: 'Privacy: Your Files Never Leave Your Device | viveSticker',
			description:
				'viveSticker doesn’t upload your files: converting, background removal and packing happen in your browser. See what is stored and where.',
			heading: 'Privacy',
			lead: 'The photos, GIFs and videos you pick in viveSticker never leave your device. Converting, background removal and packing happen entirely in your browser, with no account, cookie-based tracking or ads.',
			tool: false,
			sections: [
				{
					heading: 'What stays on your device',
					paragraphs: [
						'Saved stickers and packs are kept in your browser’s storage (IndexedDB) on this device only. Your language choice is stored in the browser too. You can delete them at any time in your browser settings.'
					]
				},
				{
					heading: 'Network requests',
					paragraphs: ['viveSticker only makes network requests to:'],
					bullets: [
						'Load the site itself and the background removal model from this site.',
						'Fetch a file from a link you enter, at that link’s address.',
						'Find the media of an X (Twitter) post link, via the FxTwitter service (api.fxtwitter.com).'
					]
				},
				{
					heading: 'Hosting',
					paragraphs: [
						'The site is hosted on GitHub Pages. GitHub may process technical data such as visitors’ IP addresses to provide the service; viveSticker has no access to it.'
					]
				}
			],
			faq: [
				{
					q: 'Are analytics or ad tools used?',
					a: 'No. The site has no ads, tracking cookies or third-party analytics.'
				},
				{
					q: 'How do I delete my data?',
					a: 'Clear this site’s data in your browser’s site settings; your library and preferences are removed.'
				}
			],
			related: ['faq', 'cutout', 'guide']
		}
	}
};
