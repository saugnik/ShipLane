import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { fieldErrors } from "@/lib/validation";

/**
 * Uniform API envelope. Every route returns either `{ data }` or
 * `{ error, fields? }`, so the client has exactly one shape to branch on and
 * form components can map `fields` straight onto their inputs.
 */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(message: string, status = 400, fields?: Record<string, string>) {
  return NextResponse.json({ error: message, ...(fields ? { fields } : {}) }, { status });
}

/** Wraps a handler so validation and unexpected errors never leak a stack trace. */
export async function handle<T>(fn: () => Promise<T>): Promise<Response> {
  try {
    return ok(await fn());
  } catch (err) {
    if (err instanceof ZodError) {
      return fail("Please correct the highlighted fields", 422, fieldErrors(err));
    }
    if (err instanceof HttpError) {
      return fail(err.message, err.status);
    }
    console.error("[api]", err);
    return fail("Something went wrong on our side. Please try again.", 500);
  }
}

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const notFound = (what: string) => new HttpError(`${what} not found`, 404);
