import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiClientError } from '../api/apiClient';
import { getAuthenticatedUser } from '../api/authApi';
import { erpApiService, type AuthenticatedUser } from '../services/ErpApiService';
import { extractUserRights, hasAllRights as hasAllRightsHelper, hasAnyRight as hasAnyRightHelper, hasRight as hasRightHelper } from '../permissions/permissions';

type AuthContextValue = {
  user: AuthenticatedUser | null;
  rights: Set<string>;
  permissions: string[];
  loading: boolean;
  error: string;
  refreshUser: () => Promise<void>;
  setAuthenticatedUser: (user: AuthenticatedUser | null) => void;
  hasRight: (rightName: string) => boolean;
  hasAnyRight: (rightNames: string[]) => boolean;
  hasAllRights: (rightNames: string[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(Boolean(erpApiService.getToken()));
  const [error, setError] = useState('');

  const rights = useMemo(() => extractUserRights(user as Parameters<typeof extractUserRights>[0]), [user]);
  const permissions = useMemo(() => Array.from(rights).sort(), [rights]);

  const refreshUser = useCallback(async () => {
    if (!erpApiService.getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const currentUser = await getAuthenticatedUser();
      setUser(currentUser);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        setUser(null);
        navigate('/login', { replace: true, state: { from: location.pathname } });
        return;
      }
      if (err instanceof ApiClientError && err.status === 403) {
        navigate('/unauthorized', { replace: true });
        return;
      }
      setError(err instanceof Error ? err.message : 'Nu am putut incarca utilizatorul autentificat.');
    } finally {
      setLoading(false);
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    rights,
    permissions,
    loading,
    error,
    refreshUser,
    setAuthenticatedUser: setUser,
    hasRight: (rightName) => hasRightHelper(rights, rightName),
    hasAnyRight: (rightNames) => hasAnyRightHelper(rights, rightNames),
    hasAllRights: (rightNames) => hasAllRightsHelper(rights, rightNames),
  }), [error, loading, permissions, refreshUser, rights, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
