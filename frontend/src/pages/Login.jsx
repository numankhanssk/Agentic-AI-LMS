
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import logoSrc from "../assets/Icon.jpeg";

const generateCaptcha = () => {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";

  for (let i = 0; i < 5; i++) {
    result += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return result;
};

export default function Login() {
  const navigate = useNavigate();

  const [activeRole, setActiveRole] = useState("student");
  const [studentUSN, setStudentUSN] = useState("");
  // const [teacherID, setTeacherID] = useState("");
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha());
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const switchRole = (role) => {
    setActiveRole(role);
    setOtp("");
    setOtpSent(false);
    setCaptcha("");
    setCaptchaCode(generateCaptcha());
    setMessage("");
  };

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptcha("");
    setMessage("");
  };

  // SEND OTP - STUDENT AND TEACHER
  const sendOTP = async () => {
    setMessage("");

    if (activeRole === "student" && !studentUSN.trim()) {
      setMessage("Please enter your USN.");
      return;
    }

    if (activeRole === "teacher" && !teacherID.trim()) {
      setMessage("Please enter your Teacher USN.");
      return;
    }

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      return;
    }

    if (!captcha.trim()) {
      setMessage("Please enter the CAPTCHA.");
      return;
    }

    if (captcha.toUpperCase() !== captchaCode) {
      setMessage("Incorrect CAPTCHA. Please try again.");
      refreshCaptcha();
      return;
    }

    try {
      setLoading(true);

      const isTeacher = activeRole === "teacher";

      const endpoint = isTeacher
        ? "http://localhost:5000/api/teachers/auth/send-otp"
        : "http://localhost:5000/api/auth/send-otp";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usn: isTeacher
            ? teacherID.trim().toUpperCase()
            : studentUSN.trim().toUpperCase(),
          email: email.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setOtpSent(false);
        setOtp("");
        setMessage(data.message || "Unable to send OTP.");
        return;
      }

      setOtpSent(true);
      setOtp("");
      setMessage(data.message || "OTP sent successfully.");

    } catch (error) {
      console.error("Send OTP error:", error);
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // VERIFY OTP AND LOGIN
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // ADMIN LOGIN
    if (activeRole === "admin") {
      if (!username.trim()) {
        setMessage("Please enter your username.");
        return;
      }

      if (!password.trim()) {
        setMessage("Please enter your password.");
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(
          "http://localhost:5000/api/admin/login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              username: username.trim(),
              password: password
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message || "Invalid admin credentials.");
          return;
        }

        if (!data.token) {
          setMessage("Authentication token not received.");
          return;
        }

        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("role", "admin");

        if (data.admin) {
          localStorage.setItem("admin", JSON.stringify(data.admin));
        }

        navigate("/admin-dashboard", { replace: true });

      } catch (error) {
        console.error("Admin login error:", error);
        setMessage("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }

      return;
    }

    if (!otpSent) {
      setMessage("Please send the OTP first.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setMessage("Please enter a valid six-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const isTeacher = activeRole === "teacher";

      const endpoint = isTeacher
        ? "http://localhost:5000/api/teachers/auth/verify-otp"
        : "http://localhost:5000/api/auth/verify-otp";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usn: isTeacher
            ? teacherID.trim().toUpperCase()
            : studentUSN.trim().toUpperCase(),
          otp: otp.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "OTP verification failed.");
        return;
      }

      if (!data.token) {
        setMessage(
          "Authentication token was not received. Please try again."
        );
        return;
      }

      // SAVE AUTHENTICATION TOKEN
      if (isTeacher) {
          localStorage.setItem("teacherToken", data.token);
      } else {
          localStorage.setItem("studentToken", data.token);
      }

      if (isTeacher) {
        // SAVE TEACHER DETAILS
        if (data.teacher) {
          localStorage.setItem(
            "teacher",
            JSON.stringify(data.teacher)
          );
        }

        localStorage.setItem("role", "teacher");

        setOtpSent(false);
        setOtp("");

        navigate("/teacher-dashboard", { replace: true });

      } else {
        // SAVE STUDENT DETAILS
        if (data.student) {
          localStorage.setItem(
            "student",
            JSON.stringify(data.student)
          );
        }

        localStorage.setItem("role", "student");

        setOtpSent(false);
        setOtp("");

        navigate("/student-dashboard", { replace: true });
      }

    } catch (error) {
      console.error("OTP verification error:", error);
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setMessage("Password recovery will be connected to the backend.");
  };

  return (
    <>
      <style>{`

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          padding: 0;
          font-family: "Segoe UI", Arial, sans-serif;
        }

        button, input {
          font-family: inherit;
        }

        .login-page {
          min-height: 100vh;
          width: 100%;
          padding: 30px 20px;
          background:
            radial-gradient(circle at 10% 10%, rgba(37, 99, 235, 0.25), transparent 30%),
            radial-gradient(circle at 90% 90%, rgba(14, 165, 233, 0.2), transparent 30%),
            linear-gradient(135deg, #071426 0%, #0b1f38 45%, #06101f 100%);
          color: #172033;
          overflow-x: hidden;
          position: relative;
        }

        .bg-glow {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
          pointer-events: none;
        }

        .bg-glow-one {
          width: 250px;
          height: 250px;
          background: #3b82f6;
          top: 5%;
          left: -100px;
        }

        .bg-glow-two {
          width: 300px;
          height: 300px;
          background: #06b6d4;
          right: -120px;
          bottom: 5%;
        }

        .login-container {
          width: min(1400px, 100%);
          margin: auto;
          position: relative;
          z-index: 2;
        }

        /* LOGO HEADER */

        .brand-header {
          background: #ffffff;
          min-height: 100px;
          border-radius: 22px;
          padding: 15px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.2);
        }

        .brand-left {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .logo-box {
          width: 75px;
          height: 75px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .library-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        .brand-text h1 {
          margin: 0;
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #0f2a4a;
        }

        .brand-text h2 {
          margin: 2px 0 3px;
          font-size: 17px;
          font-weight: 700;
          color: #2563eb;
        }

        .brand-text p {
          margin: 0;
          font-size: 12px;
          color: #64748b;
        }

        .secure-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 15px;
          border-radius: 14px;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          color: #1e40af;
        }

        .secure-icon {
          font-size: 24px;
        }

        .secure-badge strong,
        .secure-badge small {
          display: block;
        }

        .secure-badge strong {
          font-size: 13px;
        }

        .secure-badge small {
          font-size: 11px;
          margin-top: 2px;
          color: #64748b;
        }

        /* MOVING BANNER */

        .welcome-banner {
          margin-top: 16px;
          height: 48px;
          border-radius: 14px;
          overflow: hidden;
          background: linear-gradient(90deg, #1d4ed8, #2563eb, #0891b2);
          color: white;
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
          display: flex;
          align-items: center;
        }

        .banner-track {
          width: 100%;
          overflow: hidden;
          white-space: nowrap;
        }

        .banner-content {
          display: inline-flex;
          align-items: center;
          gap: 18px;
          padding-left: 100%;
          animation: moveBanner 25s linear infinite;
          font-size: 14px;
        }

        .banner-content span {
          opacity: 0.95;
        }

        .banner-content strong {
          letter-spacing: 0.6px;
        }

        @keyframes moveBanner {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }

        /* LIBRARY VISUAL */

        .library-visual {
          margin-top: 16px;
          height: 180px;
          border-radius: 22px;
          position: relative;
          overflow: hidden;
          background:
            linear-gradient(120deg, rgba(4, 19, 40, 0.97), rgba(11, 55, 92, 0.92)),
            radial-gradient(circle at 80% 30%, #38bdf8, transparent 25%);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-shadow: inset 0 0 60px rgba(56, 189, 248, 0.1);
        }

        .library-visual::before,
        .library-visual::after {
          content: "";
          position: absolute;
          bottom: 0;
          height: 45px;
          width: 100%;
          background: repeating-linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.08) 0,
            rgba(255, 255, 255, 0.08) 42px,
            transparent 42px,
            transparent 60px
          );
        }

        .library-visual::after {
          bottom: 45px;
          height: 7px;
          background: rgba(255, 255, 255, 0.13);
        }

        .library-content {
          position: relative;
          z-index: 2;
          max-width: 650px;
          color: white;
        }

        .library-content h3 {
          margin: 0 0 5px;
          font-size: 24px;
          font-weight: 800;
        }

        .library-content p {
          margin: 0 auto;
          max-width: 600px;
          font-size: 13px;
          line-height: 1.6;
          color: #cbd5e1;
        }

        .ai-orb {
          width: 45px;
          height: 45px;
          margin: 0 auto 8px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle, #67e8f9, #2563eb);
          box-shadow: 0 0 15px #38bdf8, 0 0 40px rgba(56, 189, 248, 0.4);
          animation: pulseAI 2s infinite;
        }

        .ai-orb span {
          font-weight: 900;
          font-size: 13px;
          color: white;
        }

        @keyframes pulseAI {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        .floating-book {
          position: absolute;
          font-size: 34px;
          opacity: 0.8;
          animation: floatingBook 4s ease-in-out infinite;
        }

        .book-one { left: 15%; top: 35px; }
        .book-two { right: 16%; top: 30px; animation-delay: 1s; }
        .book-three { left: 25%; bottom: 22px; animation-delay: 2s; }

        @keyframes floatingBook {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-12px) rotate(5deg); }
        }

        /* ROLE SWITCHER */

        .role-section {
          margin-top: 22px;
        }

        .role-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: center;
          margin-bottom: 14px;
        }

        .role-heading h3 {
          color: white;
          font-size: 15px;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .heading-line {
          width: 80px;
          height: 1px;
          background: rgba(255, 255, 255, 0.35);
        }

        .role-switcher {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .role-card {
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.08);
          color: white;
          min-height: 78px;
          border-radius: 16px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: 0.25s ease;
          backdrop-filter: blur(12px);
        }

        .role-card:hover {
          background: rgba(255, 255, 255, 0.14);
          transform: translateY(-2px);
        }

        .role-card.active {
          background: white;
          color: #17304e;
          border-color: white;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25);
          transform: translateY(-2px);
        }

        .role-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #eff6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .role-card strong,
        .role-card small {
          display: block;
          text-align: left;
        }

        .role-card strong { font-size: 14px; }

        .role-card small {
          margin-top: 3px;
          font-size: 11px;
          opacity: 0.65;
        }

        /* LOGIN CARD */

        .login-card {
          width: min(850px, 100%);
          margin: 18px auto 0;
          padding: 28px;
          border-radius: 24px;
          background: white;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.25);
        }

        .login-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 22px;
        }

        .login-title-icon {
          width: 50px;
          height: 50px;
          border-radius: 15px;
          background: #eff6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .login-card-header h2 {
          margin: 0;
          color: #0f2742;
          font-size: 21px;
        }

        .login-card-header p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 12px;
        }

        /* INPUTS */

        .input-group { margin-bottom: 18px; }

        .input-group label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 7px;
        }

        .input-group label span { color: #ef4444; }

        .input-wrapper {
          height: 48px;
          display: flex;
          align-items: center;
          border: 1px solid #d8dee9;
          border-radius: 12px;
          background: #f8fafc;
          transition: 0.2s ease;
          overflow: hidden;
        }

        .input-wrapper:focus-within {
          border-color: #2563eb;
          background: white;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.09);
        }

        .input-icon {
          width: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
        }

        .input-wrapper input {
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          padding: 0 13px 0 0;
          font-size: 13px;
          color: #172033;
        }

        .input-wrapper input::placeholder { color: #94a3b8; }

        .password-toggle {
          width: 44px;
          height: 100%;
          flex-shrink: 0;
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
        }

        .password-toggle:hover { color: #2563eb; }

        /* CAPTCHA */

        .captcha-row {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 10px;
        }

        .captcha-display {
          height: 48px;
          border-radius: 12px;
          border: 1px dashed #93c5fd;
          background: repeating-linear-gradient(
            -25deg,
            #eff6ff,
            #eff6ff 5px,
            #dbeafe 5px,
            #dbeafe 10px
          );
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
        }

        .captcha-display span {
          font-size: 19px;
          font-weight: 900;
          letter-spacing: 5px;
          color: #1e3a8a;
          font-style: italic;
          user-select: none;
        }

        .captcha-refresh {
          border: none;
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 22px;
          font-weight: 800;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s ease;
          flex-shrink: 0;
        }

        .captcha-refresh:hover {
          background: #2563eb;
          color: white;
          transform: rotate(180deg);
        }

        .captcha-display small {
          font-size: 8px;
          color: #64748b;
        }

        /* OTP */

        .otp-button {
          width: 100%;
          height: 45px;
          border: none;
          border-radius: 11px;
          cursor: pointer;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 13px;
          font-weight: 800;
          transition: 0.2s ease;
          margin-bottom: 18px;
        }

        .otp-button:hover { background: #dbeafe; }

        .otp-button span { margin-right: 8px; }

        .otp-status {
          display: block;
          margin-top: 6px;
          color: #059669;
          font-size: 11px;
        }

        /* ADMIN PASSWORD */

        .password-note {
          display: flex;
          justify-content: flex-end;
          margin-top: 6px;
        }

        .password-note span {
          font-size: 10px;
          color: #64748b;
        }

        .forgot-password {
          border: none;
          background: none;
          color: #2563eb;
          font-size: 12px;
          font-weight: 700;
          padding: 0;
          cursor: pointer;
          margin-top: -7px;
          margin-bottom: 18px;
        }

        .forgot-password:hover { text-decoration: underline; }

        /* MESSAGE */

        .form-message {
          border-radius: 10px;
          padding: 11px 13px;
          font-size: 12px;
          margin-bottom: 14px;
        }

        .form-message.success {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }

        .form-message.error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        /* SUBMIT */

        .submit-button {
          width: 100%;
          height: 51px;
          border: none;
          border-radius: 13px;
          background: linear-gradient(90deg, #1d4ed8, #2563eb, #0891b2);
          color: white;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          box-shadow: 0 12px 25px rgba(37, 99, 235, 0.25);
          transition: 0.25s ease;
        }

        .submit-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 30px rgba(37, 99, 235, 0.35);
        }

        .submit-button .arrow {
          font-size: 20px;
          margin-left: 5px;
        }

        /* LOGIN FOOTER */

        .login-footer {
          border-top: 1px solid #e5e7eb;
          margin-top: 20px;
          padding-top: 15px;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px;
          color: #64748b;
          font-size: 10px;
        }

        /* FEATURES */

        .features-section {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.09);
          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: 16px;
          padding: 17px;
          display: flex;
          gap: 12px;
          color: white;
          backdrop-filter: blur(10px);
        }

        .feature-icon {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
        }

        .feature-card h4 {
          margin: 0 0 4px;
          font-size: 12px;
        }

        .feature-card p {
          margin: 0;
          font-size: 10px;
          line-height: 1.5;
          color: #cbd5e1;
        }

        /* FOOTER */

        .page-footer {
          text-align: center;
          color: #94a3b8;
          font-size: 10px;
          margin: 22px 0 5px;
        }

        .page-footer p { margin: 0 0 4px; }
        .page-footer span { color: #64748b; }

        /* TABLET */

        @media (max-width: 768px) {
          .login-page { padding: 18px 12px; }
          .brand-header { padding: 14px; }
          .secure-badge { display: none; }
          .brand-text h1 { font-size: 22px; }
          .brand-text h2 { font-size: 14px; }
          .brand-text p { font-size: 10px; }
          .logo-box { width: 65px; height: 65px; }
          .library-visual { height: 165px; }
          .library-content h3 { font-size: 20px; }
          .library-content p { font-size: 12px; padding: 0 25px; }
          .features-section { grid-template-columns: 1fr; }
        }

        /* MOBILE */

        @media (max-width: 520px) {
          .login-page { padding: 10px 8px; }
          .brand-header {
            min-height: auto;
            border-radius: 16px;
            padding: 11px;
          }
          .brand-left { gap: 10px; }
          .logo-box { width: 54px; height: 54px; }
          .brand-text h1 { font-size: 18px; }
          .brand-text h2 { font-size: 11px; }
          .brand-text p { display: none; }
          .welcome-banner { height: 42px; margin-top: 10px; }
          .banner-content { font-size: 11px; gap: 12px; }
          .library-visual { height: 145px; border-radius: 16px; }
          .library-content h3 { font-size: 17px; }
          .library-content p { font-size: 10px; padding: 0 25px; }
          .ai-orb { width: 36px; height: 36px; margin-bottom: 5px; }
          .role-section { margin-top: 15px; }
          .role-heading { margin-bottom: 10px; }
          .heading-line { width: 30px; }
          .role-switcher { gap: 6px; }
          .role-card {
            min-height: 70px;
            padding: 8px 4px;
            flex-direction: column;
            gap: 4px;
            border-radius: 12px;
          }
          .role-icon {
            width: 30px;
            height: 30px;
            font-size: 15px;
            border-radius: 8px;
          }
          .role-card strong { font-size: 11px; text-align: center; }
          .role-card small { display: none; }
          .login-card {
            margin-top: 12px;
            padding: 19px 14px;
            border-radius: 18px;
          }
          .login-card-header {
            padding-bottom: 15px;
            margin-bottom: 17px;
          }
          .login-title-icon {
            width: 42px;
            height: 42px;
            font-size: 20px;
            border-radius: 12px;
          }
          .login-card-header h2 { font-size: 17px; }
          .login-card-header p { font-size: 10px; }
          .captcha-row { grid-template-columns: 1fr; }
          .captcha-display { height: 44px; }
          .input-wrapper { height: 45px; }
          .submit-button { height: 48px; font-size: 12px; }
          .features-section { gap: 8px; }
          .feature-card { padding: 13px; }
        }

        /* VERY SMALL PHONES */

        @media (max-width: 360px) {
          .brand-text h1 { font-size: 16px; }
          .brand-text h2 { font-size: 9px; }
          .logo-box { width: 48px; height: 48px; }
          .role-card { min-height: 62px; }
          .login-card { padding: 15px 11px; }
        }

        /* FULL-SCREEN LAYOUT */

        html, body, #root {
          width: 100%;
          min-height: 100%;
          margin: 0;
        }

        .login-page {
          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;
          padding: 20px clamp(12px, 2vw, 32px);
        }

        .login-container {
          width: 100%;
          max-width: none;
          margin: 0 auto;
        }

        .brand-header,
        .welcome-banner,
        .library-visual,
        .role-section,
        .features-section,
        .page-footer {
          width: 100%;
        }

        .login-card {
          width: min(560px, 100%);
          margin-left: auto;
          margin-right: auto;
        }

        @media (max-width: 520px) {
          .login-page { padding: 10px 8px; }
          .login-card { width: 100%; }
        }

      `}</style>

      <div className="login-page">
        <div className="bg-glow bg-glow-one"></div>
        <div className="bg-glow bg-glow-two"></div>

        <main className="login-container">

          {/* LOGO HEADER */}

          <section className="brand-header">
            <div className="brand-left">
              <div className="logo-box">
                <img
                  src={logoSrc}
                  alt="Agentic AI Library Logo"
                  className="library-logo"
                />
              </div>

              <div className="brand-text">
                <h1>Agentic-AI</h1>
                <h2>Smart Library Management System</h2>
                <p>Intelligent • Secure • Digital • Connected</p>
              </div>
            </div>

            <div className="secure-badge">
              <span className="secure-icon">🔐</span>
              <div>
                <strong>Secure Access</strong>
                <small>AI Powered</small>
              </div>
            </div>
          </section>

          {/* MOVING WELCOME */}

          <section className="welcome-banner">
            <div className="banner-track">
              <div className="banner-content">
                <span>📚</span>
                <strong>WELCOME TO AGENTIC-AI LIBRARY MANAGEMENT SYSTEM</strong>
                <span>✦</span>
                <span>Smart Library</span>
                <span>•</span>
                <span>AI-Powered Intelligence</span>
                <span>•</span>
                <span>Digital Book Access</span>
                <span>•</span>
                <span>Secure Authentication</span>
                <span>•</span>
                <strong>WELCOME TO AGENTIC-AI LIBRARY MANAGEMENT SYSTEM</strong>
                <span>📚</span>
              </div>
            </div>
          </section>

          {/* LIBRARY VISUAL */}

          <section className="library-visual">
            <div className="floating-book book-one">📘</div>
            <div className="floating-book book-two">📕</div>
            <div className="floating-book book-three">📗</div>

            <div className="library-content">
              <div className="ai-orb">
                <span>AI</span>
              </div>

              <h3>Your Intelligent Digital Library</h3>

              <p>
                Discover books, manage your library and access
                intelligent AI-powered services from one secure
                platform.
              </p>
            </div>
          </section>

          {/* ROLE SWITCHER */}

          <section className="role-section">
            <div className="role-heading">
              <span className="heading-line"></span>
              <h3>Select Login Type</h3>
              <span className="heading-line"></span>
            </div>

            <div className="role-switcher">

              <button
                type="button"
                className={`role-card ${activeRole === "student" ? "active" : ""}`}
                onClick={() => switchRole("student")}
              >
                <div className="role-icon">🎓</div>
                <div>
                  <strong>Student</strong>
                  <small>Student Login</small>
                </div>
              </button>

              {/* <button
                type="button"
                className={`role-card ${activeRole === "teacher" ? "active" : ""}`}
                onClick={() => switchRole("teacher")}
              >
                <div className="role-icon">👨‍🏫</div>
                <div>
                  <strong>Teacher</strong>
                  <small>Faculty Login</small>
                </div>
              </button> */}

              <button
                type="button"
                className={`role-card ${activeRole === "admin" ? "active" : ""}`}
                onClick={() => switchRole("admin")}
              >
                <div className="role-icon">🛡️</div>
                <div>
                  <strong>Admin</strong>
                  <small>Administrator</small>
                </div>
              </button>

            </div>
          </section>

          {/* LOGIN CARD */}

          <section className="login-card">

            <div className="login-card-header">
              <div className="login-title-icon">
                {activeRole === "student"
                  ? "🎓"
                  : activeRole === "teacher"
                  ? "👨‍🏫"
                  : "🛡️"}
              </div>

              <div>
                <h2>
                  {activeRole === "student"
                    ? "Student Login"
                    : activeRole === "teacher"
                    ? "Teacher Login"
                    : "Admin Login"}
                </h2>

                <p>
                  {activeRole === "student"
                    ? "Sign in using your student credentials"
                    : activeRole === "teacher"
                    ? "Sign in using your faculty credentials"
                    : "Access the administration dashboard securely"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>

              {/* STUDENT */}

              {activeRole === "student" && (
                <>
                  <div className="input-group">
                    <label htmlFor="studentUSN">
                      USN <span>*</span>
                    </label>

                    <div className="input-wrapper">
                      <span className="input-icon">🎓</span>

                      <input
                        id="studentUSN"
                        type="text"
                        placeholder="Enter your USN"
                        value={studentUSN}
                        onChange={(e) =>
                          setStudentUSN(e.target.value.toUpperCase())
                        }
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="studentEmail">
                      Email Address <span>*</span>
                    </label>

                    <div className="input-wrapper">
                      <span className="input-icon">✉️</span>

                      <input
                        id="studentEmail"
                        type="email"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* TEACHER */}

              {/* {activeRole === "teacher" && (
                <>
                  <div className="input-group">
                    <label htmlFor="teacherID">
                      Teacher USN <span>*</span>
                    </label>

                    <div className="input-wrapper">
                      <span className="input-icon">👨‍🏫</span>

                      <input
                        id="teacherID"
                        type="text"
                        placeholder="Enter your Teacher USN"
                        value={teacherID}
                        onChange={(e) =>
                          setTeacherID(e.target.value.toUpperCase())
                        }
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="teacherEmail">
                      Email Address <span>*</span>
                    </label>

                    <div className="input-wrapper">
                      <span className="input-icon">✉️</span>

                      <input
                        id="teacherEmail"
                        type="email"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )} */}

              {/* CAPTCHA + OTP */}

              {activeRole !== "admin" && (
                <>
                  <div className="input-group">
                    <label htmlFor="captcha">
                      CAPTCHA <span>*</span>
                    </label>

                    <div className="captcha-row">
                      <div className="captcha-display">
                        <button
                          type="button"
                          className="captcha-refresh"
                          onClick={refreshCaptcha}
                          title="Generate a new CAPTCHA"
                          aria-label="Refresh CAPTCHA"
                        >
                          ↻
                        </button>

                        <span>{captchaCode}</span>
                        <small>CAPTCHA</small>
                      </div>

                      <div className="input-wrapper">
                        <span className="input-icon">🔒</span>

                        <input
                          id="captcha"
                          type="text"
                          maxLength="5"
                          placeholder="Enter CAPTCHA"
                          value={captcha}
                          onChange={(e) =>
                            setCaptcha(e.target.value.toUpperCase())
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEND OTP */}

                  <button
                    type="button"
                    className="otp-button"
                    onClick={sendOTP}
                    disabled={loading}
                  >
                    <span>📨</span>
                    {loading
                      ? "Please wait..."
                      : otpSent
                      ? "Resend OTP"
                      : "Send OTP"}
                  </button>

                  {/* OTP */}

                  <div className="input-group">
                    <label htmlFor="otp">
                      OTP Verification <span>*</span>
                    </label>

                    <div className="input-wrapper">
                      <span className="input-icon">🔑</span>

                      <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        maxLength="6"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, ""))
                        }
                      />
                    </div>

                    {otpSent && (
                      <small className="otp-status">
                        ✓ OTP sent to your registered email
                      </small>
                    )}
                  </div>
                </>
              )}

              {/* ADMIN */}

              {activeRole === "admin" && (
                <>
                  <div className="input-group">
                    <label htmlFor="username">
                      Username <span>*</span>
                    </label>

                    <div className="input-wrapper">
                      <span className="input-icon">👤</span>

                      <input
                        id="username"
                        type="text"
                        placeholder="Enter admin username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="password">
                      Password <span>*</span>
                    </label>

                    <div className="input-wrapper">
                      <span className="input-icon">🔐</span>

                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />

                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>

                    <div className="password-note">
                      <span>🔒 Password protected</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="forgot-password"
                    onClick={handleForgotPassword}
                  >
                    Forgot Password?
                  </button>
                </>
              )}

              {/* MESSAGE */}

              {message && (
                <div
                  className={`form-message ${
                    message.toLowerCase().includes("successfully")
                      ? "success"
                      : "error"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                <span>
                  {activeRole === "admin" ? "🔐" : "🚀"}
                </span>

                {loading
                  ? "Please wait..."
                  : activeRole === "admin"
                  ? "Login as Admin"
                  : activeRole === "student"
                  ? "Login as Student"
                  : "Login as Teacher"}

                <span className="arrow">→</span>
              </button>

            </form>

            <div className="login-footer">
              <span>🔐 Secure Authentication</span>
              <span>•</span>
              <span>AI Powered</span>
              <span>•</span>
              <span>Digital Library</span>
            </div>

          </section>

          {/* FEATURES */}

          <section className="features-section">

            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <div>
                <h4>Secure Authentication</h4>
                <p>
                  Protected login with OTP verification and secure
                  access control.
                </p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <div>
                <h4>Digital Library Access</h4>
                <p>
                  Search, reserve and manage books through one
                  intelligent platform.
                </p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <div>
                <h4>AI-Powered Intelligence</h4>
                <p>
                  Smart recommendations and intelligent library
                  assistance through AI agents.
                </p>
              </div>
            </div>

          </section>

          {/* FOOTER */}

          <footer className="page-footer">
            <p>
              © 2026 Agentic-AI Smart Library Management System
            </p>

            <span>
              Built with ❤️ using AI & Modern Web Technology
            </span>
          </footer>

        </main>
      </div>
    </>
  );
}
