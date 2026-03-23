"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "./Navbar.module.css";
import { GraduationCap, Send, MessageCircle, LogOut, Radio, User as UserIcon, X, ShieldAlert, CheckCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "react-hot-toast";

export default function Navbar() {
    const { user, logout, updateUserProfile } = useAuth();
    const pathname = usePathname();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [bannedUsers, setBannedUsers] = useState<any[]>([]);

    useEffect(() => {
        if (isAdminModalOpen) {
            const unsub = onSnapshot(collection(db, "bannedUsers"), (snapshot) => {
                setBannedUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            });
            return () => unsub();
        }
    }, [isAdminModalOpen]);

    const handleUnban = async (userId: string) => {
        if (!confirm("해당 학생의 정지를 해제하시겠습니까?")) return;
        try {
            await deleteDoc(doc(db, "bannedUsers", userId));
            toast.success("정지가 해제되었습니다.");
        } catch (e) {
            toast.error("해제 실패");
        }
    };

    const animalEmojis = [
        "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨",
        "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🦍", "🦧", "🐥", "🦉",
        "🐺", "🐗", "🦝", "🦇", "🐙", "🦑", "🦀", "🐡", "🦥", "🦦",
        "🐝", "🐛", "🦋", "🐞", "🕷️", "🪲", "🦠", "🐍", "🦭", "🦚",
        "🐲", "🙈", "🙉", "🙊", "😺", "😸", "😹", "😻", "😼", "😽",
        "🙀", "😿", "😾", "🧸", "⛄", "👽", "👾", "🤖", "👻", "🤡"
    ];

    const pastelColors = [
        "fca5a5", "fdba74", "fcd34d", "fef08a", "d9f99d", "bbf7d0", 
        "86efac", "5eead4", "7dd3fc", "93c5fd", "a5b4fc", "c4b5fd", 
        "d8b4fe", "f0abfc", "f9a8d4", "fda4af"
    ];

    const generateAvatarUrl = (emoji: string, color: string) => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#${color}"/><text x="50" y="50" font-size="60" text-anchor="middle" dy=".35em">${emoji}</text></svg>`;
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    };

    const isTeacher = user?.email?.toLowerCase() === "chaesang@korea.kr";
    
    const AVATARS = isTeacher 
      ? [
          generateAvatarUrl("👑", "fef08a"),
          generateAvatarUrl("👨‍🏫", "bfdbfe"),
          generateAvatarUrl("👩‍🏫", "fbcfe8"),
          generateAvatarUrl("🎓", "fed7aa"),
          generateAvatarUrl("🌟", "fef08a"),
          ...animalEmojis.map((emoji, idx) => generateAvatarUrl(emoji, pastelColors[idx % pastelColors.length]))
        ]
      : animalEmojis.map((emoji, idx) => generateAvatarUrl(emoji, pastelColors[idx % pastelColors.length]));

    const handleSelectAvatar = async (url: string) => {
        if (updateUserProfile) {
            await updateUserProfile(url);
            setIsProfileModalOpen(false);
        }
    };

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
                    {isTeacher && (
                        <button onClick={() => setIsAdminModalOpen(true)} className={styles.adminNavBtn} title="학생 관리">
                            <ShieldAlert size={18} />
                            <span className={styles.btnText}>학생 관리</span>
                        </button>
                    )}
                    <div className={styles.profileBtn} onClick={() => setIsProfileModalOpen(true)} title="프로필 이미지 변경">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="profile" className={styles.profileImg} />
                        ) : (
                            <div className={styles.profilePlaceholder}>
                                <UserIcon size={20} />
                            </div>
                        )}
                    </div>
                    <span className={styles.userName}>
                        {user.email?.toLowerCase() === "chaesang@korea.kr" ? "임채상 선생님" : `${user.displayName || user.email?.split('@')[0]} 친구`}
                    </span>
                    <button onClick={logout} className={styles.logoutBtn}>
                        <LogOut size={18} />
                        <span>로그아웃</span>
                    </button>
                </div>
            </div>

            {isProfileModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsProfileModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>나만의 프로필 이미지 고르기</h3>
                            <button onClick={() => setIsProfileModalOpen(false)}><X size={24} /></button>
                        </div>
                        <div className={styles.avatarGrid}>
                            {AVATARS.map((url, idx) => (
                                <img 
                                    key={idx} 
                                    src={url} 
                                    alt={`avatar-${idx}`} 
                                    className={`${styles.avatarOption} ${user.photoURL === url ? styles.selectedAvatar : ''}`}
                                    onClick={() => handleSelectAvatar(url)}
                                />
                            ))}
                        </div>
                        <p className={styles.modalTip}>마음에 드는 프로필을 클릭해보세요! 💕</p>
                    </div>
                </div>
            )}

            {isAdminModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsAdminModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>⚙️ 학생 관리 (정지 목록)</h3>
                            <button onClick={() => setIsAdminModalOpen(false)}><X size={24} /></button>
                        </div>
                        <div className={styles.bannedList}>
                            {bannedUsers.length === 0 ? (
                                <p className={styles.emptyText}>현재 정지된 학생이 없습니다.</p>
                            ) : (
                                bannedUsers.map(bUser => (
                                    <div key={bUser.id} className={styles.bannedItem}>
                                        <div className={styles.bannedInfo}>
                                            <span className={styles.bannedName}>{bUser.userName}</span>
                                            <span className={styles.bannedDate}>정지일: {bUser.bannedAt?.toDate().toLocaleDateString()}</span>
                                        </div>
                                        <button onClick={() => handleUnban(bUser.id)} className={styles.unbanBtn}>
                                            <CheckCircle size={16} />
                                            <span>정지 해제</span>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
