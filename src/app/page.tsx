"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, limit, addDoc, Timestamp } from "firebase/firestore";
import { Megaphone, Utensils, BookOpen, GraduationCap, Edit3, X } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Home() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [lunch, setLunch] = useState<any>(null);
  const [learning, setLearning] = useState<any[]>([]);

  // Admin states
  const isTeacher = user?.email === "chaesang@korea.kr";
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isLearningModalOpen, setIsLearningModalOpen] = useState(false);
  const [noticeInput, setNoticeInput] = useState("");
  const [learningInput, setLearningInput] = useState({ period: 1, subject: "" });

  useEffect(() => {
    // Real-time listener for Notices
    const qNotice = query(collection(db, "notices"), orderBy("createdAt", "desc"), limit(3));
    const unsubscribeNotice = onSnapshot(qNotice, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotices(data);
    });

    // NEIS API for Lunch
    const fetchLunch = async () => {
      const officeCode = process.env.NEXT_PUBLIC_ATPT_OFCDC_SC_CODE;
      const schoolCode = process.env.NEXT_PUBLIC_SD_SCHUL_CODE;
      const apiKey = process.env.NEXT_PUBLIC_NEIS_API_KEY;

      if (!officeCode || !schoolCode) {
        setLunch({ menu: ["설정에서 학교 코드를 입력해주세요!"], isEmpty: false });
        return;
      }

      const today = new Date();
      const yyyymmdd = today.toISOString().split('T')[0].replace(/-/g, '');
      const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${apiKey}&Type=json&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&MLSV_YMD=${yyyymmdd}`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.mealServiceDietInfo) {
          const menuRaw = data.mealServiceDietInfo[1].row[0].DDISH_NM;
          const menuClean = menuRaw
            .replace(/\([^)]*\)/g, '')
            .split('<br/>')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);

          setLunch({ menu: menuClean, isEmpty: false });
        } else {
          setLunch({
            menu: ["오늘은 급식이 없어요. 가족과 즐거운 시간 보내세요!"],
            isEmpty: true
          });
        }
      } catch (error) {
        console.error("Lunch API Error:", error);
        setLunch({ menu: ["급식 정보를 가져오지 못했어요 ㅠ_ㅠ"], isEmpty: false });
      }
    };

    fetchLunch();

    // Real-time listener for Learning
    const qLearning = query(collection(db, "learning"), orderBy("period", "asc"));
    const unsubscribeLearning = onSnapshot(qLearning, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLearning(data);
    });

    return () => {
      unsubscribeNotice();
      unsubscribeLearning();
    };
  }, []);

  const handleSaveNotice = async () => {
    if (!noticeInput.trim()) return;
    try {
      await addDoc(collection(db, "notices"), {
        content: noticeInput,
        createdAt: Timestamp.now(),
      });
      setNoticeInput("");
      setIsNoticeModalOpen(false);
      toast.success("알림장이 등록되었습니다! 📢");
    } catch (e) {
      toast.error("저장에 실패했습니다.");
    }
  };

  const handleSaveLearning = async () => {
    if (!learningInput.subject.trim()) return;
    try {
      await addDoc(collection(db, "learning"), {
        period: Number(learningInput.period),
        subject: learningInput.subject,
        createdAt: Timestamp.now(),
      });
      setLearningInput({ period: 1, subject: "" });
      setIsLearningModalOpen(false);
      toast.success("오늘의 학습이 업데이트되었습니다! 📚");
    } catch (e) {
      toast.error("저장에 실패했습니다.");
    }
  };


  return (
    <div className={styles.container}>
      <header className={styles.banner}>
        <div className={styles.bannerContent}>
          <h1 className={styles.title}>성장하는 5학년 1반</h1>
          <p className={styles.subtitle}>우리들의 즐거운 학교 생활 이야기</p>
        </div>
        <div className={styles.bannerImageWrapper}>
          <Image
            src="/banner.png"
            alt="School Life illustration"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
      </header>

      {/* Feature Cards */}
      <main className={styles.main} id="notices">
        <div className={styles.cardGrid}>
          {/* Notification Card */}
          <div className={`${styles.card} ${styles.notice}`}>
            <div className={styles.cardHeader}>
              <div className={`${styles.iconCircle} ${styles.blue}`}>
                <Megaphone size={24} color="#3b82f6" />
              </div>
              <h2>알림장</h2>
              {isTeacher && (
                <button onClick={() => setIsNoticeModalOpen(true)} className={styles.adminBtn}>
                  <Edit3 size={16} /> 글쓰기
                </button>
              )}
            </div>
            <ul className={styles.list}>
              {notices.length > 0 ? (
                notices.map((n) => <li key={n.id}>{n.content}</li>)
              ) : (
                <p className={styles.emptyText}>등록된 소식이 없어요.</p>
              )}
            </ul>
            <button className={styles.moreBtn}>더 보기</button>
          </div>

          {/* Lunch Card */}
          <div className={`${styles.card} ${styles.lunch}`}>
            <div className={styles.cardHeader}>
              <div className={`${styles.iconCircle} ${styles.pink}`}>
                <Utensils size={24} color="#f43f5e" />
              </div>
              <h2>오늘의 급식</h2>
            </div>
            <div className={`${styles.lunchMenu} ${lunch?.isEmpty ? styles.lunchEmpty : ''}`}>
              {lunch?.menu.map((item: string, i: number) => (
                <p key={i}>{item}</p>
              ))}
            </div>
            <button className={styles.moreBtn}>주간 식단표</button>
          </div>


          {/* Today's Learning Card */}
          <div className={`${styles.card} ${styles.learning}`}>
            <div className={styles.cardHeader}>
              <div className={`${styles.iconCircle} ${styles.yellow}`}>
                <BookOpen size={24} color="#eab308" />
              </div>
              <h2>오늘의 학습</h2>
              {isTeacher && (
                <button onClick={() => setIsLearningModalOpen(true)} className={styles.adminBtn}>
                  <Edit3 size={16} /> 글쓰기
                </button>
              )}
            </div>
            <div className={styles.learningSteps}>
              {learning.length > 0 ? (
                learning.map((step, i) => (
                  <div key={i} className={styles.step}>
                    <span className={styles.stepNum}>{step.period}교시</span>
                    <p>{step.subject}</p>
                  </div>
                ))
              ) : (
                <p className={styles.emptyText}>학습 일정이 없어요.</p>
              )}
            </div>
            <button className={styles.moreBtn}>학습 안내서</button>
          </div>
        </div>
      </main>

      {/* Admin Modals */}
      {isNoticeModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>새 알림장 등록</h3>
              <button onClick={() => setIsNoticeModalOpen(false)}><X size={20} /></button>
            </div>
            <textarea
              value={noticeInput}
              onChange={(e) => setNoticeInput(e.target.value)}
              placeholder="친구들에게 전할 내용을 입력하세요."
              rows={5}
            />
            <button className={styles.saveBtn} onClick={handleSaveNotice}>저장하기</button>
          </div>
        </div>
      )}

      {isLearningModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>오늘의 학습 추가</h3>
              <button onClick={() => setIsLearningModalOpen(false)}><X size={20} /></button>
            </div>
            <div className={styles.inputGroup}>
              <label>교시</label>
              <input
                type="number"
                value={learningInput.period}
                onChange={(e) => setLearningInput({ ...learningInput, period: Number(e.target.value) })}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>과목/내용</label>
              <input
                type="text"
                value={learningInput.subject}
                onChange={(e) => setLearningInput({ ...learningInput, subject: e.target.value })}
                placeholder="예: 국어 - 비유하는 표현"
              />
            </div>
            <button className={styles.saveBtn} onClick={handleSaveLearning}>저장하기</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 성장하는 5학년 1반. All rights reserved.</p>
      </footer>
    </div>
  );
}


