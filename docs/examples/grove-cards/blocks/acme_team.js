// A site's own grove-aware block (docs/README.md § Groves). An example, not loaded by the layer.
import { z } from 'zod';
import { defineBlock, groveSourceSchema, headlineField } from '@timbrr/community/schema/define.js';

export default defineBlock({
 type: 'acme_team',
 label: 'Team cards',
 category: 'dynamic',
 schema: z.object({ headline: z.string().max(160).default(''), source: groveSourceSchema, round: z.boolean().default(true) }),
 fields: [headlineField, { key: 'source', label: 'Who to show', widget: 'grove' }, { key: 'round', label: 'Round photos', widget: 'switch' }],
 defaults: { headline: 'Our team', round: true },
});
