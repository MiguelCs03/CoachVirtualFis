// src/auth/AuthProvider.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  authService,
  restoreTokensFromStorage,
  setAccessToken,
} from "../api/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Restaurar sesión al cargar (token + /usuarios/me/)
  useEffect(() => {
    let mounted = true;
    const { accessToken } = restoreTokensFromStorage();
    if (accessToken) setAccessToken(accessToken);

    (async () => {
      try {
        const me = await authService.me(); // ← trae is_superuser
        if (mounted) setUser(me || null);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setInitializing(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // Login: guarda tokens y LUEGO trae /me para tener is_superuser
  const signIn = async (email, password) => {
    await authService.login(email, password);   // guarda tokens
    const me = await authService.me();          // perfil con is_superuser
    setUser(me || null);
  };

  const signOut = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    initializing,
    // 🔹 Helpers de rol:
    isSuper: !!user?.is_superuser,
    hasRole: (r) => !!user && (user.role === r || user?.roles?.includes?.(r)),
    hasAnyRole: (...rs) => rs.some((r) => !!user && (user.role === r || user?.roles?.includes?.(r))),
    // auth actions
    signIn,
    signOut,
    setUser,
  }), [user, initializing]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
