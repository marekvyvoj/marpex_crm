import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { customers, contacts, importJobs } from "../db/schema.js";
import { customerSegments, contactRoles } from "@marpex/domain";
import { sendError } from "../lib/http.js";

// Expected CSV columns (case-insensitive header match):
// name, segment, category, currentRevenue, potential,
// contactFirstName, contactLastName, contactRole, contactEmail, contactPhone

const rowSchema = z.object({
  name: z.string().min(1),
  segment: z.enum(customerSegments),
  category: z.enum(["A", "B", "C"]).optional(),
  currentRevenue: z.string().optional(),
  potential: z.string().optional(),
  contactFirstName: z.string().optional(),
  contactLastName: z.string().optional(),
  contactRole: z.enum(contactRoles).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
});

const CSV_HEADER_ALIASES: Record<string, keyof z.infer<typeof rowSchema>> = {
  name: "name",
  segment: "segment",
  category: "category",
  currentrevenue: "currentRevenue",
  potential: "potential",
  contactfirstname: "contactFirstName",
  contactlastname: "contactLastName",
  contactrole: "contactRole",
  contactemail: "contactEmail",
  contactphone: "contactPhone",
};

const DANGEROUS_TEXT_FIELDS = new Set(["name", "contactFirstName", "contactLastName", "contactEmail"]);
const DANGEROUS_SPREADSHEET_PREFIXES = new Set(["=", "+", "-", "@"]); 

function stripControlCharacters(value: string) {
  return [...value]
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("");
}

function normalizeCsvHeader(header: string) {
  const normalized = header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return CSV_HEADER_ALIASES[normalized] ?? header.trim();
}

function sanitizeCsvCell(field: string, value: string) {
  const cleaned = stripControlCharacters(value).trim();

  if (cleaned.length === 0) {
    return cleaned;
  }

  if (DANGEROUS_TEXT_FIELDS.has(field) && DANGEROUS_SPREADSHEET_PREFIXES.has(cleaned[0])) {
    throw new Error(`Pole ${field} obsahuje nepovolený prefix pre CSV/spreadsheet hodnotu`);
  }

  return cleaned;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => normalizeCsvHeader(h.replace(/^"|"$/g, "")));
  return lines.slice(1)
    .filter((l) => l.trim().length > 0)
    .map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      header.forEach((h, i) => { row[h] = sanitizeCsvCell(h, values[i] ?? ""); });
      return row;
    });
}

export const importRoutes: FastifyPluginAsync = async (app) => {
  // POST /customers — bulk import customers (+ optional contacts) from CSV
  app.post("/customers", async (request, reply) => {
    const userId = request.userId!;
    const contentType = request.headers["content-type"] ?? "";

    if (!contentType.includes("text/csv") && !contentType.includes("text/plain")) {
      return sendError(reply, 415, "UNSUPPORTED_MEDIA_TYPE", "Content-Type must be text/csv or text/plain");
    }

    const csvText = request.body as string;
    if (!csvText || typeof csvText !== "string" || csvText.trim().length === 0) {
      return sendError(reply, 400, "EMPTY_BODY", "Empty body");
    }

    const rawRows = parseCsv(csvText);
    if (rawRows.length === 0) {
      return sendError(reply, 400, "INVALID_CSV", "CSV má menej ako 2 riadky (header + aspoň 1 dátový riadok)");
    }

    // Record import job
    const [job] = await db
      .insert(importJobs)
      .values({
        sourceSystem: "csv",
        entityType: "customers",
        status: "running",
        totalRows: rawRows.length,
        startedBy: userId,
      })
      .returning();

    let importedRows = 0;
    let errorRows = 0;
    const errorReport: string[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const rowNum = i + 2; // 1-based + header
      try {
        const parsed = rowSchema.parse(rawRows[i]);

        const [cust] = await db
          .insert(customers)
          .values({
            name: parsed.name,
            segment: parsed.segment,
            strategicCategory: parsed.category ?? null,
            currentRevenue: parsed.currentRevenue ? String(Number(parsed.currentRevenue)) : null,
            potential: parsed.potential ? String(Number(parsed.potential)) : null,
            sourceSystem: "csv",
          })
          .returning();

        if (parsed.contactFirstName && parsed.contactLastName && parsed.contactRole) {
          await db.insert(contacts).values({
            customerId: cust.id,
            firstName: parsed.contactFirstName,
            lastName: parsed.contactLastName,
            role: parsed.contactRole,
            email: parsed.contactEmail || null,
            phone: parsed.contactPhone || null,
            sourceSystem: "csv",
          });
        }

        importedRows++;
      } catch (err) {
        errorRows++;
        const message = err instanceof Error ? err.message : String(err);
        errorReport.push(`Riadok ${rowNum}: ${message}`);
      }
    }

    await db
      .update(importJobs)
      .set({
        status: errorRows === rawRows.length ? "failed" : "completed",
        importedRows,
        errorRows,
        errorReport: errorReport.length > 0 ? errorReport.join("\n") : null,
        completedAt: new Date(),
      })
      .where(eq(importJobs.id, job.id));

    return reply.code(200).send({
      jobId: job.id,
      total: rawRows.length,
      imported: importedRows,
      errors: errorRows,
      errorReport: errorReport.length > 0 ? errorReport : undefined,
    });
  });
};
