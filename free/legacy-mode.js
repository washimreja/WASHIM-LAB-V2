import { supabase } from "../supabase-client.js";

export const useStaticCatalog = (async () => {
  if (!supabase) return true;
  const { data, error } = await supabase.rpc("legacy_catalog_managed");
  if (error) {
    if (error.code === "PGRST202") return true;
    throw error;
  }
  return data !== true;
})();
