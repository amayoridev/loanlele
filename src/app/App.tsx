import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { DEFAULT_DRAFT, SAMPLE_ENTRIES, J_MOODS, Sparkles, FloatingEmotionalCircles, FlowerBloom, MoodBadge, EmotionCheckIn, JournalWrite, SaveSuccessOverlay, AIInsight, SuggestedActivities, JournalHistory, CalendarView, SearchFilter, JournalDetail, EditJournal, JournalRewardPopup } from "./JournalModule";
import { MOOD_HISTORY, ScoreRing, MoodDashboard, WeeklyMood, MonthlyMood, YearOverview, DailyMoodSummary, EmotionalPattern, MoodAIInsight, CompareProgress, Achievement, ExportReport } from "./MoodModule";
import type { MoodEntry, MoodCtx } from "./MoodModule";
import { FamilyHome, LetterEditor, LessonList, LessonDetail, GratitudeNote, FamilyProgress, FamilyAIRecommend, FamilyUserProfile, ConnectChallenges } from "./FamilyModule";
import type { FamilyCtx, SocialUser } from "./FamilyModule";

// ─── Types ────────────────────────────────────────────────────────────────────
type PageName =
  | "home" | "selfcare"
  | "water" | "breathing" | "exercise" | "sleep"
  | "eating" | "reading" | "relax" | "gratitude" | "meditation"
  | "journal-history" | "journal-checkin" | "journal-write"
  | "journal-insight" | "journal-activities" | "journal-calendar"
  | "journal-search" | "journal-detail" | "journal-edit"
  | "mood-dashboard" | "mood-weekly" | "mood-monthly" | "mood-yearly"
  | "mood-daily" | "mood-patterns" | "mood-ai-insight"
  | "mood-compare" | "mood-achievement" | "mood-export"
  | "family-home" | "family-letters" | "family-challenges"
  | "family-lessons" | "family-lesson-detail" | "family-gratitude"
  | "family-progress" | "family-ai" | "family-user-profile"
  | "understanding-home" | "understanding-loading"
  | "understanding-response" | "understanding-reflection";

interface GlobalCtx {
  streaks: Record<string, number>;
  completedToday: Set<string>;
  emotionalCircles: number;
  onComplete: (id: string, name: string, emoji: string) => void;
  navigate: (p: PageName) => void;
}

interface JournalEntry {
  id: string;
  date: string;
  time: string;
  mood: string;
  moodEmoji: string;
  moodLabel: string;
  moodColor: string;
  moodBg: string;
  moodIntensity: number;
  title: string;
  content: string;
  tags: string[];
  emojis: string[];
  hasVoice: boolean;
  hasPhoto: boolean;
  wordCount: number;
}

interface DraftEntry {
  mood: string;
  moodEmoji: string;
  moodLabel: string;
  moodColor: string;
  moodBg: string;
  moodIntensity: number;
  title: string;
  content: string;
  tags: string[];
  emojis: string[];
  hasVoice: boolean;
  hasPhoto: boolean;
}

interface JournalCtx {
  entries: JournalEntry[];
  draft: DraftEntry;
  setDraft: (d: Partial<DraftEntry>) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  addEntry: (entry: Omit<JournalEntry, "id" | "date" | "time" | "wordCount">) => void;
  updateEntry: (id: string, data: Partial<JournalEntry>) => void;
  deleteEntry: (id: string) => void;
  navigate: (p: PageName) => void;
  onJournalComplete: () => void;
  showJournalReward: boolean;
  setShowJournalReward: (v: boolean) => void;
}

type CompanionMode = "listen" | "perspective" | "lesson" | "advice" | null;

interface UnderstandingCtx {
  userText: string;
  setUserText: (t: string) => void;
  companionMode: CompanionMode;
  setCompanionMode: (m: CompanionMode) => void;
  navigate: (p: PageName) => void;
  emotionalCircles: number;
  onComplete: (id: string, name: string, emoji: string) => void;
  setSelectedLesson: (i: number | null) => void;
  responseIdx: number;
  setResponseIdx: (i: number) => void;
}

// ─── Activity config ──────────────────────────────────────────────────────────
const ACTS = [
  { id: "water",     name: "Uống đủ nước",        emoji: "💧", accent: "#7AB8D8", bg: "#EDF5FB", page: "water"     as PageName },
  { id: "breathing", name: "Hít thở",              emoji: "🌬️", accent: "#7BBFA8", bg: "#EEF8F4", page: "breathing" as PageName },
  { id: "exercise",  name: "Vận động",              emoji: "🏃", accent: "#F5A87B", bg: "#FFF4EE", page: "exercise"  as PageName },
  { id: "sleep",     name: "Ngủ đủ giấc",           emoji: "🌙", accent: "#C3B4E8", bg: "#F5F0FB", page: "sleep"     as PageName },
  { id: "eating",    name: "Ăn uống lành mạnh",     emoji: "🥗", accent: "#7BBFA8", bg: "#EEF8F4", page: "eating"    as PageName },
  { id: "reading",   name: "Đọc sách",              emoji: "📚", accent: "#F5A87B", bg: "#FFF8F0", page: "reading"   as PageName },
  { id: "relax",     name: "Thư giãn",              emoji: "🎵", accent: "#A8C8E8", bg: "#EEF5FB", page: "relax"     as PageName },
  { id: "gratitude", name: "Biết ơn",               emoji: "🌸", accent: "#E87BA8", bg: "#FFF0F6", page: "gratitude" as PageName },
  { id: "meditation",name: "Thiền",                 emoji: "🧘", accent: "#9B8FD8", bg: "#F0EEF8", page: "meditation"as PageName },
] as const;

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useCountdown(initial: number) {
  const [secs, setSecs]       = useState(initial);
  const [running, setRunning] = useState(false);
  const [done, setDone]       = useState(false);

  useEffect(() => {
    if (!running) return;
    if (secs <= 0) { setRunning(false); setDone(true); return; }
    const t = setInterval(() => setSecs(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [running, secs]);

  const start = useCallback(() => { setRunning(true); setDone(false); }, []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback((n: number) => { setSecs(n); setRunning(false); setDone(false); }, []);
  return { secs, running, done, start, pause, reset };
}

function useBreathPhase(active: boolean) {
  const [phase, setPhase] = useState(0);           // 0=inhale 1=hold 2=exhale 3=rest
  const ref = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) {
      if (timerRef.current) clearTimeout(timerRef.current);
      ref.current = 0; setPhase(0); return;
    }
    const dur = [4000, 4000, 4000, 2000];
    const tick = () => {
      ref.current = (ref.current + 1) % 4;
      setPhase(ref.current);
      timerRef.current = setTimeout(tick, dur[ref.current]);
    };
    timerRef.current = setTimeout(tick, dur[0]);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active]);

  return phase;
}

// ─── Utilities ────────────────────────────────────────────────────────────────
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// ─── FloatCircle ──────────────────────────────────────────────────────────────
function FloatCircle({ size, color, x, y, delay = 0, opacity = 0.5, dur = 7, blur = 0 }: {
  size: number; color: string; x: string; y: string;
  delay?: number; opacity?: number; dur?: number; blur?: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none select-none"
      style={{ width: size, height: size, background: color, left: x, top: y, opacity, filter: blur ? `blur(${blur}px)` : undefined }}
      animate={{ y: [0, -16, 0], x: [0, 5, 0], scale: [1, 1.05, 1] }}
      transition={{ duration: dur, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti() {
  const colors = ["#7BBFA8", "#C3B4E8", "#F5D0BE", "#A8D4E8", "#F4C0C0", "#FDE68A", "#BBF7D0", "#F5A87B"];
  const particles = useMemo(() => Array.from({ length: 28 }, (_, i) => {
    const angle = (i / 28) * 360;
    const dist  = 70 + Math.random() * 140;
    return {
      x: Math.cos((angle * Math.PI) / 180) * dist,
      y: Math.sin((angle * Math.PI) / 180) * dist,
      size: 7 + Math.random() * 14,
      color: colors[i % colors.length],
      delay: Math.random() * 0.12,
    };
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] flex items-center justify-center">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, background: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 1 }}
          transition={{ duration: 0.9 + Math.random() * 0.3, ease: "easeOut", delay: p.delay }}
        />
      ))}
    </div>
  );
}

// ─── Reward flow (3-step overlay) ────────────────────────────────────────────
function RewardFlow({ data, circles, streak, onClose }: {
  data: { name: string; emoji: string } | null;
  circles: number; streak: number;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => { if (data) setStep(0); }, [data]);

  if (!data) return null;

  const steps = [
    // 0 – Activity complete
    <motion.div
      key="complete"
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="bg-white rounded-[2rem] p-8 flex flex-col items-center text-center max-w-xs w-full mx-4 shadow-2xl"
    >
      <motion.div className="text-6xl mb-4"
        animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 0.8 }}>
        {data.emoji}
      </motion.div>
      <h3 className="font-black text-2xl text-[#3D3547] mb-1" style={{ fontFamily: "Nunito" }}>Hoàn thành! 🎉</h3>
      <p className="text-[#9490A4] text-sm mb-6" style={{ fontFamily: "Be Vietnam Pro" }}>{data.name}</p>
      <div className="w-full h-0.5 rounded-full mb-4" style={{ background: "rgba(180,160,220,0.2)" }} />
      <p className="text-[#7BBFA8] font-bold text-sm mb-6" style={{ fontFamily: "Nunito" }}>+1 Chấm Tròn Cảm Xúc đang đến ✨</p>
      <motion.button
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        onClick={() => setStep(1)}
        className="w-full py-3.5 rounded-2xl font-black text-white text-sm"
        style={{ background: "linear-gradient(135deg,#7BBFA8,#9BC5B8)", fontFamily: "Nunito" }}
      >Tiếp theo ›</motion.button>
    </motion.div>,

    // 1 – Emotional circle
    <motion.div
      key="circle"
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="bg-white rounded-[2rem] p-8 flex flex-col items-center text-center max-w-xs w-full mx-4 shadow-2xl"
    >
      <div className="relative mb-6">
        <motion.div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#C3B4E8,#A8D4E8)" }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          <span className="text-3xl">🌀</span>
        </motion.div>
        <motion.div
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#FDE68A] flex items-center justify-center font-black text-sm text-[#3D3547]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          style={{ fontFamily: "Nunito" }}
        >+1</motion.div>
      </div>
      <h3 className="font-black text-xl text-[#3D3547] mb-1" style={{ fontFamily: "Nunito" }}>Chấm Tròn Cảm Xúc</h3>
      <motion.p
        className="font-black text-4xl mb-2"
        style={{ color: "#C3B4E8", fontFamily: "Nunito" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >{circles}</motion.p>
      <p className="text-[#9490A4] text-xs mb-6" style={{ fontFamily: "Be Vietnam Pro" }}>tổng số chấm tròn của bạn</p>
      <motion.button
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        onClick={() => setStep(2)}
        className="w-full py-3.5 rounded-2xl font-black text-white text-sm"
        style={{ background: "linear-gradient(135deg,#C3B4E8,#A8C8E8)", fontFamily: "Nunito" }}
      >Xem chuỗi ngày 🔥</motion.button>
    </motion.div>,

    // 2 – Streak
    <motion.div
      key="streak"
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="bg-white rounded-[2rem] p-8 flex flex-col items-center text-center max-w-xs w-full mx-4 shadow-2xl"
    >
      <motion.div
        className="text-6xl mb-3"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
      >🔥</motion.div>
      <h3 className="font-black text-3xl text-[#3D3547] mb-1" style={{ fontFamily: "Nunito" }}>{streak} ngày</h3>
      <p className="text-[#F5A87B] font-bold text-sm mb-2" style={{ fontFamily: "Nunito" }}>liên tiếp!</p>
      <p className="text-[#9490A4] text-xs mb-8 leading-relaxed" style={{ fontFamily: "Be Vietnam Pro" }}>
        Bạn thật tuyệt vời! Hãy tiếp tục giữ thói quen này nhé 💙
      </p>
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
              style={{ background: i < Math.min(streak, 7) ? "#FDE68A" : "#F0EDF8" }}>
              {i < Math.min(streak, 7) ? "⭐" : ""}
            </div>
          </div>
        ))}
      </div>
      <motion.button
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        onClick={onClose}
        className="w-full py-3.5 rounded-2xl font-black text-white text-sm"
        style={{ background: "linear-gradient(135deg,#F5A87B,#F5D060)", fontFamily: "Nunito" }}
      >Về trang chủ 🏠</motion.button>
    </motion.div>,
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(61,53,71,0.6)", backdropFilter: "blur(12px)" }}>
      <Confetti />
      <AnimatePresence mode="wait">{steps[step]}</AnimatePresence>
    </div>
  );
}

