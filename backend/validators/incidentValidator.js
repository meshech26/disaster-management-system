const { z } = require('zod');

const createIncidentSchema = z.object({
  title: z.string().optional().default('Ground Hazard Report'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  disasterType: z.enum([
    'flood',
    'landslide',
    'land slide',
    'extreme_wind',
    'extreme wind',
    'heavy_rain_lightning',
    'heavy rain with lightning',
    'heavy_rain_with_lightning',
    'fire',
    'earthquake',
    'cyclone',
    'medical',
    'tsunami',
    'industrial',
    'other'
  ]).optional().default('flood'),
  customDisasterType: z.string().optional().default(''),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  latitude: z.union([z.number(), z.string().transform(Number)]),
  longitude: z.union([z.number(), z.string().transform(Number)]),
  address: z.string().optional(),
  peopleTrappedCount: z.union([z.number(), z.string().transform(Number)]).optional(),
  immediateNeeds: z.union([z.array(z.string()), z.string().transform(v => [v])]).optional()
});

const updateIncidentStatusSchema = z.object({
  status: z.enum(['reported', 'under_review', 'verified', 'in_progress', 'resolved', 'dismissed', 'rejected']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  note: z.string().optional(),
  verificationNote: z.string().optional(),
  rejectionNote: z.string().optional(),
  forwardedToDmc: z.boolean().optional()
});

module.exports = {
  createIncidentSchema,
  updateIncidentStatusSchema
};
