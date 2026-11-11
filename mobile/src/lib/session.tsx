import * as SecureStore from "expo-secure-store";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, call, type Me, type Session } from "./api";

const KEY = "slotback.session";

type State =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; session: Session; me: Me };

type Ctx = {
  state: State;
  signIn: (session: Session) => Promise<void>;
  signOut: (opts?: { tellServer?: boolean }) => Promise<void>;
};

const SessionContext = createContext<Ctx | null>(null);

/** Keeps the device token in the phone's secure storage and the signed-in member in memory. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: "loading" });

  const signIn = useCallback(async (session: Session) => {
    const me = await call<Me>(session, "/me");
    await SecureStore.setItemAsync(KEY, JSON.stringify(session));
    setState({ status: "signedIn", session, me });
  }, []);

  const signOut = useCallback(
    async ({ tellServer = true }: { tellServer?: boolean } = {}) => {
      if (tellServer && state.status === "signedIn") {
        await call(state.session, "/me", { method: "DELETE" }).catch(() => undefined);
      }
      await SecureStore.deleteItemAsync(KEY);
      setState({ status: "signedOut" });
    },
    [state],
  );

  useEffect(() => {
    (async () => {
      const saved = await SecureStore.getItemAsync(KEY);
      if (!saved) return setState({ status: "signedOut" });
      const session = JSON.parse(saved) as Session;
      try {
        const me = await call<Me>(session, "/me");
        setState({ status: "signedIn", session, me });
      } catch (err) {
        // Offline: stay signed out of the UI but keep the token, so it works when back online.
        if (err instanceof ApiError && err.status === 401) await SecureStore.deleteItemAsync(KEY);
        setState({ status: "signedOut" });
      }
    })();
  }, []);

  const value = useMemo(() => ({ state, signIn, signOut }), [state, signIn, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession outside SessionProvider");
  return ctx;
}

/** For screens behind sign-in. */
export function useSignedIn() {
  const { state, signOut } = useSession();
  if (state.status !== "signedIn") throw new Error("Screen rendered while signed out");
  return { session: state.session, me: state.me, signOut };
}
