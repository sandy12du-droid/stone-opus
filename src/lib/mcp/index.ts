import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchInventory from "./tools/search-inventory";
import getProductAvailability from "./tools/get-product-availability";
import listQuotations from "./tools/list-quotations";
import getQuotation from "./tools/get-quotation";
import listProjects from "./tools/list-projects";
import trackShipments from "./tools/track-shipments";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "arquane-stone-os",
  title: "Arquane Stone OS",
  version: "0.1.0",
  instructions:
    "Tools for Arquane OS, an operating system for the natural stone and quartz industry. Use search_inventory and get_product_availability for stone products and slab stock, list_quotations and get_quotation for commercial documents, list_projects for fabrication/supply projects, and track_shipments for logistics status. All tools are read-only and act as the signed-in Arquane user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchInventory,
    getProductAvailability,
    listQuotations,
    getQuotation,
    listProjects,
    trackShipments,
  ],
});
