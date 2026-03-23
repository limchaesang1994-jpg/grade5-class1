"use client";

import { useState, useEffect } from "react";
import styles from "./radio.module.css";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { Radio, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function RadioPage() {
  const { user } = useAuth();
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
        author: user?.displayName || user?.email?.split('@')[0] || "익명",
        createdAt: Timestamp.now(),
      });
      toast.success("신청곡이 등록되었습니다! 🎵");
      setRadioInput("");
    } catch (error) {
      toast.error("신청곡 등록에 실패했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("정말 이 신청곡을 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, "radio", id));
        toast.success("삭제되었습니다.");
      } catch (error) {
        toast.error("삭제 실패");
      }
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
              placeholder="[곡 제목 / 가수]를 입력해주세요"
              required
            />
            <button type="submit" className={styles.radioSubmitBtn}>신청하기</button>
          </form>

          <div className={styles.radioList}>
            {radioRequests.length > 0 ? (
              radioRequests.map((req) => (
                <div key={req.id} className={styles.radioItem}>
                  <div className={styles.radioContent}>
                    <span className={styles.radioText}>{req.content}</span>
                    <span className={styles.radioAuthor}>- {req.author} 친구</span>
                  </div>
                  {isTeacher && (
                    <button
                      onClick={() => handleDelete(req.id)}
                      className={styles.deleteRadioBtn}
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
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
