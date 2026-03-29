/**
 * Thin wrapper around @polyfea/core's lazy-loading mechanism.
 *
 * Maintains a Set of already-loaded microfrontend IDs to avoid duplicate
 * imports. Works with both polyfea's `customElements.defineLazy` extension
 * and plain dynamic `import()` as a fallback.
 */

const loaded = new Set<string>();

/** Map of microfrontend → module URL, populated at load time. */
const moduleUrls = new Map<string, string>();

/** Register module URLs from the polyfea manifest so the bridge can find them. */
export function registerModuleUrls(urls: Map<string, string>): void {
  for (const [mfe, url] of urls) {
    moduleUrls.set(mfe, url);
  }
}

/**
 * Ensure the microfrontend module is loaded and the custom element is defined.
 * Safe to call multiple times — subsequent calls for the same `microfrontend`
 * are no-ops after the first load.
 *
 * @param microfrontend  Polyfea microfrontend identifier
 * @param tagName        Custom element tag name (e.g. "my-widget")
 * @param moduleUrl      Optional direct module URL override
 */
export async function ensureLoaded(
  microfrontend: string,
  tagName: string,
  moduleUrl?: string,
): Promise<void> {
  // If the element is already registered (e.g. pre-imported in the host page),
  // mark as loaded and skip the import entirely.
  if (customElements.get(tagName)) {
    loaded.add(microfrontend);
    return;
  }

  if (loaded.has(microfrontend)) {
    // Already loaded — still wait for the element to be defined in case
    // a previous load is still in progress.
    await customElements.whenDefined(tagName);
    return;
  }

  loaded.add(microfrontend);

  const url = moduleUrl ?? moduleUrls.get(microfrontend);

  if (!url) {
    console.warn(
      `[galleon] No module URL for microfrontend "${microfrontend}". ` +
      `Register it via registerModuleUrls() or supply a moduleUrl.`,
    );
    return;
  }

  const cl = customElements as typeof customElements & {
    defineLazy?: (tag: string, loader: string | (() => Promise<unknown>)) => void;
  };

  if (typeof cl.defineLazy === 'function') {
    // Polyfea core path — hands off to polyfea's mutation-observer based loader.
    cl.defineLazy(tagName, url);
  } else {
    // Fallback: direct dynamic import.
    try {
      await import(/* @vite-ignore */ url);
    } catch (err) {
      loaded.delete(microfrontend);
      throw new Error(`[galleon] Failed to load module "${url}" for "${microfrontend}": ${err}`);
    }
  }

  await customElements.whenDefined(tagName);
}

/** Clear the loaded-set (useful in tests). */
export function resetBridge(): void {
  loaded.clear();
  moduleUrls.clear();
}
