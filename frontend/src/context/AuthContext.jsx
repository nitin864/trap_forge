import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

const VALID_USER = "admin";
const VALID_PASS = "trapforge2025";
const STORAGE_KEY = "trapforge_auth";

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(
        () => localStorage.getItem(STORAGE_KEY) === "true"
    );

    const login = useCallback((username, password) => {
        if (username === VALID_USER && password === VALID_PASS) {
            localStorage.setItem(STORAGE_KEY, "true");
            setIsAuthenticated(true);
            return true;
        }
        return false;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setIsAuthenticated(false);
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
