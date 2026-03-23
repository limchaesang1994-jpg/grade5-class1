"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "./Navbar.module.css";
import { GraduationCap, Send, MessageCircle, LogOut, Radio } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    if (!user) return null;

    return (
        <nav className={styles.navbar}>
            <Link href="/" className={styles.logo}>
                <GraduationCap className={styles.logoIcon} />
                <span>5-1 Class</span>
            </Link>
            <div className={styles.navLinks}>

                <Link href="/assignments" className={`${styles.navItem} ${pathname === "/assignments" ? styles.active : ""}`}>
                    <Send size={18} />
                    <span>과제 제출</span>
                </Link>
                <Link href="/radio" className={`${styles.navItem} ${pathname === "/radio" ? styles.active : ""}`}>
                    <Radio size={18} />
                    <span>신청곡</span>
                </Link>
                <Link href="/chat" className={`${styles.navItem} ${pathname === "/chat" ? styles.active : ""}`}>
                    <MessageCircle size={18} />
                    <span>오픈채팅</span>
                </Link>
                <div className={styles.separator} />
                <div className={styles.userInfo}>
                    <span className={styles.userName}>{user.displayName || user.email?.split('@')[0]} 친구</span>
                    <button onClick={logout} className={styles.logoutBtn}>
                        <LogOut size={18} />
                        <span>로그아웃</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
