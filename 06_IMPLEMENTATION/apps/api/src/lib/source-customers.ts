import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import XLSX from "xlsx";
import type { CustomerIndustry, CustomerSegment } from "@marpex/domain";

export interface SourceCustomerRow {
  industry: CustomerIndustry;
  name: string;
  ico: string;
  dic: string;
  icDph: string;
  address: string;
  city: string;
  postalCode: string;
  district: string;
  region: string;
  currentRevenue: string;
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .trim();
}

function normalizeAmount(value: unknown) {
  const raw = normalizeText(value).replace(/\s+/g, "").replace(",", ".");

  if (!raw) {
    return null;
  }

  const amount = Number(raw);

  if (Number.isNaN(amount)) {
    throw new Error(`Invalid amount value: ${String(value)}`);
  }

  return amount.toFixed(2);
}

function resolveIndustry(fileName: string): CustomerIndustry {
  const normalized = fileName.toLowerCase();

  if (normalized.includes("potravinarstvo")) {
    return "potravinarstvo";
  }

  if (normalized.includes("mobile equipment")) {
    return "mobile_equipment";
  }

  if (normalized.includes("oem")) {
    return "oem";
  }

  throw new Error(`Unsupported SourceData file name: ${fileName}`);
}

export function resolveSegmentForIndustry(industry: CustomerIndustry): CustomerSegment {
  if (industry === "oem") {
    return "oem";
  }

  return "vyroba";
}

function resolveSourceDataDir() {
  const baseCandidates = [process.cwd(), process.env.INIT_CWD].filter((value): value is string => Boolean(value));
  const relativeCandidates = [
    "SourceData",
    "../SourceData",
    "../../SourceData",
    "../../../SourceData",
  ];

  for (const basePath of baseCandidates) {
    for (const relativePath of relativeCandidates) {
      const candidate = resolve(basePath, relativePath);

      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }

  throw new Error("SourceData directory was not found. Expected it near the repository root.");
}

export function loadSourceCustomers() {
  const sourceDataDir = resolveSourceDataDir();
  const workbookFiles = readdirSync(sourceDataDir)
    .filter((entry) => entry.toLowerCase().endsWith(".xlsx"))
    .sort((left, right) => left.localeCompare(right));

  if (workbookFiles.length === 0) {
    throw new Error(`No XLSX files were found in ${sourceDataDir}`);
  }

  const rows: SourceCustomerRow[] = [];
  const icoSet = new Set<string>();

  for (const workbookFile of workbookFiles) {
    const industry = resolveIndustry(workbookFile);
    const workbook = XLSX.readFile(resolve(sourceDataDir, workbookFile));
    const [sheetName] = workbook.SheetNames;

    if (!sheetName) {
      throw new Error(`Workbook ${workbookFile} does not contain a sheet.`);
    }

    const sheet = workbook.Sheets[sheetName];
    const workbookRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    for (const workbookRow of workbookRows) {
      const row: SourceCustomerRow = {
        industry,
        name: normalizeText(workbookRow["Názov"]),
        ico: normalizeText(workbookRow["IČO"]),
        dic: normalizeText(workbookRow["DIČ"]),
        icDph: normalizeText(workbookRow["IČ DPH"]),
        address: normalizeText(workbookRow["Adresa"]),
        city: normalizeText(workbookRow["Mesto"]),
        postalCode: normalizeText(workbookRow["PSČ"]),
        district: normalizeText(workbookRow["Okres"]),
        region: normalizeText(workbookRow["Kraj"]),
        currentRevenue: normalizeAmount(workbookRow["Tržby"]) ?? "0.00",
      };

      if (!row.name || !row.ico) {
        throw new Error(`Workbook ${workbookFile} contains a row without required company identity fields.`);
      }

      if (icoSet.has(row.ico)) {
        throw new Error(`Duplicate customer ICO detected in SourceData: ${row.ico}`);
      }

      icoSet.add(row.ico);
      rows.push(row);
    }
  }

  return rows;
}