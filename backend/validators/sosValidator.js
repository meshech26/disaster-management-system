const { z } = require('zod');

const triggerSosSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  accuracy: z.number().optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  emergencyType: z
    .enum(['trapped', 'medical_emergency', 'flood_surround', 'fire_threat', 'general_danger'])
    .optional(),
  peopleCount: z.number().min(1).optional(),
  notes: z.string().optional()
});

const updateSosStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']),
  notes: z.string().optional()
});

module.exports = {
  triggerSosSchema,
  updateSosStatusSchema
};
