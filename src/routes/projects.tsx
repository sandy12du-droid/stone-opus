import { createFileRoute } from "@tanstack/react-router";
import { FolderKanban } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Arquane OS" },
      { name: "description", content: "Project delivery for stone installations." },
      { property: "og:title", content: "Projects — Arquane OS" },
      { property: "og:description", content: "Project delivery for stone installations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell title="Projects" subtitle="End-to-end project delivery from drawing to installation.">
      <ModulePlaceholder icon={FolderKanban} title="Project workspaces" description="Track drawings, milestones, materials, and site logistics." />
    </AppShell>
  ),
});
