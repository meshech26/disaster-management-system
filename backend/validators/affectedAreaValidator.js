const { z } = require('zod');

const position = z.tuple([z.number().finite().min(-180).max(180), z.number().finite().min(-90).max(90)]);
const affectedGeometrySchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(position).min(4).max(1000)).length(1)
}).superRefine((geometry, ctx) => {
  const ring = geometry.coordinates[0];
  if (!ring || ring.length < 4) return;
  const first = ring[0];
  const last = ring[ring.length - 1];
  const distinct = new Set(ring.map(([lng, lat]) => `${lng},${lat}`));
  const area = ring.slice(1).reduce((sum, point, index) =>
    sum + ring[index][0] * point[1] - point[0] * ring[index][1], 0);
  if (first[0] !== last[0] || first[1] !== last[1] || distinct.size < 3 || Math.abs(area) < 1e-12) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Draw a closed affected area with at least three distinct boundary points.' });
  }
});

module.exports = { affectedGeometrySchema };
