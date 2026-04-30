import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const AppLayout = lazy(() => import('@/components/layout/AppLayout').then((module) => ({ default: module.AppLayout })));
const Dashboard = lazy(() => import('@/components/dashboard/Dashboard').then((module) => ({ default: module.Dashboard })));
const CdaReport = lazy(() => import('@/components/dashboard/CdaReport').then((module) => ({ default: module.CdaReport })));
const LoginPage = lazy(() => import('@/components/auth/LoginPage').then((module) => ({ default: module.LoginPage })));
const ResetPasswordPage = lazy(() => import('@/components/auth/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })));
const AssetsTable = lazy(() => import('@/components/assets/AssetsTable').then((module) => ({ default: module.AssetsTable })));
const WorkOrdersList = lazy(() => import('@/components/work-orders/WorkOrdersList').then((module) => ({ default: module.WorkOrdersList })));
const PublicTicketForm = lazy(() => import('@/components/ticketing/PublicTicketForm').then((module) => ({ default: module.PublicTicketForm })));
const TicketsQueue = lazy(() => import('@/components/ticketing/TicketsQueue').then((module) => ({ default: module.TicketsQueue })));
const ScheduleView = lazy(() => import('@/components/schedule/ScheduleView').then((module) => ({ default: module.ScheduleView })));
const SuppliersTable = lazy(() => import('@/components/suppliers/SuppliersTable').then((module) => ({ default: module.SuppliersTable })));
const AuditLogView = lazy(() => import('@/components/audit/AuditLogView').then((module) => ({ default: module.AuditLogView })));
const UsersManagement = lazy(() => import('@/components/users/UsersManagement').then((module) => ({ default: module.UsersManagement })));
const RapportiniView = lazy(() => import('@/components/rapportini/RapportiniView').then((module) => ({ default: module.RapportiniView })));

function RouteLoader() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function LayoutRoute({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<RouteLoader />}>
      <AppLayout title={title}>{children}</AppLayout>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                {/* Public */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/report-issue" element={<PublicTicketForm />} />

                {/* Protected */}
                <Route path="/" element={<ProtectedRoute><LayoutRoute title="Dashboard Generale"><Dashboard /></LayoutRoute></ProtectedRoute>} />
                <Route path="/reports/cda" element={<ProtectedRoute allowedRoles={['ADMIN', 'RESPONSABILE']}><CdaReport /></ProtectedRoute>} />
                <Route path="/assets" element={<ProtectedRoute><LayoutRoute title="Gestione Asset"><AssetsTable /></LayoutRoute></ProtectedRoute>} />
                <Route path="/work-orders" element={<ProtectedRoute><LayoutRoute title="Work Orders"><WorkOrdersList /></LayoutRoute></ProtectedRoute>} />
                <Route path="/rapportini" element={<ProtectedRoute><LayoutRoute title="Rapportini"><RapportiniView /></LayoutRoute></ProtectedRoute>} />
                <Route path="/tickets" element={<ProtectedRoute><LayoutRoute title="Ticketing System"><TicketsQueue /></LayoutRoute></ProtectedRoute>} />
                <Route path="/schedule" element={<ProtectedRoute><LayoutRoute title="Scadenzario Manutenzioni"><ScheduleView /></LayoutRoute></ProtectedRoute>} />
                <Route path="/suppliers" element={<ProtectedRoute><LayoutRoute title="Fornitori e Tecnici"><SuppliersTable /></LayoutRoute></ProtectedRoute>} />
                <Route path="/audit" element={<ProtectedRoute allowedRoles={['ADMIN', 'RESPONSABILE']}><LayoutRoute title="Audit Log"><AuditLogView /></LayoutRoute></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute adminOnly><LayoutRoute title="Gestione Utenti"><UsersManagement /></LayoutRoute></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            </ErrorBoundary>
            <Toaster position="top-right" />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
