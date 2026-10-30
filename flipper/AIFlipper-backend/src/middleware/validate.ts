import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

// Runs a zod schema against req.body and replaces it with the parsed result, so
// downstream handlers receive a value of the validated shape (unknown keys
// stripped or rejected per the schema). A parse failure is a 400 with the field
// errors, not a 500 — the client sent bad input, and it can see exactly what.
export const validateBody =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
