import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchInventory from "./tools/search-inventory";
import getProductAvailability from "./tools/get-product-availability";
import listQuotations from "./tools/list-quotations";
import getQuotation from "./tools/get-quotation";
import listProjects from "./tools/list-projects";
import trackShipments from "./tools/track-shipments";
import createQuotation from "./tools/create-quotation";
import updateQuotation from "./tools/update-quotation";
import createProject from "./tools/create-project";
import updateShipmentStatus from "./tools/update-shipment-status";
import { withUsageLog } from "./logging";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "arquane-stone-os",
  title: "Arquane Stone OS",
  version: "0.2.0",
  instructions:
    "Tools for Arquane OS, an operating system for the natural stone and quartz industry. Read: search_inventory, get_product_availability, list_quotations, get_quotation, list_projects, track_shipments. Write (staff roles only): create_quotation, update_quotation, create_project, update_shipment_status. All tools act as the signed-in Arquane user and respect their permissions.",
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
    createQuotation,
    updateQuotation,
    createProject,
    updateShipmentStatus,
  ].map(withUsageLog),
});
