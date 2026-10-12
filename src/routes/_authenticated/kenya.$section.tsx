import { createFileRoute, notFound } from "@tanstack/react-router";
import { KenyaWorkspace } from "@/components/kenya/KenyaWorkspace";
import { isKenyaSection, kenyaSections } from "@/lib/kenya-erp";

export const Route = createFileRoute("/_authenticated/kenya/$section")({
  beforeLoad: ({ params }) => { if (!isKenyaSection(params.section)) throw notFound(); },
  head: ({ params }) => {
    const name = isKenyaSection(params.section) ? kenyaSections[params.section] : "Kenya Accounting";
    const title = `${name} · Kenya — Arquane OS`;
    const description = `${name} for Arquane Surfaces Kenya Limited, with company-scoped records and Kenyan shilling accounting.`;
    return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
  },
  component: KenyaPage,
});
function KenyaPage() {
  const { section } = Route.useParams();
  if (!isKenyaSection(section)) return null;
  return <KenyaWorkspace section={section} />;
}