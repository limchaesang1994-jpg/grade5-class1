"use client";

import { useAuth } from "@/context/AuthContext";
import styles from "./assignments.module.css";
import { ExternalLink, ChevronLeft, ShieldCheck, Heart } from "lucide-react";
import Link from "next/link";

export default function AssignmentPage() {
    const { user } = useAuth();

    const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSc_R1VTDspuQfAVREx17KqYCYwhGamPh7Kk3JTgeWWvIsIwbg/viewform?usp=header";

    return (
        <div className={styles.container}>
            <Link href="/" className={styles.backBtn}>
                <ChevronLeft size={20} />
                <span>홈으로 가기</span>
            </Link>

            <header className={styles.header}>
                <h1>📚 과제 제출방</h1>
                <p>우리 반 친구들의 노력이 결실을 맺는 곳입니다.</p>
            </header>

            <div className={styles.centeredGrid}>
                <section className={styles.formSection}>
                    <div className={styles.card}>
                        <div className={styles.formIcon}>
                            <Heart size={40} color="#ffb7c5" />
                        </div>
                        <h2>오늘의 과제 제출하기</h2>
                        <p className={styles.description}>
                            아래 버튼을 누르면 구글 폼으로 연결됩니다.<br />
                            준비한 파일을 사진 찍거나 선택해서 제출해 주세요!
                        </p>

                        <div className={styles.noticeCard}>
                            <ShieldCheck size={24} color="#a1c9a1" />
                            <p>
                                제출한 파일은 선생님의 구글 드라이브에 안전하게 보관됩니다.
                                다른 친구들은 볼 수 없으니 안심하고 올려주세요!
                            </p>
                        </div>

                        <a
                            href={GOOGLE_FORM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.submitBtn}
                        >
                            <ExternalLink size={18} />
                            <span>과제 제출하기</span>
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
}
