// Locale homes are `/` and `/en/`: `/en/` prerenders to `en/index.html`, which cannot clash with the
// `en/` folder that holds the other English pages on static hosts.
export const trailingSlash = 'always';
