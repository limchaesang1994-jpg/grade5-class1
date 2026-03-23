"use client";

import { useState, useEffect } from "react";
import styles from "./radio.module.css";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp, deleteDoc, doc, setDoc } from "firebase/firestore";
import { Radio, Trash2, User as UserIcon, Ban } from "lucide-react";
import { toast } from "react-hot-toast";

export default function RadioPage() {
  const { user, isBanned } = useAuth();
  const [radioRequests, setRadioRequests] = useState<any[]>([]);
  const [radioInput, setRadioInput] = useState("");

  const isTeacher = user?.email?.toLowerCase() === "chaesang@korea.kr";

  useEffect(() => {
    const qRadio = query(collection(db, "radio"), orderBy("createdAt", "desc"));
    const unsubscribeRadio = onSnapshot(qRadio, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRadioRequests(data);
    });

    return () => unsubscribeRadio();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!radioInput.trim()) return;

    try {
      await addDoc(collection(db, "radio"), {
        content: radioInput.trim(),
        userId: user?.uid || null,
        author: user?.email?.toLowerCase() === "chaesang@korea.kr" ? "선생님" : (user?.displayName || user?.email?.split('@')[0] || "익명"),
        userPhoto: user?.photoURL || null,
        createdAt: Timestamp.now(),
      });
      toast.success("신청곡이 등록되었습니다! 🎵");
      setRadioInput("");
    } catch (error) {
      console.error("Radio Request Error:", error);
      toast.error("신청곡 등록에 실패했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 이 신청곡을 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "radio", id));
      toast.success("신청곡이 삭제되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error("삭제 실패");
    }
  };

  const handleBanUser = async (targetUserId: string, targetUserName: string) => {
      if (!targetUserId) {
          toast.error("⚠️ 시스템 업데이트 이전의 글은 작성자를 정지할 수 없습니다.");
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

  if (!user) return null;

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.iconCircle}>
            <Radio size={32} color="#9333ea" />
          </div>
          <h1 className={styles.title}>5-1 라디오 신청곡</h1>
        </div>
        
        <p className={styles.description}>
          듣고 싶은 노래가 있나요? 곡 제목과 가수를 알려주세요!
        </p>

        <section className={styles.radioSection}>
          <form className={styles.radioForm} onSubmit={handleSubmit}>
            <input
              type="text"
              className={styles.radioInput}
              value={radioInput}
              onChange={(e) => setRadioInput(e.target.value)}
              placeholder={isBanned ? "⚠️ 이용 규칙 위반으로 글쓰기가 제한되었습니다." : "🎵 듣고 싶은 노래 제목과 가수를 적어주세요!"}
              disabled={isBanned}
              required
            />
            <button type="submit" className={styles.radioSubmitBtn} disabled={!radioInput.trim() || isBanned}>신청하기</button>
          </form>

          <div className={styles.radioList}>
            {radioRequests.length > 0 ? (
              radioRequests.map((req) => (
                <div key={req.id} className={styles.radioItem}>
                  <div className={styles.radioItemLeft}>
                    <div className={styles.radioProfile}>
                      {req.userPhoto ? (
                        <img src={req.userPhoto} alt="profile" />
                      ) : (
                        <div className={styles.avatarFallback}><UserIcon size={20} /></div>
                      )}
                    </div>
                    <div className={styles.radioContent}>
                      <span className={styles.radioText}>{req.content}</span>
                      <span className={styles.radioAuthor}>
                        - {req.author === "선생님" || req.author === "chaesang" ? "임채상 선생님" : `${req.author} 친구`}
                      </span>
                    </div>
                  </div>
                  {isTeacher && (
                    <div className={styles.adminActions}>
                      <button
                        onClick={() => handleBanUser(req.userId, req.author)}
                        className={styles.banBtn}
                      >
                        <Ban size={14} /> 작성자 정지
                      </button>
                      <button
                        onClick={() => handleDelete(req.id)}
                        className={styles.deleteBtn}
                      >
                        <Trash2 size={14} /> 게시물 삭제
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className={styles.emptyText}>아직 신청곡이 없어요. 첫 번째로 신청해보세요!</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
