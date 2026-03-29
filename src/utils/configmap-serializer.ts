import type { GridManifest } from '../types/cell-entry.js';

export interface K8sConfigMap {
  apiVersion: 'v1';
  kind: 'ConfigMap';
  metadata: {
    name: string;
    namespace: string;
    labels: Record<string, string>;
  };
  data: {
    'grid.json': string;
  };
}

export function manifestToConfigMap(
  manifest: GridManifest,
  name: string,
  namespace = 'default',
): K8sConfigMap {
  return {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name,
      namespace,
      labels: {
        'app.kubernetes.io/managed-by': 'galleon-lit-grid-shell',
        'app.kubernetes.io/component': 'grid-layout',
      },
    },
    data: {
      'grid.json': JSON.stringify(manifest, null, 2),
    },
  };
}

export function configMapToManifest(cm: K8sConfigMap): GridManifest {
  const raw = cm.data?.['grid.json'];
  if (!raw) throw new Error('ConfigMap is missing data["grid.json"]');
  return JSON.parse(raw) as GridManifest;
}

/** Convenience: serialize directly to a JSON string. */
export function manifestToConfigMapJson(
  manifest: GridManifest,
  name: string,
  namespace?: string,
): string {
  return JSON.stringify(manifestToConfigMap(manifest, name, namespace), null, 2);
}
