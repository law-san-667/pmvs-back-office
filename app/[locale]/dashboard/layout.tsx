import { AppSidebar } from "@/components/app-sidebar";
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard";
import { SiteHeader } from "@/components/site-header";
import { BusinessProvider } from "@/contexts/business-context";
import { MessagingProvider } from "@/contexts/messaging-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BusinessProvider>
      <DashboardAuthGuard>
        <MessagingProvider>
          <SidebarProvider
            style={
              {
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
              } as React.CSSProperties
            }
          >
            <AppSidebar variant="sidebar" />
            <SidebarInset>
              <SiteHeader />
              <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                  {children}
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </MessagingProvider>
      </DashboardAuthGuard>
    </BusinessProvider>
  );
}
