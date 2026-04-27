import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { customers, opportunities, visits } from "../db/schema.js";
import { PIPELINE_STAGES } from "@marpex/domain";
import { getOptionalNumberEnv } from "../lib/env.js";
import { sendError } from "../lib/http.js";
import { syncStagnantOpportunities } from "../lib/stagnation.js";

type CustomerRow = {
  id: string;
  name: string;
  currentRevenue: string | null;
};

type OpportunityRow = typeof opportunities.$inferSelect;
type VisitRow = typeof visits.$inferSelect;

type PlannerStatus = "overdue" | "today" | "this_week" | "later";

type PlannerItem = {
  id: string;
  sourceType: "opportunity" | "visit";
  customerId: string;
  customerName: string;
  title: string;
  nextStep: string;
  dueDate: string;
  status: PlannerStatus;
  stage: string | null;
  visitDate: string | null;
  value: number | null;
};

async function loadScopedDashboardRows(userRole: string, userId: string) {
  const oppRows = userRole === "manager"
    ? await db.select().from(opportunities)
    : await db.select().from(opportunities).where(eq(opportunities.ownerId, userId));

  const visitRows = userRole === "manager"
    ? await db.select().from(visits)
    : await db.select().from(visits).where(eq(visits.ownerId, userId));

  const customerRows = await db
    .select({ id: customers.id, name: customers.name, currentRevenue: customers.currentRevenue })
    .from(customers);

  return {
    oppRows,
    visitRows,
    customerRows,
  };
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function resolvePlannerStatus(dueDate: string, todayKey: string, windowEndKey: string): PlannerStatus {
  if (dueDate < todayKey) return "overdue";
  if (dueDate === todayKey) return "today";
  if (dueDate <= windowEndKey) return "this_week";
  return "later";
}

function buildPlannerItems(
  oppRows: OpportunityRow[],
  visitRows: VisitRow[],
  customerRows: CustomerRow[],
  todayKey: string,
  windowEndKey: string,
) {
  const customerNameById = new Map(customerRows.map((customer) => [customer.id, customer.name]));

  const items: PlannerItem[] = [
    ...oppRows
      .filter((opportunity) => opportunity.stage !== "won" && opportunity.stage !== "lost")
      .map((opportunity) => ({
        id: opportunity.id,
        sourceType: "opportunity" as const,
        customerId: opportunity.customerId,
        customerName: customerNameById.get(opportunity.customerId) ?? "Neznámy zákazník",
        title: opportunity.title,
        nextStep: opportunity.nextStepSummary,
        dueDate: opportunity.nextStepDeadline,
        status: resolvePlannerStatus(opportunity.nextStepDeadline, todayKey, windowEndKey),
        stage: opportunity.stage,
        visitDate: null,
        value: Number(opportunity.value),
      })),
    ...visitRows.map((visit) => ({
      id: visit.id,
      sourceType: "visit" as const,
      customerId: visit.customerId,
      customerName: customerNameById.get(visit.customerId) ?? "Neznámy zákazník",
      title: `Návšteva ${visit.date}`,
      nextStep: visit.nextStep,
      dueDate: visit.nextStepDeadline,
      status: resolvePlannerStatus(visit.nextStepDeadline, todayKey, windowEndKey),
      stage: null,
      visitDate: visit.date,
      value: Number(visit.potentialEur),
    })),
  ];

  items.sort((left, right) => {
    if (left.dueDate !== right.dueDate) {
      return left.dueDate.localeCompare(right.dueDate);
    }

    if (left.sourceType !== right.sourceType) {
      return left.sourceType.localeCompare(right.sourceType);
    }

    return left.title.localeCompare(right.title, "sk");
  });

  return items;
}

function buildPlannerSummary(items: PlannerItem[]) {
  return items.reduce(
    (summary, item) => {
      if (item.status === "overdue") summary.overdueCount += 1;
      if (item.status === "today") summary.dueTodayCount += 1;
      if (item.status === "this_week") summary.dueThisWeekCount += 1;
      if (item.status === "later") summary.laterCount += 1;
      summary.totalCount += 1;
      return summary;
    },
    {
      overdueCount: 0,
      dueTodayCount: 0,
      dueThisWeekCount: 0,
      laterCount: 0,
      totalCount: 0,
    },
  );
}

function buildPlannerPayload(
  oppRows: OpportunityRow[],
  visitRows: VisitRow[],
  customerRows: CustomerRow[],
  todayKey: string,
  windowEndKey: string,
) {
  const items = buildPlannerItems(oppRows, visitRows, customerRows, todayKey, windowEndKey);
  const summary = buildPlannerSummary(items);

  return {
    summary,
    windowStart: todayKey,
    windowEnd: windowEndKey,
    previewItems: items.filter((item) => item.status !== "later").slice(0, 5),
    items,
  };
}

function isStagnantOpportunity(lastActivityAt: string | Date) {
  const activityTime = new Date(lastActivityAt).getTime();
  const threshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return activityTime < threshold;
}

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/planner", async (request, reply) => {
    const userRole = request.userRole!;

    if (userRole !== "sales") {
      return sendError(reply, 403, "FORBIDDEN", "Prístup zamietnutý — planner je určený pre obchodníkov.");
    }

    const userId = request.userId!;
    const today = new Date();
    const todayKey = toDateKey(today);
    const windowEndKey = toDateKey(addDays(today, 7));
    const { oppRows, visitRows, customerRows } = await loadScopedDashboardRows(userRole, userId);
    return buildPlannerPayload(oppRows, visitRows, customerRows, todayKey, windowEndKey);
  });

  app.get("/", async (request) => {
    const userRole = request.userRole!;
    const userId = request.userId!;

    await syncStagnantOpportunities();

    const { oppRows, visitRows, customerRows } = await loadScopedDashboardRows(userRole, userId);
    const today = new Date();
    const todayKey = toDateKey(today);
    const plannerPreview = userRole === "sales"
      ? buildPlannerPayload(oppRows, visitRows, customerRows, todayKey, toDateKey(addDays(today, 7)))
      : null;

    const open = oppRows.filter((o) => o.stage !== "won" && o.stage !== "lost");
    const won = oppRows.filter((o) => o.stage === "won");
    const lost = oppRows.filter((o) => o.stage === "lost");

    const totalPipeline = open.reduce((s, o) => s + Number(o.value), 0);
    const weightedPipeline = open.reduce((s, o) => {
      const stage = PIPELINE_STAGES.find((st) => st.id === o.stage);
      return s + Number(o.value) * ((stage?.weight ?? 0) / 100);
    }, 0);
    const wonTotal = won.reduce((s, o) => s + Number(o.value), 0);
    const lostTotal = lost.reduce((s, o) => s + Number(o.value), 0);

    const winRate = won.length + lost.length > 0
      ? Math.round((won.length / (won.length + lost.length)) * 100)
      : 0;

    const avgDealSize = won.length > 0 ? Math.round(wonTotal / won.length) : 0;

    const totalCurrentRevenue = customerRows.reduce((sum, customer) => sum + Number(customer.currentRevenue ?? 0), 0);
    const configuredAnnualTarget = getOptionalNumberEnv("ANNUAL_REVENUE_TARGET_EUR");
    const annualRevenueTarget = configuredAnnualTarget ?? (totalCurrentRevenue > 0 ? Math.round(totalCurrentRevenue * 1.3) : null);
    const coverageRatio = annualRevenueTarget && annualRevenueTarget > 0
      ? Number((totalPipeline / annualRevenueTarget).toFixed(2))
      : null;

    const stagnant = open.filter((o) => o.stagnant || isStagnantOpportunity(o.lastActivityAt));
    const overdue = open.filter((o) => o.nextStepDeadline < todayKey);

    // Visit -> opportunity conversion
    const visitsWithOpp = visitRows.filter((v) => v.opportunityCreated);
    const conversionRate = visitRows.length > 0
      ? Math.round((visitsWithOpp.length / visitRows.length) * 100)
      : 0;
    const crossSellRate = visitsWithOpp.length > 0
      ? Math.round((visitsWithOpp.filter((v) => v.opportunityType === "cross_sell").length / visitsWithOpp.length) * 100)
      : null;

    // Lost reasons
    const lostReasons: Record<string, number> = {};
    lost.forEach((o) => {
      const reason = o.lostReason || "Neuvedený";
      lostReasons[reason] = (lostReasons[reason] || 0) + 1;
    });

    // Top 10 open deals
    const customerNameById = new Map(customerRows.map((customer) => [customer.id, customer.name]));
    const top10 = [...open]
      .sort((a, b) => Number(b.value) - Number(a.value))
      .slice(0, 10)
      .map((o) => ({
        id: o.id,
        title: o.title,
        customerName: customerNameById.get(o.customerId) ?? "Neznámy zákazník",
        value: Number(o.value),
        stage: o.stage,
        nextStepSummary: o.nextStepSummary,
        nextStepDeadline: o.nextStepDeadline,
        stagnant: o.stagnant || isStagnantOpportunity(o.lastActivityAt),
      }));

    // Semaphore
    let semaphore: "OK" | "POZOR" | "RIZIKO" = "OK";
    if (stagnant.length > 0 || overdue.length > 2) semaphore = "POZOR";
    if (stagnant.length >= 3 || overdue.length >= 5) semaphore = "RIZIKO";

    return {
      customerCount: customerRows.length,
      totalPipeline,
      weightedPipeline,
      wonTotal,
      lostTotal,
      annualRevenueTarget,
      coverageRatio,
      openCount: open.length,
      visitCount: visitRows.length,
      conversionRate,
      winRate,
      avgDealSize,
      crossSellRate,
      stagnantCount: stagnant.length,
      overdueCount: overdue.length,
      lostReasons,
      plannerPreview: plannerPreview ? { summary: plannerPreview.summary, previewItems: plannerPreview.previewItems } : null,
      top10,
      semaphore,
    };
  });
};
