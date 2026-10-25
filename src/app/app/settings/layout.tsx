import { PageHeader } from "@/components/app/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({ children }: LayoutProps<"/app/settings">) {
  return (
    <>
      <PageHeader title="Settings" description="Your business, services, team and preferences." />
      <SettingsNav />
      {children}
    </>
  );
}
