import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Arquane OS — Company Workspace" },
    { name: "description", content: "Access your Arquane company workspace for stone inventory, sales and operations." },
    { property: "og:title", content: "Arquane OS — Company Workspace" },
    { property: "og:description", content: "Your company workspace for natural stone sales, inventory and operations." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    throw redirect({ to: "/workspace" });
  },
});