// ─── PageShell ────────────────────────────────────────────────────────────────
function PageShell({ title, accent, bg, onBack, children }: {
  title: string; accent: string; bg: string;
  onBack: () => void; children: React.ReactNode;
}) {
  return (
    <motion.div
      className="min-h-screen flex flex-col"
      style={{ background: bg, maxWidth: 480, margin: "0 auto" }}
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -30, opacity: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-5 py-4"
        style={{ background: bg, borderBottom: "1px solid rgba(180,170,200,0.18)" }}>
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.8)", border: `1.5px solid ${accent}44` }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
        <h1 className="font-black text-lg text-[#3D3547]" style={{ fontFamily: "Nunito" }}>{title}</h1>
      </div>
      <div className="flex-1 overflow-y-auto pb-10" style={{ scrollbarWidth: "none" }}>
        {children}
      </div>
    </motion.div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton({ h = 80, rounded = 16 }: { h?: number; rounded?: number }) {
  return (
    <motion.div
      className="w-full"
      style={{ height: h, borderRadius: rounded, background: "linear-gradient(90deg,#F0EDF8 0%,#E8E4F4 50%,#F0EDF8 100%)", backgroundSize: "200% 100%" }}
      animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    />
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SELF-CARE DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function SelfCareDashboard({ ctx }: { ctx: GlobalCtx }) {
  const { streaks, completedToday, emotionalCircles, navigate } = ctx;
  const totalActs = ACTS.length;
  const doneToday = ACTS.filter(a => completedToday.has(a.id)).length;

  return (
    <motion.div
      className="min-h-screen pb-10"
      style={{ background: "#FFF8F3", maxWidth: 480, margin: "0 auto" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="relative overflow-hidden px-5 pt-14 pb-8"
        style={{ background: "linear-gradient(135deg,#EDF8F4 0%,#F0EBF8 100%)" }}>
        <FloatCircle size={120} color="#C3B4E8" x="70%" y="-10px" opacity={0.28} dur={9} />
        <FloatCircle size={70} color="#7BBFA8" x="82%" y="60px" delay={1.5} opacity={0.3} dur={8} />
        <FloatCircle size={40} color="#F5D0BE" x="60%" y="80px" delay={2.5} opacity={0.4} dur={7} />

        <button
          onClick={() => navigate("home")}
          className="absolute top-4 left-5 flex items-center gap-1.5 text-[#9490A4] text-xs font-semibold"
          style={{ fontFamily: "Be Vietnam Pro" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L5 7l4 4" stroke="#9490A4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Trang chủ
        </button>

        <p className="text-xs font-semibold text-[#9490A4] mb-1 uppercase tracking-wider relative z-10" style={{ fontFamily: "Be Vietnam Pro" }}>
          Hành trình của bạn
        </p>
        <h1 className="font-black text-2xl text-[#3D3547] relative z-10" style={{ fontFamily: "Nunito" }}>
          Nuôi dưỡng bản thân 🌱
        </h1>

        {/* Stats row */}
        <div className="flex gap-3 mt-5 relative z-10">
          {[
            { label: "Hôm nay", value: `${doneToday}/${totalActs}`, color: "#7BBFA8" },
            { label: "Chấm tròn", value: `${emotionalCircles}`, color: "#C3B4E8" },
          ].map(s => (
            <div key={s.label} className="flex-1 bg-white/70 rounded-2xl p-3 text-center backdrop-blur-sm">
              <p className="font-black text-xl" style={{ color: s.color, fontFamily: "Nunito" }}>{s.value}</p>
              <p className="text-[10px] text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>{s.label}</p>
            </div>
          ))}
          {/* Progress arc */}
          <div className="flex-1 bg-white/70 rounded-2xl p-3 flex items-center justify-center backdrop-blur-sm">
            <svg width="48" height="48">
              <circle cx="24" cy="24" r="18" fill="none" stroke="#F0EDF8" strokeWidth="5" />
              <circle cx="24" cy="24" r="18" fill="none" stroke="#7BBFA8" strokeWidth="5"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 * (1 - doneToday / totalActs)}
                strokeLinecap="round"
                transform="rotate(-90 24 24)" />
              <text x="24" y="28" textAnchor="middle" fontSize="10" fontWeight="700" fill="#3D3547" fontFamily="Nunito">
                {Math.round((doneToday / totalActs) * 100)}%
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Activity grid */}
      <div className="px-5 mt-6 grid grid-cols-3 gap-3">
        {ACTS.map((act, i) => {
          const done = completedToday.has(act.id);
          const streak = streaks[act.id] || 0;
          return (
            <motion.button
              key={act.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(act.page)}
              className="relative flex flex-col items-center gap-2 p-4 rounded-3xl text-center"
              style={{
                background: done ? `${act.accent}22` : "#FFFFFF",
                border: `1.5px solid ${done ? act.accent + "55" : "rgba(180,170,200,0.2)"}`,
                boxShadow: done ? `0 6px 20px ${act.accent}20` : "0 4px 16px rgba(180,160,220,0.08)",
              }}
            >
              {done && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#7BBFA8] flex items-center justify-center"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              )}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: `${act.accent}22` }}>
                {act.emoji}
              </div>
              <p className="font-bold text-[10px] text-[#3D3547] leading-tight" style={{ fontFamily: "Nunito" }}>
                {act.name}
              </p>
              {streak > 0 && (
                <span className="text-[9px] font-semibold" style={{ color: "#F5A87B", fontFamily: "Nunito" }}>
                  🔥 {streak} ngày
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Quote strip */}
      <div className="mx-5 mt-6 rounded-3xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#C3B4E8,#A8C8E8)" }}>
        <FloatCircle size={60} color="#fff" x="-5%" y="-20%" opacity={0.1} />
        <FloatCircle size={40} color="#fff" x="85%" y="50%" delay={1} opacity={0.1} />
        <p className="text-white font-bold text-sm relative z-10" style={{ fontFamily: "Nunito" }}>
          "Mỗi thói quen nhỏ là một bước tiến lớn." 🌟
        </p>
        <p className="text-white/70 text-xs mt-1 relative z-10" style={{ fontFamily: "Be Vietnam Pro" }}>
          Tiếp tục hành trình của bạn nhé!
        </p>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. WATER PAGE
// ══════════════════════════════════════════════════════════════════════════════
function WaterPage({ ctx }: { ctx: GlobalCtx }) {
  const [filled, setFilled] = useState<boolean[]>(Array(8).fill(false));
  const [reminder, setReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const count = filled.filter(Boolean).length;
  const done  = completedToday(ctx, "water");

  useEffect(() => { setTimeout(() => setLoading(false), 800); }, []);
  useEffect(() => {
    if (count === 8 && !showSuccess) { setTimeout(() => setShowSuccess(true), 300); }
  }, [count, showSuccess]);

  function completedToday(ctx: GlobalCtx, id: string) { return ctx.completedToday.has(id); }

  const toggle = (i: number) => {
    if (showSuccess) return;
    setFilled(prev => { const n = [...prev]; n[i] = !n[i]; return n; });
  };

  const onConfirm = () => {
    setShowSuccess(false);
    ctx.onComplete("water", "Uống đủ nước", "💧");
    ctx.navigate("selfcare");
  };

  const ACT = ACTS.find(a => a.id === "water")!;

  return (
    <PageShell title="Uống đủ nước 💧" accent={ACT.accent} bg={ACT.bg} onBack={() => ctx.navigate("selfcare")}>
      <div className="px-5 pt-6 flex flex-col gap-6">

        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton h={120} /><Skeleton h={80} /><Skeleton h={100} />
          </div>
        ) : (
          <>
            {/* Goal card */}
            <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgba(122,184,216,0.12)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-[#9490A4] font-semibold uppercase tracking-wider" style={{ fontFamily: "Be Vietnam Pro" }}>Mục tiêu hôm nay</p>
                  <p className="font-black text-2xl text-[#3D3547]" style={{ fontFamily: "Nunito" }}>
                    {count} <span className="text-[#9490A4] text-lg font-semibold">/ 8 ly</span>
                  </p>
                </div>
                <div className="relative">
                  <svg width="64" height="64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#EDF5FB" strokeWidth="6" />
                    <circle cx="32" cy="32" r="26" fill="none" stroke={ACT.accent} strokeWidth="6"
                      strokeDasharray={2 * Math.PI * 26}
                      strokeDashoffset={2 * Math.PI * 26 * (1 - count / 8)}
                      strokeLinecap="round" transform="rotate(-90 32 32)" />
                    <text x="32" y="37" textAnchor="middle" fontSize="13" fontWeight="800" fill="#3D3547" fontFamily="Nunito">
                      {Math.round((count / 8) * 100)}%
                    </text>
                  </svg>
                </div>
              </div>

              {/* Water glass circles – 4 × 2 grid */}
              <div className="grid grid-cols-4 gap-3">
                {filled.map((f, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.88 }}
                    onClick={() => toggle(i)}
                    className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 relative overflow-hidden"
                    style={{
                      background: f ? `${ACT.accent}33` : "#F0EDF8",
                      border: `2px solid ${f ? ACT.accent : "transparent"}`,
                    }}
                  >
                    {f && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        initial={{ y: "100%" }}
                        animate={{ y: "0%" }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                        style={{ background: `${ACT.accent}22` }}
                      />
                    )}
                    <span className="text-xl relative z-10">{f ? "💧" : "🫙"}</span>
                    <span className="text-[9px] font-semibold relative z-10" style={{ color: f ? ACT.accent : "#C0B8D0", fontFamily: "Nunito" }}>Ly {i + 1}</span>
                  </motion.button>
                ))}
              </div>

              <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background: "#F0EDF8" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg,${ACT.accent},${ACT.accent}99)` }}
                  animate={{ width: `${(count / 8) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-center text-xs text-[#9490A4] mt-2" style={{ fontFamily: "Be Vietnam Pro" }}>
                {count === 0 && "Bắt đầu bằng ly nước đầu tiên nhé! 🌊"}
                {count > 0 && count < 8 && `Còn ${8 - count} ly nữa là đạt mục tiêu! 💪`}
                {count === 8 && "Tuyệt vời! Bạn đã uống đủ nước hôm nay! 🎉"}
              </p>
            </div>

            {/* Reminder toggle */}
            <div className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(122,184,216,0.1)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#3D3547] text-sm" style={{ fontFamily: "Nunito" }}>Nhắc nhở uống nước</p>
                  <p className="text-xs text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>Nhắc mỗi 2 giờ</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setReminder(!reminder)}
                  className="relative w-12 h-6 rounded-full transition-colors duration-300"
                  style={{ background: reminder ? ACT.accent : "#E8E4F4" }}
                >
                  <motion.div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{ left: reminder ? "26px" : "4px" }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  />
                </motion.button>
              </div>
              <AnimatePresence>
                {reminder && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden"
                  >
                    <label className="text-xs text-[#9490A4] block mb-1" style={{ fontFamily: "Be Vietnam Pro" }}>Bắt đầu từ</label>
                    <input
                      type="time" value={reminderTime}
                      onChange={e => setReminderTime(e.target.value)}
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                      style={{ background: "#F7F4FC", color: "#3D3547", fontFamily: "Be Vietnam Pro", border: `1.5px solid ${ACT.accent}44` }}
                    />
                    <p className="text-xs text-[#7BBFA8] mt-2 font-semibold" style={{ fontFamily: "Nunito" }}>✓ Đã bật nhắc nhở lúc {reminderTime}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(122,184,216,0.08)]">
              <p className="font-bold text-[#3D3547] text-sm mb-3" style={{ fontFamily: "Nunito" }}>Lợi ích của việc uống đủ nước</p>
              {["Tăng tập trung và năng lượng", "Da đẹp, tươi sáng hơn", "Hỗ trợ tiêu hóa tốt", "Giảm đau đầu và mệt mỏi"].map((b, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: `${ACT.accent}33` }}>
                    <div className="w-full h-full rounded-full flex items-center justify-center text-xs">✓</div>
                  </div>
                  <p className="text-xs text-[#5E5870]" style={{ fontFamily: "Be Vietnam Pro" }}>{b}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Success popup */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(61,53,71,0.55)", backdropFilter: "blur(10px)" }}>
            <Confetti />
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="bg-white rounded-[2rem] p-8 flex flex-col items-center text-center max-w-xs w-full mx-4 shadow-2xl"
            >
              <motion.div className="text-6xl mb-3"
                animate={{ rotate: [0, -10, 10, -8, 8, 0] }}
                transition={{ duration: 0.8 }}>💧</motion.div>
              <h3 className="font-black text-2xl text-[#3D3547] mb-1" style={{ fontFamily: "Nunito" }}>8/8 ly nước!</h3>
              <p className="text-[#9490A4] text-sm mb-2" style={{ fontFamily: "Be Vietnam Pro" }}>
                Cơ thể bạn đang rất vui đấy! 🎊
              </p>
              <div className="px-4 py-2 rounded-xl mb-6" style={{ background: `${ACT.accent}22` }}>
                <p className="text-xs font-bold" style={{ color: ACT.accent, fontFamily: "Nunito" }}>+1 Chấm Tròn Cảm Xúc ✨</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={onConfirm}
                className="w-full py-3.5 rounded-2xl font-black text-white text-sm"
                style={{ background: `linear-gradient(135deg,${ACT.accent},${ACT.accent}CC)`, fontFamily: "Nunito" }}
              >Tuyệt vời! 🌟</motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. BREATHING PAGE
// ══════════════════════════════════════════════════════════════════════════════
function BreathingPage({ ctx }: { ctx: GlobalCtx }) {
  const durations = [60, 180, 300];
  const [durIdx, setDurIdx] = useState(0);
  const { secs, running, done, start, pause, reset } = useCountdown(durations[durIdx]);
  const phase = useBreathPhase(running);
  const ACT = ACTS.find(a => a.id === "breathing")!;
  const total = durations[durIdx];
  const progress = 1 - secs / total;

  useEffect(() => { if (done) ctx.onComplete("breathing", "Hít thở", "🌬️"); }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const phaseLabel = ["Hít vào...", "Giữ lại...", "Thở ra...", "Nghỉ..."][phase];
  const phaseEmoji = ["🌬️", "🫁", "💨", "🌿"][phase];
  const circleScale = phase === 0 ? 1.55 : phase === 1 ? 1.55 : 1;

  const R = 100;
  const circ = 2 * Math.PI * R;

  return (
    <PageShell title="Hít thở 🌬️" accent={ACT.accent} bg={ACT.bg} onBack={() => ctx.navigate("selfcare")}>
      <div className="px-5 pt-6 flex flex-col gap-6 items-center">

        {/* Duration selector */}
        <div className="flex gap-2 self-stretch">
          {["1 phút", "3 phút", "5 phút"].map((label, i) => (
            <motion.button key={i} whileTap={{ scale: 0.94 }}
              onClick={() => { if (!running) { setDurIdx(i); reset(durations[i]); } }}
              className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all"
              style={{
                background: durIdx === i ? ACT.accent : "#FFFFFF",
                color: durIdx === i ? "#fff" : "#9490A4",
                fontFamily: "Nunito",
                border: `1.5px solid ${durIdx === i ? ACT.accent : "rgba(180,170,200,0.25)"}`,
                boxShadow: durIdx === i ? `0 4px 16px ${ACT.accent}40` : "none",
                opacity: running ? 0.6 : 1,
              }}
            >{label}</motion.button>
          ))}
        </div>

        {/* Breathing orb */}
        <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
          {/* Progress ring */}
          <svg className="absolute inset-0" width="260" height="260">
            <circle cx="130" cy="130" r={R} fill="none" stroke={`${ACT.accent}22`} strokeWidth="8" />
            <circle cx="130" cy="130" r={R} fill="none" stroke={ACT.accent} strokeWidth="8"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
              strokeLinecap="round" transform="rotate(-90 130 130)"
              style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>

          {/* Outer pulsing ring */}
          {running && (
            <motion.div
              className="absolute rounded-full border-2"
              style={{ width: 220, height: 220, borderColor: `${ACT.accent}44` }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {/* Main orb */}
          <motion.div
            className="rounded-full flex flex-col items-center justify-center"
            style={{
              width: 160, height: 160,
              background: `radial-gradient(circle at 40% 35%, ${ACT.accent}CC, ${ACT.accent}66)`,
              boxShadow: `0 16px 50px ${ACT.accent}55`,
            }}
            animate={{ scale: circleScale }}
            transition={{ duration: 4, ease: "easeInOut" }}
          >
            <span className="text-3xl">{running ? phaseEmoji : "🌿"}</span>
            <span className="text-white font-black text-sm mt-1" style={{ fontFamily: "Nunito" }}>
              {running ? phaseLabel : "Bắt đầu"}
            </span>
          </motion.div>
        </div>

        {/* Timer display */}
        <div className="text-center">
          <p className="font-black text-4xl text-[#3D3547]" style={{ fontFamily: "Nunito" }}>{fmt(secs)}</p>
          <p className="text-xs text-[#9490A4] mt-1" style={{ fontFamily: "Be Vietnam Pro" }}>
            {running ? "đang thở..." : done ? "Hoàn thành rồi! 🎉" : "Nhấn bắt đầu khi sẵn sàng"}
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-3 w-full">
          {!running && !done && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
              onClick={start}
              className="flex-1 py-4 rounded-2xl font-black text-white text-base"
              style={{ background: `linear-gradient(135deg,${ACT.accent},${ACT.accent}CC)`, fontFamily: "Nunito", boxShadow: `0 8px 24px ${ACT.accent}40` }}
            >▶ Bắt đầu</motion.button>
          )}
          {running && (
            <>
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={pause}
                className="flex-1 py-4 rounded-2xl font-bold text-sm"
                style={{ background: "#FFFFFF", border: `1.5px solid ${ACT.accent}55`, color: ACT.accent, fontFamily: "Nunito" }}
              >⏸ Tạm dừng</motion.button>
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => { pause(); ctx.onComplete("breathing", "Hít thở", "🌬️"); ctx.navigate("selfcare"); }}
                className="flex-1 py-4 rounded-2xl font-bold text-sm"
                style={{ background: "#FFFFFF", border: `1.5px solid ${ACT.accent}55`, color: ACT.accent, fontFamily: "Nunito" }}
              >✓ Xong</motion.button>
            </>
          )}
          {!running && (running === false) && (secs < durations[durIdx]) && !done && (
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={start}
              className="flex-1 py-4 rounded-2xl font-bold text-sm"
              style={{ background: `${ACT.accent}22`, color: ACT.accent, fontFamily: "Nunito" }}
            >▶ Tiếp tục</motion.button>
          )}
          {done && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
              onClick={() => ctx.navigate("selfcare")}
              className="flex-1 py-4 rounded-2xl font-black text-white"
              style={{ background: `linear-gradient(135deg,${ACT.accent},#A8D4E8)`, fontFamily: "Nunito" }}
            >🏠 Về trang chủ</motion.button>
          )}
        </div>

        {/* Guide card */}
        <div className="w-full bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(123,191,168,0.1)]">
          <p className="font-bold text-[#3D3547] text-sm mb-3" style={{ fontFamily: "Nunito" }}>Hướng dẫn thở ô vuông</p>
          {[["Hít vào", "4 giây", "🌬️"], ["Giữ lại", "4 giây", "🫁"], ["Thở ra", "4 giây", "💨"], ["Nghỉ", "2 giây", "🌿"]].map(([l, t, e]) => (
            <div key={l} className="flex items-center gap-3 mb-2">
              <span className="text-lg">{e}</span>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-[#3D3547]" style={{ fontFamily: "Nunito" }}>{l}</span>
                  <span className="text-xs text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>{t}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. EXERCISE PAGE
// ══════════════════════════════════════════════════════════════════════════════
const EXERCISES = [
  { id: "stretch", name: "Giãn cơ nhẹ",   emoji: "🧘", dur: 300,  level: "Dễ",    color: "#BBF7D0" },
  { id: "yoga",    name: "Yoga nhẹ nhàng", emoji: "🌿", dur: 600,  level: "Dễ",    color: "#C3B4E8" },
  { id: "jump",    name: "Nhảy dây",       emoji: "🪢", dur: 300,  level: "Trung", color: "#FDE68A" },
  { id: "walk",    name: "Đi bộ nhanh",    emoji: "🚶", dur: 900,  level: "Dễ",    color: "#A8D4E8" },
  { id: "push",    name: "Hít đất",        emoji: "💪", dur: 180,  level: "Khó",   color: "#F4C0C0" },
  { id: "dance",   name: "Nhảy theo nhạc", emoji: "💃", dur: 600,  level: "Trung", color: "#F5D0BE" },
];

function ExercisePage({ ctx }: { ctx: GlobalCtx }) {
  const [selected, setSelected] = useState<typeof EXERCISES[0] | null>(null);
  const [phase, setPhase] = useState<"list" | "timer" | "done">("list");
  const { secs, running, done, start, pause, reset } = useCountdown(selected?.dur ?? 60);
  const ACT = ACTS.find(a => a.id === "exercise")!;

  useEffect(() => { if (done) setPhase("done"); }, [done]);

  const selectEx = (ex: typeof EXERCISES[0]) => {
    setSelected(ex);
    reset(ex.dur);
    setPhase("timer");
  };

  const finish = () => {
    ctx.onComplete("exercise", "Vận động", "🏃");
    ctx.navigate("selfcare");
  };

  const progress = selected ? 1 - secs / selected.dur : 0;
  const R = 80;
  const circ = 2 * Math.PI * R;

  return (
    <PageShell title="Vận động 🏃" accent={ACT.accent} bg={ACT.bg} onBack={() => { setPhase("list"); ctx.navigate("selfcare"); }}>
      <div className="px-5 pt-6">
        <AnimatePresence mode="wait">
          {phase === "list" && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
              <p className="text-sm text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>Chọn bài tập hôm nay</p>
              {EXERCISES.map((ex, i) => (
                <motion.button key={ex.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => selectEx(ex)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-[0_4px_16px_rgba(245,168,123,0.08)]"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: ex.color }}>
                    {ex.emoji}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily: "Nunito" }}>{ex.name}</p>
                    <p className="text-xs text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>{fmt(ex.dur)}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${ex.level === "Khó" ? "#F4C0C0" : ex.level === "Trung" ? "#FDE68A" : "#BBF7D0"}`,
                             color: "#3D3547", fontFamily: "Nunito" }}>
                    {ex.level}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}

          {phase === "timer" && selected && (
            <motion.div key="timer" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6">
              <button onClick={() => setPhase("list")}
                className="self-start text-xs text-[#9490A4] flex items-center gap-1"
                style={{ fontFamily: "Be Vietnam Pro" }}>
                ← Đổi bài tập
              </button>

              {/* Exercise icon + name */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-3"
                  style={{ background: selected.color }}>
                  {selected.emoji}
                </div>
                <h2 className="font-black text-xl text-[#3D3547]" style={{ fontFamily: "Nunito" }}>{selected.name}</h2>
                <p className="text-xs text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>Độ khó: {selected.level}</p>
              </div>

              {/* Progress ring + timer */}
              <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
                <svg width="220" height="220">
                  <circle cx="110" cy="110" r={R} fill="none" stroke={`${ACT.accent}22`} strokeWidth="10" />
                  <circle cx="110" cy="110" r={R} fill="none" stroke={ACT.accent} strokeWidth="10"
                    strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
                    strokeLinecap="round" transform="rotate(-90 110 110)"
                    style={{ transition: "stroke-dashoffset 1s linear" }} />
                </svg>
                <div className="absolute text-center">
                  <p className="font-black text-4xl text-[#3D3547]" style={{ fontFamily: "Nunito" }}>{fmt(secs)}</p>
                  <p className="text-xs text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>
                    {running ? "đang chạy..." : "tạm dừng"}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-3 w-full">
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={running ? pause : start}
                  className="flex-1 py-4 rounded-2xl font-black text-sm"
                  style={{
                    background: running ? "#F7F4FC" : `linear-gradient(135deg,${ACT.accent},${ACT.accent}CC)`,
                    color: running ? "#9490A4" : "#fff", fontFamily: "Nunito",
                  }}
                >{running ? "⏸ Tạm dừng" : "▶ Tiếp tục"}</motion.button>
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={finish}
                  className="flex-1 py-4 rounded-2xl font-bold text-sm"
                  style={{ background: "#FFFFFF", border: `1.5px solid ${ACT.accent}55`, color: ACT.accent, fontFamily: "Nunito" }}
                >✓ Hoàn thành</motion.button>
              </div>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div key="done" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center gap-5 py-8">
              <Confetti />
              <motion.div className="text-7xl" animate={{ rotate: [0, -15, 15, -10, 10, 0] }} transition={{ duration: 0.8 }}>🏆</motion.div>
              <h2 className="font-black text-2xl text-[#3D3547]" style={{ fontFamily: "Nunito" }}>Xuất sắc!</h2>
              <p className="text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>Bạn đã hoàn thành bài tập 💪</p>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={finish}
                className="w-full max-w-xs py-4 rounded-2xl font-black text-white"
                style={{ background: `linear-gradient(135deg,${ACT.accent},${ACT.accent}CC)`, fontFamily: "Nunito" }}
              >Nhận phần thưởng 🎁</motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. SLEEP PAGE
// ══════════════════════════════════════════════════════════════════════════════
function SleepPage({ ctx }: { ctx: GlobalCtx }) {
  const [bedH, setBedH]   = useState(22);
  const [bedM, setBedM]   = useState(30);
  const [wakeH, setWakeH] = useState(6);
  const [wakeM, setWakeM] = useState(30);
  const [quality, setQuality] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const ACT = ACTS.find(a => a.id === "sleep")!;

  const totalMins = ((wakeH * 60 + wakeM) - (bedH * 60 + bedM) + 1440) % 1440;
  const sleepH = Math.floor(totalMins / 60);
  const sleepM = totalMins % 60;

  const suggestion = sleepH < 6
    ? "Bạn cần ngủ nhiều hơn! Hãy thử đi ngủ sớm hơn 1–2 tiếng. 😔"
    : sleepH < 7
    ? "Gần đủ rồi! Thêm 1 tiếng nữa là lý tưởng. 🌙"
    : sleepH <= 9
    ? "Hoàn hảo! Đây là lượng ngủ lý tưởng cho sức khỏe. 🌟"
    : "Bạn ngủ nhiều hơn mức cần. Thử giảm xuống 7–9 tiếng nhé. 😌";

  const qualityLabels = ["😴 Rất tệ", "😔 Tệ", "😌 Bình thường", "😊 Tốt", "✨ Rất tốt"];

  const save = () => {
    setSaved(true);
    ctx.onComplete("sleep", "Ngủ đủ giấc", "🌙");
  };

  const TimePicker = ({ label, h, m, setH, setM }: { label: string; h: number; m: number; setH: (v: number) => void; setM: (v: number) => void }) => (
    <div className="flex-1 bg-white rounded-2xl p-4 text-center shadow-[0_4px_16px_rgba(195,180,232,0.1)]">
      <p className="text-xs text-[#9490A4] mb-3 font-semibold uppercase tracking-wider" style={{ fontFamily: "Be Vietnam Pro" }}>{label}</p>
      <div className="flex items-center justify-center gap-2">
        <div className="flex flex-col items-center gap-1">
          <button onClick={() => setH((h + 1) % 24)} className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: `${ACT.accent}22`, color: ACT.accent }}>↑</button>
          <p className="font-black text-2xl text-[#3D3547] w-8 text-center" style={{ fontFamily: "Nunito" }}>{String(h).padStart(2,"0")}</p>
          <button onClick={() => setH((h - 1 + 24) % 24)} className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: `${ACT.accent}22`, color: ACT.accent }}>↓</button>
        </div>
        <span className="font-black text-2xl text-[#C3B4E8]" style={{ fontFamily: "Nunito" }}>:</span>
        <div className="flex flex-col items-center gap-1">
          <button onClick={() => setM((m + 15) % 60)} className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: `${ACT.accent}22`, color: ACT.accent }}>↑</button>
          <p className="font-black text-2xl text-[#3D3547] w-8 text-center" style={{ fontFamily: "Nunito" }}>{String(m).padStart(2,"0")}</p>
          <button onClick={() => setM((m - 15 + 60) % 60)} className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: `${ACT.accent}22`, color: ACT.accent }}>↓</button>
        </div>
      </div>
    </div>
  );

  return (
    <PageShell title="Ngủ đủ giấc 🌙" accent={ACT.accent} bg={ACT.bg} onBack={() => ctx.navigate("selfcare")}>
      <div className="px-5 pt-6 flex flex-col gap-5">

        {/* Time pickers */}
        <div className="flex gap-3">
          <TimePicker label="Giờ ngủ" h={bedH} m={bedM} setH={setBedH} setM={setBedM} />
          <TimePicker label="Giờ dậy" h={wakeH} m={wakeM} setH={setWakeH} setM={setWakeM} />
        </div>

        {/* Duration display */}
        <motion.div
          key={`${sleepH}-${sleepM}`}
          initial={{ scale: 0.95, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl p-5 text-center relative overflow-hidden"
          style={{ background: `linear-gradient(135deg,${ACT.accent}33,${ACT.accent}11)`, border: `1.5px solid ${ACT.accent}44` }}
        >
          <FloatCircle size={80} color={ACT.accent} x="80%" y="-20px" opacity={0.15} />
          <p className="text-xs text-[#9490A4] mb-1 relative z-10" style={{ fontFamily: "Be Vietnam Pro" }}>Thời gian ngủ</p>
          <p className="font-black text-4xl relative z-10" style={{ color: ACT.accent, fontFamily: "Nunito" }}>
            {sleepH}h {sleepM > 0 ? `${sleepM}m` : ""}
          </p>
          <p className="text-xs text-[#9490A4] mt-2 relative z-10" style={{ fontFamily: "Be Vietnam Pro" }}>{suggestion}</p>
        </motion.div>

        {/* Sleep quality */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(195,180,232,0.1)]">
          <p className="font-bold text-[#3D3547] text-sm mb-4" style={{ fontFamily: "Nunito" }}>Chất lượng giấc ngủ</p>
          <div className="flex justify-between">
            {qualityLabels.map((label, i) => (
              <motion.button key={i} whileTap={{ scale: 0.88 }}
                onClick={() => setQuality(i)}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all"
                  style={{
                    background: quality === i ? `${ACT.accent}33` : "#F0EDF8",
                    border: `2px solid ${quality === i ? ACT.accent : "transparent"}`,
                    transform: quality === i ? "scale(1.15)" : "scale(1)",
                  }}
                >{label.split(" ")[0]}</div>
                <span className="text-[9px] text-[#9490A4] text-center" style={{ fontFamily: "Be Vietnam Pro" }}>{label.split(" ").slice(1).join(" ")}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(195,180,232,0.08)]">
          <p className="font-bold text-[#3D3547] text-sm mb-3" style={{ fontFamily: "Nunito" }}>Mẹo ngủ ngon hơn 💤</p>
          {["Tắt điện thoại 30 phút trước khi ngủ", "Giữ phòng ngủ mát và tối", "Uống trà hoa cúc thư giãn", "Thở sâu 5 lần trước khi nhắm mắt"].map((tip, i) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-xs"
                style={{ background: `${ACT.accent}33`, color: ACT.accent }}>✓</div>
              <p className="text-xs text-[#5E5870]" style={{ fontFamily: "Be Vietnam Pro" }}>{tip}</p>
            </div>
          ))}
        </div>

        {/* Save */}
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: `0 10px 30px ${ACT.accent}40` }}
          whileTap={{ scale: 0.97 }}
          onClick={save}
          className="py-4 rounded-2xl font-black text-white text-base"
          style={{ background: `linear-gradient(135deg,${ACT.accent},${ACT.accent}CC)`, fontFamily: "Nunito" }}
        >Lưu giấc ngủ 🌙</motion.button>
      </div>
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. EATING PAGE
// ══════════════════════════════════════════════════════════════════════════════
const MEALS = [
  { id: "morning", name: "Bữa sáng ☀️", items: ["Ăn đúng giờ (trước 9h)", "Ăn đủ chất đạm", "Ăn rau xanh hoặc trái cây", "Không bỏ bữa"] },
  { id: "noon",    name: "Bữa trưa 🌤",  items: ["Ăn đủ 4 nhóm thực phẩm", "Ăn rau xanh", "Ăn chậm nhai kỹ", "Uống nước sau ăn"] },
  { id: "evening", name: "Bữa tối 🌙",   items: ["Ăn nhẹ và sớm (trước 8h)", "Tránh đồ chiên xào", "Không ăn vặt sau bữa", "Nghỉ ngơi sau ăn 30 phút"] },
];

function EatingPage({ ctx }: { ctx: GlobalCtx }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [showPop, setShowPop] = useState(false);
  const ACT = ACTS.find(a => a.id === "eating")!;

  const total = MEALS.reduce((a, m) => a + m.items.length, 0);
  const done  = Object.values(checked).filter(Boolean).length;
  const allDone = done === total;

  const toggle = (key: string) => {
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (allDone && !showPop) setTimeout(() => setShowPop(true), 400);
  }, [allDone, showPop]);

  return (
    <PageShell title="Ăn uống lành mạnh 🥗" accent={ACT.accent} bg={ACT.bg} onBack={() => ctx.navigate("selfcare")}>
      <div className="px-5 pt-6 flex flex-col gap-5">

        {/* Overall progress */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgba(123,191,168,0.1)]">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-[#3D3547] text-sm" style={{ fontFamily: "Nunito" }}>Tiến trình hôm nay</p>
            <span className="font-black text-sm" style={{ color: ACT.accent, fontFamily: "Nunito" }}>{done}/{total}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "#F0EDF8" }}>
            <motion.div className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg,${ACT.accent},${ACT.accent}99)` }}
              animate={{ width: `${(done / total) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Meal checklists */}
        {MEALS.map(meal => (
          <div key={meal.id} className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(123,191,168,0.08)]">
            <p className="font-bold text-[#3D3547] mb-4" style={{ fontFamily: "Nunito" }}>{meal.name}</p>
            {meal.items.map((item, i) => {
              const key = `${meal.id}-${i}`;
              const isChecked = !!checked[key];
              return (
                <motion.button key={key} whileTap={{ scale: 0.97 }}
                  onClick={() => toggle(key)}
                  className="w-full flex items-center gap-3 mb-3 text-left"
                >
                  <motion.div
                    className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center border-2 transition-all"
                    style={{
                      background: isChecked ? ACT.accent : "transparent",
                      borderColor: isChecked ? ACT.accent : "rgba(180,170,200,0.5)",
                    }}
                    animate={isChecked ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.25 }}
                  >
                    {isChecked && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </motion.div>
                  <span className="text-sm flex-1 transition-colors"
                    style={{ color: isChecked ? "#9490A4" : "#3D3547", fontFamily: "Be Vietnam Pro",
                             textDecoration: isChecked ? "line-through" : "none" }}>
                    {item}
                  </span>
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Completion popup */}
      <AnimatePresence>
        {showPop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(61,53,71,0.55)", backdropFilter: "blur(10px)" }}>
            <Confetti />
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="bg-white rounded-[2rem] p-8 flex flex-col items-center text-center max-w-xs w-full mx-4 shadow-2xl">
              <motion.div className="text-6xl mb-3" animate={{ rotate: [0, -10, 10, -8, 8, 0] }} transition={{ duration: 0.8 }}>🥗</motion.div>
              <h3 className="font-black text-2xl text-[#3D3547] mb-1" style={{ fontFamily: "Nunito" }}>Ăn uống lành mạnh!</h3>
              <p className="text-[#9490A4] text-sm mb-6" style={{ fontFamily: "Be Vietnam Pro" }}>
                Bạn đã hoàn thành tất cả {total} mục tiêu dinh dưỡng hôm nay! 🎉
              </p>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => { setShowPop(false); ctx.onComplete("eating", "Ăn uống lành mạnh", "🥗"); ctx.navigate("selfcare"); }}
                className="w-full py-3.5 rounded-2xl font-black text-white text-sm"
                style={{ background: `linear-gradient(135deg,${ACT.accent},${ACT.accent}CC)`, fontFamily: "Nunito" }}
              >Tuyệt vời! 🌱</motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. READING PAGE
// ══════════════════════════════════════════════════════════════════════════════
function ReadingPage({ ctx }: { ctx: GlobalCtx }) {
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState([
    { date: "Hôm qua", dur: "23 phút", book: "Đắc Nhân Tâm" },
    { date: "13/07", dur: "45 phút", book: "Nhà Giả Kim" },
  ]);
  const [quotes, setQuotes] = useState([
    { text: "Khi bạn thực sự muốn điều gì, cả vũ trụ sẽ hợp sức giúp bạn.", from: "Nhà Giả Kim" },
  ]);
  const [newQuote, setNewQuote] = useState("");
  const [newFrom, setNewFrom] = useState("");
  const [saved, setSaved] = useState(false);
  const ACT = ACTS.find(a => a.id === "reading")!;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const stop = () => {
    setRunning(false);
    if (secs > 30) {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      const dur = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m} phút ${s > 0 ? s+"s" : ""}` : `${s} giây`;
      setHistory(prev => [{ date: "Hôm nay", dur, book: "Không xác định" }, ...prev]);
      setSecs(0);
      ctx.onComplete("reading", "Đọc sách", "📚");
      setSaved(true);
    }
  };

  const addQuote = () => {
    if (newQuote.trim()) {
      setQuotes(prev => [{ text: newQuote.trim(), from: newFrom || "Không rõ" }, ...prev]);
      setNewQuote(""); setNewFrom("");
    }
  };

  const dispSecs = secs;
  const h = Math.floor(dispSecs / 3600);
  const m = Math.floor((dispSecs % 3600) / 60);
  const s = dispSecs % 60;

  return (
    <PageShell title="Đọc sách 📚" accent={ACT.accent} bg={ACT.bg} onBack={() => ctx.navigate("selfcare")}>
      <div className="px-5 pt-6 flex flex-col gap-5">

        {/* Timer card */}
        <div className="bg-white rounded-3xl p-6 text-center shadow-[0_8px_30px_rgba(245,168,123,0.12)] relative overflow-hidden">
          <FloatCircle size={90} color={ACT.accent} x="80%" y="-10px" opacity={0.15} />
          <p className="text-xs text-[#9490A4] mb-2 font-semibold uppercase tracking-wider relative z-10" style={{ fontFamily: "Be Vietnam Pro" }}>
            {running ? "Đang đọc" : saved ? "Đã lưu phiên đọc ✓" : "Sẵn sàng đọc?"}
          </p>
          <p className="font-black relative z-10" style={{ fontFamily: "Nunito", fontSize: "clamp(2.5rem,8vw,3.5rem)", color: ACT.accent }}>
            {String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}
          </p>

          {running && (
            <motion.div className="flex justify-center gap-1 mt-3 relative z-10">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-1.5 h-4 rounded-full"
                  style={{ background: ACT.accent }}
                  animate={{ scaleY: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </motion.div>
          )}

          <div className="flex gap-3 mt-5 relative z-10">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
              onClick={() => setRunning(!running)}
              className="flex-1 py-3.5 rounded-2xl font-black text-sm text-white"
              style={{ background: `linear-gradient(135deg,${ACT.accent},${ACT.accent}CC)`, fontFamily: "Nunito" }}
            >{running ? "⏸ Tạm dừng" : "▶ Bắt đầu"}</motion.button>
            {(running || secs > 0) && (
              <motion.button whileTap={{ scale: 0.96 }}
                onClick={stop}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm"
                style={{ background: "#F7F4FC", color: "#9490A4", fontFamily: "Nunito" }}
              >⏹ Dừng & Lưu</motion.button>
            )}
          </div>
        </div>

        {/* Reading history */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(245,168,123,0.08)]">
          <p className="font-bold text-[#3D3547] mb-3" style={{ fontFamily: "Nunito" }}>Lịch sử đọc sách</p>
          {history.length === 0 ? (
            <p className="text-xs text-[#9490A4] text-center py-4" style={{ fontFamily: "Be Vietnam Pro" }}>Chưa có phiên đọc nào 📖</p>
          ) : (
            history.map((h, i) => (
              <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${ACT.accent}22` }}>📖</div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#3D3547]" style={{ fontFamily: "Nunito" }}>{h.book}</p>
                  <p className="text-[10px] text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>{h.date} · {h.dur}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Favorite quotes */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(245,168,123,0.08)]">
          <p className="font-bold text-[#3D3547] mb-3" style={{ fontFamily: "Nunito" }}>Câu trích yêu thích ✨</p>
          {quotes.map((q, i) => (
            <div key={i} className="mb-3 p-3 rounded-2xl" style={{ background: `${ACT.accent}15` }}>
              <p className="text-xs text-[#3D3547] italic mb-1" style={{ fontFamily: "Be Vietnam Pro" }}>"{q.text}"</p>
              <p className="text-[10px] text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>— {q.from}</p>
            </div>
          ))}
          <textarea value={newQuote} onChange={e => setNewQuote(e.target.value)}
            placeholder="Thêm câu trích mới..."
            className="w-full resize-none rounded-xl p-3 text-xs outline-none mt-2"
            style={{ background: "#F7F4FC", color: "#3D3547", fontFamily: "Be Vietnam Pro", border: `1.5px solid ${ACT.accent}33` }}
            rows={2} />
          <input value={newFrom} onChange={e => setNewFrom(e.target.value)}
            placeholder="Nguồn (tên sách, tác giả...)"
            className="w-full rounded-xl p-3 text-xs outline-none mt-2"
            style={{ background: "#F7F4FC", color: "#3D3547", fontFamily: "Be Vietnam Pro", border: `1.5px solid ${ACT.accent}33` }} />
          <motion.button whileTap={{ scale: 0.96 }} onClick={addQuote}
            className="w-full mt-3 py-2.5 rounded-xl font-bold text-sm"
            style={{ background: `${ACT.accent}22`, color: ACT.accent, fontFamily: "Nunito" }}
          >+ Thêm câu trích</motion.button>
        </div>
      </div>
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 7. RELAX PAGE
// ══════════════════════════════════════════════════════════════════════════════
const SOUNDS = [
  { id: "nature", name: "Thiên nhiên", emoji: "🌿", color: "#EEF8F4", wave: "#7BBFA8", bg: "linear-gradient(135deg,#EEF8F4,#D4F1E8)" },
  { id: "rain",   name: "Mưa rơi",     emoji: "🌧️", color: "#EDF5FB", wave: "#7AB8D8", bg: "linear-gradient(135deg,#EDF5FB,#D0E8F5)" },
  { id: "ocean",  name: "Biển cả",     emoji: "🌊", color: "#EEF5FB", wave: "#5B9FD8", bg: "linear-gradient(135deg,#EEF5FB,#C8DEFA)" },
  { id: "white",  name: "White Noise", emoji: "🌫️", color: "#F5F0FB", wave: "#C3B4E8", bg: "linear-gradient(135deg,#F5F0FB,#E8DCF8)" },
];

function RelaxPage({ ctx }: { ctx: GlobalCtx }) {
  const [sel, setSel]         = useState(SOUNDS[0]);
  const [playing, setPlaying] = useState(false);
  const [vol, setVol]         = useState(70);
  const [timerMins, setTimerMins] = useState(10);
  const { secs, running, done, start, pause, reset } = useCountdown(timerMins * 60);
  const ACT = ACTS.find(a => a.id === "relax")!;

  useEffect(() => { if (done) { setPlaying(false); ctx.onComplete("relax", "Thư giãn", "🎵"); } }, [done]); // eslint-disable-line

  const togglePlay = () => {
    if (!playing) { setPlaying(true); if (!running && secs === timerMins * 60) start(); else start(); }
    else { setPlaying(false); pause(); }
  };

  const selectSound = (s: typeof SOUNDS[0]) => {
    setSel(s); setPlaying(false); pause(); reset(timerMins * 60);
  };

  return (
    <PageShell title="Thư giãn 🎵" accent={ACT.accent} bg="#F7F4FC" onBack={() => ctx.navigate("selfcare")}>
      {/* Animated background */}
      <div className="relative overflow-hidden mx-5 mt-6 rounded-3xl" style={{ height: 200, background: sel.bg }}>
        <FloatCircle size={120} color={sel.wave} x="-10%" y="-20%" opacity={0.25} dur={8} blur={20} />
        <FloatCircle size={80} color={sel.wave} x="70%" y="30%" delay={1.5} opacity={0.2} dur={10} blur={15} />
        <FloatCircle size={50} color={sel.wave} x="30%" y="60%" delay={3} opacity={0.3} dur={7} />

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div className="text-5xl mb-2"
            animate={playing ? { scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >{sel.emoji}</motion.div>
          <p className="font-black text-white text-base" style={{ fontFamily: "Nunito", textShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
            {playing ? sel.name : "Chọn âm thanh"}
          </p>
          {playing && (
            <div className="flex gap-1 mt-2">
              {[1,2,3,4,5,6,7,8].map(i => (
                <motion.div key={i} className="w-1 rounded-full"
                  style={{ background: "rgba(255,255,255,0.7)" }}
                  animate={{ height: [4, 4 + Math.random() * 16, 4] }}
                  transition={{ duration: 0.4 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 mt-5 flex flex-col gap-4">
        {/* Sound selector */}
        <div className="grid grid-cols-2 gap-3">
          {SOUNDS.map(s => (
            <motion.button key={s.id} whileTap={{ scale: 0.95 }}
              onClick={() => selectSound(s)}
              className="flex items-center gap-3 p-3.5 rounded-2xl transition-all"
              style={{
                background: sel.id === s.id ? s.color : "#FFFFFF",
                border: `1.5px solid ${sel.id === s.id ? s.wave + "77" : "rgba(180,170,200,0.2)"}`,
                boxShadow: sel.id === s.id ? `0 4px 16px ${s.wave}30` : "none",
              }}
            >
              <span className="text-2xl">{s.emoji}</span>
              <span className="text-xs font-bold text-[#3D3547]" style={{ fontFamily: "Nunito" }}>{s.name}</span>
              {sel.id === s.id && playing && (
                <div className="ml-auto flex gap-0.5">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-0.5 rounded-full"
                      style={{ background: s.wave, height: 12 }}
                      animate={{ scaleY: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Player controls */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(168,200,232,0.12)]">
          {/* Volume */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm">🔈</span>
            <input type="range" min={0} max={100} value={vol}
              onChange={e => setVol(Number(e.target.value))}
              className="flex-1 accent-[#A8C8E8] h-2 rounded-full" />
            <span className="text-sm">🔊</span>
            <span className="text-xs text-[#9490A4] w-8 text-right" style={{ fontFamily: "Nunito" }}>{vol}%</span>
          </div>

          {/* Timer selector */}
          <div className="flex gap-2 mb-4">
            {[5, 10, 15, 30].map(m => (
              <motion.button key={m} whileTap={{ scale: 0.93 }}
                onClick={() => { setTimerMins(m); reset(m * 60); }}
                className="flex-1 py-2 rounded-xl text-xs font-bold"
                style={{
                  background: timerMins === m ? ACT.accent : "#F0EDF8",
                  color: timerMins === m ? "#fff" : "#9490A4",
                  fontFamily: "Nunito",
                }}
              >{m}p</motion.button>
            ))}
          </div>

          {/* Countdown display */}
          <div className="text-center mb-4">
            <p className="font-black text-3xl" style={{ color: ACT.accent, fontFamily: "Nunito" }}>{fmt(secs)}</p>
            <p className="text-xs text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>còn lại</p>
          </div>

          {/* Play / Pause */}
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            onClick={togglePlay}
            className="w-full py-4 rounded-2xl font-black text-white text-base"
            style={{
              background: playing
                ? "linear-gradient(135deg,#F4C0C0,#F5D0BE)"
                : `linear-gradient(135deg,${ACT.accent},${ACT.accent}CC)`,
              fontFamily: "Nunito",
            }}
          >{playing ? "⏸ Tạm dừng" : "▶ Phát"}</motion.button>
        </div>
      </div>
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 8. GRATITUDE PAGE
// ══════════════════════════════════════════════════════════════════════════════
function GratitudePage({ ctx }: { ctx: GlobalCtx }) {
  const prompts = [
    "Điều gì hôm nay làm bạn mỉm cười? 😊",
    "Một người bạn biết ơn vì sự hiện diện của họ? 💙",
    "Điều nhỏ bé nào khiến bạn cảm thấy ấm lòng? 🌸",
  ];
  const [values, setValues] = useState(["", "", ""]);
  const [showBloom, setShowBloom] = useState(false);
  const [history, setHistory] = useState([
    { date: "Hôm qua", items: ["Buổi sáng có nắng", "Bạn Hân nhắn tin hỏi thăm", "Cốc trà sữa ngon tuyệt"] },
  ]);
  const ACT = ACTS.find(a => a.id === "gratitude")!;

  const allFilled = values.every(v => v.trim().length > 0);

  const save = () => {
    if (!allFilled) return;
    setShowBloom(true);
    setHistory(prev => [{ date: "Hôm nay", items: [...values] }, ...prev]);
    setTimeout(() => {
      setShowBloom(false);
      ctx.onComplete("gratitude", "Biết ơn", "🌸");
      ctx.navigate("selfcare");
    }, 2800);
  };

  return (
    <PageShell title="Biết ơn 🌸" accent={ACT.accent} bg={ACT.bg} onBack={() => ctx.navigate("selfcare")}>
      <div className="px-5 pt-6 flex flex-col gap-5">

        <div className="text-center px-4">
          <p className="text-sm text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>
            Hãy viết 3 điều bạn biết ơn hôm nay. Chúng không cần to lớn — mỗi điều nhỏ đều có ý nghĩa. 🌿
          </p>
        </div>

        {/* 3 gratitude cards */}
        {prompts.map((prompt, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(232,123,168,0.1)]"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                style={{ background: ACT.accent, fontFamily: "Nunito" }}>{i + 1}</div>
              <p className="text-xs text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>{prompt}</p>
            </div>
            <textarea
              value={values[i]}
              onChange={e => { const n = [...values]; n[i] = e.target.value; setValues(n); }}
              placeholder="Viết ra đây..."
              className="w-full resize-none rounded-xl p-3 text-sm outline-none"
              style={{
                background: values[i] ? `${ACT.accent}15` : "#F7F4FC",
                color: "#3D3547", fontFamily: "Be Vietnam Pro",
                border: `1.5px solid ${values[i] ? ACT.accent + "55" : "transparent"}`,
              }}
              rows={2}
            />
          </motion.div>
        ))}

        {/* Save */}
        <motion.button
          whileHover={{ scale: allFilled ? 1.02 : 1 }}
          whileTap={{ scale: allFilled ? 0.97 : 1 }}
          onClick={save}
          className="py-4 rounded-2xl font-black text-white text-base transition-all"
          style={{
            background: allFilled
              ? `linear-gradient(135deg,${ACT.accent},#F5A0C0)`
              : "#E8E4F4",
            color: allFilled ? "#fff" : "#C0B8D0",
            fontFamily: "Nunito",
            boxShadow: allFilled ? `0 8px 24px ${ACT.accent}40` : "none",
          }}
        >Lưu lại 🌸 {!allFilled && `(${values.filter(v => v.trim()).length}/3)`}</motion.button>

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(232,123,168,0.08)]">
            <p className="font-bold text-[#3D3547] mb-3" style={{ fontFamily: "Nunito" }}>Những lần biết ơn trước</p>
            {history.map((h, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <p className="text-[10px] text-[#9490A4] mb-1.5 font-semibold uppercase tracking-wider" style={{ fontFamily: "Be Vietnam Pro" }}>{h.date}</p>
                {h.items.map((item, j) => (
                  <div key={j} className="flex items-start gap-2 mb-1">
                    <span className="text-xs mt-0.5">{["🌸", "💙", "✨"][j]}</span>
                    <p className="text-xs text-[#5E5870]" style={{ fontFamily: "Be Vietnam Pro" }}>{item}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flower bloom overlay */}
      <AnimatePresence>
        {showBloom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(255,240,246,0.92)", backdropFilter: "blur(12px)" }}>
            <div className="relative flex items-center justify-center">
              {/* Petals */}
              {Array.from({ length: 12 }, (_, i) => {
                const angle = (i / 12) * 360;
                return (
                  <motion.div key={i}
                    className="absolute w-8 h-14 rounded-full"
                    style={{ background: `${ACT.accent}${i % 2 === 0 ? "CC" : "88"}`, transformOrigin: "50% 100%" }}
                    initial={{ scale: 0, rotate: angle, y: -20 }}
                    animate={{ scale: 1, y: -40 }}
                    transition={{ duration: 0.6, delay: i * 0.06, ease: "backOut" }}
                  />
                );
              })}
              {/* Center */}
              <motion.div
                className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#FDE68A,#F5D060)" }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
              >
                <span className="text-3xl">🌸</span>
              </motion.div>
            </div>
            <motion.p
              className="absolute bottom-1/3 font-black text-xl text-[#3D3547]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              style={{ fontFamily: "Nunito" }}
            >Cảm ơn vì biết ơn! 🌸</motion.p>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 9. MEDITATION PAGE
// ══════════════════════════════════════════════════════════════════════════════
function MeditationPage({ ctx }: { ctx: GlobalCtx }) {
  const durations = [5, 10, 15, 20];
  const [durIdx, setDurIdx] = useState(0);
  const { secs, running, done, start, pause, reset } = useCountdown(durations[durIdx] * 60);
  const [showCelebration, setShowCelebration] = useState(false);
  const ACT = ACTS.find(a => a.id === "meditation")!;
  const total = durations[durIdx] * 60;
  const progress = 1 - secs / total;
  const R = 110;
  const circ = 2 * Math.PI * R;

  useEffect(() => {
    if (done) { setShowCelebration(true); ctx.onComplete("meditation", "Thiền", "🧘"); }
  }, [done]); // eslint-disable-line

  const encouragements = [
    "Hít vào bình yên... thở ra lo lắng... 🌿",
    "Chú ý đến hơi thở, thả lỏng mọi suy nghĩ 🌊",
    "Bạn đang làm rất tốt. Tiếp tục nhé 💙",
  ];
  const [encIdx, setEncIdx] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setEncIdx(p => (p + 1) % encouragements.length), 6000);
    return () => clearInterval(t);
  }, [running]); // eslint-disable-line

  return (
    <PageShell title="Thiền 🧘" accent={ACT.accent} bg={ACT.bg} onBack={() => ctx.navigate("selfcare")}>
      <div className="px-5 pt-6 flex flex-col items-center gap-6">

        {/* Duration tabs */}
        <div className="flex gap-2 w-full">
          {durations.map((d, i) => (
            <motion.button key={d} whileTap={{ scale: 0.93 }}
              onClick={() => { if (!running) { setDurIdx(i); reset(d * 60); } }}
              className="flex-1 py-2.5 rounded-2xl text-sm font-bold"
              style={{
                background: durIdx === i ? ACT.accent : "#FFFFFF",
                color: durIdx === i ? "#fff" : "#9490A4",
                fontFamily: "Nunito",
                border: `1.5px solid ${durIdx === i ? ACT.accent : "rgba(180,170,200,0.25)"}`,
                opacity: running ? 0.6 : 1,
              }}
            >{d}p</motion.button>
          ))}
        </div>

        {/* Meditation orb */}
        <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
          {/* Ambient rings */}
          {running && [1, 2, 3].map(i => (
            <motion.div key={i}
              className="absolute rounded-full border"
              style={{ width: 120 + i * 50, height: 120 + i * 50, borderColor: `${ACT.accent}${30 - i * 8}` }}
              animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.1, 0.4] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: i * 1.5 }}
            />
          ))}

          {/* Progress ring */}
          <svg className="absolute inset-0" width="280" height="280">
            <circle cx="140" cy="140" r={R} fill="none" stroke={`${ACT.accent}20`} strokeWidth="8" />
            <circle cx="140" cy="140" r={R} fill="none" stroke={ACT.accent} strokeWidth="8"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
              strokeLinecap="round" transform="rotate(-90 140 140)"
              style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>

          {/* Core orb */}
          <motion.div
            className="rounded-full flex flex-col items-center justify-center"
            style={{
              width: 180, height: 180,
              background: `radial-gradient(circle at 38% 35%,${ACT.accent}CC,${ACT.accent}55)`,
              boxShadow: `0 0 60px ${ACT.accent}66`,
            }}
            animate={{ scale: running ? [1, 1.06, 1] : 1 }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-4xl">{running ? "🌀" : "🧘"}</span>
            <p className="font-black text-white text-sm mt-1" style={{ fontFamily: "Nunito" }}>
              {fmt(secs)}
            </p>
          </motion.div>
        </div>

        {/* Encouragement */}
        <div className="min-h-[40px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {running && (
              <motion.p
                key={encIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-sm text-center"
                style={{ color: ACT.accent, fontFamily: "Be Vietnam Pro" }}
              >{encouragements[encIdx]}</motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex gap-3 w-full">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
            onClick={running ? pause : start}
            className="flex-1 py-4 rounded-2xl font-black text-white text-base"
            style={{ background: `linear-gradient(135deg,${ACT.accent},${ACT.accent}99)`, fontFamily: "Nunito", boxShadow: `0 8px 24px ${ACT.accent}40` }}
          >{running ? "⏸ Tạm dừng" : "🧘 Bắt đầu"}</motion.button>
          {(running || (!running && secs < total)) && (
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => { pause(); ctx.onComplete("meditation","Thiền","🧘"); ctx.navigate("selfcare"); }}
              className="py-4 px-5 rounded-2xl font-bold text-sm"
              style={{ background: "#FFFFFF", border: `1.5px solid ${ACT.accent}44`, color: ACT.accent, fontFamily: "Nunito" }}
            >✓ Xong</motion.button>
          )}
        </div>

        {/* Tips */}
        <div className="w-full bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(155,143,216,0.1)]">
          <p className="font-bold text-[#3D3547] text-sm mb-3" style={{ fontFamily: "Nunito" }}>Mẹo thiền hiệu quả</p>
          {["Ngồi thoải mái, cột sống thẳng", "Nhắm nhẹ mắt hoặc nhìn xuống đất", "Theo dõi hơi thở – không cố kiểm soát", "Khi suy nghĩ xuất hiện, nhẹ nhàng quay lại hơi thở"].map((tip, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <div className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-[8px] font-bold text-white"
                style={{ background: ACT.accent, fontFamily: "Nunito" }}>{i+1}</div>
              <p className="text-xs text-[#5E5870]" style={{ fontFamily: "Be Vietnam Pro" }}>{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: "rgba(240,238,248,0.96)", backdropFilter: "blur(16px)" }}>
            <Confetti />
            {Array.from({ length: 12 }, (_, i) => (
              <FloatCircle key={i}
                size={10 + Math.random() * 30}
                color={["#C3B4E8","#7BBFA8","#F5D0BE","#A8D4E8","#FDE68A"][i%5]}
                x={`${Math.random() * 100}%`}
                y={`${Math.random() * 100}%`}
                delay={Math.random() * 2}
                opacity={0.6}
              />
            ))}
            <motion.div className="flex flex-col items-center text-center px-8"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", delay: 0.3 }}>
              <motion.div className="text-7xl mb-4"
                animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 1.2 }}>🧘</motion.div>
              <h2 className="font-black text-3xl text-[#3D3547] mb-2" style={{ fontFamily: "Nunito" }}>Tâm hồn bình yên</h2>
              <p className="text-[#9490A4] mb-8" style={{ fontFamily: "Be Vietnam Pro" }}>
                Bạn đã hoàn thành {durations[durIdx]} phút thiền. Cảm ơn vì đã dành thời gian cho chính mình 💙
              </p>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => { setShowCelebration(false); ctx.navigate("selfcare"); }}
                className="px-10 py-4 rounded-2xl font-black text-white"
                style={{ background: `linear-gradient(135deg,${ACT.accent},#A8C8E8)`, fontFamily: "Nunito" }}
              >Về trang chủ 🏠</motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HOMEPAGE COMPONENTS (preserved from original)
// ══════════════════════════════════════════════════════════════════════════════
const navLinks = ["Trang chủ", "Nhật ký", "Khám phá", "Cộng đồng", "Trợ lý"];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 flex-shrink-0">
        <div className="absolute w-6 h-6 rounded-full top-0 left-0" style={{ background: "#7BBFA8" }} />
        <div className="absolute w-5 h-5 rounded-full bottom-0 right-0" style={{ background: "#C3B4E8" }} />
        <div className="absolute w-3.5 h-3.5 rounded-full top-1 right-0.5" style={{ background: "#F5D0BE" }} />
        <div className="absolute w-2.5 h-2.5 rounded-full bottom-1 left-1" style={{ background: "#A8D4E8" }} />
      </div>
      <div className="flex flex-col">
        <span className="font-black text-[#3D3547] text-[15px] leading-tight" style={{ fontFamily: "Nunito" }}>Những Chấm Tròn</span>
        <span className="text-[10px] text-[#9490A4] tracking-wider leading-tight" style={{ fontFamily: "Be Vietnam Pro" }}>Cảm Xúc</span>
      </div>
    </div>
  );
}

function Navbar({ scrolled, navigate }: { scrolled: boolean; navigate: (p: PageName) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4"
        animate={{
          background: scrolled ? "rgba(255,248,243,0.92)" : "rgba(255,248,243,0.0)",
          boxShadow: scrolled ? "0 2px 30px rgba(180,160,220,0.10)" : "none",
          backdropFilter: scrolled ? "blur(20px)" : "blur(0px)",
        }}
        transition={{ duration: 0.3 }}
      >
        <Logo />
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link, i) => (
            <motion.a key={link} href="#"
              className="text-sm font-semibold transition-colors"
              style={{ color: i === 0 ? "#7BBFA8" : "#9490A4", fontFamily: "Be Vietnam Pro" }}
              whileHover={{ color: "#7BBFA8", y: -1 }}
              onClick={(e) => { e.preventDefault(); if (i === 0) navigate("home"); else if (i === 1) navigate("journal-history"); }}>
              {link}
            </motion.a>
          ))}
          <motion.a href="#"
            onClick={(e) => { e.preventDefault(); navigate("selfcare"); }}
            className="text-sm font-semibold transition-colors"
            style={{ color: "#9490A4", fontFamily: "Be Vietnam Pro" }}
            whileHover={{ color: "#7BBFA8", y: -1 }}>
            Tự chăm sóc
          </motion.a>
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="px-5 py-2.5 rounded-2xl text-sm font-bold border-2"
            style={{ borderColor: "#7BBFA8", color: "#7BBFA8", fontFamily: "Nunito" }}>
            Đăng nhập
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(123,191,168,0.35)" }}
            whileTap={{ scale: 0.97 }}
            className="px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#7BBFA8,#9BCFC0)", fontFamily: "Nunito" }}>
            Bắt đầu miễn phí
          </motion.button>
        </div>
        <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={() => setMenuOpen(!menuOpen)}>
          <motion.span animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 8 : 0 }} className="block w-6 h-0.5 rounded-full" style={{ background: "#3D3547" }} />
          <motion.span animate={{ opacity: menuOpen ? 0 : 1 }} className="block w-6 h-0.5 rounded-full" style={{ background: "#3D3547" }} />
          <motion.span animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -8 : 0 }} className="block w-6 h-0.5 rounded-full" style={{ background: "#3D3547" }} />
        </button>
      </motion.header>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-4 right-4 z-40 rounded-3xl p-6 flex flex-col gap-4"
            style={{ background: "rgba(255,255,255,0.97)", boxShadow: "0 20px 60px rgba(180,160,220,0.2)" }}
          >
            {[...navLinks, "Tự chăm sóc"].map(link => (
              <a key={link} href="#"
                className="text-base font-bold text-[#3D3547] py-1"
                style={{ fontFamily: "Nunito" }}
                onClick={(e) => { e.preventDefault(); setMenuOpen(false); if (link === "Tự chăm sóc") navigate("selfcare"); else if (link === "Nhật ký") navigate("journal-history"); else if (link === "Trang chủ") navigate("home"); }}>
                {link}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: "rgba(180,170,200,0.2)" }}>
              <button className="py-3 rounded-2xl font-bold text-sm border-2" style={{ borderColor: "#7BBFA8", color: "#7BBFA8", fontFamily: "Nunito" }}>Đăng nhập</button>
              <button className="py-3 rounded-2xl font-bold text-sm text-white" style={{ background: "linear-gradient(135deg,#7BBFA8,#9BCFC0)", fontFamily: "Nunito" }}>Bắt đầu miễn phí</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Hero() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 text-center"
      style={{ background: "linear-gradient(160deg,#FFF8F3 0%,#F5EFF8 50%,#EDF5F8 100%)" }}>
      <FloatCircle size={500} color="#C3B4E8" x="-12%" y="-8%" opacity={0.18} dur={9} blur={60} />
      <FloatCircle size={420} color="#7BBFA8" x="60%" y="-5%" delay={2} opacity={0.15} dur={11} blur={70} />
      <FloatCircle size={320} color="#F5D0BE" x="75%" y="55%" delay={1} opacity={0.2} dur={8} blur={50} />
      <FloatCircle size={260} color="#A8D4E8" x="-8%" y="65%" delay={3} opacity={0.18} dur={10} blur={45} />
      <FloatCircle size={90} color="#7BBFA8" x="8%" y="18%" delay={0.5} opacity={0.55} dur={7} />
      <FloatCircle size={60} color="#C3B4E8" x="85%" y="22%" delay={1.2} opacity={0.6} dur={6} />
      <FloatCircle size={44} color="#F5D0BE" x="80%" y="70%" delay={2.5} opacity={0.65} dur={8} />
      <FloatCircle size={36} color="#A8D4E8" x="12%" y="78%" delay={1.8} opacity={0.6} dur={9} />
      <FloatCircle size={28} color="#F4C0C0" x="50%" y="85%" delay={0.8} opacity={0.5} dur={7} />
      <FloatCircle size={22} color="#FDE68A" x="25%" y="14%" delay={3.2} opacity={0.6} dur={6} />
      <FloatCircle size={18} color="#7BBFA8" x="68%" y="82%" delay={2} opacity={0.5} dur={8} />
      <FloatCircle size={14} color="#C3B4E8" x="92%" y="48%" delay={1} opacity={0.55} dur={5} />
      <FloatCircle size={52} color="#BBF7D0" x="3%" y="44%" delay={4} opacity={0.45} dur={10} />
      <motion.div style={{ y, opacity }} className="relative z-10 flex flex-col items-center max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8 flex items-center gap-2 px-5 py-2.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(195,180,232,0.35)", boxShadow: "0 4px 20px rgba(195,180,232,0.15)" }}>
          <span className="text-base">🌿</span>
          <span className="text-xs font-semibold text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>Không gian an toàn cho tâm hồn bạn</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }}
          className="font-black leading-tight text-[#3D3547]"
          style={{ fontFamily: "Nunito", fontSize: "clamp(2.6rem,7vw,4.5rem)", letterSpacing: "-0.01em" }}>
          Những Chấm Tròn{" "}
          <span className="relative inline-block"
            style={{ background: "linear-gradient(135deg,#7BBFA8 0%,#C3B4E8 60%,#F5A87B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Cảm Xúc
          </span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-5 text-[#9490A4] font-medium"
          style={{ fontFamily: "Be Vietnam Pro", fontSize: "clamp(1rem,3vw,1.3rem)", letterSpacing: "0.01em" }}>
          Mỗi cảm xúc đều xứng đáng được lắng nghe.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.6 }}
          className="mt-10 flex flex-wrap gap-4 justify-center">
          <motion.button whileHover={{ scale: 1.04, boxShadow: "0 12px 36px rgba(123,191,168,0.4)" }} whileTap={{ scale: 0.97 }}
            className="px-8 py-4 rounded-2xl text-white font-black text-base shadow-lg"
            style={{ background: "linear-gradient(135deg,#7BBFA8,#9BCFC0)", fontFamily: "Nunito" }}>
            Bắt đầu hành trình 🌱
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="px-8 py-4 rounded-2xl font-bold text-base"
            style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(195,180,232,0.45)", color: "#3D3547", fontFamily: "Nunito" }}>
            Tìm hiểu thêm ✨
          </motion.button>
        </motion.div>
        <motion.div className="absolute -top-8 -left-4 w-5 h-5 rounded-full pointer-events-none"
          style={{ background: "#FDE68A", opacity: 0.8 }}
          animate={{ y: [0, -8, 0], rotate: [0, 360] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute top-6 -right-6 w-4 h-4 rounded-full pointer-events-none"
          style={{ background: "#F4C0C0", opacity: 0.75 }}
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 flex justify-center pt-2" style={{ borderColor: "rgba(148,144,164,0.4)" }}>
          <div className="w-1.5 h-2.5 rounded-full" style={{ background: "#9490A4", opacity: 0.5 }} />
        </motion.div>
      </motion.div>
    </section>
  );
}

function Introduction() {
  return (
    <section className="relative py-24 px-6 overflow-hidden" style={{ background: "#FFFFFF" }}>
      <FloatCircle size={180} color="#7BBFA8" x="-6%" y="10%" opacity={0.12} dur={9} blur={30} />
      <FloatCircle size={140} color="#C3B4E8" x="88%" y="55%" delay={2} opacity={0.14} dur={8} blur={25} />
      <FloatCircle size={48} color="#F5D0BE" x="90%" y="8%" delay={1} opacity={0.55} dur={7} />
      <FloatCircle size={34} color="#A8D4E8" x="5%" y="85%" delay={3} opacity={0.5} dur={9} />
      <FloatCircle size={22} color="#FDE68A" x="48%" y="5%" delay={2} opacity={0.55} dur={6} />
      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }}
          className="flex items-center gap-3 mb-8">
          <div className="flex gap-1.5">
            {["#7BBFA8","#C3B4E8","#F5D0BE"].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}
          </div>
          <span className="text-xs font-semibold text-[#9490A4] tracking-widest uppercase" style={{ fontFamily: "Be Vietnam Pro" }}>Về chúng mình</span>
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7 }}
          className="font-black text-[#3D3547] mb-8"
          style={{ fontFamily: "Nunito", fontSize: "clamp(1.7rem,4vw,2.6rem)", lineHeight: 1.25 }}>
          Mọi cảm xúc đều có chỗ đứng của nó 💙
        </motion.h2>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, delay: 0.15 }} className="space-y-6">
          <p className="text-[#5E5870] leading-[1.9]" style={{ fontFamily: "Be Vietnam Pro", fontSize: "clamp(0.95rem,2vw,1.08rem)" }}>
            Ai cũng có những <span className="font-bold" style={{ color: "#7BBFA8" }}>"chấm tròn cảm xúc"</span> của riêng mình. Có những chấm tròn rực rỡ của niềm vui, nhưng cũng có những chấm tròn mang màu của nỗi buồn, sự lo lắng hay cô đơn. Dù là cảm xúc nào, chúng đều xứng đáng được lắng nghe và thấu hiểu.
          </p>
          <p className="text-[#5E5870] leading-[1.9]" style={{ fontFamily: "Be Vietnam Pro", fontSize: "clamp(0.95rem,2vw,1.08rem)" }}>
            <span className="font-bold" style={{ color: "#C3B4E8" }}>"Những Chấm Tròn Cảm Xúc"</span> được tạo ra như một không gian an toàn, nơi bạn có thể chia sẻ suy nghĩ, lưu giữ hành trình cảm xúc, học cách yêu thương bản thân và từng bước xây dựng những kết nối tích cực với gia đình, bạn bè và cộng đồng.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-12 grid grid-cols-3 gap-4">
          {[{ value:"12,000+",label:"Bạn trẻ tin tưởng",color:"#7BBFA8"},{ value:"98%",label:"Cảm thấy tốt hơn",color:"#C3B4E8"},{ value:"24/7",label:"Luôn bên bạn",color:"#F5A87B"}].map(s=>(
            <div key={s.label} className="flex flex-col items-center text-center p-4 rounded-2xl"
              style={{ background:`${s.color}18`, border:`1.5px solid ${s.color}33` }}>
              <span className="font-black text-xl" style={{ fontFamily:"Nunito", color:s.color }}>{s.value}</span>
              <span className="text-xs text-[#9490A4] mt-1" style={{ fontFamily:"Be Vietnam Pro" }}>{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCards({ navigate }: { navigate: (p: PageName) => void }) {
  const features = [
    { emoji:"📓", title:"Nhật ký cảm xúc", desc:"Ghi lại suy nghĩ và cảm xúc mỗi ngày với những gợi ý nhẹ nhàng.", color:"#EEF8F4", accent:"#7BBFA8", tag:"Phổ biến nhất", page: "journal-history" as PageName },
    { emoji:"🌱", title:"Hành trình nuôi dưỡng bản thân", desc:"Những thói quen nhỏ mỗi ngày giúp bạn yêu thương chính mình hơn.", color:"#F5F0FB", accent:"#C3B4E8", tag:null, page:"selfcare" as PageName },
    { emoji:"🎯", title:"Theo dõi cảm xúc", desc:"Biểu đồ cảm xúc trực quan giúp bạn hiểu rõ những thay đổi trong tâm trạng.", color:"#EEF5FB", accent:"#7AB8D8", tag:null, page:"mood-dashboard" as PageName },
    { emoji:"💛", title:"Gia đình & Bạn bè", desc:"Chia sẻ hành trình cảm xúc và kết nối sâu hơn với những người thân yêu.", color:"#FFFBEE", accent:"#F5C842", tag:null, page:"family-home" as PageName },
    { emoji:"🤍", title:"Góc thấu hiểu", desc:"Chia sẻ điều đang ở trong lòng — mình sẽ lắng nghe và đồng hành cùng bạn.", color:"#FFF4F0", accent:"#F5A87B", tag:"Mới", page:"understanding-home" as PageName },
    { emoji:"🫂", title:"Cộng đồng", desc:"Gặp gỡ những bạn trẻ đồng hành, chia sẻ và lắng nghe nhau trong không gian ấm áp.", color:"#FFF0F4", accent:"#E87BA8", tag:null, page:null },
    { emoji:"🤖", title:"Trợ lý cảm xúc", desc:"Người bạn AI luôn sẵn sàng lắng nghe và đồng hành cùng bạn bất kỳ lúc nào.", color:"#F0F4FF", accent:"#7B98E8", tag:"AI", page:null },
    { emoji:"🆘", title:"Hỗ trợ", desc:"Kết nối với chuyên gia tâm lý và đường dây hỗ trợ khẩn cấp khi bạn cần.", color:"#FFF3F3", accent:"#E87B7B", tag:"Luôn mở", page:null },
  ];
  return (
    <section className="relative py-24 px-6 overflow-hidden" style={{ background:"#FFF8F3" }}>
      <FloatCircle size={200} color="#F5D0BE" x="-5%" y="5%" delay={1} opacity={0.2} dur={10} blur={40} />
      <FloatCircle size={160} color="#7BBFA8" x="85%" y="70%" opacity={0.15} dur={9} blur={35} />
      <FloatCircle size={40} color="#C3B4E8" x="92%" y="10%" delay={2} opacity={0.6} dur={7} />
      <FloatCircle size={28} color="#FDE68A" x="3%" y="88%" delay={1.5} opacity={0.55} dur={8} />
      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:"-80px" }} transition={{ duration:0.7 }}
          className="text-center mb-14">
          <div className="flex justify-center gap-1.5 mb-4">
            {["#7BBFA8","#C3B4E8","#F5D0BE","#A8D4E8","#F4C0C0"].map((c,i)=>(
              <motion.div key={i} className="rounded-full" style={{ width:10, height:10, background:c }}
                animate={{ y:[0,-6,0] }} transition={{ duration:2.5, repeat:Infinity, delay:i*0.25 }} />
            ))}
          </div>
          <h2 className="font-black text-[#3D3547]" style={{ fontFamily:"Nunito", fontSize:"clamp(1.7rem,4vw,2.5rem)" }}>Những điều mình dành cho bạn</h2>
          <p className="mt-3 text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro", fontSize:"clamp(0.9rem,2vw,1rem)" }}>Tất cả công cụ bạn cần để chăm sóc sức khỏe tâm thần của mình.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:"-40px" }} transition={{ duration:0.55, delay:i*0.07 }}
              whileHover={{ y:-6, boxShadow:`0 16px 40px ${f.accent}25` }}
              onClick={() => { if (f.page) navigate(f.page); }}
              className="relative rounded-3xl p-5 cursor-pointer transition-shadow"
              style={{ background:f.color, border:`1.5px solid ${f.accent}22`, boxShadow:`0 4px 20px ${f.accent}12` }}>
              {f.tag && <span className="absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background:f.accent, color:"#fff", fontFamily:"Nunito" }}>{f.tag}</span>}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4" style={{ background:`${f.accent}22` }}>{f.emoji}</div>
              <h3 className="font-black text-sm text-[#3D3547] mb-2 leading-snug" style={{ fontFamily:"Nunito" }}>{f.title}</h3>
              <p className="text-xs text-[#9490A4] leading-relaxed" style={{ fontFamily:"Be Vietnam Pro" }}>{f.desc}</p>
              <div className="mt-4 flex items-center gap-1">
                <span className="text-xs font-bold" style={{ color:f.accent, fontFamily:"Nunito" }}>Khám phá</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke={f.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const quotes = [
  { text:"Bạn không cần phải hoàn hảo để xứng đáng được yêu thương.", author:"— Không gian an toàn của bạn 💙" },
  { text:"Hôm nay, chỉ cần tồn tại thôi cũng đã là đủ rồi.", author:"— Những Chấm Tròn Cảm Xúc 🌿" },
  { text:"Những cảm xúc khó khăn cũng chỉ là khách thăm, chúng sẽ đi qua.", author:"— Rumi 🌸" },
];

function QuoteOfDay() {
  const [quoteIdx] = useState(() => Math.floor(Math.random() * quotes.length));
  const q = quotes[quoteIdx];
  return (
    <section className="relative py-20 px-6 overflow-hidden">
      <div className="absolute inset-0" style={{ background:"linear-gradient(135deg,#C3B4E8,#A8C8E8,#7BBFA8)" }} />
      <FloatCircle size={260} color="#FFFFFF" x="-4%" y="-30%" opacity={0.08} dur={11} blur={10} />
      <FloatCircle size={200} color="#FFFFFF" x="78%" y="40%" delay={2} opacity={0.07} dur={9} blur={15} />
      <FloatCircle size={70} color="#FFFFFF" x="10%" y="70%" delay={1} opacity={0.15} dur={8} />
      <FloatCircle size={44} color="#FFFFFF" x="88%" y="10%" delay={3} opacity={0.18} dur={7} />
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <motion.div initial={{ opacity:0, scale:0.92 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }} transition={{ duration:0.7 }}>
          <div className="flex justify-center gap-2 mb-6">
            {[...Array(3)].map((_,i)=>(
              <motion.div key={i} className="rounded-full bg-white/30"
                style={{ width:8+i*4, height:8+i*4 }}
                animate={{ y:[0,-6,0] }} transition={{ duration:2+i, repeat:Infinity, delay:i*0.4 }} />
            ))}
          </div>
          <p className="text-[10px] font-bold text-white/70 tracking-[0.2em] uppercase mb-6" style={{ fontFamily:"Be Vietnam Pro" }}>✨ Câu nói hôm nay</p>
          <blockquote className="text-white font-black leading-snug mb-6"
            style={{ fontFamily:"Nunito", fontSize:"clamp(1.4rem,4vw,2rem)" }}>"{q.text}"</blockquote>
          <p className="text-white/75 text-sm mb-8" style={{ fontFamily:"Be Vietnam Pro" }}>{q.author}</p>
          <div className="flex justify-center gap-3">
            {["Chia sẻ 🔗","Lưu lại 🌟"].map(label=>(
              <motion.button key={label} whileHover={{ scale:1.05 }} whileTap={{ scale:0.96 }}
                className="px-5 py-2.5 rounded-full text-xs font-bold"
                style={{ background:"rgba(255,255,255,0.25)", backdropFilter:"blur(10px)", border:"1.5px solid rgba(255,255,255,0.4)", color:"white", fontFamily:"Nunito" }}>
                {label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function SelfCareToday({ navigate }: { navigate: (p: PageName) => void }) {
  const activities = [
    { emoji:"🫁", title:"Thở ô vuông", duration:"5 phút", color:"#EEF8F4", accent:"#7BBFA8", category:"Thở", page:"breathing" as PageName },
    { emoji:"✍️", title:"Viết 3 điều biết ơn", duration:"10 phút", color:"#FFF4F0", accent:"#F5A87B", category:"Nhật ký", page:"gratitude" as PageName },
    { emoji:"🎵", title:"Nghe nhạc thư giãn", duration:"15 phút", color:"#EEF5FB", accent:"#A8C8E8", category:"Thư giãn", page:"relax" as PageName },
    { emoji:"🚶", title:"Đi bộ chánh niệm", duration:"10 phút", color:"#FFF8F0", accent:"#F5C842", category:"Vận động", page:"exercise" as PageName },
  ];
  const [activeAct, setActiveAct] = useState(0);
  const [started, setStarted] = useState(false);
  const act = activities[activeAct];
  return (
    <section className="relative py-24 px-6 overflow-hidden" style={{ background:"#FFFFFF" }}>
      <FloatCircle size={220} color="#C3B4E8" x="88%" y="-5%" opacity={0.12} dur={10} blur={40} />
      <FloatCircle size={180} color="#7BBFA8" x="-4%" y="60%" delay={1.5} opacity={0.12} dur={9} blur={35} />
      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:"-80px" }} transition={{ duration:0.7 }} className="text-center mb-12">
          <p className="text-xs font-semibold text-[#9490A4] tracking-widest uppercase mb-3" style={{ fontFamily:"Be Vietnam Pro" }}>🌸 Hoạt động hôm nay</p>
          <h2 className="font-black text-[#3D3547]" style={{ fontFamily:"Nunito", fontSize:"clamp(1.7rem,4vw,2.5rem)" }}>Chăm sóc bản thân ngay hôm nay</h2>
        </motion.div>
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {activities.map((a,i)=>(
            <motion.button key={a.title} whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
              onClick={()=>{ setActiveAct(i); setStarted(false); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all"
              style={{ background:activeAct===i?a.accent:"#F0EDF8", color:activeAct===i?"#fff":"#9490A4", fontFamily:"Nunito", boxShadow:activeAct===i?`0 6px 20px ${a.accent}40`:"none" }}>
              <span>{a.emoji}</span><span>{a.category}</span>
            </motion.button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={activeAct} initial={{ opacity:0,y:20,scale:0.97 }} animate={{ opacity:1,y:0,scale:1 }} exit={{ opacity:0,y:-20,scale:0.97 }} transition={{ duration:0.35 }} className="max-w-lg mx-auto">
            <div className="rounded-3xl p-8 text-center relative overflow-hidden"
              style={{ background:act.color, border:`1.5px solid ${act.accent}33`, boxShadow:`0 12px 50px ${act.accent}20` }}>
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20" style={{ background:act.accent }} />
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl mx-auto mb-4" style={{ background:`${act.accent}25` }}>{act.emoji}</div>
              <span className="text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block" style={{ background:`${act.accent}25`, color:act.accent, fontFamily:"Nunito" }}>{act.duration}</span>
              <h3 className="font-black text-xl text-[#3D3547] mb-2 mt-2" style={{ fontFamily:"Nunito" }}>{act.title}</h3>
              <div className="flex gap-3 mt-5">
                <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                  onClick={()=>navigate(act.page)}
                  className="flex-1 px-4 py-3 rounded-2xl text-white font-black text-sm"
                  style={{ background:`linear-gradient(135deg,${act.accent},${act.accent}CC)`, fontFamily:"Nunito" }}>
                  Bắt đầu ngay ▶
                </motion.button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function MoodCTA() {
  const [picked, setPicked] = useState<string|null>(null);
  const moods = [
    { id:"rad", emoji:"✨", label:"Tuyệt!", bg:"#FEF9C3", ring:"#F59E0B" },
    { id:"good", emoji:"😊", label:"Vui", bg:"#DCFCE7", ring:"#22C55E" },
    { id:"okay", emoji:"😌", label:"Ổn", bg:"#DBEAFE", ring:"#3B82F6" },
    { id:"sad", emoji:"🥺", label:"Buồn", bg:"#EDE9FE", ring:"#8B5CF6" },
    { id:"tired", emoji:"😔", label:"Mệt", bg:"#FFE4E6", ring:"#F43F5E" },
  ];
  return (
    <section className="relative py-24 px-6 overflow-hidden" style={{ background:"#FFF8F3" }}>
      <FloatCircle size={120} color="#7BBFA8" x="5%" y="5%" opacity={0.3} dur={8} />
      <FloatCircle size={90} color="#C3B4E8" x="88%" y="70%" delay={1.5} opacity={0.3} dur={9} />
      <div className="max-w-xl mx-auto relative z-10 text-center">
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.7 }}>
          <h2 className="font-black text-[#3D3547] mb-3" style={{ fontFamily:"Nunito", fontSize:"clamp(1.6rem,4vw,2.3rem)" }}>Hôm nay bạn thế nào? 🌤</h2>
          <p className="text-[#9490A4] mb-10" style={{ fontFamily:"Be Vietnam Pro" }}>Chỉ mất 2 giây thôi — hãy cho mình biết nhé.</p>
          <div className="flex justify-center gap-3 flex-wrap mb-8">
            {moods.map(m=>(
              <motion.button key={m.id} whileHover={{ scale:1.12 }} whileTap={{ scale:0.9 }}
                onClick={()=>setPicked(m.id)}
                className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all duration-200"
                  style={{ background:picked===m.id?m.bg:"#F0EDF8", boxShadow:picked===m.id?`0 0 0 4px ${m.ring}55`:"none", transform:picked===m.id?"scale(1.2)":"scale(1)" }}>
                  {m.emoji}
                </div>
                <span className="text-xs text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>{m.label}</span>
              </motion.button>
            ))}
          </div>
          <AnimatePresence>
            {picked && (
              <motion.div initial={{ opacity:0,y:12,scale:0.95 }} animate={{ opacity:1,y:0,scale:1 }} exit={{ opacity:0 }}
                className="mb-6 p-5 rounded-2xl"
                style={{ background:"rgba(255,255,255,0.8)", backdropFilter:"blur(10px)", border:"1.5px solid rgba(195,180,232,0.3)" }}>
                <p className="text-sm text-[#5E5870]" style={{ fontFamily:"Be Vietnam Pro" }}>
                  {picked==="rad"&&"Cảm xúc đó thật rực rỡ! ✨ Chia sẻ năng lượng đó với người bên cạnh nhé."}
                  {picked==="good"&&"Tuyệt vời! 😊 Hôm nay là một ngày tốt lành — tiếp tục nhé bạn ơi!"}
                  {picked==="okay"&&"Bình thường cũng hoàn toàn ổn mà 🌿 Bạn đang làm rất tốt rồi đó."}
                  {picked==="sad"&&"Cảm ơn bạn đã chia sẻ 💜 Mình ở đây lắng nghe bạn. Muốn thử viết nhật ký không?"}
                  {picked==="tired"&&"Bạn đã cố gắng rất nhiều rồi 🫂 Hôm nay cho phép mình nghỉ ngơi một chút nhé."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            className="px-8 py-4 rounded-2xl text-white font-black text-base"
            style={{ background:"linear-gradient(135deg,#7BBFA8,#9BCFC0)", fontFamily:"Nunito", opacity:picked?1:0.5 }}>
            Lưu cảm xúc hôm nay 💙
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative overflow-hidden py-16 px-6" style={{ background:"#3D3547" }}>
      <FloatCircle size={200} color="#C3B4E8" x="-5%" y="-20%" opacity={0.08} dur={10} blur={30} />
      <FloatCircle size={150} color="#7BBFA8" x="80%" y="50%" delay={2} opacity={0.08} dur={9} blur={25} />
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-12">
          <div className="max-w-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-9 h-9">
                <div className="absolute w-5 h-5 rounded-full top-0 left-0" style={{ background:"#7BBFA8" }} />
                <div className="absolute w-4 h-4 rounded-full bottom-0 right-0" style={{ background:"#C3B4E8" }} />
                <div className="absolute w-3 h-3 rounded-full top-0.5 right-0.5" style={{ background:"#F5D0BE" }} />
              </div>
              <span className="font-black text-white text-sm" style={{ fontFamily:"Nunito" }}>Những Chấm Tròn Cảm Xúc</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed" style={{ fontFamily:"Be Vietnam Pro" }}>Không gian an toàn dành cho sức khỏe tâm thần của các bạn trẻ Việt Nam.</p>
          </div>
          {[{ title:"Tính năng", links:["Nhật ký cảm xúc","Theo dõi cảm xúc","Trợ lý AI","Cộng đồng"] },
            { title:"Hỗ trợ", links:["Đường dây khẩn cấp","Chuyên gia tâm lý","FAQ","Liên hệ"] },
            { title:"Về chúng mình", links:["Giới thiệu","Blog","Chính sách bảo mật","Điều khoản"] }].map(col=>(
            <div key={col.title}>
              <h4 className="font-bold text-white text-sm mb-4" style={{ fontFamily:"Nunito" }}>{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(link=>(
                  <li key={link}><a href="#" className="text-xs text-white/50 hover:text-white/80 transition-colors" style={{ fontFamily:"Be Vietnam Pro" }}>{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop:"1px solid rgba(255,255,255,0.1)" }}>
          <p className="text-xs text-white/35" style={{ fontFamily:"Be Vietnam Pro" }}>© 2025 Những Chấm Tròn Cảm Xúc · Được tạo ra với 💙 cho bạn trẻ Việt Nam</p>
          <div className="flex gap-2">
            {["#7BBFA8","#C3B4E8","#F5D0BE","#A8D4E8","#F4C0C0"].map((c,i)=>(
              <div key={i} className="w-3 h-3 rounded-full" style={{ background:c, opacity:0.7 }} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ══════════════════════════════════════════════════════════════════════════════

// GÓC THẤU HIỂU MODULE
// ══════════════════════════════════════════════════════════════════════════════

const U_RESPONSES = [
  {
    // Overloaded / exhausted
    summary: "Mình cảm nhận được rằng bạn đang mang rất nhiều thứ — có lẽ quá nhiều cho một người thôi. Không phải vì bạn yếu, mà vì những gì đang đặt lên vai bạn thật sự quá nặng.",
    reassurance: "Bạn không cần phải mạnh mẽ mọi lúc. Cho phép bản thân được nghỉ ngơi — đó không phải là từ bỏ, đó là yêu thương chính mình một cách trọn vẹn.",
    perspectiveNote: "Đôi khi mình bị cuốn vào cảm giác 'phải làm xong hết' đến mức quên rằng mỗi ngày mình chỉ có một lượng năng lượng nhất định. Ưu tiên không phải là từ chối — đó là sự khôn ngoan.",
    adviceNote: "Thử chọn ra một thứ duy nhất bạn cần làm hôm nay và cho phép phần còn lại chờ đến ngày mai. Chỉ một thứ thôi — rồi mình nghỉ ngơi.",
    lessonId: 3,
    lessonTitle: "Khi mình cảm thấy quá tải",
    lessonEmoji: "🤍",
    lessonColor: "#C3B4E8",
    lessonBg: "#F5F0FB",
    tryToday: "Dành 5 phút ngồi yên, đặt tay lên ngực và hít thở chậm. Không cần làm gì — chỉ cần hiện diện với chính mình.",
    quote: "Bạn không cần phải giải quyết mọi thứ ngay hôm nay. Một hơi thở thôi cũng đủ rồi. 🌙",
  },
  {
    // Sad / anxious / not okay
    summary: "Mình nghe thấy một nỗi buồn — và có thể cả sự lo lắng — trong những gì bạn vừa chia sẻ. Đây không phải là cảm giác bạn tưởng tượng ra; nó rất thật và rất chính đáng.",
    reassurance: "Buồn không phải là yếu đuối — đó là dấu hiệu của một trái tim đang thật sự quan tâm. Bạn không cần phải 'vui lên' ngay — cảm xúc của bạn xứng đáng được ở đây một lúc.",
    perspectiveNote: "Khi mình đang buồn hoặc lo, trí óc thường thu nhỏ mọi thứ lại và phóng to những điều tiêu cực. Nhưng cảm xúc là tạm thời — dù nó có cảm giác như mãi mãi, nó sẽ thay đổi.",
    adviceNote: "Hôm nay, hãy tự cho phép mình cảm nhận cảm xúc này mà không cần giải thích hay biện minh. Đặt tay lên ngực và nói nhỏ: 'Mình đang không ổn, và điều đó ổn thôi.'",
    lessonId: 1,
    lessonTitle: "Cảm xúc nào cũng đáng được lắng nghe",
    lessonEmoji: "🌸",
    lessonColor: "#E87BA8",
    lessonBg: "#FFF0F6",
    tryToday: "Viết ra 3 cảm xúc bạn đang có hôm nay mà không phán xét chúng. Chỉ cần gọi tên và quan sát.",
    quote: "Mỗi cảm xúc đều là một vị khách — hãy mời chúng vào, lắng nghe, rồi để chúng ra đi. 🌸",
  },
  {
    // Self-blame / not good enough
    summary: "Mình thấy bạn đang rất khắt khe với chính mình. Bạn đang mang trong lòng cảm giác 'mình chưa đủ tốt' — nhưng mình nhìn thấy một người đang cố gắng rất nhiều, theo cách riêng của mình.",
    reassurance: "Bạn đã làm hết sức với những gì bạn có vào thời điểm đó. Hãy dịu dàng với chính mình như cách bạn sẽ dịu dàng với người bạn yêu thương đang ở vị trí này.",
    perspectiveNote: "Sự hoàn hảo không phải là tiêu chuẩn của con người. Mỗi lần mình vấp ngã, mình đang học một điều gì đó mà chỉ trải nghiệm mới dạy được. Thất bại không định nghĩa bạn.",
    adviceNote: "Hôm nay, mỗi khi có suy nghĩ tự trách, hãy thay nó bằng một câu hỏi: 'Mình có thể làm gì khác hơn không?' Nếu có — học và tiếp tục. Nếu không — buông tha cho mình.",
    lessonId: 2,
    lessonTitle: "Dịu dàng với chính mình",
    lessonEmoji: "🌿",
    lessonColor: "#7BBFA8",
    lessonBg: "#EEF8F4",
    tryToday: "Hôm nay, khi có suy nghĩ tự chỉ trích, hãy thay nó bằng: \"Mình đang cố gắng, và điều đó là đủ.\"",
    quote: "Bạn xứng đáng nhận được sự dịu dàng từ chính mình — không kém gì từ người khác. 🌿",
  },
  {
    // Lonely / not understood / family
    summary: "Mình cảm nhận được sự cô đơn trong những gì bạn chia sẻ — cảm giác ở giữa mọi người nhưng vẫn thấy mình là người ngoài cuộc. Không được hiểu thật sự rất mệt mỏi và nặng nề.",
    reassurance: "Bạn không phải là người duy nhất cảm thấy như vậy — dù lúc này có thể cảm giác như thế. Việc bạn mong muốn kết nối là điều rất con người và rất đáng trân trọng.",
    perspectiveNote: "Đôi khi người thân không hiểu ta không phải vì họ không quan tâm — mà vì họ chưa có ngôn ngữ để chạm đến những gì ta đang trải qua. Khoảng cách không phải lúc nào cũng là sự lạnh nhạt.",
    adviceNote: "Thử nhắn cho một người bạn tin tưởng — chỉ cần: 'Dạo này mình không ổn lắm, mình muốn nói chuyện.' Một câu đó thôi cũng đủ để mở ra một cánh cửa.",
    lessonId: 6,
    lessonTitle: "Khi gia đình không hiểu mình",
    lessonEmoji: "💛",
    lessonColor: "#F5A87B",
    lessonBg: "#FFF4EE",
    tryToday: "Thử viết một tin nhắn nhỏ cho ai đó bạn tin tưởng — chỉ \"Dạo này mình không ổn lắm\" cũng đủ để mở ra một cánh cửa.",
    quote: "Kết nối bắt đầu từ sự dũng cảm chia sẻ — và bạn đã làm điều đó hôm nay. 💛",
  },
];

function pickResponse(text: string): number {
  const t = text.toLowerCase();
  if (/mệt|kiệt|quá tải|áp lực|nặng|căng/.test(t)) return 0;
  if (/buồn|lo|sợ|khóc|không ổn|tệ/.test(t)) return 1;
  if (/lỗi|sai|tệ|thất bại|không đủ|kém/.test(t)) return 2;
  if (/cô đơn|gia đình|bạn bè|không hiểu|một mình/.test(t)) return 3;
  return text.length % 4;
}

function FloatingPetals() {
  const petals = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      delay: Math.random() * 4,
      dur: 6 + Math.random() * 5,
      size: 10 + Math.random() * 14,
      emoji: ["🌸", "🌺", "✨", "🌼", "💮"][i % 5],
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {petals.map(p => (
        <motion.div
          key={p.id}
          className="absolute select-none"
          style={{ left: `${p.x}%`, top: "-2rem", fontSize: p.size }}
          animate={{ y: ["0vh", "110vh"], rotate: [0, 360], opacity: [0, 0.7, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "linear" }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
}

const COMPANION_OPTIONS: { id: CompanionMode; emoji: string; label: string; desc: string; color: string; bg: string }[] = [
  { id: "listen",      emoji: "🤍", label: "Chỉ cần lắng nghe",         desc: "Mình chỉ cần được nghe và thấu hiểu",     color: "#C3B4E8", bg: "#F5F0FB" },
  { id: "perspective", emoji: "🌿", label: "Cho mình một góc nhìn khác", desc: "Mình muốn thấy điều này theo cách khác",   color: "#7BBFA8", bg: "#EEF8F4" },
  { id: "lesson",      emoji: "📖", label: "Gợi ý cho mình một bài học", desc: "Mình muốn học cách vượt qua điều này",     color: "#F5A87B", bg: "#FFF4EE" },
  { id: "advice",      emoji: "🌸", label: "Cho mình một lời khuyên nhỏ",desc: "Mình muốn biết mình có thể làm gì hôm nay",color: "#E87BA8", bg: "#FFF0F6" },
];

// PAGE 1 – Góc thấu hiểu (input + companion mode)
function UnderstandingHome({ uCtx }: { uCtx: UnderstandingCtx }) {
  const [text, setText] = useState(uCtx.userText);
  const [selectedMode, setSelectedMode] = useState<CompanionMode>(uCtx.companionMode);
  const [bloomIdx, setBloomIdx] = useState<number | null>(null);

  const handleSelectMode = (id: CompanionMode, idx: number) => {
    if (selectedMode === id) { setSelectedMode(null); setBloomIdx(null); return; }
    setSelectedMode(id);
    setBloomIdx(idx);
    setTimeout(() => setBloomIdx(null), 800);
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    uCtx.setUserText(text.trim());
    uCtx.setCompanionMode(selectedMode);
    uCtx.setResponseIdx(pickResponse(text.trim()));
    uCtx.navigate("understanding-loading");
  };

  return (
    <motion.div
      key="understanding-home"
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="min-h-screen w-full flex flex-col"
      style={{ background: "linear-gradient(160deg,#FFF8F3 0%,#FFF0FB 50%,#F0F8FF 100%)" }}
    >
      <FloatingPetals />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-12 pb-2">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => uCtx.navigate("home")}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3D3547" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </motion.button>
        <h1 className="text-xl font-bold" style={{ color: "#3D3547", fontFamily: "Nunito, sans-serif" }}>🤍 Góc thấu hiểu</h1>
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-5 pt-4 pb-10 gap-4 max-w-lg mx-auto w-full overflow-y-auto">

        {/* Intro card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.45 }}
          className="rounded-3xl p-5 text-center"
          style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", boxShadow: "0 4px 24px rgba(195,180,232,0.18)" }}
        >
          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="text-5xl mb-3 inline-block"
          >🤍</motion.div>
          <p className="text-sm leading-relaxed" style={{ color: "#6B5F7A", fontFamily: "Be Vietnam Pro, sans-serif" }}>
            Mình luôn sẵn sàng lắng nghe bạn.<br />
            Bạn không cần viết thật hay — chỉ cần viết<br />
            <strong style={{ color: "#3D3547" }}>điều đang ở trong lòng.</strong>
          </p>
        </motion.div>

        {/* Textarea */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.45 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Hôm nay điều gì khiến bạn nặng lòng?"
            rows={6}
            className="w-full rounded-2xl p-4 text-sm resize-none outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "2px solid",
              borderColor: text.trim() ? "#C3B4E8" : "#EDE8F5",
              color: "#3D3547",
              fontFamily: "Be Vietnam Pro, sans-serif",
              lineHeight: 1.75,
              boxShadow: text.trim() ? "0 0 0 4px rgba(195,180,232,0.12)" : "none",
              transition: "border-color 0.25s, box-shadow 0.25s",
            }}
          />
          <div className="flex justify-between items-center mt-1.5 px-1">
            <p className="text-xs" style={{ color: "#A89BB8" }}>
              {text.trim() ? "✓ Mình đang lắng nghe..." : "Không có câu trả lời đúng hay sai"}
            </p>
            <p className="text-xs" style={{ color: "#A89BB8" }}>{text.length} ký tự</p>
          </div>
        </motion.div>

        {/* Companion mode selector */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.45 }}
          className="rounded-3xl p-4"
          style={{ background: "rgba(255,255,255,0.80)", backdropFilter: "blur(10px)", boxShadow: "0 2px 16px rgba(195,180,232,0.12)" }}
        >
          <p className="text-sm font-bold mb-0.5" style={{ color: "#3D3547", fontFamily: "Nunito, sans-serif" }}>
            🤍 Trước khi mình đọc những điều bạn vừa viết...
          </p>
          <p className="text-xs mb-3" style={{ color: "#9B8FD8" }}>
            Hãy cho mình biết hôm nay bạn mong mình đồng hành theo cách nào. (Có thể bỏ qua)
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {COMPANION_OPTIONS.map((opt, idx) => {
              const active = selectedMode === opt.id;
              return (
                <motion.button
                  key={opt.id}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleSelectMode(opt.id, idx)}
                  className="relative text-left rounded-2xl p-3 overflow-hidden transition-all"
                  style={{
                    background: active ? opt.bg : "rgba(255,255,255,0.7)",
                    border: `2px solid ${active ? opt.color : "#EDE8F5"}`,
                    boxShadow: active ? `0 4px 16px ${opt.color}30` : "none",
                  }}
                  animate={{ scale: active ? 1.02 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Bloom burst on select */}
                  <AnimatePresence>
                    {bloomIdx === idx && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        style={{ background: opt.color, opacity: 0 }}
                        initial={{ opacity: 0.35, scale: 0.6 }}
                        animate={{ opacity: 0, scale: 1.4 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    )}
                  </AnimatePresence>
                  <span className="text-xl mb-1 block">{opt.emoji}</span>
                  <p className="text-xs font-bold leading-snug" style={{ color: active ? opt.color : "#3D3547", fontFamily: "Nunito, sans-serif" }}>
                    {opt.label}
                  </p>
                  <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "#9B8FD8" }}>{opt.desc}</p>
                  {active && (
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: opt.color }}
                    >
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.45 }}
          className="flex gap-3"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { setText(""); setSelectedMode(null); }}
            disabled={!text.trim() && !selectedMode}
            className="flex-none px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-30"
            style={{ background: "rgba(255,255,255,0.85)", color: "#6B5F7A", border: "1.5px solid #E8E0F0", fontFamily: "Be Vietnam Pro, sans-serif" }}
          >
            Xóa
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-40"
            style={{
              background: text.trim() ? "linear-gradient(135deg,#C3B4E8,#E87BA8)" : "#D0C8E0",
              color: "#fff",
              fontFamily: "Nunito, sans-serif",
              boxShadow: text.trim() ? "0 4px 16px rgba(195,180,232,0.45)" : "none",
            }}
          >
            🤍 Để mình lắng nghe
          </motion.button>
        </motion.div>

        {/* Privacy note */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
          className="rounded-2xl p-3.5 text-center"
          style={{ background: "rgba(255,244,248,0.75)" }}
        >
          <p className="text-xs" style={{ color: "#C37BA8", fontFamily: "Be Vietnam Pro, sans-serif" }}>
            🔒 Những gì bạn chia sẻ chỉ dành riêng cho bạn.<br />Mình lắng nghe mà không phán xét.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// PAGE 2 – Loading / Listening animation
function UnderstandingLoading({ uCtx }: { uCtx: UnderstandingCtx }) {
  const steps = [
    "Mình đang đọc những điều bạn vừa chia sẻ...",
    "Mình đang cố gắng hiểu cảm xúc của bạn...",
    "Mình đang chọn điều phù hợp nhất dành cho bạn...",
    "Cảm ơn vì đã tin tưởng mình. 🤍",
  ];
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const timers = steps.map((_, i) =>
      setTimeout(() => setStepIdx(i), i * 1200)
    );
    const nav = setTimeout(() => uCtx.navigate("understanding-response"), 4800);
    return () => { timers.forEach(clearTimeout); clearTimeout(nav); };
  }, []);

  const petalCount = 8;
  return (
    <motion.div
      key="understanding-loading"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen w-full flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(160deg,#FFF8F3 0%,#F5F0FB 60%,#FFF0F6 100%)" }}
    >
      <FloatingPetals />
      <div className="relative flex flex-col items-center gap-8 px-8 z-10 max-w-sm w-full">
        {/* Flower bloom */}
        <div className="relative w-36 h-36">
          {Array.from({ length: petalCount }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                width: 36, height: 36,
                borderRadius: "50% 50% 50% 0",
                background: `hsl(${290 + i * 20},60%,80%)`,
                top: "50%", left: "50%",
                transformOrigin: "-18px 18px",
                rotate: `${i * (360 / petalCount)}deg`,
              }}
              animate={{ scale: [0, 1.1, 1], opacity: [0, 1] }}
              transition={{ delay: 0.1 + i * 0.12, duration: 0.6, ease: "backOut" }}
            />
          ))}
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-3xl"
            animate={{ scale: [0.8, 1.05, 1] }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            🤍
          </motion.div>
        </div>

        {/* Step text */}
        <div className="min-h-[3.5rem] flex items-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIdx}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-base text-center font-medium"
              style={{ color: "#6B5F7A", fontFamily: "Be Vietnam Pro, sans-serif", lineHeight: 1.6 }}
            >
              {steps[stepIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2.5">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{ background: i <= stepIdx ? "#C3B4E8" : "#E8E0F0" }}
              animate={{ width: i === stepIdx ? 24 : 8, height: 8 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// PAGE 3 – Personalized response (mode-aware)
function UnderstandingResponse({ uCtx }: { uCtx: UnderstandingCtx }) {
  const resp = U_RESPONSES[uCtx.responseIdx] ?? U_RESPONSES[0];
  const mode = uCtx.companionMode;

  const handleReadLesson = () => {
    uCtx.setSelectedLesson(resp.lessonId);
    uCtx.navigate("family-lesson-detail");
  };

  // Determine what the secondary response card says based on mode
  const modeLabel =
    mode === "listen"      ? { icon: "🤍", tag: "ĐIỀU MÌNH MUỐN NÓI VỚI BẠN",       color: "#C3B4E8", text: resp.reassurance } :
    mode === "perspective" ? { icon: "🌿", tag: "MỘT GÓC NHÌN KHÁC",                  color: "#7BBFA8", text: resp.perspectiveNote } :
    mode === "lesson"      ? { icon: "📖", tag: "ĐIỀU MÌNH MUỐN NÓI VỚI BẠN",       color: "#F5A87B", text: resp.reassurance } :
    mode === "advice"      ? { icon: "🌸", tag: "ĐIỀU MÌNH MUỐN NÓI VỚI BẠN",       color: "#E87BA8", text: resp.reassurance } :
                             { icon: "🌸", tag: "ĐIỀU MÌNH MUỐN NÓI VỚI BẠN",       color: "#E87BA8", text: resp.reassurance };

  const actionText = mode === "advice" ? resp.adviceNote : resp.tryToday;
  const actionLabel = mode === "advice" ? "💡 LỜI KHUYÊN NHỎ HÔM NAY" : "🌱 MỘT ĐIỀU NHỎ BẠN CÓ THỂ LÀM HÔM NAY";

  // Mode badge to show at top
  const modeBadge = mode ? COMPANION_OPTIONS.find(o => o.id === mode) : null;

  return (
    <motion.div
      key="understanding-response"
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="min-h-screen w-full flex flex-col"
      style={{ background: "linear-gradient(160deg,#FFF8F3 0%,#FFF0F6 100%)" }}
    >
      <FloatingPetals />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-12 pb-2">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => uCtx.navigate("understanding-home")}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3D3547" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </motion.button>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: "#3D3547", fontFamily: "Nunito, sans-serif" }}>🤍 Phản hồi từ mình</h1>
        </div>
        {modeBadge && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: modeBadge.bg, color: modeBadge.color, border: `1px solid ${modeBadge.color}40` }}
          >
            {modeBadge.emoji} {modeBadge.label}
          </motion.span>
        )}
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-5 pt-3 pb-10 gap-4 max-w-lg mx-auto w-full overflow-y-auto">

        {/* Section 1: What mình heard */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-3xl p-5"
          style={{ background: "rgba(255,255,255,0.90)", boxShadow: "0 4px 20px rgba(195,180,232,0.15)" }}>
          <p className="text-xs font-bold mb-2 tracking-widest" style={{ color: "#C3B4E8" }}>
            🤍 ĐIỀU MÌNH ĐỌC ĐƯỢC TỪ NHỮNG DÒNG BẠN VỪA VIẾT...
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#3D3547", fontFamily: "Be Vietnam Pro, sans-serif" }}>
            {resp.summary}
          </p>
        </motion.div>

        {/* Section 2: mode-adapted message */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-3xl p-5"
          style={{ background: `linear-gradient(135deg,${modeLabel.color}18,${modeLabel.color}08)`, border: `1.5px solid ${modeLabel.color}25`, boxShadow: `0 4px 20px ${modeLabel.color}15` }}>
          <p className="text-xs font-bold mb-2 tracking-widest" style={{ color: modeLabel.color }}>
            {modeLabel.icon} {modeLabel.tag}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#3D3547", fontFamily: "Be Vietnam Pro, sans-serif" }}>
            {modeLabel.text}
          </p>
        </motion.div>

        {/* Section 3: lesson card — always shown, but downplayed for "listen" mode */}
        {mode !== "listen" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <p className="text-xs font-bold mb-2 tracking-widest px-1" style={{ color: "#F5A87B" }}>📖 BÀI HỌC DÀNH CHO BẠN</p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleReadLesson}
              className="w-full text-left rounded-3xl p-5 transition-all"
              style={{ background: resp.lessonBg, border: `2px solid ${resp.lessonColor}35`, boxShadow: `0 4px 20px ${resp.lessonColor}20` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{resp.lessonEmoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm mb-0.5" style={{ color: "#3D3547", fontFamily: "Nunito, sans-serif" }}>{resp.lessonTitle}</p>
                  <p className="text-xs" style={{ color: "#9B8FD8" }}>Nhấn để đọc bài học này →</p>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-none" style={{ background: resp.lessonColor }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t" style={{ borderColor: `${resp.lessonColor}25` }}>
                <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full" style={{ background: resp.lessonColor, color: "#fff" }}>Đọc bài học</span>
              </div>
            </motion.button>
          </motion.div>
        )}

        {/* "Listen" mode: soft lesson mention instead */}
        {mode === "listen" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid #EDE8F5" }}>
            <span className="text-2xl">{resp.lessonEmoji}</span>
            <div className="flex-1">
              <p className="text-xs font-semibold" style={{ color: "#6B5F7A" }}>Khi bạn sẵn sàng</p>
              <p className="text-xs" style={{ color: "#9B8FD8" }}>Có một bài học có thể giúp bạn — "{resp.lessonTitle}"</p>
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleReadLesson}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl flex-none"
              style={{ background: resp.lessonBg, color: resp.lessonColor, border: `1px solid ${resp.lessonColor}40` }}>
              Đọc
            </motion.button>
          </motion.div>
        )}

        {/* Section 4: gentle action */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-3xl p-5"
          style={{ background: "rgba(238,248,244,0.9)", boxShadow: "0 4px 20px rgba(123,191,168,0.12)" }}>
          <p className="text-xs font-bold mb-2 tracking-widest" style={{ color: "#7BBFA8" }}>{actionLabel}</p>
          <p className="text-sm leading-relaxed" style={{ color: "#3D3547", fontFamily: "Be Vietnam Pro, sans-serif" }}>
            {actionText}
          </p>
        </motion.div>

        {/* Section 5: quote */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-3xl p-5 text-center"
          style={{ background: "linear-gradient(135deg,#F5F0FB,#FFF8F3)" }}>
          <p className="text-xs font-bold mb-2 tracking-widest" style={{ color: "#9B8FD8" }}>☁️ MANG THEO HÔM NAY</p>
          <p className="text-sm italic leading-relaxed" style={{ color: "#6B5F7A", fontFamily: "Be Vietnam Pro, sans-serif" }}>
            "{resp.quote}"
          </p>
        </motion.div>

        {/* Next */}
        <motion.button
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => uCtx.navigate("understanding-reflection")}
          className="w-full py-4 rounded-2xl font-bold text-sm text-white"
          style={{ background: "linear-gradient(135deg,#C3B4E8,#E87BA8)", fontFamily: "Nunito, sans-serif", boxShadow: "0 6px 20px rgba(195,180,232,0.35)" }}
        >
          Tiếp theo →
        </motion.button>
      </div>
    </motion.div>
  );
}

// PAGE 4 – Reflection / "Bạn thấy nhẹ lòng hơn chưa?"
function UnderstandingReflection({ uCtx }: { uCtx: UnderstandingCtx }) {
  const [choice, setChoice] = useState<"better" | "notOk" | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleBetter = () => {
    setChoice("better");
    setShowSuccess(true);
    uCtx.onComplete("understanding", "Góc thấu hiểu", "🤍");
  };

  if (showSuccess) {
    return (
      <motion.div
        key="understanding-success"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="min-h-screen w-full flex flex-col items-center justify-center px-8"
        style={{ background: "linear-gradient(160deg,#FFF8F3 0%,#FFF0F6 100%)" }}
      >
        <FloatingPetals />
        <div className="relative z-10 flex flex-col items-center gap-5 text-center">
          <motion.div
            animate={{ scale: [0.8, 1.2, 1], rotate: [0, 10, -5, 0] }}
            transition={{ duration: 0.8, ease: "backOut" }}
            className="text-6xl"
          >🤍</motion.div>
          <h2 className="text-2xl font-black" style={{ color: "#3D3547", fontFamily: "Nunito, sans-serif" }}>Mình rất vui vì điều đó!</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#6B5F7A", fontFamily: "Be Vietnam Pro, sans-serif" }}>
            Cảm ơn vì đã chia sẻ với mình hôm nay.<br />Hãy nhớ rằng — bạn không bao giờ một mình. 🌸
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => uCtx.navigate("home")}
            className="mt-2 px-10 py-4 rounded-2xl font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg,#C3B4E8,#E87BA8)", fontFamily: "Nunito, sans-serif", boxShadow: "0 6px 20px rgba(195,180,232,0.35)" }}
          >
            Về trang chủ 🏠
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="understanding-reflection"
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="min-h-screen w-full flex flex-col"
      style={{ background: "linear-gradient(160deg,#FFF8F3 0%,#F5F0FB 60%,#FFF0F6 100%)" }}
    >
      <FloatingPetals />
      <div className="relative z-10 flex items-center gap-3 px-5 pt-12 pb-2">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => uCtx.navigate("understanding-response")}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3D3547" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </motion.button>
        <h1 className="text-xl font-bold" style={{ color: "#3D3547", fontFamily: "Nunito, sans-serif" }}>🌸 Đánh giá</h1>
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-5 pt-6 pb-10 gap-5 max-w-lg mx-auto w-full">
        {/* Question */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-3xl p-6 text-center"
          style={{ background: "rgba(255,255,255,0.88)", boxShadow: "0 4px 24px rgba(195,180,232,0.18)" }}>
          <div className="text-4xl mb-3">🌸</div>
          <h2 className="text-lg font-black mb-1" style={{ color: "#3D3547", fontFamily: "Nunito, sans-serif" }}>
            Mình có giúp được bạn một chút nào không?
          </h2>
          <p className="text-xs" style={{ color: "#9B8FD8" }}>Phản hồi của bạn giúp mình hiểu bạn hơn</p>
        </motion.div>

        {/* Main buttons */}
        <div className="flex flex-col gap-3">
          <motion.button
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleBetter}
            className="w-full py-5 rounded-2xl font-bold text-base"
            style={{ background: "linear-gradient(135deg,#C3B4E8,#E87BA8)", color: "#fff", fontFamily: "Nunito, sans-serif", boxShadow: "0 6px 20px rgba(195,180,232,0.35)" }}
          >
            🤍 Mình thấy nhẹ lòng hơn
          </motion.button>
          <motion.button
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setChoice("notOk")}
            className="w-full py-5 rounded-2xl font-bold text-base"
            style={{ background: choice === "notOk" ? "#EEF8F4" : "rgba(255,255,255,0.9)", color: "#7BBFA8", border: "2px solid #7BBFA840", fontFamily: "Nunito, sans-serif" }}
          >
            🌿 Mình vẫn chưa ổn
          </motion.button>
        </div>

        {/* "Mình vẫn chưa ổn" expansion */}
        <AnimatePresence>
          {choice === "notOk" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="overflow-hidden"
            >
              <div className="rounded-3xl p-5 flex flex-col gap-3"
                style={{ background: "rgba(238,248,244,0.9)", boxShadow: "0 4px 20px rgba(123,191,168,0.12)" }}>
                <p className="text-sm font-semibold text-center" style={{ color: "#3D3547", fontFamily: "Be Vietnam Pro, sans-serif" }}>
                  Nếu bạn muốn, bạn có thể chia sẻ thêm. 💚
                </p>
                {[
                  { emoji: "✍️", label: "Viết thêm", action: () => uCtx.navigate("understanding-home") },
                  { emoji: "📖", label: "Xem bài học khác", action: () => uCtx.navigate("family-lessons") },
                  { emoji: "🎧", label: "Nghe Podcast phù hợp", action: () => uCtx.navigate("relax") },
                  { emoji: "👥", label: "Chia sẻ với Bạn đồng hành", action: () => uCtx.navigate("family-challenges") },
                ].map((btn, i) => (
                  <motion.button
                    key={btn.label}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={btn.action}
                    className="w-full py-3.5 px-4 rounded-2xl text-sm font-semibold text-left flex items-center gap-3"
                    style={{ background: "rgba(255,255,255,0.9)", color: "#3D3547", fontFamily: "Be Vietnam Pro, sans-serif", border: "1.5px solid #D4EDE6" }}
                  >
                    <span className="text-lg">{btn.emoji}</span>
                    {btn.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage]   = useState<PageName>("home");
  const [scrolled, setScrolled] = useState(false);

  const [streaks, setStreaks]   = useState<Record<string, number>>({
    water:3, breathing:1, exercise:0, sleep:5, eating:2, reading:7, relax:0, gratitude:4, meditation:2,
  });
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set(["sleep"]));
  const [emotionalCircles, setEmotionalCircles] = useState(12);
  const [rewardData, setRewardData] = useState<{ name: string; emoji: string } | null>(null);

  // ─── Journal state ──────────────────────────────────────────────────────────
  const [journalEntries, setJournalEntries]       = useState<JournalEntry[]>(SAMPLE_ENTRIES);
  const [journalDraft, setJournalDraft]           = useState<DraftEntry>(DEFAULT_DRAFT);
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const [showJournalSuccess, setShowJournalSuccess] = useState(false);
  const [showJournalReward, setShowJournalReward]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navigate = useCallback((p: PageName) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const onComplete = useCallback((id: string, name: string, emoji: string) => {
    setCompletedToday(prev => new Set([...prev, id]));
    setStreaks(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setEmotionalCircles(prev => prev + 1);
    setRewardData({ name, emoji });
  }, []);

  // ─── Journal callbacks ──────────────────────────────────────────────────────
  const addJournalEntry = useCallback((entry: Omit<JournalEntry, "id" | "date" | "time" | "wordCount">) => {
    const now = new Date();
    const newEntry: JournalEntry = {
      ...entry,
      id: Date.now().toString(),
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().slice(0, 5),
      wordCount: entry.content.trim().split(/\s+/).filter(Boolean).length,
    };
    setJournalEntries(prev => [newEntry, ...prev]);
    setJournalDraft(DEFAULT_DRAFT);
    setShowJournalSuccess(true);
  }, []);

  const updateJournalEntry = useCallback((id: string, data: Partial<JournalEntry>) => {
    setJournalEntries(prev => prev.map(e => e.id === id
      ? { ...e, ...data, wordCount: (data.content ?? e.content).trim().split(/\s+/).filter(Boolean).length }
      : e));
  }, []);

  const deleteJournalEntry = useCallback((id: string) => {
    setJournalEntries(prev => prev.filter(e => e.id !== id));
    setSelectedJournalId(null);
  }, []);

  const ctx: GlobalCtx = {
    streaks,
    completedToday,
    emotionalCircles,
    onComplete,
    navigate,
  };

  const [selectedMoodDate,   setSelectedMoodDate]   = useState<string | null>(null);
  const [selectedLesson,     setSelectedLesson]     = useState<number | null>(null);
  const [selectedUser,       setSelectedUser]       = useState<SocialUser | null>(null);
  const [userText,           setUserText]           = useState("");
  const [responseIdx,        setResponseIdx]        = useState(0);
  const [companionMode,      setCompanionMode]      = useState<CompanionMode>(null);

  const fCtx: FamilyCtx = {
    navigate,
    emotionalCircles,
    onComplete,
    selectedLesson,
    setSelectedLesson,
    selectedUser,
    setSelectedUser,
  };

  const uCtx: UnderstandingCtx = {
    userText,
    setUserText,
    companionMode,
    setCompanionMode,
    navigate,
    emotionalCircles,
    onComplete,
    setSelectedLesson,
    responseIdx,
    setResponseIdx,
  };

  const mCtx: MoodCtx = {
    history: MOOD_HISTORY,
    selectedDate: selectedMoodDate,
    setSelectedDate: setSelectedMoodDate,
    navigate,
    emotionalCircles,
    journalEntries,
  };

  const jCtx: JournalCtx = {
    entries: journalEntries,
    draft: journalDraft,
    setDraft: (d: Partial<DraftEntry>) => setJournalDraft(prev => ({ ...prev, ...d })),
    selectedId: selectedJournalId,
    setSelectedId: setSelectedJournalId,
    addEntry: addJournalEntry,
    updateEntry: updateJournalEntry,
    deleteEntry: deleteJournalEntry,
    navigate,
    onJournalComplete: () => {
      setShowJournalReward(false);
      onComplete("journal", "Nhật ký cảm xúc", "📓");
      navigate("home");
    },
    showJournalReward,
    setShowJournalReward,
  };

  const totalStreak = Math.max(...Object.values(streaks));

  if (page === "home") {
    return (
      <div className="min-h-screen w-full" style={{ background: "#FFF8F3" }}>
        <Navbar scrolled={scrolled} navigate={navigate} />
        <Hero />
        <Introduction />
        <FeatureCards navigate={navigate} />
        <QuoteOfDay />
        <SelfCareToday navigate={navigate} />
        <MoodCTA />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ background: "#FFF8F3" }}>
      <AnimatePresence mode="wait">
        {page === "selfcare"            && <SelfCareDashboard  key="selfcare"            ctx={ctx} />}
        {page === "water"               && <WaterPage           key="water"               ctx={ctx} />}
        {page === "breathing"           && <BreathingPage        key="breathing"           ctx={ctx} />}
        {page === "exercise"            && <ExercisePage         key="exercise"            ctx={ctx} />}
        {page === "sleep"               && <SleepPage            key="sleep"               ctx={ctx} />}
        {page === "eating"              && <EatingPage           key="eating"              ctx={ctx} />}
        {page === "reading"             && <ReadingPage          key="reading"             ctx={ctx} />}
        {page === "relax"               && <RelaxPage            key="relax"               ctx={ctx} />}
        {page === "gratitude"           && <GratitudePage        key="gratitude"           ctx={ctx} />}
        {page === "meditation"          && <MeditationPage       key="meditation"          ctx={ctx} />}
        {page === "journal-history"     && <JournalHistory       key="journal-history"     jCtx={jCtx} />}
        {page === "journal-checkin"     && <EmotionCheckIn       key="journal-checkin"     jCtx={jCtx} />}
        {page === "journal-write"       && <JournalWrite          key="journal-write"       jCtx={jCtx} />}
        {page === "journal-insight"     && <AIInsight             key="journal-insight"     jCtx={jCtx} />}
        {page === "journal-activities"  && <SuggestedActivities   key="journal-activities"  jCtx={jCtx} />}
        {page === "journal-calendar"    && <CalendarView          key="journal-calendar"    jCtx={jCtx} />}
        {page === "journal-search"      && <SearchFilter          key="journal-search"      jCtx={jCtx} />}
        {page === "journal-detail"      && <JournalDetail         key="journal-detail"      jCtx={jCtx} />}
        {page === "journal-edit"        && <EditJournal           key="journal-edit"        jCtx={jCtx} />}
        {page === "mood-dashboard"      && <MoodDashboard         key="mood-dashboard"      mCtx={mCtx} />}
        {page === "mood-weekly"         && <WeeklyMood            key="mood-weekly"         mCtx={mCtx} />}
        {page === "mood-monthly"        && <MonthlyMood           key="mood-monthly"        mCtx={mCtx} />}
        {page === "mood-yearly"         && <YearOverview          key="mood-yearly"         mCtx={mCtx} />}
        {page === "mood-daily"          && <DailyMoodSummary      key="mood-daily"          mCtx={mCtx} />}
        {page === "mood-patterns"       && <EmotionalPattern      key="mood-patterns"       mCtx={mCtx} />}
        {page === "mood-ai-insight"     && <MoodAIInsight         key="mood-ai-insight"     mCtx={mCtx} />}
        {page === "mood-compare"        && <CompareProgress       key="mood-compare"        mCtx={mCtx} />}
        {page === "mood-achievement"    && <Achievement           key="mood-achievement"    mCtx={mCtx} />}
        {page === "mood-export"         && <ExportReport          key="mood-export"         mCtx={mCtx} />}
        {page === "family-home"         && <FamilyHome            key="family-home"         fCtx={fCtx} />}
        {page === "family-letters"      && <LetterEditor          key="family-letters"      fCtx={fCtx} />}
        {page === "family-challenges"   && <ConnectChallenges     key="family-challenges"   fCtx={fCtx} />}
        {page === "family-lessons"      && <LessonList            key="family-lessons"      fCtx={fCtx} />}
        {page === "family-lesson-detail"&& <LessonDetail          key="family-lesson-detail" fCtx={fCtx} />}
        {page === "family-gratitude"    && <GratitudeNote         key="family-gratitude"    fCtx={fCtx} />}
        {page === "family-progress"     && <FamilyProgress        key="family-progress"     fCtx={fCtx} />}
        {page === "family-ai"           && <FamilyAIRecommend     key="family-ai"           fCtx={fCtx} />}
        {page === "family-user-profile"      && <FamilyUserProfile     key="family-user-profile"      fCtx={fCtx} />}
        {page === "understanding-home"        && <UnderstandingHome       key="understanding-home"        uCtx={uCtx} />}
        {page === "understanding-loading"     && <UnderstandingLoading    key="understanding-loading"     uCtx={uCtx} />}
        {page === "understanding-response"    && <UnderstandingResponse   key="understanding-response"    uCtx={uCtx} />}
        {page === "understanding-reflection"  && <UnderstandingReflection key="understanding-reflection"  uCtx={uCtx} />}
      </AnimatePresence>

      <RewardFlow
        data={rewardData}
        circles={emotionalCircles}
        streak={totalStreak}
        onClose={() => { setRewardData(null); navigate("selfcare"); }}
      />

      <AnimatePresence>
        {showJournalSuccess && journalEntries[0] && (
          <SaveSuccessOverlay
            entry={journalEntries[0]}
            onClose={() => { setShowJournalSuccess(false); navigate("journal-insight"); }}
            onSkip={() => { setShowJournalSuccess(false); navigate("journal-history"); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showJournalReward && (
          <JournalRewardPopup
            circles={emotionalCircles}
            streak={totalStreak}
            onClose={jCtx.onJournalComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
