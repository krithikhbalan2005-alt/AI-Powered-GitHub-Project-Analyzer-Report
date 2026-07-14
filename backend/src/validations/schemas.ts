import { z } from 'zod';

export const createAnalysisSchema = z.object({
  body: z.object({
    repositoryUrl: z
      .string({
        required_error: 'Repository URL is required',
      })
      .trim()
      .min(1, 'Repository URL cannot be empty')
      .refine(
        val => {
          // Normalize check: must have github.com
          return val.includes('github.com');
        },
        {
          message: 'Only public GitHub repository URLs are supported',
        }
      ),
  }),
});

export const getAnalysesQuerySchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'analyzing', 'completed', 'failed']).optional(),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .optional()
      .default('10'),
    page: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .optional()
      .default('1'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters long').optional(),
    photoURL: z.string().url('Invalid URL format for profile picture').nullable().optional(),
  }),
});
