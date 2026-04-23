import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { customers, opportunities, visits } from "../db/schema.js";
import { PIPELINE_STAGES } from "@marpex/domain";
import { getOptionalNumberEnv } from "../lib/env.js";
import { syncStagnantOpportunities } from "../lib/stagnation.js";

function isStagnantOpportunity(lastActivityAt: string | Date) {
  const activityTime = new Date(lastActivityAt).getTime();
  const threshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return activityTime < threshold;
}

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request) => {
    const userRole = request.userRole!;
    const userId = request.userId!;

    await syncStagnantOpportunities();

    // Base opportunity query — manager sees all, sales sees own
    const oppRows = userRole === "manager"
      ? await db.select().from(opportunities)
      : await db.select().from(opportunities).where(eq(opportunities.ownerId, userId));

    const visitRows = userRole === "manager"
      ? await db.select().from(visits)
      : await db.select().from(visits).where(eq(visits.ownerId, userId));

    const customerRows = await db.select({ id: customers.id, name: customers.name, currentRevenue: customers.currentRevenue }).from(customers);

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
    const now = new Date();
    const overdue = open.filter((o) => new Date(o.nextStepDeadline) < now);

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
      top10,
      semaphore,
    };
  });
};
