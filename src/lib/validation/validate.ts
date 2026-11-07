import { z, ZodError } from "zod";

/**
 * Standardized single validation error detail.
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
}

/**
 * Standardized validation result returned by safe validation helpers.
 */
export type ValidationResult<T> =
  | {
      success: true;
      data: T;
      errors?: never;
      errorMessage?: never;
    }
  | {
      success: false;
      data?: never;
      errors: ValidationErrorDetail[];
      errorMessage: string;
    };

/**
 * Lightweight error class representing validation failures in API handlers.
 */
export class ValidationError extends Error {
  public readonly statusCode = 400;
  public readonly details: ValidationErrorDetail[];

  constructor(message: string, details: ValidationErrorDetail[]) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

/**
 * Formats a ZodError into an array of standardized ValidationErrorDetails.
 */
export function formatZodIssues(error: ZodError): ValidationErrorDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
  }));
}

/**
 * Safely validates data against a Zod schema without throwing exceptions.
 */
export function validate<T>(
  schema: z.ZodType<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = formatZodIssues(result.error);
  const errorMessage = errors.map((e) => `${e.field}: ${e.message}`).join("; ");

  return {
    success: false,
    errors,
    errorMessage,
  };
}

/**
 * Validates data against a Zod schema, throwing a ValidationError if invalid.
 */
export function validateOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = validate(schema, data);
  if (!result.success) {
    throw new ValidationError(result.errorMessage, result.errors);
  }
  return result.data;
}
