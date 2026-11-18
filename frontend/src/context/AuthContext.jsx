import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            // Dọn sạch refresh token cũ nếu còn sót lại từ phiên bản lưu localStorage trước đây
            localStorage.removeItem('blocktickets_refresh_token');
            const stored = localStorage.getItem('blocktickets_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const [token, setToken] = useState(() => {
        return localStorage.getItem('blocktickets_token') || null;
    });

    const login = useCallback((userData, accessToken) => {
        setUser(userData);
        setToken(accessToken);
        localStorage.setItem('blocktickets_user', JSON.stringify(userData));
        localStorage.setItem('blocktickets_token', accessToken);
        localStorage.removeItem('blocktickets_refresh_token');
    }, []);

    const logout = useCallback(() => {
        authAPI.logout().catch(() => {});
        setUser(null);
        setToken(null);
        localStorage.removeItem('blocktickets_user');
        localStorage.removeItem('blocktickets_token');
        localStorage.removeItem('blocktickets_refresh_token');
    }, []);

    useEffect(() => {
        const handleAuthExpired = () => {
            setUser(null);
            setToken(null);
        };
        window.addEventListener('blocktickets:auth-expired', handleAuthExpired);
        return () => window.removeEventListener('blocktickets:auth-expired', handleAuthExpired);
    }, []);

    const updateUser = useCallback((updatedFields) => {
        setUser((prev) => {
            const updated = { ...prev, ...updatedFields };
            localStorage.setItem('blocktickets_user', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const isAuthenticated = Boolean(user && token);

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
