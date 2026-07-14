import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export function validateRequest(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          code: 'request/validation-failure',
          details: error.errors.map(err => ({
            field: err.path.join('.').replace(/^(body|query|params)\./, ''),
            message: err.message,
          })),
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal error during request validation',
        code: 'request/validation-error',
      });
    }
  };
}
