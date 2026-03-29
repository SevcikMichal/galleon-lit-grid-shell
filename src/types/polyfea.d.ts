/**
 * Ambient type extensions for @polyfea/core browser-side APIs.
 * The package itself may ship types; these fill gaps for galleon's usage.
 */

declare namespace CustomElementRegistry {
  /** Polyfea-core extension: lazily load a custom element definition. */
  function defineLazy(tagName: string, moduleUrlOrLoader: string | (() => Promise<unknown>)): void;
}

interface PolyfeaElement {
  tagName: string;
  microfrontend: string;
  /** Arbitrary display/config attributes. */
  attributes?: Record<string, string>;
}

interface PolyfeaContextArea {
  elements: PolyfeaElement[];
}

interface PolyfeaContextAreaEntry {
  name: string;
  contextArea: PolyfeaContextArea;
}

interface PolyfeaMicrofrontend {
  module: string;
  dependsOn?: string[];
  resources?: Array<{ kind: 'stylesheet' | 'script'; href: string }>;
}

/** The static JSON config file served by polyfea backend. */
interface PolyfeaStaticConfig {
  microfrontends?: Record<string, PolyfeaMicrofrontend>;
  contextAreas?: PolyfeaContextAreaEntry[];
}
