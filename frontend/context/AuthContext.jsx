import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    // On page load, ask the backend whether the cookie we already have is valid.
    useEffect(() => {
        api.get('/auth/me')
            .then((payload) => setUser(payload.user))
            .catch(() => setUser(null))
            .finally(() => setIsCheckingSession(false));
    }, []);

    const signIn = useCallback(async (email, password) => {
        const payload = await api.post('/auth/login', { email, password });
        setUser(payload.user);
    }, []);

    const signOut = useCallback(async () => {
        await api.post('/auth/logout');
        setUser(null);
    }, [])

    return (
        <AuthContext.Provider value={{user, isCheckingSession, signIn, signOut}}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
    return context;
}