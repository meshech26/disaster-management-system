const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional().default(''),
  district: z.string().optional(),
  role: z.enum(['citizen', 'volunteer', 'responder', 'admin', 'duty_officer']).optional(),
  agency: z.string().optional(),
  lastKnownLocation: z.any().optional(),
  emergencyContacts: z
    .array(
      z.object({
        name: z.string(),
        phone: z.string(),
        relation: z.string().optional()
      })
    )
    .optional()
});

const loginSchema = z.object({
  email: z.string().optional(),
  username: z.string().optional(),
  password: z.string().min(1, 'Password is required')
});

const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  updateLocationSchema
};
