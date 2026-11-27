import type { ContentId } from '#lib/seo/site.ts';

export interface Faq {
	q: string;
	a: string;
}

export interface Section {
	heading: string;
	paragraphs: string[];
	bullets?: string[];
	steps?: string[];
}

export interface PageCopy {
	/** Short name for menus and links. */
	label: string;
	/** `<title>`; keep it under ~60 characters. */
	title: string;
	/** Meta description; keep it under ~155 characters. */
	description: string;
	heading: string;
	/** First paragraph under the H1; answers the search query directly. */
	lead: string;
	/** Shows the sticker maker right under the intro. */
	tool: boolean;
	sections: Section[];
	faq: Faq[];
	related: ContentId[];
}

export interface HomeCopy {
	title: string;
	description: string;
	intro: Section;
	steps: { title: string; text: string }[];
	stepsHeading: string;
	features: { title: string; text: string }[];
	featuresHeading: string;
	faq: Faq[];
	guidesHeading: string;
	guides: ContentId[];
}

export interface SiteCopy {
	home: HomeCopy;
	library: { title: string; description: string };
	pages: Record<ContentId, PageCopy>;
}
