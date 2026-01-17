"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, limit } from "firebase/firestore";
import { toast } from "react-hot-toast";
import styles from "./chat.module.css";
import { Send, Smile, User as UserIcon, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function ChatPage() {
    const { user } = useAuth();
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
                userName: user.displayName || user.email?.split("@")[0],
                userPhoto: user.photoURL,
                createdAt: Timestamp.now(),
            });
            setNewMessage("");
        } catch (error) {
            console.error(error);
            toast.error("메시지 전송에 실패했습니다.");
        }
    };

    return (
        <div className={styles.container}>
            <Link href="/" className={styles.backBtn}>
                <ChevronLeft size={20} />
                <span>홈으로 가기</span>
            </Link>

            <header className={styles.header}>
                <h1>💬 우리들의 수다방</h1>
                <p>5학년 1반 친구들의 실시간 오픈채팅공간입니다.</p>
            </header>

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
                                <span className={styles.userName}>{msg.userName}</span>
                                <div className={styles.bubble}>
                                    <p>{msg.text}</p>
                                    <span className={styles.time}>
                                        {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
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
                        placeholder="친구들에게 메시지를 보내보세요!"
                        required
                    />
                    <button type="submit" className={styles.sendBtn} disabled={!newMessage.trim()}>
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}
