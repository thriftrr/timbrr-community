// A site's own collection-aware block (docs/README.md § Collections). An example, not loaded by the layer.
import { z } from 'zod';
import { defineBlock, collectionSourceSchema, headlineField } from '@timbrr/community/schema/define.js';

export default defineBlock({
 type: 'acme_team',
 label: 'Team cards',
 category: 'dynamic',
 schema: z.object({ headline: z.string().max(160).default(''), source: collectionSourceSchema, round: z.boolean().default(true) }),
 fields: [headlineField, { key: 'source', label: 'Who to show', widget: 'collection' }, { key: 'round', label: 'Round photos', widget: 'switch' }],
 defaults: { headline: 'Our team', round: true },
});
