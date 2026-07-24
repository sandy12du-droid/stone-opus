import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "AI Command Center — Arquane OS" },
      { name: "description", content: "Conversational operations for the global stone industry." },
      { property: "og:title", content: "AI Command Center — Arquane OS" },
      { property: "og:description", content: "Conversational operations for the global stone industry." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell
      title="AI Command Center"
      subtitle="A conversational operating layer over CRM, inventory, quotations, and production."
    >
      <ModulePlaceholder
        icon={Sparkles}
        title="Conversation surface reserved"
        description="A ChatGPT-style workspace with suggested prompts, workflow tools, and agent execution hooks. AI logic intentionally deferred — architecture is placeholder-ready."
        bullets={[
          "Message input pinned to bottom",
          "Conversation history with pinnable threads",
          "Suggested prompts across modules",
          "Agent execution slots for future automation",
        ]}
      />
    </AppShell>
  ),
});
