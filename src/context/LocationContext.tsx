import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { HQ_LOCATION, setActiveLocation, type AppLocation } from "@/lib/location";

const KEY = "arquane.location.v2";
type Ctx = { location: AppLocation; setLocation: (l: AppLocation) => void };
const LocationCtx = createContext<Ctx>({ location: HQ_LOCATION, setLocation: () => {} });

export function LocationProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [location, setLoc] = useState<AppLocation>(HQ_LOCATION);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const l = JSON.parse(raw) as AppLocation;
        setActiveLocation(l);
        setLoc(l);
        qc.invalidateQueries();
        router.invalidate();
      }
    } catch { /* ignore */ }
  }, []);

  const setLocation = (l: AppLocation) => {
    setActiveLocation(l);
    localStorage.setItem(KEY, JSON.stringify(l));
    setLoc(l);
    qc.invalidateQueries();
    router.invalidate();
  };

  return <LocationCtx.Provider value={{ location, setLocation }}>{children}</LocationCtx.Provider>;
}

export const useLocation = () => useContext(LocationCtx);
