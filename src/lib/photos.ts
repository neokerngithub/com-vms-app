import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const PROPERTY_PHOTOS_BUCKET = "property-photos";

/**
 * Property photos live in a private bucket and are stored as object paths.
 * Legacy records may hold a plain http(s) URL — those pass straight through.
 */
export function usePhotoUrl(value: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(
    value && /^https?:\/\//i.test(value) ? value : null,
  );

  useEffect(() => {
    let active = true;
    if (!value) {
      setUrl(null);
      return;
    }
    if (/^https?:\/\//i.test(value)) {
      setUrl(value);
      return;
    }
    supabase.storage
      .from(PROPERTY_PHOTOS_BUCKET)
      .createSignedUrl(value, 60 * 60)
      .then(({ data }) => {
        if (active) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [value]);

  return url;
}
