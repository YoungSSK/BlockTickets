import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('blocktickets_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const [token, setToken] = useState(() => {
        return localStorage.getItem('blocktickets_token') || null;
    });

    const login = useCallback((userData, accessToken, refreshToken) => {
        setUser(userData);
        setToken(accessToken);
        localStorage.setItem('blocktickets_user', JSON.stringify(userData));
        localStorage.setItem('blocktickets_token', accessToken);
        if (refreshToken) {
            localStorage.setItem('blocktickets_refresh_token', refreshToken);
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('blocktickets_user');
        localStorage.removeItem('blocktickets_token');
        localStorage.removeItem('blocktickets_refresh_token');
    }, []);

    const isAuthenticated = Boolean(user && token);

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
