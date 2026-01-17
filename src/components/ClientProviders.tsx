"use client";

import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "./Navbar";

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <Toaster position="top-center" reverseOrder={false} />
            <Navbar />
            {children}
        </AuthProvider>
    );
}
