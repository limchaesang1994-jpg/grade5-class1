"use strict";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    updateUserProfile?: (photoURL: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);

            // Handle protected routes
            if (!loading) {
                if (!user && pathname !== "/login") {
                    router.push("/login");
                } else if (user && pathname === "/login") {
                    router.push("/");
                }
            }
        });

        return () => unsubscribe();
    }, [loading, pathname, router]);

    const logout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    const updateUserProfile = async (photoURL: string) => {
        if (!user) return;
        await updateProfile(user, { photoURL });
        // Force local state update so it reflects instantly
        setUser(auth.currentUser ? { ...auth.currentUser } as User : null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, updateUserProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
