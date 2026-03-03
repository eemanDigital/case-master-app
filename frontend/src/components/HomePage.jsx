import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

/* ─── DESIGN SYSTEM ────────────────────────────────────────────────────────
   Matches app's tailwind.config + index.css exactly:
   Font:     Poppins (same as app)
   Primary:  #2563eb / #1c4e80  (deepBlue)
   Secondary:#e11d48
   Accent:   #8b5cf6
   Dark bg:  #0f172a → #111827 → #1f2937 (app's gray-900/800)
   Text:     #f9fafb / #d1d5db / #9ca3af (app's gray scale)
   Surfaces: #1f2937 / #374151 (app's dark cards)
─────────────────────────────────────────────────────────────────────────── */

const STYLE = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    /* --- Brand (matches app's CSS vars) --- */
    --primary:       #2563eb;
    --primary-hover: #1d4ed8;
    --primary-light: rgba(37,99,235,0.15);
    --primary-rim:   rgba(37,99,235,0.35);
    --deep-blue:     #1c4e80;
    --secondary:     #e11d48;
    --secondary-light: rgba(225,29,72,0.12);
    --secondary-rim:   rgba(225,29,72,0.3);
    --accent:        #8b5cf6;
    --accent-light:  rgba(139,92,246,0.12);
    --accent-rim:    rgba(139,92,246,0.3);

    /* --- Dark surfaces (app's gray scale in dark mode) --- */
    --bg:      #0f172a;
    --ink:     #111827;
    --ink2:    #1f2937;
    --ink3:    #374151;
    --glass:   rgba(255,255,255,0.03);
    --glass2:  rgba(255,255,255,0.06);
    --rim:     rgba(255,255,255,0.07);
    --rim2:    rgba(255,255,255,0.12);

    /* --- Text (app's gray scale) --- */
    --text-1:  #f9fafb;   /* gray-50  */
    --text-2:  #d1d5db;   /* gray-300 */
    --text-3:  #9ca3af;   /* gray-400 */
    --text-4:  #6b7280;   /* gray-500 */
    --text-5:  #4b5563;   /* gray-600 */

    /* --- Radii --- */
    --r-sm: 8px;
    --r-md: 12px;
    --r-lg: 16px;
    --r-xl: 24px;
    --r-2xl: 32px;
  }

  html { scroll-behavior: smooth; }

  /* Scoped to homepage only so we don't bleed into app */
  .lm-home {
    background: var(--bg);
    color: var(--text-1);
    font-family: 'Poppins', system-ui, sans-serif;
    font-size: 15px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
    min-height: 100vh;
  }

  /* Scrollbar */
  .lm-home ::-webkit-scrollbar { width: 3px; }
  .lm-home ::-webkit-scrollbar-track { background: var(--bg); }
  .lm-home ::-webkit-scrollbar-thumb { background: var(--text-5); border-radius: 2px; }

  /* ── NAV ── */
  .lm-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
    padding: 4px 0;
  }
  .lm-nav.scrolled {
    background: rgba(15,23,42,0.9);
    backdrop-filter: blur(20px) saturate(1.5);
    border-bottom: 1px solid var(--rim);
    padding: 0;
  }
  .lm-nav-inner {
    max-width: 1200px; margin: 0 auto;
    padding: 18px 32px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .lm-logo {
    display: flex; align-items: center; gap: 10px; text-decoration: none;
  }
  .lm-logo-mark {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, var(--primary), var(--deep-blue));
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 18px rgba(37,99,235,0.4);
    flex-shrink: 0;
  }
  .lm-logo-mark svg { width: 18px; height: 18px; }
  .lm-logo-name {
    font-size: 18px; font-weight: 700; color: var(--text-1);
    letter-spacing: -0.3px;
  }
  .lm-nav-links {
    display: flex; align-items: center; gap: 32px; list-style: none;
  }
  .lm-nav-links a {
    color: var(--text-3); text-decoration: none;
    font-size: 13.5px; font-weight: 500; letter-spacing: 0.01em;
    transition: color 0.2s; position: relative;
  }
  .lm-nav-links a:hover { color: var(--text-1); }
  .lm-nav-links a::after {
    content: ''; position: absolute;
    bottom: -3px; left: 0; right: 0; height: 1.5px;
    background: var(--primary);
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.25s;
  }
  .lm-nav-links a:hover::after { transform: scaleX(1); }
  .lm-nav-actions { display: flex; align-items: center; gap: 10px; }

  /* ── BUTTONS ── */
  .lm-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    border-radius: var(--r-md); font-size: 13.5px; font-weight: 500;
    cursor: pointer; text-decoration: none; white-space: nowrap; border: none;
    font-family: 'Poppins', sans-serif;
    transition: all 0.22s cubic-bezier(0.16,1,0.3,1);
  }
  .lm-btn-ghost {
    background: transparent; color: var(--text-3); padding: 9px 16px;
  }
  .lm-btn-ghost:hover { color: var(--text-1); background: var(--glass2); border-radius: var(--r-md); }
  .lm-btn-outline {
    background: transparent; color: var(--text-1); padding: 9px 18px;
    border: 1px solid var(--rim2);
  }
  .lm-btn-outline:hover { background: var(--glass2); }
  .lm-btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--deep-blue));
    color: #ffffff; padding: 9px 20px; font-weight: 600;
    box-shadow: 0 0 0 0 rgba(37,99,235,0.4);
  }
  .lm-btn-primary:hover {
    background: linear-gradient(135deg, #1d4ed8, #1c4e80);
    box-shadow: 0 0 22px rgba(37,99,235,0.45), 0 4px 12px rgba(0,0,0,0.3);
    transform: translateY(-1px);
  }
  .lm-btn-primary:active { transform: translateY(0); }
  .lm-btn-lg { padding: 14px 28px; font-size: 15px; border-radius: var(--r-lg); font-weight: 600; }
  .lm-btn-secondary-lg {
    background: var(--glass); color: var(--text-1);
    padding: 14px 28px; font-size: 15px; border-radius: var(--r-lg); font-weight: 500;
    border: 1px solid var(--rim2); cursor: pointer;
    font-family: 'Poppins', sans-serif; text-decoration: none;
    display: inline-flex; align-items: center; gap: 8px;
    transition: all 0.22s;
  }
  .lm-btn-secondary-lg:hover { background: var(--glass2); transform: translateY(-1px); }
  .lm-btn-outline-lg {
    background: transparent; color: var(--text-1);
    padding: 14px 28px; font-size: 15px; border-radius: var(--r-lg); font-weight: 500;
    border: 1px solid var(--rim2); cursor: pointer;
    font-family: 'Poppins', sans-serif;
    transition: all 0.22s; display: inline-flex; align-items: center; gap: 8px;
  }
  .lm-btn-outline-lg:hover { background: var(--glass2); transform: translateY(-1px); }

  /* ── HERO ── */
  .lm-hero {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    position: relative; overflow: hidden;
    padding: 140px 32px 80px;
  }
  .lm-hero-bg {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 50% -5%, rgba(37,99,235,0.18) 0%, transparent 55%),
      radial-gradient(ellipse 50% 50% at 85% 45%, rgba(28,78,128,0.12) 0%, transparent 50%),
      radial-gradient(ellipse 55% 55% at 10% 80%, rgba(139,92,246,0.08) 0%, transparent 50%);
  }
  .lm-hero-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
  }
  .lm-hero-inner {
    max-width: 1200px; width: 100%; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 60px; align-items: center;
    position: relative; z-index: 2;
  }
  .lm-hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--primary-light); border: 1px solid var(--primary-rim);
    border-radius: 100px; padding: 5px 14px;
    font-size: 12px; font-weight: 500; color: #93c5fd;
    letter-spacing: 0.04em; margin-bottom: 26px;
  }
  .lm-badge-dot {
    width: 6px; height: 6px; background: var(--primary);
    border-radius: 50%; animation: lm-pulse 2s ease-in-out infinite;
  }
  @keyframes lm-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }
  .lm-hero-h1 {
    font-size: clamp(38px, 4.2vw, 56px); font-weight: 700;
    line-height: 1.1; letter-spacing: -0.03em;
    color: var(--text-1); margin-bottom: 20px;
  }
  .lm-hero-h1 em {
    font-style: italic; font-weight: 700;
    background: linear-gradient(135deg, #60a5fa, #a78bfa);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .lm-hero-sub {
    font-size: 16px; color: var(--text-2);
    line-height: 1.72; max-width: 420px;
    margin-bottom: 36px; font-weight: 300;
  }
  .lm-hero-ctas { display: flex; align-items: center; gap: 12px; margin-bottom: 44px; flex-wrap: wrap; }
  .lm-hero-trust { display: flex; align-items: center; gap: 12px; }
  .lm-hero-trust-text { font-size: 12px; color: var(--text-4); }
  .lm-hero-avatars { display: flex; }
  .lm-hero-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    border: 2px solid var(--ink); background: var(--ink3);
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; color: var(--text-3);
    margin-right: -8px;
  }

  /* ── PREVIEW CARD ── */
  .lm-hero-preview { position: relative; }
  .lm-preview-glow {
    position: absolute; width: 380px; height: 380px;
    background: radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%);
    top: 50%; left: 50%; transform: translate(-50%,-50%);
    pointer-events: none;
  }
  .lm-preview-card {
    background: var(--ink2); border: 1px solid var(--rim);
    border-radius: var(--r-xl); overflow: hidden;
    box-shadow: 0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05);
    position: relative; z-index: 2;
  }
  .lm-preview-topbar {
    background: var(--ink); padding: 12px 16px;
    border-bottom: 1px solid var(--rim);
    display: flex; align-items: center; gap: 6px;
  }
  .lm-preview-dot { width: 8px; height: 8px; border-radius: 50%; }
  .lm-preview-tabs { display: flex; gap: 0; margin-left: 12px; }
  .lm-preview-tab { font-size: 11px; color: var(--text-4); padding: 4px 12px; border-radius: 4px; cursor: pointer; }
  .lm-preview-tab.active { background: var(--glass2); color: var(--text-1); }
  .lm-preview-body { padding: 18px; }
  .lm-stat-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 16px; }
  .lm-stat-cell {
    background: var(--glass); border: 1px solid var(--rim);
    border-radius: var(--r-sm); padding: 12px;
  }
  .lm-stat-cell-lbl { font-size: 9.5px; color: var(--text-4); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 5px; }
  .lm-stat-cell-val { font-size: 18px; font-weight: 700; color: var(--text-1); }
  .lm-stat-cell-sub { font-size: 9.5px; color: #60a5fa; margin-top: 3px; }
  .lm-tbl { width: 100%; border-collapse: collapse; }
  .lm-tbl-head th { font-size: 9.5px; color: var(--text-4); text-transform: uppercase; letter-spacing: 0.07em; padding: 5px 8px; text-align: left; border-bottom: 1px solid var(--rim); }
  .lm-tbl-body tr { border-bottom: 1px solid rgba(255,255,255,0.03); }
  .lm-tbl-body tr:last-child { border-bottom: none; }
  .lm-tbl-body td { font-size: 11px; color: var(--text-3); padding: 9px 8px; vertical-align: middle; }
  .lm-tbl-body td:first-child { color: var(--text-1); font-weight: 500; }
  .lm-pill {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 100px;
    font-size: 9.5px; font-weight: 500;
  }
  .lm-pill-blue { background: rgba(59,130,246,0.15); color: #60a5fa; }
  .lm-pill-amber { background: rgba(245,158,11,0.15); color: #fbbf24; }
  .lm-pill-dim { background: rgba(107,114,128,0.15); color: var(--text-4); }
  .lm-pill-rose { background: rgba(225,29,72,0.15); color: #fb7185; }

  /* Float cards */
  .lm-float {
    position: absolute; background: var(--ink2); border: 1px solid var(--rim2);
    border-radius: 14px; padding: 11px 15px;
    box-shadow: 0 16px 40px rgba(0,0,0,0.4); z-index: 3;
    animation: lm-float-bob 4s ease-in-out infinite;
  }
  .lm-float-1 { bottom: -14px; left: -28px; animation-delay: 0s; }
  .lm-float-2 { top: 24px; right: -28px; animation-delay: 1.8s; }
  @keyframes lm-float-bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  .lm-float-inner { display: flex; align-items: center; gap: 10px; }
  .lm-float-ico {
    width: 30px; height: 30px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; font-size: 14px;
  }
  .lm-float-ico-b { background: var(--primary-light); }
  .lm-float-ico-r { background: var(--secondary-light); }
  .lm-float-lbl { font-size: 10.5px; color: var(--text-3); }
  .lm-float-val { font-size: 13px; font-weight: 600; color: var(--text-1); }

  /* ── LOGOS ── */
  .lm-logos {
    padding: 48px 32px;
    border-top: 1px solid var(--rim);
    border-bottom: 1px solid var(--rim);
    background: var(--ink);
  }
  .lm-logos-inner { max-width: 1200px; margin: 0 auto; text-align: center; }
  .lm-logos-lbl { font-size: 11px; color: var(--text-4); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 26px; }
  .lm-logos-row { display: flex; align-items: center; justify-content: center; gap: 48px; flex-wrap: wrap; }
  .lm-firm { font-size: 14px; font-weight: 600; color: var(--text-5); letter-spacing: 0.03em; cursor: default; transition: color 0.2s; }
  .lm-firm:hover { color: var(--text-3); }

  /* ── SECTION SHARED ── */
  .lm-section-inner { max-width: 1200px; margin: 0 auto; }
  .lm-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.11em;
    text-transform: uppercase; color: #60a5fa; margin-bottom: 14px;
  }
  .lm-eyebrow-line { width: 20px; height: 1.5px; background: #60a5fa; }
  .lm-h2 {
    font-size: clamp(28px, 3.2vw, 42px); font-weight: 700;
    line-height: 1.13; letter-spacing: -0.025em;
    color: var(--text-1); margin-bottom: 14px;
  }
  .lm-sub {
    font-size: 15px; color: var(--text-2);
    max-width: 440px; font-weight: 300; line-height: 1.72;
    margin-bottom: 48px;
  }

  /* ── FEATURES ── */
  .lm-features { padding: 120px 32px; }
  .lm-feat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .lm-feat-card {
    background: var(--ink2); border: 1px solid var(--rim);
    border-radius: var(--r-lg); padding: 24px;
    position: relative; overflow: hidden; cursor: default;
    transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
  }
  .lm-feat-card::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 55% 55% at 20% 20%, rgba(37,99,235,0.08) 0%, transparent 60%);
    opacity: 0; transition: opacity 0.3s;
  }
  .lm-feat-card:hover::before { opacity: 1; }
  .lm-feat-card:hover {
    border-color: var(--primary-rim);
    transform: translateY(-3px);
    box-shadow: 0 20px 50px rgba(0,0,0,0.35);
  }
  .lm-feat-ico {
    width: 42px; height: 42px;
    background: var(--glass2); border: 1px solid var(--rim2);
    border-radius: 11px; display: flex; align-items: center; justify-content: center;
    font-size: 18px; margin-bottom: 18px;
    transition: background 0.25s, border-color 0.25s;
  }
  .lm-feat-card:hover .lm-feat-ico { background: var(--primary-light); border-color: var(--primary-rim); }
  .lm-feat-title { font-size: 14.5px; font-weight: 600; color: var(--text-1); margin-bottom: 8px; }
  .lm-feat-desc { font-size: 13px; color: var(--text-3); line-height: 1.65; font-weight: 300; }

  /* ── SHOWCASE ── */
  .lm-showcase {
    padding: 120px 32px;
    background: var(--ink);
    border-top: 1px solid var(--rim); border-bottom: 1px solid var(--rim);
  }
  .lm-showcase-inner {
    max-width: 1200px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 80px; align-items: center;
  }
  .lm-showcase-screen {
    background: var(--ink2); border: 1px solid var(--rim2);
    border-radius: var(--r-xl); overflow: hidden;
    box-shadow: 0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
  }
  .lm-screen-hdr {
    background: var(--ink); padding: 14px 18px;
    border-bottom: 1px solid var(--rim);
    display: flex; align-items: center; justify-content: space-between;
  }
  .lm-screen-title { font-size: 12px; font-weight: 600; color: var(--text-1); }
  .lm-screen-body { padding: 16px; }
  .lm-matter-row {
    display: flex; align-items: center; gap: 11px;
    padding: 10px 11px; border-radius: 9px;
    border: 1px solid transparent; margin-bottom: 5px;
    transition: all 0.2s; cursor: default;
  }
  .lm-matter-row:hover { background: var(--glass); border-color: var(--rim); }
  .lm-m-av {
    width: 30px; height: 30px; border-radius: 8px;
    background: var(--ink3); display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; color: var(--text-3); flex-shrink: 0;
  }
  .lm-m-info { flex: 1; min-width: 0; }
  .lm-m-name { font-size: 12px; font-weight: 500; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lm-m-type { font-size: 10.5px; color: var(--text-4); }
  .lm-m-date { font-size: 10.5px; color: var(--text-4); flex-shrink: 0; }

  .lm-benefits { list-style: none; display: flex; flex-direction: column; gap: 20px; margin-top: 40px; }
  .lm-benefit { display: flex; gap: 14px; align-items: flex-start; }
  .lm-benefit-ico {
    width: 34px; height: 34px; border-radius: 10px;
    background: var(--primary-light); border: 1px solid var(--primary-rim);
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; flex-shrink: 0; margin-top: 2px;
  }
  .lm-benefit-title { font-size: 14px; font-weight: 600; color: var(--text-1); margin-bottom: 4px; }
  .lm-benefit-desc { font-size: 13px; color: var(--text-3); font-weight: 300; line-height: 1.62; }

  /* ── STATS ── */
  .lm-stats { padding: 100px 32px; }
  .lm-stats-grid {
    display: grid; grid-template-columns: repeat(4,1fr);
    gap: 1px; background: var(--rim);
    border: 1px solid var(--rim); border-radius: var(--r-xl);
    overflow: hidden; margin-top: 48px;
  }
  .lm-stat-box {
    background: var(--ink2); padding: 42px 28px; text-align: center;
    position: relative; overflow: hidden;
  }
  .lm-stat-box::before {
    content: ''; position: absolute;
    top: 0; left: 50%; transform: translateX(-50%);
    width: 60%; height: 1.5px;
    background: linear-gradient(90deg, transparent, var(--primary), transparent);
    opacity: 0.5;
  }
  .lm-stat-num {
    font-size: 44px; font-weight: 800; line-height: 1;
    color: var(--text-1); margin-bottom: 8px; letter-spacing: -0.04em;
  }
  .lm-stat-num span { color: #60a5fa; }
  .lm-stat-label { font-size: 12.5px; color: var(--text-4); letter-spacing: 0.02em; }

  /* ── TESTIMONIALS ── */
  .lm-testimonials { padding: 120px 32px; }
  .lm-testi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-top: 48px; }
  .lm-testi-card {
    background: var(--ink2); border: 1px solid var(--rim);
    border-radius: var(--r-lg); padding: 26px;
    display: flex; flex-direction: column;
    transition: border-color 0.25s, transform 0.25s;
  }
  .lm-testi-card:hover { border-color: var(--rim2); transform: translateY(-2px); }
  .lm-testi-qmark {
    font-size: 44px; font-weight: 700; line-height: 1;
    color: var(--primary); margin-bottom: 10px; opacity: 0.5;
  }
  .lm-testi-quote {
    font-size: 13.5px; color: var(--text-2); line-height: 1.75;
    font-weight: 300; font-style: italic; flex: 1; margin-bottom: 22px;
  }
  .lm-stars { color: #fbbf24; font-size: 11px; letter-spacing: 2px; margin-bottom: 6px; }
  .lm-testi-author { display: flex; align-items: center; gap: 11px; border-top: 1px solid var(--rim); padding-top: 18px; }
  .lm-testi-av {
    width: 36px; height: 36px; border-radius: 9px;
    background: linear-gradient(135deg, var(--primary), var(--deep-blue));
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #fff;
  }
  .lm-testi-name { font-size: 12.5px; font-weight: 600; color: var(--text-1); }
  .lm-testi-role { font-size: 11px; color: var(--text-4); }

  /* ── PRICING ── */
  .lm-pricing { padding: 120px 32px; background: var(--ink); border-top: 1px solid var(--rim); border-bottom: 1px solid var(--rim); }
  .lm-pricing-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; max-width: 960px; margin: 0 auto; }
  .lm-plan {
    background: var(--ink2); border: 1px solid var(--rim);
    border-radius: var(--r-xl); padding: 32px 28px;
    position: relative; transition: border-color 0.25s, transform 0.25s;
  }
  .lm-plan:hover { border-color: var(--primary-rim); transform: translateY(-3px); }
  .lm-plan-popular {
    border-color: var(--primary-rim);
    box-shadow: 0 0 0 1px var(--primary), 0 16px 48px rgba(37,99,235,0.2);
  }
  .lm-plan-badge {
    position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: #fff; font-size: 10.5px; font-weight: 600;
    padding: 4px 14px; border-radius: 100px; white-space: nowrap;
    letter-spacing: 0.04em;
  }
  .lm-plan-name { font-size: 16px; font-weight: 700; color: var(--text-1); margin-bottom: 6px; }
  .lm-plan-desc { font-size: 13px; color: var(--text-3); margin-bottom: 20px; }
  .lm-plan-price { font-size: 42px; font-weight: 800; color: var(--text-1); letter-spacing: -0.04em; line-height: 1; margin-bottom: 4px; }
  .lm-plan-price span { font-size: 14px; font-weight: 400; color: var(--text-4); }
  .lm-plan-divider { height: 1px; background: var(--rim); margin: 22px 0; }
  .lm-plan-features { list-style: none; display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; }
  .lm-plan-feature { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-2); }
  .lm-plan-check {
    width: 18px; height: 18px; border-radius: 5px;
    background: var(--primary-light); border: 1px solid var(--primary-rim);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; flex-shrink: 0; color: #60a5fa;
  }
  .lm-plan-cta {
    display: block; width: 100%; padding: 12px; border-radius: var(--r-md);
    font-size: 14px; font-weight: 600; text-align: center; cursor: pointer;
    font-family: 'Poppins', sans-serif; transition: all 0.22s; border: none;
    text-decoration: none;
  }
  .lm-plan-cta-primary {
    background: linear-gradient(135deg, var(--primary), var(--deep-blue));
    color: #fff;
    box-shadow: 0 4px 16px rgba(37,99,235,0.35);
  }
  .lm-plan-cta-primary:hover { box-shadow: 0 6px 24px rgba(37,99,235,0.5); transform: translateY(-1px); }
  .lm-plan-cta-ghost {
    background: var(--glass); color: var(--text-1);
    border: 1px solid var(--rim2);
  }
  .lm-plan-cta-ghost:hover { background: var(--glass2); }

  /* ── CTA ── */
  .lm-cta { padding: 80px 32px 120px; }
  .lm-cta-inner { max-width: 860px; margin: 0 auto; }
  .lm-cta-box {
    background: var(--ink2); border: 1px solid var(--rim);
    border-radius: 28px; padding: 72px 60px; text-align: center;
    position: relative; overflow: hidden;
  }
  .lm-cta-box::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 70% 60% at 50% -10%, rgba(37,99,235,0.13) 0%, transparent 60%);
    pointer-events: none;
  }
  .lm-cta-box::after {
    content: ''; position: absolute;
    top: 0; left: 12%; right: 12%; height: 1.5px;
    background: linear-gradient(90deg, transparent, var(--primary), transparent);
    opacity: 0.6;
  }
  .lm-cta-h2 {
    font-size: clamp(26px, 3.2vw, 40px); font-weight: 700;
    color: var(--text-1); letter-spacing: -0.02em;
    line-height: 1.15; margin-bottom: 16px;
  }
  .lm-cta-h2 em {
    font-style: italic;
    background: linear-gradient(135deg, #60a5fa, #a78bfa);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .lm-cta-sub { font-size: 15px; color: var(--text-2); font-weight: 300; margin-bottom: 36px; }
  .lm-cta-btns { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; }

  /* ── FOOTER ── */
  .lm-footer { padding: 64px 32px 40px; border-top: 1px solid var(--rim); }
  .lm-footer-inner { max-width: 1200px; margin: 0 auto; }
  .lm-footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
  .lm-footer-tagline { font-size: 12.5px; color: var(--text-4); line-height: 1.7; max-width: 270px; margin-top: 12px; font-weight: 300; }
  .lm-footer-col-title { font-size: 10.5px; font-weight: 600; color: var(--text-1); letter-spacing: 0.09em; text-transform: uppercase; margin-bottom: 16px; }
  .lm-footer-links { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .lm-footer-links a { font-size: 13px; color: var(--text-4); text-decoration: none; transition: color 0.2s; }
  .lm-footer-links a:hover { color: var(--text-2); }
  .lm-social-row { display: flex; gap: 8px; margin-top: 18px; }
  .lm-social-btn {
    width: 32px; height: 32px; border-radius: 8px;
    background: var(--glass); border: 1px solid var(--rim);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s; font-size: 12px; color: var(--text-4);
    text-decoration: none;
  }
  .lm-social-btn:hover { background: var(--glass2); border-color: var(--rim2); color: var(--text-2); }
  .lm-footer-bottom {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 28px; border-top: 1px solid var(--rim);
  }
  .lm-footer-copy { font-size: 12px; color: var(--text-4); }
  .lm-footer-legal { display: flex; gap: 20px; }
  .lm-footer-legal a { font-size: 12px; color: var(--text-4); text-decoration: none; transition: color 0.2s; }
  .lm-footer-legal a:hover { color: var(--text-2); }

  /* ── ACCENT STRIPE (top of page) ── */
  .lm-top-stripe {
    height: 3px;
    background: linear-gradient(90deg, var(--primary), var(--accent), var(--secondary));
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
  }

  /* ── REVEAL ANIMATIONS ── */
  .lm-reveal {
    opacity: 0; transform: translateY(22px);
    transition: opacity 0.72s cubic-bezier(0.16,1,0.3,1), transform 0.72s cubic-bezier(0.16,1,0.3,1);
  }
  .lm-reveal.visible { opacity: 1; transform: translateY(0); }
  .lm-rd1 { transition-delay: 0.08s; }
  .lm-rd2 { transition-delay: 0.16s; }
  .lm-rd3 { transition-delay: 0.24s; }
  .lm-rd4 { transition-delay: 0.32s; }

  /* ── RESPONSIVE ── */
  @media (max-width: 960px) {
    .lm-hero-inner { grid-template-columns: 1fr; }
    .lm-hero-preview { display: none; }
    .lm-feat-grid { grid-template-columns: 1fr 1fr; }
    .lm-showcase-inner { grid-template-columns: 1fr; }
    .lm-stats-grid { grid-template-columns: repeat(2,1fr); }
    .lm-testi-grid { grid-template-columns: 1fr; }
    .lm-pricing-grid { grid-template-columns: 1fr; max-width: 420px; }
    .lm-footer-top { grid-template-columns: 1fr 1fr; gap: 32px; }
    .lm-nav-links { display: none; }
    .lm-cta-box { padding: 44px 28px; }
  }
  @media (max-width: 600px) {
    .lm-feat-grid { grid-template-columns: 1fr; }
    .lm-footer-top { grid-template-columns: 1fr; }
    .lm-footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
    .lm-stats-grid { grid-template-columns: repeat(2,1fr); }
  }
`;

// ── Reveal hook
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("visible");
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ── Animated counter
function Counter({ end, suffix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const num = parseFloat(end);
          const isFloat = String(end).includes(".");
          const duration = 1400,
            step = 16;
          const inc = num / (duration / step);
          let cur = 0;
          const t = setInterval(() => {
            cur += inc;
            if (cur >= num) {
              cur = num;
              clearInterval(t);
            }
            setVal(isFloat ? cur.toFixed(1) : Math.floor(cur));
          }, step);
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end]);
  return (
    <div ref={ref} className="lm-stat-num">
      {val}
      <span>{suffix}</span>
    </div>
  );
}

// ── DATA
const features = [
  {
    ico: "⚖️",
    title: "Matter Management",
    desc: "Complete lifecycle for every case — intake, assignment, automated workflows, and closing in one unified view.",
  },
  {
    ico: "👥",
    title: "Client Portal",
    desc: "A branded self-service portal where clients track their matters, pay invoices, and communicate securely with your team.",
  },
  {
    ico: "💳",
    title: "Billing & Invoices",
    desc: "Auto-generate invoices from time entries. Accept card, bank transfer or USSD. Real-time receivables dashboard.",
  },
  {
    ico: "📅",
    title: "Cause List & Calendar",
    desc: "Sync court schedules automatically. Get smart reminders for hearings, filing deadlines, and team meetings.",
  },
  {
    ico: "✅",
    title: "Task Management",
    desc: "Assign tasks with deadlines, priorities, and dependencies. Kanban or list view — your workflow, your way.",
  },
  {
    ico: "🔍",
    title: "Audit & Compliance",
    desc: "Every action logged with full timestamps. GDPR & NDPR compliant with one-click compliance report export.",
  },
];

const matters = [
  {
    init: "AO",
    name: "Adeyemi v. Lagos State",
    type: "Commercial Litigation",
    date: "Mar 12",
    pill: "lm-pill-blue",
    sl: "Active",
  },
  {
    init: "FK",
    name: "Fola Kuti Estate",
    type: "Probate & Estate",
    date: "Mar 08",
    pill: "lm-pill-amber",
    sl: "Review",
  },
  {
    init: "GT",
    name: "GTBank Deed Review",
    type: "Corporate / M&A",
    date: "Feb 28",
    pill: "lm-pill-blue",
    sl: "Active",
  },
  {
    init: "CH",
    name: "Chukwu vs. Okonkwo",
    type: "Land Dispute",
    date: "Feb 20",
    pill: "lm-pill-dim",
    sl: "Closed",
  },
];

const testimonials = [
  {
    q: "We cut our billing cycle from 3 weeks to 3 days. The automation is genuinely remarkable for a legal platform.",
    name: "Chidi Okafor",
    role: "Managing Partner · Okafor & Co.",
    init: "CO",
  },
  {
    q: "Our clients stopped calling for status updates. The portal handles everything. That alone is worth the subscription.",
    name: "Amaka Eze",
    role: "Senior Associate · Eze Legal",
    init: "AE",
  },
  {
    q: "The audit logs saved us during a bar council review — complete, timestamped, ready to export. Completely stress-free.",
    name: "Babatunde Lawal",
    role: "Head of Compliance · Lawal Chambers",
    init: "BL",
  },
];

const stats = [
  { end: "500", suffix: "+", label: "Law Firms" },
  { end: "50", suffix: "K+", label: "Matters Managed" },
  { end: "99.9", suffix: "%", label: "Uptime SLA" },
  { end: "4.9", suffix: "★", label: "Avg. Rating" },
];

const plans = [
  {
    name: "Starter",
    price: "49",
    period: "/month",
    desc: "Perfect for small practices",
    features: [
      "Up to 5 users",
      "100 active matters",
      "Client portal",
      "Basic reporting",
      "Email support",
    ],
    popular: false,
  },
  {
    name: "Professional",
    price: "149",
    period: "/month",
    desc: "For growing law firms",
    features: [
      "Up to 20 users",
      "Unlimited matters",
      "Client portal",
      "Advanced analytics",
      "API access",
      "Priority support",
      "Custom workflows",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large organisations",
    features: [
      "Unlimited users",
      "Unlimited matters",
      "Dedicated instance",
      "Custom integrations",
      "SLA guarantee",
      "24/7 phone support",
      "On-premise option",
    ],
    popular: false,
  },
];

// ── LOGO MARK
const LogoMark = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M9 2L15 5.5V12.5L9 16L3 12.5V5.5L9 2Z"
      fill="white"
      fillOpacity="0.9"
    />
    <path
      d="M9 5.5L13 7.75V12.25L9 14.5L5 12.25V7.75L9 5.5Z"
      fill="white"
      fillOpacity="0.3"
    />
  </svg>
);

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const rHero = useReveal();
  const rLogos = useReveal();
  const rFH = useReveal();
  const rFG = useReveal();
  const rSL = useReveal();
  const rSR = useReveal();
  const rStats = useReveal();
  const rTH = useReveal();
  const rTG = useReveal();
  const rPH = useReveal();
  const rPG = useReveal();
  const rCta = useReveal();

  return (
    <>
      <style>{STYLE}</style>
      <div className="lm-home">
        {/* Top accent stripe */}
        <div className="lm-top-stripe" />

        {/* ── NAV ── */}
        <nav
          className={`lm-nav ${scrolled ? "scrolled" : ""}`}
          style={{ paddingTop: 3 }}>
          <div className="lm-nav-inner">
            <Link to="/" className="lm-logo">
              <div className="lm-logo-mark">
                <LogoMark />
              </div>
              <span className="lm-logo-name">LawMaster</span>
            </Link>
            <ul className="lm-nav-links">
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#showcase">Product</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
              <li>
                <a href="#testimonials">Reviews</a>
              </li>
            </ul>
            <div className="lm-nav-actions">
              <Link to="/users/login" className="lm-btn lm-btn-ghost">
                Sign in
              </Link>
              <Link to="/users/login" className="lm-btn lm-btn-primary">
                Get started →
              </Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="lm-hero">
          <div className="lm-hero-bg" />
          <div className="lm-hero-grid" />
          <div className="lm-hero-inner">
            <div ref={rHero} className="lm-reveal">
              <div className="lm-hero-badge">
                <div className="lm-badge-dot" />
                Now in public release — v2.0
              </div>
              <h1 className="lm-hero-h1">
                Legal practice,
                <br />
                <em>finally</em> under
                <br />
                your control.
              </h1>
              <p className="lm-hero-sub">
                LawMaster unifies matter management, client billing, court
                calendars, and compliance into one elegant platform — built for
                the modern Nigerian law firm.
              </p>
              <div className="lm-hero-ctas">
                <Link
                  to="/users/login"
                  className="lm-btn lm-btn-primary lm-btn-lg">
                  Start free — 14 days
                </Link>
                <button className="lm-btn-secondary-lg">
                  ▶ Watch 2-min demo
                </button>
              </div>
              <div className="lm-hero-trust">
                <div className="lm-hero-avatars">
                  {["AO", "FK", "CE", "BL", "MR"].map((i) => (
                    <div key={i} className="lm-hero-avatar">
                      {i}
                    </div>
                  ))}
                </div>
                <span className="lm-hero-trust-text">
                  Trusted by 500+ attorneys across Nigeria
                </span>
              </div>
            </div>

            <div className="lm-hero-preview">
              <div className="lm-preview-glow" />
              <div className="lm-preview-card">
                <div className="lm-preview-topbar">
                  <div
                    className="lm-preview-dot"
                    style={{ background: "#ff5f57" }}
                  />
                  <div
                    className="lm-preview-dot"
                    style={{ background: "#ffbd2e" }}
                  />
                  <div
                    className="lm-preview-dot"
                    style={{ background: "#28ca41" }}
                  />
                  <div className="lm-preview-tabs">
                    <div className="lm-preview-tab active">Dashboard</div>
                    <div className="lm-preview-tab">Matters</div>
                    <div className="lm-preview-tab">Billing</div>
                  </div>
                </div>
                <div className="lm-preview-body">
                  <div className="lm-stat-row">
                    <div className="lm-stat-cell">
                      <div className="lm-stat-cell-lbl">Active Matters</div>
                      <div className="lm-stat-cell-val">47</div>
                      <div className="lm-stat-cell-sub">↑ 8 this week</div>
                    </div>
                    <div className="lm-stat-cell">
                      <div className="lm-stat-cell-lbl">Revenue</div>
                      <div className="lm-stat-cell-val">₦4.2M</div>
                      <div className="lm-stat-cell-sub">↑ 23% MoM</div>
                    </div>
                    <div className="lm-stat-cell">
                      <div className="lm-stat-cell-lbl">Pending Tasks</div>
                      <div className="lm-stat-cell-val">12</div>
                      <div className="lm-stat-cell-sub">3 due today</div>
                    </div>
                  </div>
                  <table className="lm-tbl">
                    <thead className="lm-tbl-head">
                      <tr>
                        <th>Matter</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Hearing</th>
                      </tr>
                    </thead>
                    <tbody className="lm-tbl-body">
                      <tr>
                        <td>Adeyemi v. Lagos State</td>
                        <td>Commercial</td>
                        <td>
                          <span className="lm-pill lm-pill-blue">● Active</span>
                        </td>
                        <td>Mar 15</td>
                      </tr>
                      <tr>
                        <td>Fola Kuti Estate</td>
                        <td>Probate</td>
                        <td>
                          <span className="lm-pill lm-pill-amber">
                            ● Review
                          </span>
                        </td>
                        <td>Mar 22</td>
                      </tr>
                      <tr>
                        <td>GTBank Deed Review</td>
                        <td>Corporate</td>
                        <td>
                          <span className="lm-pill lm-pill-blue">● Active</span>
                        </td>
                        <td>Apr 02</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Floating cards */}
              <div className="lm-float lm-float-1">
                <div className="lm-float-inner">
                  <div className="lm-float-ico lm-float-ico-b">✅</div>
                  <div>
                    <div className="lm-float-lbl">Invoice paid</div>
                    <div className="lm-float-val">₦850,000</div>
                  </div>
                </div>
              </div>
              <div className="lm-float lm-float-2">
                <div className="lm-float-inner">
                  <div className="lm-float-ico lm-float-ico-r">📅</div>
                  <div>
                    <div className="lm-float-lbl">Hearing in</div>
                    <div className="lm-float-val">2 days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── LOGOS ── */}
        <div ref={rLogos} className="lm-logos lm-reveal">
          <div className="lm-logos-inner">
            <p className="lm-logos-lbl">
              Trusted by leading chambers across Nigeria
            </p>
            <div className="lm-logos-row">
              {[
                "Okonkwo & Partners",
                "Adesanya Chambers",
                "Nwosu Legal",
                "F&C Advocates",
                "Lawal & Co.",
                "Eze Associates",
              ].map((f) => (
                <div key={f} className="lm-firm">
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section id="features" className="lm-features">
          <div className="lm-section-inner">
            <div ref={rFH} className="lm-reveal">
              <div className="lm-eyebrow">
                <div className="lm-eyebrow-line" />
                Capabilities
              </div>
              <h2 className="lm-h2">
                One platform.
                <br />
                Every workflow.
              </h2>
              <p className="lm-sub">
                Everything a modern law firm needs — designed with the precision
                your practice demands.
              </p>
            </div>
            <div ref={rFG} className="lm-reveal lm-rd2 lm-feat-grid">
              {features.map((f, i) => (
                <div key={i} className="lm-feat-card">
                  <div className="lm-feat-ico">{f.ico}</div>
                  <div className="lm-feat-title">{f.title}</div>
                  <div className="lm-feat-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SHOWCASE ── */}
        <section id="showcase" className="lm-showcase">
          <div className="lm-showcase-inner">
            <div ref={rSL} className="lm-reveal">
              <div className="lm-showcase-screen">
                <div className="lm-screen-hdr">
                  <span className="lm-screen-title">Active Matters</span>
                  <span className="lm-pill lm-pill-blue">● 47 live</span>
                </div>
                <div className="lm-screen-body">
                  {matters.map((m, i) => (
                    <div key={i} className="lm-matter-row">
                      <div className="lm-m-av">{m.init}</div>
                      <div className="lm-m-info">
                        <div className="lm-m-name">{m.name}</div>
                        <div className="lm-m-type">{m.type}</div>
                      </div>
                      <span
                        className={`lm-pill ${m.pill}`}
                        style={{ marginRight: 8 }}>
                        {m.sl}
                      </span>
                      <div className="lm-m-date">{m.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div ref={rSR} className="lm-reveal lm-rd2">
              <div className="lm-eyebrow">
                <div className="lm-eyebrow-line" />
                Matter Management
              </div>
              <h2 className="lm-h2">
                Every case.
                <br />
                Always on track.
              </h2>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--text-2)",
                  fontWeight: 300,
                  lineHeight: 1.72,
                }}>
                From first intake to final judgment — LawMaster gives your team
                complete visibility, precise control, and zero dropped balls.
              </p>
              <ul className="lm-benefits">
                {[
                  {
                    ico: "⚡",
                    t: "Instant matter intake",
                    d: "Capture client details, assign teams, and set up workflows in under 60 seconds.",
                  },
                  {
                    ico: "🔔",
                    t: "Automated reminders",
                    d: "Court dates, filing deadlines, and tasks delivered to the right person at the right time.",
                  },
                  {
                    ico: "📂",
                    t: "Unified document hub",
                    d: "All pleadings, contracts, and correspondence in one searchable, version-controlled space.",
                  },
                ].map((b, i) => (
                  <li key={i} className="lm-benefit">
                    <div className="lm-benefit-ico">{b.ico}</div>
                    <div>
                      <div className="lm-benefit-title">{b.t}</div>
                      <div className="lm-benefit-desc">{b.d}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section id="metrics" className="lm-stats">
          <div className="lm-section-inner">
            <div
              ref={rStats}
              className="lm-reveal"
              style={{ textAlign: "center" }}>
              <div className="lm-eyebrow" style={{ justifyContent: "center" }}>
                <div className="lm-eyebrow-line" />
                By the numbers
              </div>
              <h2 className="lm-h2" style={{ maxWidth: 460, margin: "0 auto" }}>
                Results that speak
                <br />
                for themselves
              </h2>
              <div className="lm-stats-grid">
                {stats.map((s, i) => (
                  <div key={i} className="lm-stat-box">
                    <Counter end={s.end} suffix={s.suffix} />
                    <div className="lm-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section id="testimonials" className="lm-testimonials">
          <div className="lm-section-inner">
            <div ref={rTH} className="lm-reveal">
              <div className="lm-eyebrow">
                <div className="lm-eyebrow-line" />
                Testimonials
              </div>
              <h2 className="lm-h2">
                Practitioners who
                <br />
                made the switch.
              </h2>
            </div>
            <div ref={rTG} className="lm-reveal lm-rd2 lm-testi-grid">
              {testimonials.map((t, i) => (
                <div key={i} className="lm-testi-card">
                  <div className="lm-stars">★★★★★</div>
                  <div className="lm-testi-qmark">"</div>
                  <p className="lm-testi-quote">{t.q}</p>
                  <div className="lm-testi-author">
                    <div className="lm-testi-av">{t.init}</div>
                    <div>
                      <div className="lm-testi-name">{t.name}</div>
                      <div className="lm-testi-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="lm-pricing">
          <div className="lm-section-inner">
            <div
              ref={rPH}
              className="lm-reveal"
              style={{ textAlign: "center" }}>
              <div className="lm-eyebrow" style={{ justifyContent: "center" }}>
                <div className="lm-eyebrow-line" />
                Pricing
              </div>
              <h2 className="lm-h2" style={{ maxWidth: 440, margin: "0 auto" }}>
                Simple, transparent pricing
              </h2>
              <p
                className="lm-sub"
                style={{ margin: "14px auto 48px", textAlign: "center" }}>
                All plans include a 14-day free trial. No credit card required.
              </p>
            </div>
            <div ref={rPG} className="lm-reveal lm-rd2 lm-pricing-grid">
              {plans.map((p, i) => (
                <div
                  key={i}
                  className={`lm-plan ${p.popular ? "lm-plan-popular" : ""}`}>
                  {p.popular && (
                    <div className="lm-plan-badge">Most Popular</div>
                  )}
                  <div className="lm-plan-name">{p.name}</div>
                  <div className="lm-plan-desc">{p.desc}</div>
                  <div className="lm-plan-price">
                    {p.price === "Custom" ? (
                      <span style={{ fontSize: 28 }}>Custom</span>
                    ) : (
                      <>${p.price}</>
                    )}
                    {p.period && <span>{p.period}</span>}
                  </div>
                  <div className="lm-plan-divider" />
                  <ul className="lm-plan-features">
                    {p.features.map((f, j) => (
                      <li key={j} className="lm-plan-feature">
                        <div className="lm-plan-check">✓</div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/users/login"
                    className={`lm-plan-cta ${p.popular ? "lm-plan-cta-primary" : "lm-plan-cta-ghost"}`}>
                    {p.price === "Custom"
                      ? "Contact Sales"
                      : "Start Free Trial"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="lm-cta">
          <div className="lm-cta-inner">
            <div ref={rCta} className="lm-reveal lm-cta-box">
              <h2 className="lm-cta-h2">
                Your practice deserves
                <br />
                <em>better infrastructure.</em>
              </h2>
              <p className="lm-cta-sub">
                Join 500+ Nigerian law firms running on LawMaster. Start free —
                no card required.
              </p>
              <div className="lm-cta-btns">
                <Link
                  to="/users/login"
                  className="lm-btn lm-btn-primary lm-btn-lg">
                  Start 14-day free trial →
                </Link>
                <button className="lm-btn-outline-lg">Schedule a demo</button>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="lm-footer">
          <div className="lm-footer-inner">
            <div className="lm-footer-top">
              <div>
                <div className="lm-logo" style={{ marginBottom: 12 }}>
                  <div className="lm-logo-mark">
                    <LogoMark />
                  </div>
                  <span className="lm-logo-name">LawMaster</span>
                </div>
                <p className="lm-footer-tagline">
                  The modern legal practice management platform built for
                  Nigerian law firms.
                </p>
                <div className="lm-social-row">
                  {["𝕏", "in", "fb", "●"].map((s, i) => (
                    <a key={i} href="#" className="lm-social-btn">
                      {s}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <div className="lm-footer-col-title">Product</div>
                <ul className="lm-footer-links">
                  {[
                    "Features",
                    "Pricing",
                    "Security",
                    "Changelog",
                    "API Docs",
                  ].map((l) => (
                    <li key={l}>
                      <a href="#">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="lm-footer-col-title">Company</div>
                <ul className="lm-footer-links">
                  {["About", "Blog", "Careers", "Press", "Contact"].map((l) => (
                    <li key={l}>
                      <a href="#">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="lm-footer-col-title">Legal</div>
                <ul className="lm-footer-links">
                  {[
                    "Privacy Policy",
                    "Terms of Service",
                    "Cookie Policy",
                    "NDPR Compliance",
                    "DPA",
                  ].map((l) => (
                    <li key={l}>
                      <a href="#">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="lm-footer-bottom">
              <p className="lm-footer-copy">
                © 2026 LawMaster Technologies Ltd. All rights reserved.
              </p>
              <div className="lm-footer-legal">
                <a href="#">Terms</a>
                <a href="#">Privacy</a>
                <a href="#">Cookies</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
