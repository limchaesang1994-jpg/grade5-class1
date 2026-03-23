"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, limit, addDoc, Timestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Megaphone, Utensils, BookOpen, GraduationCap, Edit3, X, Trash2, Presentation, Tablet, Gift } from "lucide-react";
import { toast } from "react-hot-toast";
import { studentData, Student } from "@/students";

export default function Home() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [lunch, setLunch] = useState<any>(null);
  const [learning, setLearning] = useState<any[]>([]);

  // Birthday states
  const [birthdayMessages, setBirthdayMessages] = useState<any[]>([]);
  const [bdayMessageInput, setBdayMessageInput] = useState("");
  const [todayBirthdayStudents, setTodayBirthdayStudents] = useState<Student[]>([]);

  // Admin states
  const isTeacher = user?.email?.toLowerCase() === "chaesang@korea.kr";

  // Write Modals
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isLearningModalOpen, setIsLearningModalOpen] = useState(false);
  const [noticeInput, setNoticeInput] = useState("");
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [learningInput, setLearningInput] = useState<string[]>(["", "", "", "", "", ""]);

  // Detail Modals
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [selectedLearning, setSelectedLearning] = useState<any>(null);

  useEffect(() => {
    // Check birthdays
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${month}-${day}`;
    
    // Default test value if needed: const todayString = "11-11";
    const birthdayKids = studentData.filter(s => s.birthday === todayString);
    setTodayBirthdayStudents(birthdayKids);

    if (birthdayKids.length > 0) {
      const qBday = query(collection(db, "birthdayMessages"), orderBy("createdAt", "desc"));
      const unsubscribeBday = onSnapshot(qBday, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBirthdayMessages(data);
      });
      return () => unsubscribeBday();
    }
  }, []);

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
      if (editingNoticeId) {
        await updateDoc(doc(db, "notices", editingNoticeId), {
          content: noticeInput,
          updatedAt: Timestamp.now(),
        });
        toast.success("알림장이 수정되었습니다! ✏️");
      } else {
        await addDoc(collection(db, "notices"), {
          content: noticeInput,
          createdAt: Timestamp.now(),
        });
        toast.success("알림장이 등록되었습니다! 📢");
      }
      setNoticeInput("");
      setEditingNoticeId(null);
      setIsNoticeModalOpen(false);
    } catch (e) {
      toast.error("저장에 실패했습니다.");
    }
  };

  const handleEditNoticeClick = (notice: any) => {
    setEditingNoticeId(notice.id);
    setNoticeInput(notice.content);
    setSelectedNotice(null);
    setIsNoticeModalOpen(true);
  };

  const handleSaveLearning = async () => {
    try {
      // First, delete existing timetable entries
      for (const item of learning) {
        await deleteDoc(doc(db, "learning", item.id));
      }

      let savedCount = 0;
      for (let i = 0; i < 6; i++) {
        const subject = learningInput[i].trim();
        if (subject) {
          await addDoc(collection(db, "learning"), {
            period: i + 1,
            subject: subject,
            createdAt: Timestamp.now(),
          });
          savedCount++;
        }
      }
      
      if (savedCount === 0) {
        toast.error("입력된 과목이 없습니다.");
        return;
      }
      
      setLearningInput(["", "", "", "", "", ""]);
      setIsLearningModalOpen(false);
      toast.success("시간표가 업데이트되었습니다! 📚");
    } catch (e: any) {
      console.error("Save failed:", e);
      toast.error(`저장에 실패했습니다: ${e.message}`);
    }
  };

  const handleDeleteNotice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("정말 이 알림장을 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, "notices", id));
        toast.success("삭제되었습니다.");
        if (selectedNotice?.id === id) setSelectedNotice(null);
      } catch (error) {
        toast.error("삭제 실패");
      }
    }
  };

  const handleDeleteLearning = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("정말 이 학습 내용을 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, "learning", id));
        toast.success("삭제되었습니다.");
        if (selectedLearning?.id === id) setSelectedLearning(null);
      } catch (error) {
        toast.error("삭제 실패");
      }
    }
  };

  const handleSaveBirthdayMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bdayMessageInput.trim()) return;

    try {
      await addDoc(collection(db, "birthdayMessages"), {
        content: bdayMessageInput.trim(),
        author: user?.displayName || user?.email?.split('@')[0] || "익명",
        createdAt: Timestamp.now(),
      });
      toast.success("축하 메시지가 등록되었습니다! 🎂");
      setBdayMessageInput("");
    } catch (error) {
      console.error("Birthday message error:", error);
      toast.error("등록에 실패했습니다.");
    }
  };

  const handleDeleteBirthdayMessage = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("정말 이 축하 메시지를 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, "birthdayMessages", id));
        toast.success("메시지가 삭제되었습니다.");
      } catch (error) {
        toast.error("삭제 실패");
      }
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
        
        {/* Birthday Banner */}
        {todayBirthdayStudents.length > 0 && (
          <section className={styles.birthdaySection}>
            <div className={styles.birthdayHeader}>
              <Gift size={32} color="#f43f5e" />
              <h2>🎉 오늘은 {todayBirthdayStudents.map(s => s.name).join(", ")} 친구의 생일입니다! 🎉</h2>
            </div>
            <p className={styles.birthdaySub}>
              따뜻한 축하의 한마디를 남겨주세요!
            </p>
            <form className={styles.birthdayForm} onSubmit={handleSaveBirthdayMessage}>
              <input
                type="text"
                className={styles.birthdayInput}
                value={bdayMessageInput}
                onChange={(e) => setBdayMessageInput(e.target.value)}
                placeholder="축하 메시지를 입력하세요"
                required
              />
              <button type="submit" className={styles.birthdaySubmitBtn}>축하해요!</button>
            </form>
            <div className={styles.birthdayMessagesList}>
              {birthdayMessages.map((msg) => (
                <div key={msg.id} className={styles.birthdayMessageItem}>
                  <div className={styles.birthdayMessageContent}>
                    <span className={styles.bdayText}>{msg.content}</span>
                    <span className={styles.bdayAuthor}>- {msg.author}</span>
                  </div>
                  {isTeacher && (
                    <button
                      onClick={(e) => handleDeleteBirthdayMessage(msg.id, e)}
                      className={styles.deleteBdayBtn}
                      title="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Learning Shortcuts Section */}
        <section className={styles.shortcutsSection}>
          <h2 className={styles.sectionTitle}>학습 바로가기</h2>
          <div className={styles.shortcutsGrid}>
            <a 
              href="https://classroom.google.com/c/ODUxODIyNTQ2NTE4?cjc=wzvp5mz3" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.shortcutCard}
            >
              <div className={`${styles.shortcutIcon} ${styles.green}`}>
                <Presentation size={32} color="#16a34a" />
              </div>
              <span className={styles.shortcutName}>구글 클래스룸</span>
            </a>
            
            <a 
              href="https://hi.goe.go.kr/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.shortcutCard}
            >
              <div className={`${styles.shortcutIcon} ${styles.purple}`}>
                <Tablet size={32} color="#9333ea" />
              </div>
              <span className={styles.shortcutName}>하이러닝</span>
            </a>
          </div>
        </section>

        <div className={styles.cardGrid}>
          {/* Notification Card */}
          <div className={`${styles.card} ${styles.notice}`}>
            <div className={styles.cardHeader}>
              <div className={`${styles.iconCircle} ${styles.blue}`}>
                <Megaphone size={24} color="#3b82f6" />
              </div>
              <h2>알림장</h2>
              {isTeacher && (
                <button onClick={() => {
                  setEditingNoticeId(null);
                  setNoticeInput("");
                  setIsNoticeModalOpen(true);
                }} className={styles.adminBtn}>
                  <Edit3 size={16} /> 글쓰기
                </button>
              )}
            </div>
            <ul className={styles.list}>
              {notices.length > 0 ? (
                notices.map((n) => (
                  <li
                    key={n.id}
                    onClick={() => setSelectedNotice(n)}
                    className={styles.clickableItem}
                  >
                    <div className={styles.noticeItemContent}>
                      <span className={styles.noticeItemDate}>
                        {n.createdAt?.toDate().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                      </span>
                      <span className={styles.liContent}>{n.content}</span>
                    </div>
                    {isTeacher && (
                      <button
                        onClick={(e) => handleDeleteNotice(n.id, e)}
                        className={styles.deleteBtn}
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                ))
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
              <h2>시간표</h2>
              {isTeacher && (
                <button onClick={() => setIsLearningModalOpen(true)} className={styles.adminBtn}>
                  <Edit3 size={16} /> 글쓰기
                </button>
              )}
            </div>
            <div className={styles.learningSteps}>
              {learning.length > 0 ? (
                learning.map((step, i) => (
                  <div
                    key={i}
                    className={`${styles.step} ${styles.clickableItem}`}
                    onClick={() => setSelectedLearning(step)}
                  >
                    <span className={styles.stepNum}>{step.period}교시</span>
                    <p className={styles.stepContent}>{step.subject}</p>
                    {isTeacher && (
                      <button
                        onClick={(e) => handleDeleteLearning(step.id, e)}
                        className={styles.deleteBtn}
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
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

      {/* Write Modals */}
      {isNoticeModalOpen && (
        <div className={styles.chalkboardOverlay}>
          <div className={styles.chalkboardModal}>
            <div className={styles.chalkboardHeader}>
              <span className={styles.chalkboardDate}>
                {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </span>
              <button onClick={() => {
                setIsNoticeModalOpen(false);
                setEditingNoticeId(null);
                setNoticeInput("");
              }} className={styles.chalkboardCloseBtn}><X size={40} /></button>
            </div>
            <textarea
              className={styles.chalkboardTextarea}
              value={noticeInput}
              onChange={(e) => setNoticeInput(e.target.value)}
              placeholder=""
            />
            <button className={styles.chalkboardSaveBtn} onClick={handleSaveNotice}>알림장 작성 완료</button>
          </div>
        </div>
      )}

      {isLearningModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>시간표 추가</h3>
              <button onClick={() => setIsLearningModalOpen(false)}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
              {[1, 2, 3, 4, 5, 6].map((period, index) => (
                <div className={styles.inputGroup} key={period}>
                  <label>{period}교시</label>
                  <input
                    type="text"
                    value={learningInput[index]}
                    onChange={(e) => {
                      const newInputs = [...learningInput];
                      newInputs[index] = e.target.value;
                      setLearningInput(newInputs);
                    }}
                    placeholder={`예: 수학`}
                  />
                </div>
              ))}
            </div>
            <button className={styles.saveBtn} onClick={handleSaveLearning}>저장하기</button>
          </div>
        </div>
      )}

      {/* Detail Modals */}
      {selectedNotice && (
        <div className={styles.modalOverlay} onClick={() => setSelectedNotice(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>📢 알림장 상세</h3>
              <button onClick={() => setSelectedNotice(null)}><X size={20} /></button>
            </div>
            <div className={styles.detailContent}>
              <p className={styles.detailText}>{selectedNotice.content}</p>
              <span className={styles.detailDate}>
                {selectedNotice.createdAt?.toDate().toLocaleString()}
              </span>
            </div>
            {isTeacher && (
              <div className={styles.actionGroup}>
                <button
                  onClick={() => handleEditNoticeClick(selectedNotice)}
                  className={styles.editActionBtn}
                >
                  수정하기
                </button>
                <button
                  onClick={(e) => handleDeleteNotice(selectedNotice.id, e)}
                  className={styles.deleteActionBtn}
                >
                  삭제하기
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedLearning && (
        <div className={styles.modalOverlay} onClick={() => setSelectedLearning(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>📚 시간표 상세</h3>
              <button onClick={() => setSelectedLearning(null)}><X size={20} /></button>
            </div>
            <div className={styles.detailContent}>
              <div className={styles.learningBadge}>{selectedLearning.period}교시</div>
              <p className={styles.detailText}>{selectedLearning.subject}</p>
            </div>
            {isTeacher && (
              <button
                onClick={(e) => handleDeleteLearning(selectedLearning.id, e)}
                className={styles.deleteActionBtn}
              >
                삭제하기
              </button>
            )}
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
