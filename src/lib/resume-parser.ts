/**
 * Extract text from resume files (PDF, DOCX, TXT) for mock interview.
 * Used server-side only.
 */

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_TEXT_LENGTH = 18_000; // truncate for OpenAI context

const ALLOWED_PDF = "application/pdf";
const ALLOWED_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const ALLOWED_TXT = "text/plain";

export type ParseResult = { ok: true; text: string } | { ok: false; error: string };

export function getAllowedTypes(): string[] {
  return [ALLOWED_PDF, ALLOWED_DOCX, ALLOWED_TXT];
}

export function getAllowedExtensions(): string {
  return ".pdf, .docx, .txt";
}

export async function parseResumeFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ParseResult> {
  if (buffer.length > MAX_FILE_BYTES) {
    return { ok: false, error: "File is too large (max 5MB)." };
  }

  let text: string;

  if (mimeType === ALLOWED_PDF || fileName.toLowerCase().endsWith(".pdf")) {
    const result = await parsePdf(buffer);
    if (!result.ok) return result;
    text = result.text;
  } else if (mimeType === ALLOWED_DOCX || fileName.toLowerCase().endsWith(".docx")) {
    const result = await parseDocx(buffer);
    if (!result.ok) return result;
    text = result.text;
  } else if (mimeType === ALLOWED_TXT || fileName.toLowerCase().endsWith(".txt")) {
    text = buffer.toString("utf-8").trim();
    if (!text) return { ok: false, error: "File appears to be empty." };
  } else {
    return { ok: false, error: "Unsupported format. Use PDF, DOCX, or TXT." };
  }

  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length < 50) {
    return { ok: false, error: "Could not extract enough text from the file (min 50 characters)." };
  }

  const truncated =
    trimmed.length > MAX_TEXT_LENGTH ? trimmed.slice(0, MAX_TEXT_LENGTH) + "…" : trimmed;
  return { ok: true, text: truncated };
}

async function parsePdf(buffer: Buffer): Promise<ParseResult> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const textResult = await parser.getText();
    await parser.destroy();
    const text = typeof textResult?.text === "string" ? textResult.text.trim() : "";
    if (!text) return { ok: false, error: "Could not extract text from the PDF." };
    return { ok: true, text };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Failed to parse PDF: ${message.slice(0, 100)}` };
  }
}

async function parseDocx(buffer: Buffer): Promise<ParseResult> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    const text = (result?.value ?? "").trim();
    if (!text) return { ok: false, error: "Could not extract text from the DOCX." };
    return { ok: true, text };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Failed to parse DOCX: ${message.slice(0, 100)}` };
  }
}
