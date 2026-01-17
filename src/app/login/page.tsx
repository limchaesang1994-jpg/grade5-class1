"use client";

import { useState } from "react";
import {
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import styles from "./login.module.css";
import Image from "next/image";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState("");

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            setError("구글 로그인에 실패했습니다.");
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err: any) {
            setError(isSignUp ? "회원가입에 실패했습니다." : "로그인에 실패했습니다. 정보를 확인해주세요.");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginBox}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <span className={styles.icon}>🏫</span>
                    </div>
                    <h1>반가워요! 5-1반</h1>
                    <p>우리 반 홈페이지에 오신 것을 환영합니다.</p>
                </div>

                <button onClick={handleGoogleLogin} className={styles.googleBtn}>
                    <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={20} height={20} />
                    <span>구글로 시작하기</span>
                </button>

                <div className={styles.divider}>
                    <span>또는</span>
                </div>

                <form onSubmit={handleEmailAuth} className={styles.form}>
                    <input
                        type="email"
                        placeholder="이메일 주소"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {error && <p className={styles.error}>{error}</p>}
                    <button type="submit" className={styles.submitBtn}>
                        {isSignUp ? "회원가입하기" : "로그인하기"}
                    </button>
                </form>

                <p className={styles.toggleText}>
                    {isSignUp ? "이미 계정이 있으신가요?" : "처음 오셨나요?"}
                    <span onClick={() => setIsSignUp(!isSignUp)}>
                        {isSignUp ? "로그인하기" : "회원가입하기"}
                    </span>
                </p>
            </div>
        </div>
    );
}
