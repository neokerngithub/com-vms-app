import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Avatars live in a private bucket — resolve a short-lived signed URL for display.
 * Signed URLs are cached in-module so switching tabs never re-fetches or flickers.
 */
const CACHE = new Map<string, { url: string; expires: number }>();
const PENDING = new Map<string, Promise<string | null>>();
const TTL_MS = 55 * 60 * 1000;

function cached(path: string) {
  const hit = CACHE.get(path);
  if (hit && hit.expires > Date.now()) return hit.url;
  return null;
}

async function resolve(path: string): Promise<string | null> {
  const hit = cached(path);
  if (hit) return hit;
  const inflight = PENDING.get(path);
  if (inflight) return inflight;
  const p = supabase.storage
    .from("avatars")
    .createSignedUrl(path, 60 * 60)
    .then(({ data }) => {
      const url = data?.signedUrl ?? null;
      if (url) CACHE.set(path, { url, expires: Date.now() + TTL_MS });
      PENDING.delete(path);
      return url;
    })
    .catch(() => {
      PENDING.delete(path);
      return null;
    });
  PENDING.set(path, p);
  return p;
}

export function useAvatarUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(() => (path ? cached(path) : null));

  useEffect(() => {
    let active = true;
    if (!path) {
      setUrl(null);
      return;
    }
    const hit = cached(path);
    if (hit) {
      setUrl(hit);
      return;
    }
    void resolve(path).then((next) => {
      if (active) setUrl(next);
    });
    return () => {
      active = false;
    };
  }, [path]);

  return url;
}

export function initialsOf(name?: string | null, email?: string | null) {
  const source = (name ?? email ?? "V").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}
