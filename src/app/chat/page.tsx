"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, limit, deleteDoc, doc, setDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import styles from "./chat.module.css";
import { Send, Smile, User as UserIcon, ChevronLeft, Trash2, Info, Ban } from "lucide-react";
import Link from "next/link";

export default function ChatPage() {
    const { user, isBanned } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const q = query(
            collection(db, "chats"),
            orderBy("createdAt", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(data.reverse());
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newMessage.trim()) return;

        try {
            await addDoc(collection(db, "chats"), {
                text: newMessage,
                userId: user.uid,
                userName: user.email?.toLowerCase() === "chaesang@korea.kr" ? "선생님" : (user.displayName || user.email?.split("@")[0] || "익명"),
                userPhoto: user.photoURL,
                createdAt: Timestamp.now(),
            });
            setNewMessage("");
        } catch (error) {
            console.error(error);
            toast.error("메시지 전송에 실패했습니다.");
        }
    };

    const handleDeleteMessage = async (msgId: string) => {
        if (!confirm("이 메시지를 삭제하시겠습니까?")) return;
        try {
            await deleteDoc(doc(db, "chats", msgId));
            toast.success("메시지가 삭제되었습니다.");
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("삭제 실패");
        }
    };

    const handleBanUser = async (targetUserId: string, targetUserName: string) => {
        if (!targetUserId) {
            toast.error("알 수 없는 사용자입니다.");
            return;
        }
        if (!confirm(`${targetUserName} 학생의 글쓰기 권한을 정말 정지하시겠습니까?`)) return;
        try {
            await setDoc(doc(db, "bannedUsers", targetUserId), {
                userName: targetUserName,
                bannedAt: Timestamp.now()
            });
            toast.success(`${targetUserName} 학생이 정지되었습니다.`);
        } catch (error) {
            console.error(error);
            toast.error("정지 실패");
        }
    };

    const isTeacher = user?.email?.toLowerCase() === "chaesang@korea.kr";

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/" className={styles.backBtn}>
                    <ChevronLeft size={20} />
                    홈으로 가기
                </Link>
                <h1>💬 5-1 오픈채팅방</h1>
            </div>

            <div className={styles.stickyNotice}>
                <Info size={18} className={styles.noticeIcon} />
                <span>
                    내가 사용하는 말은 나의 이미지를 만듭니다. 언어 예절을 지키며 대화해요.<br />
                    <span style={{ color: '#dc2626', fontWeight: 'bold' }}>🚨 온라인 예절을 지키지 않을 경우, 사용이 제한될 수 있습니다.</span>
                </span>
            </div>

            <div className={styles.chatWrapper}>
                <div className={styles.messageList} ref={scrollRef}>
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`${styles.messageItem} ${msg.userId === user?.uid ? styles.myMessage : ""}`}
                        >
                            <div className={styles.profile}>
                                {msg.userPhoto ? (
                                    <img src={msg.userPhoto} alt="profile" />
                                ) : (
                                    <div className={styles.avatarPlaceholder}>
                                        <UserIcon size={20} />
                                    </div>
                                )}
                            </div>
                            <div className={styles.content}>
                                <span className={styles.userName}>
                                  {msg.userName === "선생님" || msg.userName === "chaesang" ? "임채상 선생님" : `${msg.userName} 친구`}
                                </span>
                                <div className={styles.bubble}>
                                    <p>{msg.text}</p>
                                    <span className={styles.time}>
                                        {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isTeacher && msg.userId && (
                                        <div className={styles.adminActions}>
                                            <button
                                                onClick={() => handleBanUser(msg.userId, msg.userName)}
                                                className={styles.msgBanBtn}
                                                title="작성자 정지"
                                            >
                                                <Ban size={12} /> <span>정지</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMessage(msg.id)}
                                                className={styles.msgDeleteBtn}
                                                title="메시지 삭제"
                                            >
                                                <Trash2 size={12} /> <span>삭제</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSendMessage} className={styles.inputArea}>
                    <button type="button" className={styles.emojiBtn}>
                        <Smile size={24} />
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isBanned ? "⚠️ 홈페이지 규칙 위반으로 글쓰기가 제한되었습니다." : "친구들에게 메시지를 보내보세요!"}
                        disabled={isBanned}
                        required
                    />
                    <button type="submit" className={styles.sendBtn} disabled={!newMessage.trim() || isBanned}>
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}
