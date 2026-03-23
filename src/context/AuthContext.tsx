"use strict";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isBanned: boolean;
    logout: () => Promise<void>;
    updateUserProfile?: (photoURL: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isBanned: false,
    logout: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isBanned, setIsBanned] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        let unsubBan: () => void;
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                unsubBan = onSnapshot(doc(db, "bannedUsers", currentUser.uid), (docSnap) => {
                    setIsBanned(docSnap.exists());
                });
            } else {
                setIsBanned(false);
                if (unsubBan) unsubBan();
            }
            setLoading(false);

            // Handle protected routes
            if (!loading) {
                if (!currentUser && pathname !== "/login") {
                    router.push("/login");
                } else if (currentUser && pathname === "/login") {
                    router.push("/");
                }
            }
        });

        return () => {
            unsubscribe();
            if (unsubBan) unsubBan();
        };
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
        <AuthContext.Provider value={{ user, loading, isBanned, logout, updateUserProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
