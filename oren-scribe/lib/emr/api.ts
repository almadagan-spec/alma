// Shared helpers for the fake EMR API routes.

import { NextResponse } from "next/server";
import { SECTION_CODES, type NoteInput, type SectionCode } from "@/lib/types";

/**
 * The EMR hands the embedded component a short-lived access token.
 * In the mock there is one demo token. An expired token is simulated
 * through the dev panel (stage 5), which makes the next POST return 401.
 */
export const DEMO_TOKEN = process.env.EMR_DEMO_TOKEN ?? "oren-demo-token";

export function isAuthorized(req: Request): boolean {
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${DEMO_TOKEN}`;
}

export function emrError(status: 401 | 404 | 409 | 422 | 503, message: string, details?: string[]) {
  const code = {
    401: "token_expired",
    404: "not_found",
    409: "encounter_closed",
    422: "validation_error",
    503: "emr_unavailable",
  }[status];
  return NextResponse.json({ error: { code, message, ...(details ? { details } : {}) } }, { status });
}

export const MAX_SECTION_CHARS = 2000;

// "Plain text only": reject HTML tags and common Markdown markup.
const HTML_TAG = /<\/?[a-z][^>]*>/i;
const MARKDOWN = /(\*\*|__|`|^\s{0,3}#{1,6}\s|^\s*[-*+]\s+\[[ x]\])/m;

/**
 * Validate a note body against the spec. Returns a list of problems
 * (empty list = valid). Used by the EMR mock (→ 422) and, later, by our
 * product before sending (decision 22), so the same rules apply on both sides.
 */
export function validateNoteInput(body: unknown, physicianId: string): string[] {
  const errors: string[] = [];
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return ["Body must be a JSON object"];
  }
  const b = body as Partial<NoteInput> & Record<string, unknown>;

  if (typeof b.author_id !== "string" || !b.author_id.trim()) {
    errors.push("author_id is required");
  }
  if (b.status !== "draft" && b.status !== "signed") {
    errors.push('status must be "draft" or "signed"');
  }
  if (b.status === "signed" && b.author_id !== physicianId) {
    errors.push("Only the encounter's physician can sign");
  }

  if (!Array.isArray(b.sections) || b.sections.length === 0) {
    errors.push("sections must be a non-empty array");
    return errors;
  }

  const seen = new Set<string>();
  b.sections.forEach((s, i) => {
    const where = `sections[${i}]`;
    if (typeof s !== "object" || s === null) {
      errors.push(`${where} must be an object`);
      return;
    }
    if (!SECTION_CODES.includes(s.code as SectionCode)) {
      errors.push(`${where}.code "${String(s.code)}" is not one of ${SECTION_CODES.join(", ")}`);
    } else if (seen.has(s.code)) {
      errors.push(`${where}.code "${s.code}" appears more than once`);
    } else {
      seen.add(s.code);
    }
    if (typeof s.text !== "string" || !s.text.trim()) {
      errors.push(`${where}.text must be a non-empty string`);
      return;
    }
    if (s.text.length > MAX_SECTION_CHARS) {
      errors.push(`${where}.text is ${s.text.length} characters (max ${MAX_SECTION_CHARS})`);
    }
    if (HTML_TAG.test(s.text) || MARKDOWN.test(s.text)) {
      errors.push(`${where}.text must be plain text (no HTML or Markdown)`);
    }
  });

  return errors;
}
