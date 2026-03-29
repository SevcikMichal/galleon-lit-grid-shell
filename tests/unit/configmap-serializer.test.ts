import { describe, it, expect } from 'vitest';
import {
  manifestToConfigMap,
  configMapToManifest,
  manifestToConfigMapJson,
} from '../../src/utils/configmap-serializer.js';
import { defaultManifest } from '../../src/types/cell-entry.js';
import type { GridManifest } from '../../src/types/cell-entry.js';

const sampleManifest: GridManifest = {
  ...defaultManifest(),
  cells: [
    {
      id: 'abc-123',
      tagName: 'demo-chart-widget',
      microfrontend: 'demo-widgets',
      colStart: 1,
      colSpan: 4,
      rowStart: 1,
      rowSpan: 2,
      props: { label: 'Latency', value: '99' },
    },
  ],
};

describe('manifestToConfigMap', () => {
  it('produces a valid K8s ConfigMap structure', () => {
    const cm = manifestToConfigMap(sampleManifest, 'my-layout');
    expect(cm.apiVersion).toBe('v1');
    expect(cm.kind).toBe('ConfigMap');
    expect(cm.metadata.name).toBe('my-layout');
    expect(cm.metadata.namespace).toBe('default');
    expect(typeof cm.data['grid.json']).toBe('string');
  });

  it('embeds the managed-by label', () => {
    const cm = manifestToConfigMap(sampleManifest, 'x');
    expect(cm.metadata.labels['app.kubernetes.io/managed-by']).toBe('galleon-lit-grid-shell');
  });

  it('respects custom namespace', () => {
    const cm = manifestToConfigMap(sampleManifest, 'x', 'production');
    expect(cm.metadata.namespace).toBe('production');
  });
});

describe('configMapToManifest', () => {
  it('round-trips a manifest without data loss', () => {
    const cm = manifestToConfigMap(sampleManifest, 'test');
    const restored = configMapToManifest(cm);
    expect(restored).toEqual(sampleManifest);
  });

  it('throws when grid.json is missing', () => {
    const cm = manifestToConfigMap(sampleManifest, 'x');
    // @ts-expect-error intentional bad data
    cm.data = {};
    expect(() => configMapToManifest(cm)).toThrow();
  });
});

describe('manifestToConfigMapJson', () => {
  it('returns valid JSON', () => {
    const json = manifestToConfigMapJson(sampleManifest, 'test');
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed.kind).toBe('ConfigMap');
  });
});
