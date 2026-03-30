# galleon-lit-grid-shell

A Kubernetes-native modular shell UI that hosts arbitrary Web Components in a CSS Grid canvas. Components are loaded dynamically from [Polyfea](https://github.com/polyfea) micro-frontend manifests / Kubernetes CRDs.

## Features

- **CSS Grid canvas** — responsive 12-column layout (4 columns in portrait), drag-and-drop cell placement and resizing
- **Polyfea integration** — fetches component definitions from polyfea manifests; widgets are lazy-loaded and deduplicated via `defineLazy`
- **K8s backend** — Go HTTP server persists grid state as Kubernetes ConfigMaps; reads/writes cells via `/api/cells`
- **Zero heavy UI deps** — only `lit` and `@polyfea/core` as runtime dependencies; ~7 KB gzipped bundle
- **Touch support** — pointer-capture-based drag and resize work on both desktop and mobile

## Architecture

| Element | Role |
|---|---|
| `<galleon-shell>` | Root shell; orchestrates canvas and sidebar |
| `<galleon-canvas>` | Owns `GridStore` (ReactiveController); all cell state lives here |
| `<galleon-cell>` | Wraps a placed widget; sets `grid-column`/`grid-row` on host in `willUpdate()` |
| `<galleon-sidebar>` | Components browser; shows draggable inventory items |
| `<galleon-component>` | Polyfea-aware component wrapper |
| `DragDropController` | Transparent overlay-grid drop targeting |
| `ResizeController` | Pointer Events + `setPointerCapture` resize (no DnD API) |
| `GalleonBus` | Typed `EventTarget` singleton for cross-shadow-boundary events |

Grid manifests are serialised to/from Kubernetes ConfigMaps via `src/utils/configmap-serializer.ts`.

## Getting Started

### Prerequisites

- Node.js 18+
- Go 1.21+ (for the backend)
- A Kubernetes cluster (for production use; the backend falls back gracefully in dev)

### Install and run (frontend)

```sh
npm install
npm run dev
```

The dev harness (`index.html`) loads two demo widgets — `demo-chart-widget` and `demo-status-widget`.

### Build

```sh
npm run build
```

Output is emitted to `dist/`.

### Run the backend

```sh
cd backend
go run main.go
```

The backend exposes:

| Route | Description |
|---|---|
| `GET /api/cells` | List persisted cell manifests |
| `PUT /api/cells` | Persist updated cell manifest |

Set the `NAMESPACE` environment variable to target a specific Kubernetes namespace (defaults to `default`).

### Tests

```sh
npm test          # run once
npm run test:watch  # watch mode
npm run test:ui     # Vitest UI
```

29 unit tests cover `GridStore`, controllers, and the ConfigMap serializer.

## Configuration

Grid layout is stored as a Kubernetes ConfigMap. The `MF_NAME` and `MF_NAMESPACE` environment variables control which Polyfea manifest is loaded.

Global CSS custom properties for theming:

```css
--galleon-bg
--galleon-surface-2
--galleon-shadow
```

## License

[MIT](LICENSE)
