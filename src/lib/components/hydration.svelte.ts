/**
 * Becomes true once the app has hydrated. Prerendered HTML shows its buttons before the JavaScript
 * that drives them has run; controls that only work with JavaScript stay disabled until then, so an
 * early tap is held (and retried by the visitor) instead of being silently lost.
 */
export const hydration = $state({ done: false });
