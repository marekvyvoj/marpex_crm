import type { FastifyPluginAsync } from "fastify";
import { db } from "../db/index.js";
import { users, visits, opportunities } from "../db/schema.js";
import { PIPELINE_STAGES } from "@marpex/domain";
import { managerGuard } from "../lib/guards.js";

export const reportRoutes: FastifyPluginAsync = async (app) => {
  // GET /salesperson — per-salesperson performance summary (manager only)
  app.get("/salesperson", { preHandler: [managerGuard] }, async () => {
    const [allUsers, allVisits, allOpps] = await Promise.all([
      db
        .select({ id: users.id, name: users.name, email: users.email, role: users.role, active: users.active })
        .from(users),
      db.select().from(visits),
      db.select().from(opportunities),
    ]);

    const report = allUsers
      .filter((u) => u.role === "sales" || u.role === "manager")
      .map((u) => {
        const uVisits = allVisits.filter((v) => v.ownerId === u.id);
        const uOpps = allOpps.filter((o) => o.ownerId === u.id);

        const open = uOpps.filter((o) => o.stage !== "won" && o.stage !== "lost");
        const won = uOpps.filter((o) => o.stage === "won");
        const lost = uOpps.filter((o) => o.stage === "lost");

        const wonValue = won.reduce((s, o) => s + Number(o.value), 0);
        const openValue = open.reduce((s, o) => s + Number(o.value), 0);

        const weightedPipeline = open.reduce((s, o) => {
          const stage = PIPELINE_STAGES.find((st) => st.id === o.stage);
          return s + Number(o.value) * ((stage?.weight ?? 0) / 100);
        }, 0);

        const winRate =
          won.length + lost.length > 0
            ? Math.round((won.length / (won.length + lost.length)) * 100)
            : null;

        const lateVisits = uVisits.filter((v) => v.lateFlag).length;
        const visitsWithOpp = uVisits.filter((v) => v.opportunityCreated).length;
        const conversionRate =
          uVisits.length > 0
            ? Math.round((visitsWithOpp / uVisits.length) * 100)
            : null;

        const stagnantCount = open.filter((o) => o.stagnant).length;

        const now = new Date();
        const overdueCount = open.filter(
          (o) => new Date(o.nextStepDeadline) < now,
        ).length;

        return {
          userId: u.id,
          name: u.name,
          email: u.email,
          active: u.active,
          visitCount: uVisits.length,
          lateVisits,
          conversionRate,
          openOpps: open.length,
          openValue: Math.round(openValue),
          weightedPipeline: Math.round(weightedPipeline),
          wonCount: won.length,
          wonValue: Math.round(wonValue),
          lostCount: lost.length,
          winRate,
          stagnantCount,
          overdueCount,
        };
      });

    return report;
  });
};
