import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout.tsx";

const LoginPage = lazy(async () => ({ default: (await import("./pages/LoginPage.tsx")).LoginPage }));
const DashboardPage = lazy(async () => ({ default: (await import("./pages/DashboardPage.tsx")).DashboardPage }));
const CustomersPage = lazy(async () => ({ default: (await import("./pages/CustomersPage.tsx")).CustomersPage }));
const CustomerDetailPage = lazy(async () => ({ default: (await import("./pages/CustomerDetailPage.tsx")).CustomerDetailPage }));
const VisitsPage = lazy(async () => ({ default: (await import("./pages/VisitsPage.tsx")).VisitsPage }));
const VisitDetailPage = lazy(async () => ({ default: (await import("./pages/VisitDetailPage.tsx")).VisitDetailPage }));
const PipelinePage = lazy(async () => ({ default: (await import("./pages/PipelinePage.tsx")).PipelinePage }));
const PipelineStageDetailPage = lazy(async () => ({ default: (await import("./pages/PipelineStageDetailPage.tsx")).PipelineStageDetailPage }));
const OpportunityDetailPage = lazy(async () => ({ default: (await import("./pages/OpportunityDetailPage.tsx")).OpportunityDetailPage }));
const ImportPage = lazy(async () => ({ default: (await import("./pages/ImportPage.tsx")).ImportPage }));
const UsersPage = lazy(async () => ({ default: (await import("./pages/UsersPage.tsx")).UsersPage }));
const ReportPage = lazy(async () => ({ default: (await import("./pages/ReportPage.tsx")).ReportPage }));

function PageFallback() {
  return <div className="min-h-[20rem] flex items-center justify-center text-sm text-gray-400">Načítavam stránku…</div>;
}

export function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/visits" element={<VisitsPage />} />
          <Route path="/visits/:id" element={<VisitDetailPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/pipeline/stage/:stageId" element={<PipelineStageDetailPage />} />
          <Route path="/pipeline/:id" element={<OpportunityDetailPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/settings/users" element={<UsersPage />} />
          <Route path="/report" element={<ReportPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
