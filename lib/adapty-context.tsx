import React, { createContext, useContext, useEffect, useState } from "react";
import { adapty, AdaptyProfile } from "react-native-adapty";
import { Platform } from "react-native";

// Placeholder key - User should replace this in Adapty Dashboard
const ADAPTY_PUBLIC_KEY = "public_live_u88iet3j.DhhsB7415b17zPI1j0GL";

interface AdaptyContextType {
  profile: AdaptyProfile | null;
  isLoading: boolean;
  isPremium: boolean;
  syncProfile: () => Promise<void>;
}

const AdaptyContext = createContext<AdaptyContextType | undefined>(undefined);

export function AdaptyProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<AdaptyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncProfile = async () => {
    try {
      const p = await adapty.getProfile();
      setProfile(p);
    } catch (error) {
      console.error("[Adapty] Failed to sync profile:", error);
    }
  };

  useEffect(() => {
    const initAdapty = async () => {
      try {
        // Activate SDK
        await adapty.activate(ADAPTY_PUBLIC_KEY);

        // Initial profile sync
        await syncProfile();
      } catch (error) {
        console.error("[Adapty] Initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAdapty();
  }, []);

  // Determine premium status based on access levels (adjust key as needed)
  const isPremium = profile?.accessLevels?.premium?.isActive ?? false;

  return (
    <AdaptyContext.Provider value={{ profile, isLoading, isPremium, syncProfile }}>
      {children}
    </AdaptyContext.Provider>
  );
}

export function useAdapty() {
  const context = useContext(AdaptyContext);
  if (context === undefined) {
    throw new Error("useAdapty must be used within an AdaptyProvider");
  }
  return context;
}
