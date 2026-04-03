# galleon-lit-grid-shell

A Kubernetes-native dashboard shell that hosts arbitrary Web Components in a CSS Grid canvas. Widgets are loaded dynamically via [Polyfea](https://github.com/polyfea) microfrontend context areas backed by K8s CRDs.

## What it does

- Drag widget cards from the sidebar onto a 12-column grid canvas
- Each cell loads its widget via a `polyfea-context` (UUID-scoped context area)
- Edit widget attributes inline; save cells as `WebComponent` CRDs via a backend API
- Resize cells with pointer-capture handles; move them by dragging the header
- Full touch support alongside mouse/keyboard

## Architecture

| Element | Role |
|---|---|
| `<galleon-shell>` | Root — wires canvas, sidebar, and polyfea context areas |
| `<galleon-canvas>` | CSS Grid host; handles drop and touch-drag-end to create/move cells |
| `<galleon-cell>` | Placed widget container; owns `polyfea-context`, attr editor, save/remove |
| `<galleon-components-browser>` | Sidebar inventory; lists draggable `<galleon-component>` cards |
| `<galleon-component>` | Inventory card carrying widget identity (`widget-tag`, `widget-name`, `widget-namespace`) and default `widget-attrs` |
| `ResizeController` | Pointer Events + `setPointerCapture` for col/row resize |
| `DragDropController` | Overlay-grid drop targeting |

Widget identity on a cell:

| Attribute | Description |
|---|---|
| `widget-tag` | HTML element tag name (`demo-chart-widget`) |
| `widget-name` | K8s resource name of the widget |
| `widget-namespace` | K8s namespace of the widget |
| `widget-attrs` | JSON object of runtime attributes applied to the rendered element |

## Polyfea integration

In dev, polyfea uses the `static://` backend which reads `public/polyfea/static-config`. This file defines the inventory components and the pre-seeded demo cells (Chart, Table, Logs).

In production, a K8s polyfea controller serves context areas dynamically from `WebComponent` CRDs. Saving a cell via the `⬆` button dispatches a `galleon-cell-save` event — a backend API will receive this and create/update the corresponding CRD.

Each cell renders `<polyfea-context name="galleon-cell-{cellId}">`. A matching context area in the polyfea backend is what loads the widget. If no context area exists yet (freshly dropped cell, no backend), the widget element is rendered directly as a fallback.

## Getting started

```sh
npm install
npm run dev
```

Open `http://localhost:5173`. Three demo cells are pre-loaded from `public/polyfea/static-config`. Drag additional widgets from the sidebar.

```sh
npm run build      # type-check + Vite bundle → dist/
npm test           # Vitest
```

## Theming

CSS custom properties (set on any ancestor):

```css
--galleon-bg
--galleon-surface
--galleon-surface-2
--galleon-border
--galleon-text
--galleon-text-muted
--galleon-hover
--galleon-shadow
```

## License

[MIT](LICENSE)
