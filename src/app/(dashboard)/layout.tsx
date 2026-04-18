export const dynamic = "force-dynamic";

import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AuthProvider>
        <div className="min-h-screen bg-[var(--background)]">
          <Sidebar />
          <div className="md:ml-64 flex flex-col min-h-screen">
            <Topbar />
            <main className="flex-1 p-6">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </div>
        </div>
        <Toaster />
      </AuthProvider>
    </QueryProvider>
  );
}
