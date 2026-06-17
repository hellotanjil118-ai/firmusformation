import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { ComingSoon } from "@/components/ComingSoon";
import { Megaphone } from "lucide-react";

export const Route = createFileRoute("/admin/marketing")({ component: Page });

function Page() {
  return (
    <AdminShell title="Marketing Center" subtitle="Campaigns · Funnels · Attribution">
      <ComingSoon
        icon={Megaphone}
        title="Marketing"
        description="Run and measure every channel from one place."
        features={[
          "Meta Ads & Google Ads",
          "SEO tracking",
          "Email marketing",
          "Social media",
          "Landing pages & funnels",
          "Lead & conversion tracking",
          "ROAS dashboards",
          "Mailchimp, Meta Pixel, GA, GTM integrations",
        ]}
      />
    </AdminShell>
  );
}
