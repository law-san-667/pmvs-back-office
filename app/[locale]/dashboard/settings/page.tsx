import { AccountSecurity } from "@/components/account-security";
import { NotificationPreferences } from "@/components/notification-preferences";
import BusinessSettingsForm from "@/components/forms/business-settings-form";

export default function SettingsPage() {
  return (
    <>
      <div className="flex flex-col gap-6 p-4 pb-0 lg:p-6 lg:pb-0">
        <AccountSecurity />
        <NotificationPreferences />
      </div>
      <BusinessSettingsForm />
    </>
  );
}
