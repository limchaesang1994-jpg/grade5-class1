"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { Megaphone, Utensils, BookOpen, GraduationCap } from "lucide-react";

export default function Home() {
  const { user, logout } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [lunch, setLunch] = useState<any>(null);
  const [learning, setLearning] = useState<any[]>([]);

  useEffect(() => {
    // Real-time listener for Notices
    const qNotice = query(collection(db, "notices"), orderBy("createdAt", "desc"), limit(3));
    const unsubscribeNotice = onSnapshot(qNotice, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotices(data.length > 0 ? data : [
        { id: "1", content: "알림장 섹션입니다." },
        { id: "2", content: "우리 반 소식을 확인하세요!" }
      ]);
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
          // Clean menu: remove allergy info (numbers and dots in parentheses)
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
      const data = snapshot.docs.map(doc => doc.data());
      setLearning(data.length > 0 ? data : [
        { period: 1, subject: "국어: 비유하는 표현" },
        { period: 2, subject: "수학: 분수의 덧셈" },
        { period: 3, subject: "영어: How much is it?" }
      ]);
    });

    return () => {
      unsubscribeNotice();
      unsubscribeLearning();
    };
  }, []);


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
            </div>
            <ul className={styles.list}>
              {notices.map((n) => (
                <li key={n.id}>{n.content}</li>
              ))}
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
            </div>
            <div className={styles.learningSteps}>
              {learning.map((step, i) => (
                <div key={i} className={styles.step}>
                  <span className={styles.stepNum}>{step.period}교시</span>
                  <p>{step.subject}</p>
                </div>
              ))}
            </div>
            <button className={styles.moreBtn}>학습 안내서</button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 성장하는 5학년 1반. All rights reserved.</p>
      </footer>
    </div>
  );
}


