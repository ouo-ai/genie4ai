"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AccountData } from "@/lib/generation-types";
const Context = createContext<{
  account: AccountData | null;
  refresh: () => Promise<void>;
  loading: boolean;
}>({ account: null, refresh: async () => {}, loading: true });
export async function api(path: string, body?: unknown) {
  const response = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Please try again.");
  return data;
}
export function SiteProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AccountData | null>(null),
    [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      setAccount(await api("/api/account"));
    } catch {
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return (
    <Context.Provider value={{ account, refresh, loading }}>
      {children}
    </Context.Provider>
  );
}
export const useAccount = () => useContext(Context);
