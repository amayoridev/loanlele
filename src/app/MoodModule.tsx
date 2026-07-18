import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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
  | "family-progress" | "family-ai" | "family-user-profile";

interface JournalEntry {
  id: string; date: string; time: string; mood: string;
  moodEmoji: string; moodLabel: string; moodColor: string; moodBg: string;
  moodIntensity: number; title: string; content: string;
  tags: string[]; emojis: string[]; hasVoice: boolean; hasPhoto: boolean; wordCount: number;
}
interface MoodEntry {
  date: string; score: number; mood: string; moodEmoji: string;
  moodLabel: string; moodColor: string; moodBg: string;
  journalCount: number; selfCareCompleted: number;
}
interface MoodCtx {
  history: MoodEntry[]; selectedDate: string | null;
  setSelectedDate: (d: string | null) => void;
  navigate: (p: PageName) => void;
  emotionalCircles: number; journalEntries: JournalEntry[];
}

const ACTS = [
  { id: "water",     name: "Uống đủ nước",    emoji: "💧", accent: "#7AB8D8", bg: "#EDF5FB", page: "water"     as PageName },
  { id: "breathing", name: "Hít thở",          emoji: "🌬️", accent: "#7BBFA8", bg: "#EEF8F4", page: "breathing" as PageName },
  { id: "exercise",  name: "Vận động",          emoji: "🏃", accent: "#F5A87B", bg: "#FFF4EE", page: "exercise"  as PageName },
  { id: "sleep",     name: "Ngủ đủ giấc",       emoji: "🌙", accent: "#C3B4E8", bg: "#F5F0FB", page: "sleep"     as PageName },
  { id: "eating",    name: "Ăn uống lành mạnh", emoji: "🥗", accent: "#7BBFA8", bg: "#EEF8F4", page: "eating"    as PageName },
  { id: "reading",   name: "Đọc sách",          emoji: "📚", accent: "#F5A87B", bg: "#FFF8F0", page: "reading"   as PageName },
  { id: "relax",     name: "Thư giãn",          emoji: "🎵", accent: "#A8C8E8", bg: "#EEF5FB", page: "relax"     as PageName },
  { id: "gratitude", name: "Biết ơn",           emoji: "🌸", accent: "#E87BA8", bg: "#FFF0F6", page: "gratitude" as PageName },
  { id: "meditation",name: "Thiền",             emoji: "🧘", accent: "#9B8FD8", bg: "#F0EEF8", page: "meditation"as PageName },
] as const;

const J_MOODS = [
  { id: "rad",   emoji: "✨", label: "Tuyệt vời",  color: "#F59E0B", bg: "#FEF9C3" },
  { id: "good",  emoji: "😊", label: "Vui vẻ",     color: "#22C55E", bg: "#DCFCE7" },
  { id: "okay",  emoji: "😌", label: "Bình thường", color: "#38BDF8", bg: "#DBEAFE" },
  { id: "sad",   emoji: "🥺", label: "Buồn bã",     color: "#8B5CF6", bg: "#EDE9FE" },
  { id: "awful", emoji: "😔", label: "Mệt mỏi",    color: "#F43F5E", bg: "#FFE4E6" },
] as const;

function PageShell({ title, accent, bg, onBack, children }: {
  title: string; accent: string; bg: string;
  onBack: () => void; children: React.ReactNode;
}) {
  return (
    <motion.div className="min-h-screen flex flex-col"
      style={{ background: bg, maxWidth: 480, margin: "0 auto" }}
      initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}>
      <div className="sticky top-0 z-20 flex items-center gap-3 px-5 py-4"
        style={{ background: bg, borderBottom: "1px solid rgba(180,170,200,0.18)" }}>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.8)", border: `1.5px solid ${accent}44` }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
        <h1 className="font-black text-lg text-[#3D3547]" style={{ fontFamily: "Nunito" }}>{title}</h1>
      </div>
      <div className="flex-1 overflow-y-auto pb-10" style={{ scrollbarWidth: "none" }}>{children}</div>
    </motion.div>
  );
}

function MoodBadge({ emoji, label, color, bg }: { emoji: string; label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
      style={{ background: bg, border: `1.5px solid ${color}44`, color, fontFamily: "Nunito" }}>
      {emoji} {label}
    </span>
  );
}

function Sparkles({ count = 12, active = true, color }: { count?: number; active?: boolean; color?: string }) {
  const data = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: `${8 + Math.random() * 84}%`, y: `${8 + Math.random() * 84}%`,
    size: 4 + Math.random() * 8, delay: Math.random() * 1.5,
    color: color || ["#FDE68A","#C3B4E8","#7BBFA8","#F4C0C0","#A8D4E8","#F5D0BE"][i % 6],
  })), []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {data.map((s, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ width: s.size, height: s.size, background: s.color, left: s.x, top: s.y }}
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], y: [0, -20] }}
          transition={{ duration: 2, repeat: Infinity, delay: s.delay, ease: "easeOut" }} />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MOOD TRACKING MODULE
// ══════════════════════════════════════════════════════════════════════════════

// ─── Mood history (30 days) ───────────────────────────────────────────────────
const MOOD_HISTORY: MoodEntry[] = (() => {
  const M: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
    rad:   { emoji: "✨", label: "Tuyệt vời",  color: "#F59E0B", bg: "#FEF9C3" },
    good:  { emoji: "😊", label: "Vui vẻ",     color: "#22C55E", bg: "#DCFCE7" },
    okay:  { emoji: "😌", label: "Bình thường", color: "#38BDF8", bg: "#DBEAFE" },
    sad:   { emoji: "🥺", label: "Buồn bã",     color: "#8B5CF6", bg: "#EDE9FE" },
    awful: { emoji: "😔", label: "Mệt mỏi",    color: "#F43F5E", bg: "#FFE4E6" },
  };
  const pat  = ["good","good","rad","okay","good","sad","okay","good","rad","good","okay","okay","good","rad","awful","okay","good","good","rad","okay","sad","okay","good","good","rad","good","okay","good","rad","good"];
  const scr  = [72,75,92,54,78,32,58,74,90,71,52,56,73,89,16,53,76,78,91,55,33,57,75,74,93,77,52,79,88,73];
  const jrn  = [1,0,1,0,1,1,0,1,1,0,0,1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0];
  const sca  = [5,3,7,4,6,2,4,5,8,4,3,5,6,7,2,4,6,7,8,4,3,5,6,5,7,5,4,6,7,5];
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const id = pat[i]; const m = M[id];
    return { date: d.toISOString().split("T")[0], score: scr[i], mood: id, moodEmoji: m.emoji, moodLabel: m.label, moodColor: m.color, moodBg: m.bg, journalCount: jrn[i], selfCareCompleted: sca[i] };
  });
})();

// ─── ScoreRing ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 120, color }: { score: number; size?: number; color: string }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#EDF5FB" strokeWidth={10} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeLinecap="round"
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-black text-3xl" style={{ color, fontFamily: "Nunito" }}>{Math.round(score)}</span>
        <span className="text-[10px] text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>/ 100</span>
      </div>
    </div>
  );
}

// ─── MoodDashboard ────────────────────────────────────────────────────────────
function MoodDashboard({ mCtx }: { mCtx: MoodCtx }) {
  const [moodLoading, setMoodLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setMoodLoading(false), 900); return () => clearTimeout(t); }, []);

  const today  = mCtx.history[mCtx.history.length - 1];
  const last7  = mCtx.history.slice(-7);
  const avgScore = Math.round(last7.reduce((a, e) => a + e.score, 0) / last7.length);
  const streak   = mCtx.history.length;
  const totalJournals = mCtx.history.reduce((a, e) => a + e.journalCount, 0);
  const todaySCA  = today.selfCareCompleted;

  const moodCounts: Record<string, number> = {};
  mCtx.history.forEach(e => { moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1; });
  const topMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
  const total = mCtx.history.length;

  if (moodLoading) {
    return (
      <motion.div className="min-h-screen flex flex-col items-center justify-center gap-5"
        style={{ background: "#EDF5FB", maxWidth: 480, margin: "0 auto" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
          style={{ background: "linear-gradient(135deg,#7AB8D8,#A8C8E8)" }}
          animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>🎯</motion.div>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <motion.div key={i} className="w-2.5 h-2.5 rounded-full bg-[#7AB8D8]"
              animate={{ y: [0,-8,0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i*0.15 }} />
          ))}
        </div>
        <p className="text-sm text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>Đang tải dữ liệu cảm xúc...</p>
      </motion.div>
    );
  }

  return (
    <motion.div className="min-h-screen" style={{ background: "#EDF5FB", maxWidth: 480, margin: "0 auto" }}
      initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-5 pt-12 pb-4"
        style={{ background: "rgba(238,245,251,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(122,184,216,0.15)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => mCtx.navigate("home")}
              className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.8)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="#7AB8D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </motion.button>
            <h1 className="font-black text-xl text-[#3D3547]" style={{ fontFamily: "Nunito" }}>Theo dõi cảm xúc 🎯</h1>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => mCtx.navigate("mood-export")}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white">📤</motion.button>
        </div>
      </div>

      <div className="px-5 pb-28 flex flex-col gap-4">
        {/* Today's Score */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(122,184,216,0.15)]">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-[#9490A4] mb-1" style={{ fontFamily:"Be Vietnam Pro" }}>
                {new Date().toLocaleDateString("vi-VN",{weekday:"long",day:"numeric",month:"long"})}
              </p>
              <h2 className="font-black text-lg text-[#3D3547] mb-2" style={{ fontFamily:"Nunito" }}>Điểm tâm trạng hôm nay</h2>
              <MoodBadge emoji={today.moodEmoji} label={today.moodLabel} color={today.moodColor} bg={today.moodBg} />
              <div className="mt-3 flex items-center gap-1.5">
                <span className="text-[10px] font-semibold" style={{ color: today.score >= avgScore ? "#22C55E" : "#F43F5E", fontFamily:"Nunito" }}>
                  {today.score >= avgScore ? "↑" : "↓"} {Math.abs(today.score - avgScore)} điểm so với trung bình
                </span>
              </div>
            </div>
            <ScoreRing score={today.score} color={today.moodColor} />
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
          className="grid grid-cols-3 gap-3">
          {[
            { icon:"🔥", label:"Chuỗi ngày", value:`${streak}`, sub:"ngày", bg:"#FFF4EE", color:"#F5A87B" },
            { icon:"📓", label:"Nhật ký", value:`${totalJournals}`, sub:"tổng cộng", bg:"#F5F0FB", color:"#C3B4E8" },
            { icon:"🌿", label:"Tự chăm sóc", value:`${todaySCA}/9`, sub:"hôm nay", bg:"#EEF8F4", color:"#7BBFA8" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background:s.bg }}>
              <div className="text-xl mb-1">{s.icon}</div>
              <p className="font-black text-lg" style={{ color:s.color, fontFamily:"Nunito" }}>{s.value}</p>
              <p className="text-[9px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Weekly mini chart */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(122,184,216,0.1)]">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>7 ngày gần nhất</p>
            <motion.button whileTap={{ scale:0.95 }} onClick={() => mCtx.navigate("mood-weekly")}
              className="text-xs font-bold text-[#7AB8D8]" style={{ fontFamily:"Nunito" }}>Xem chi tiết →</motion.button>
          </div>
          <div className="flex items-end gap-1.5" style={{ height:72 }}>
            {last7.map((e, i) => {
              const h = Math.max(6, (e.score / 100) * 64);
              const dayName = new Date(e.date).toLocaleDateString("vi-VN",{weekday:"short"}).replace(".","");
              return (
                <motion.button key={e.date} className="flex-1 flex flex-col items-center gap-1"
                  whileHover={{ scale:1.05 }} whileTap={{ scale:0.92 }}
                  onClick={() => { mCtx.setSelectedDate(e.date); mCtx.navigate("mood-daily"); }}>
                  <motion.div className="w-full rounded-xl"
                    style={{ background:e.moodColor, opacity: i===6 ? 1 : 0.6 }}
                    initial={{ height:0 }} animate={{ height:h }}
                    transition={{ duration:0.6, delay:i*0.07, ease:"easeOut" }} />
                  <span className="text-[9px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>{dayName}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Emotional balance */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
          className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(122,184,216,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>Cân bằng cảm xúc</p>
            <motion.button whileTap={{ scale:0.95 }} onClick={() => mCtx.navigate("mood-patterns")}
              className="text-xs font-bold text-[#7AB8D8]" style={{ fontFamily:"Nunito" }}>Xem mẫu →</motion.button>
          </div>
          <div className="space-y-2.5">
            {topMoods.slice(0,4).map(([id, count]) => {
              const m = J_MOODS.find(x => x.id === id); if (!m) return null;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={id} className="flex items-center gap-3">
                  <span className="text-base w-6">{m.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-xs font-bold text-[#3D3547]" style={{ fontFamily:"Nunito" }}>{m.label}</span>
                      <span className="text-xs text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background:"#F0EDF8" }}>
                      <motion.div className="h-full rounded-full" style={{ background:m.color }}
                        initial={{ width:0 }} animate={{ width:`${pct}%` }}
                        transition={{ duration:0.8, delay:0.3, ease:"easeOut" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Time navigation tabs */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          className="bg-white rounded-3xl p-2 shadow-[0_4px_20px_rgba(122,184,216,0.08)]">
          <div className="grid grid-cols-3 gap-1">
            {[
              { label:"Tuần", page:"mood-weekly" as PageName, icon:"📈" },
              { label:"Tháng", page:"mood-monthly" as PageName, icon:"📅" },
              { label:"Năm", page:"mood-yearly" as PageName, icon:"🌸" },
            ].map(t => (
              <motion.button key={t.label} whileHover={{ scale:1.03 }} whileTap={{ scale:0.96 }}
                onClick={() => mCtx.navigate(t.page)}
                className="flex flex-col items-center gap-1 py-3.5 rounded-2xl"
                style={{ background:"#F0F6FB" }}>
                <span className="text-xl">{t.icon}</span>
                <span className="text-xs font-bold text-[#3D3547]" style={{ fontFamily:"Nunito" }}>{t.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
          className="grid grid-cols-2 gap-3">
          {[
            { icon:"⚖️", label:"So sánh", desc:"Tuần này vs tuần trước", page:"mood-compare" as PageName, bg:"#EDF5FB", accent:"#7AB8D8" },
            { icon:"🏆", label:"Thành tích", desc:"Cột mốc của bạn", page:"mood-achievement" as PageName, bg:"#FFF4EE", accent:"#F5A87B" },
          ].map(card => (
            <motion.button key={card.label} whileHover={{ y:-4, boxShadow:`0 12px 30px ${card.accent}30` }} whileTap={{ scale:0.97 }}
              onClick={() => mCtx.navigate(card.page)}
              className="rounded-3xl p-4 text-left transition-shadow"
              style={{ background:card.bg, border:`1.5px solid ${card.accent}33` }}>
              <div className="text-2xl mb-2">{card.icon}</div>
              <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>{card.label}</p>
              <p className="text-[10px] text-[#9490A4] mt-0.5" style={{ fontFamily:"Be Vietnam Pro" }}>{card.desc}</p>
            </motion.button>
          ))}
        </motion.div>

        {/* Bottom CTA buttons */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          className="flex flex-col gap-3">
          <motion.button whileHover={{ scale:1.02, boxShadow:"0 10px 30px rgba(122,184,216,0.4)" }} whileTap={{ scale:0.97 }}
            onClick={() => mCtx.navigate("mood-weekly")}
            className="py-4 rounded-2xl font-black text-white text-base"
            style={{ background:"linear-gradient(135deg,#7AB8D8,#A8C8E8)", fontFamily:"Nunito" }}>
            Xem chi tiết 📊
          </motion.button>
          <div className="flex gap-3">
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
              onClick={() => mCtx.navigate("journal-history")}
              className="flex-1 py-3.5 rounded-2xl font-bold text-sm"
              style={{ background:"#EEF8F4", color:"#7BBFA8", border:"1.5px solid #7BBFA844", fontFamily:"Nunito" }}>
              Nhật ký hôm nay 📓
            </motion.button>
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
              onClick={() => mCtx.navigate("mood-export")}
              className="flex-1 py-3.5 rounded-2xl font-bold text-sm"
              style={{ background:"#F5F0FB", color:"#C3B4E8", border:"1.5px solid #C3B4E844", fontFamily:"Nunito" }}>
              Xuất báo cáo 📤
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── WeeklyMood ───────────────────────────────────────────────────────────────
function WeeklyMood({ mCtx }: { mCtx: MoodCtx }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<MoodEntry | null>(null);

  const getWeek = (offset: number) => {
    const end = mCtx.history.length - 1 + offset * 7;
    const start = Math.max(0, end - 6);
    return mCtx.history.slice(start, end + 1);
  };
  const week = getWeek(weekOffset);
  const avgScore = Math.round(week.reduce((a, e) => a + e.score, 0) / Math.max(1, week.length));
  const bestDay  = week.length > 0 ? week.reduce((a, e) => a.score > e.score ? a : e, week[0]) : null;

  const chartData = week.map(e => ({
    day: new Date(e.date).toLocaleDateString("vi-VN",{weekday:"short"}).replace(".",""),
    score: Math.round(e.score),
    entry: e,
  }));

  return (
    <PageShell title="Biểu đồ tuần 📈" accent="#7AB8D8" bg="#EDF5FB" onBack={() => mCtx.navigate("mood-dashboard")}>
      <div className="px-5 pt-4 flex flex-col gap-5">
        {/* Week selector */}
        <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-[0_2px_12px_rgba(122,184,216,0.1)]">
          <motion.button whileTap={{ scale:0.9 }} onClick={() => setWeekOffset(w => Math.max(-3, w-1))}
            className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background:"#EDF5FB" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="#7AB8D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </motion.button>
          <div className="text-center">
            <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>
              {weekOffset === 0 ? "Tuần này" : weekOffset === -1 ? "Tuần trước" : `${Math.abs(weekOffset)} tuần trước`}
            </p>
            {week.length >= 2 && (
              <p className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>
                {new Date(week[0].date).toLocaleDateString("vi-VN",{day:"numeric",month:"short"})} – {new Date(week[week.length-1].date).toLocaleDateString("vi-VN",{day:"numeric",month:"short"})}
              </p>
            )}
          </div>
          <motion.button whileTap={{ scale:0.9 }} onClick={() => setWeekOffset(w => Math.min(0, w+1))}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: weekOffset < 0 ? "#EDF5FB" : "#F0EDF8", opacity: weekOffset < 0 ? 1 : 0.5 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke={weekOffset < 0 ? "#7AB8D8" : "#D0CCDE"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:"Trung bình", value:avgScore, color:"#7AB8D8" },
            { label:"Tốt nhất",   value:bestDay ? Math.round(bestDay.score) : 0, color:"#22C55E" },
            { label:"Xu hướng",   value:weekOffset===0 ? `+${Math.max(0,avgScore-65)}` : "—", color:"#F59E0B" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-3 text-center shadow-[0_2px_10px_rgba(122,184,216,0.08)]">
              <p className="font-black text-xl" style={{ color:s.color, fontFamily:"Nunito" }}>{s.value}</p>
              <p className="text-[9px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Area chart */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgba(122,184,216,0.12)]">
          <p className="font-bold text-sm text-[#3D3547] mb-4" style={{ fontFamily:"Nunito" }}>Biểu đồ điểm tâm trạng</p>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top:8, right:8, bottom:4, left:-20 }}
                onClick={(data: any) => { const e = data?.activePayload?.[0]?.payload?.entry; if (e) setSelectedDay(e as MoodEntry); }}>
                <defs>
                  <linearGradient id="wkMoodG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7AB8D8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#7AB8D8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDF8" />
                <XAxis dataKey="day" tick={{ fontSize:10, fill:"#9490A4", fontFamily:"Be Vietnam Pro" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0,100]} tick={{ fontSize:10, fill:"#9490A4" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:"#FFFFFF", border:"1.5px solid rgba(122,184,216,0.3)", borderRadius:16, fontFamily:"Nunito", fontSize:12 }}
                  formatter={(v: any) => [`${v} điểm`, "Tâm trạng"]} />
                <Area type="monotone" dataKey="score" stroke="#7AB8D8" strokeWidth={3} fill="url(#wkMoodG)"
                  dot={{ r:6, fill:"#7AB8D8", stroke:"#FFFFFF", strokeWidth:2 }}
                  activeDot={{ r:8, fill:"#7AB8D8", stroke:"#FFFFFF", strokeWidth:3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-[#9490A4] text-center mt-2" style={{ fontFamily:"Be Vietnam Pro" }}>Nhấn vào điểm trên biểu đồ để xem chi tiết</p>
        </div>

        {/* Selected day card */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
              className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(122,184,216,0.12)] cursor-pointer"
              onClick={() => { mCtx.setSelectedDate(selectedDay.date); mCtx.navigate("mood-daily"); }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background:selectedDay.moodBg }}>{selectedDay.moodEmoji}</div>
                  <div>
                    <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>
                      {new Date(selectedDay.date).toLocaleDateString("vi-VN",{weekday:"long",day:"numeric",month:"short"})}
                    </p>
                    <MoodBadge emoji={selectedDay.moodEmoji} label={selectedDay.moodLabel} color={selectedDay.moodColor} bg={selectedDay.moodBg} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-2xl" style={{ color:selectedDay.moodColor, fontFamily:"Nunito" }}>{Math.round(selectedDay.score)}</p>
                  <p className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>điểm</p>
                </div>
              </div>
              <p className="text-xs font-bold text-[#7AB8D8] mt-3 text-right" style={{ fontFamily:"Nunito" }}>Xem chi tiết ngày →</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Day list */}
        <div className="flex flex-col gap-2">
          {week.map((e, i) => {
            const isToday = e.date === new Date().toISOString().split("T")[0];
            return (
              <motion.button key={e.date} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.06 }}
                whileHover={{ scale:1.01, x:4 }} whileTap={{ scale:0.98 }}
                onClick={() => { mCtx.setSelectedDate(e.date); mCtx.navigate("mood-daily"); }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-white text-left shadow-[0_2px_10px_rgba(122,184,216,0.07)]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background:e.moodBg }}>{e.moodEmoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-xs text-[#3D3547]" style={{ fontFamily:"Nunito" }}>{new Date(e.date).toLocaleDateString("vi-VN",{weekday:"long"})}</p>
                    {isToday && <span className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ background:"#7AB8D8" }}>Hôm nay</span>}
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full" style={{ background:"#F0EDF8" }}>
                    <motion.div className="h-full rounded-full" style={{ background:e.moodColor }}
                      initial={{ width:0 }} animate={{ width:`${e.score}%` }}
                      transition={{ duration:0.6, delay:i*0.08 }} />
                  </div>
                </div>
                <p className="font-black text-sm flex-shrink-0" style={{ color:e.moodColor, fontFamily:"Nunito" }}>{Math.round(e.score)}</p>
              </motion.button>
            );
          })}
        </div>
        <div className="h-4" />
      </div>
    </PageShell>
  );
}

// ─── MonthlyMood ──────────────────────────────────────────────────────────────
function MonthlyMood({ mCtx }: { mCtx: MoodCtx }) {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const dayNames   = ["CN","T2","T3","T4","T5","T6","T7"];
  const monthNames = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMth = new Date(year, month+1, 0).getDate();

  const histMap: Record<string, MoodEntry> = {};
  mCtx.history.forEach(e => { histMap[e.date] = e; });

  const monthEntries = Object.values(histMap).filter(e => { const d = new Date(e.date); return d.getFullYear()===year && d.getMonth()===month; });
  const avgScore = monthEntries.length > 0 ? Math.round(monthEntries.reduce((a,e)=>a+e.score,0)/monthEntries.length) : 0;

  const prevM = () => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextM = () => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };

  const moodDist: Record<string,number> = {};
  monthEntries.forEach(e => { moodDist[e.mood]=(moodDist[e.mood]||0)+1; });
  const topMoodId = Object.entries(moodDist).sort((a,b)=>b[1]-a[1])[0]?.[0];
  const topMood = J_MOODS.find(m => m.id === topMoodId);
  const bestEntry = monthEntries.length > 0 ? monthEntries.reduce((a,e)=>a.score>e.score?a:e, monthEntries[0]) : null;

  return (
    <PageShell title="Biểu đồ tháng 📅" accent="#7AB8D8" bg="#EDF5FB" onBack={() => mCtx.navigate("mood-dashboard")}>
      <div className="px-5 pt-4 flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:"TB tháng", value:avgScore || "—", color:"#7AB8D8" },
            { label:"Số ngày ghi", value:monthEntries.length, color:"#22C55E" },
            { label:"Ngày tốt", value:monthEntries.filter(e=>e.score>=70).length, color:"#F59E0B" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-3 text-center shadow-[0_2px_10px_rgba(122,184,216,0.08)]">
              <p className="font-black text-xl" style={{ color:s.color, fontFamily:"Nunito" }}>{s.value}</p>
              <p className="text-[9px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgba(122,184,216,0.12)]">
          <div className="flex items-center justify-between mb-5">
            <motion.button whileTap={{ scale:0.9 }} onClick={prevM}
              className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background:"#EDF5FB" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="#7AB8D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </motion.button>
            <h3 className="font-black text-[#3D3547]" style={{ fontFamily:"Nunito" }}>{monthNames[month]} {year}</h3>
            <motion.button whileTap={{ scale:0.9 }} onClick={nextM}
              className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background:"#EDF5FB" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="#7AB8D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </motion.button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map(d => <div key={d} className="text-center text-[10px] font-bold text-[#9490A4] py-1" style={{ fontFamily:"Nunito" }}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({length:firstDay}, (_,i) => <div key={`e${i}`} />)}
            {Array.from({length:daysInMth}, (_, i) => {
              const day = i+1;
              const ds  = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const entry = histMap[ds];
              const isT = ds === now.toISOString().split("T")[0];
              return (
                <motion.button key={day} whileHover={{ scale:1.15 }} whileTap={{ scale:0.85 }}
                  onClick={() => { if(entry){mCtx.setSelectedDate(ds);mCtx.navigate("mood-daily");} }}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center"
                  style={{ background:entry?`${entry.moodColor}22`:isT?"#EDF5FB":"transparent", border:isT?"2px solid #7AB8D8":entry?`2px solid ${entry.moodColor}44`:"2px solid transparent", cursor:entry?"pointer":"default" }}>
                  <span className="text-[11px] font-bold" style={{ color:entry?entry.moodColor:isT?"#7AB8D8":"#C0BCCC", fontFamily:"Nunito" }}>{day}</span>
                  {entry && <span className="text-[9px] leading-none">{entry.moodEmoji}</span>}
                </motion.button>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-3 mt-4 pt-3" style={{ borderTop:"1px solid rgba(122,184,216,0.15)" }}>
            <span className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>Thấp</span>
            {["😔","🥺","😌","😊","✨"].map((e,i) => <span key={i} className="text-sm">{e}</span>)}
            <span className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>Cao</span>
          </div>
        </div>

        {monthEntries.length > 0 && bestEntry && (
          <div className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(122,184,216,0.08)]">
            <p className="font-bold text-sm text-[#3D3547] mb-3" style={{ fontFamily:"Nunito" }}>Điểm nổi bật tháng này</p>
            <div className="flex gap-3">
              <div className="flex-1 rounded-2xl p-3 text-center" style={{ background:bestEntry.moodBg }}>
                <p className="text-xs text-[#9490A4] mb-1" style={{ fontFamily:"Be Vietnam Pro" }}>Ngày tốt nhất</p>
                <p className="text-lg">{bestEntry.moodEmoji}</p>
                <p className="font-black text-sm" style={{ color:bestEntry.moodColor, fontFamily:"Nunito" }}>{new Date(bestEntry.date).getDate()}/{month+1}</p>
              </div>
              {topMood && (
                <div className="flex-1 rounded-2xl p-3 text-center" style={{ background:topMood.bg }}>
                  <p className="text-xs text-[#9490A4] mb-1" style={{ fontFamily:"Be Vietnam Pro" }}>Tâm trạng chủ đạo</p>
                  <p className="text-lg">{topMood.emoji}</p>
                  <p className="font-black text-sm" style={{ color:topMood.color, fontFamily:"Nunito" }}>{topMood.label}</p>
                </div>
              )}
              <div className="flex-1 rounded-2xl p-3 text-center" style={{ background:"#EDF5FB" }}>
                <p className="text-xs text-[#9490A4] mb-1" style={{ fontFamily:"Be Vietnam Pro" }}>Điểm TB</p>
                <p className="text-lg">📊</p>
                <p className="font-black text-sm" style={{ color:"#7AB8D8", fontFamily:"Nunito" }}>{avgScore}</p>
              </div>
            </div>
          </div>
        )}
        <div className="h-4" />
      </div>
    </PageShell>
  );
}

// ─── YearOverview ─────────────────────────────────────────────────────────────
function YearOverview({ mCtx }: { mCtx: MoodCtx }) {
  const histMap: Record<string, MoodEntry> = {};
  mCtx.history.forEach(e => { histMap[e.date] = e; });
  const year = new Date().getFullYear();
  const mLabels = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];
  const flowers = mCtx.history.filter(e=>e.score>=80).length;
  const leaves  = mCtx.history.filter(e=>e.score>=50&&e.score<80).length;
  const sprouts = mCtx.history.filter(e=>e.score<50).length;
  const streak  = mCtx.history.length;
  const getIcon = (entry: MoodEntry | undefined) => {
    if (!entry) return null;
    if (entry.score >= 80) return "🌸";
    if (entry.score >= 60) return "🌼";
    if (entry.score >= 40) return "🌿";
    return "🌱";
  };
  return (
    <PageShell title="Khu vườn cảm xúc 🌸" accent="#7AB8D8" bg="#EDF5FB" onBack={() => mCtx.navigate("mood-dashboard")}>
      <div className="px-5 pt-4 flex flex-col gap-5">
        <div className="text-center">
          <motion.h2 className="font-black text-3xl text-[#3D3547]" style={{ fontFamily:"Nunito" }}
            animate={{ scale:[1,1.03,1] }} transition={{ duration:2, repeat:Infinity }}>🌸 {year}</motion.h2>
          <p className="text-sm text-[#9490A4] mt-1" style={{ fontFamily:"Be Vietnam Pro" }}>Khu vườn cảm xúc của bạn</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon:"🌸", label:"Hoa nở",  value:flowers, color:"#E87BA8" },
            { icon:"🌿", label:"Lá xanh", value:leaves,  color:"#7BBFA8" },
            { icon:"🌱", label:"Chồi non",value:sprouts, color:"#9B8FD8" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-3 text-center shadow-[0_2px_10px_rgba(122,184,216,0.08)]">
              <div className="text-xl mb-1">{s.icon}</div>
              <p className="font-black text-xl" style={{ color:s.color, fontFamily:"Nunito" }}>{s.value}</p>
              <p className="text-[9px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Flower garden grid */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgba(122,184,216,0.12)]">
          <p className="font-bold text-sm text-[#3D3547] mb-4" style={{ fontFamily:"Nunito" }}>Khu vườn năm {year}</p>
          <div className="space-y-2.5">
            {Array.from({length:12}, (_, m) => {
              const daysInM = new Date(year, m+1, 0).getDate();
              return (
                <div key={m} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#9490A4] w-5 flex-shrink-0" style={{ fontFamily:"Nunito" }}>{mLabels[m]}</span>
                  <div className="flex flex-wrap gap-0.5 flex-1">
                    {Array.from({length:daysInM}, (_, d) => {
                      const ds = `${year}-${String(m+1).padStart(2,"0")}-${String(d+1).padStart(2,"0")}`;
                      const entry = histMap[ds];
                      const icon  = getIcon(entry);
                      return (
                        <motion.button key={ds} whileHover={{ scale:1.5 }} whileTap={{ scale:0.85 }}
                          onClick={() => { if(entry){mCtx.setSelectedDate(ds);mCtx.navigate("mood-daily");} }}
                          style={{ cursor:entry?"pointer":"default" }}>
                          {icon ? (
                            <span className="text-sm leading-none">{icon}</span>
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-sm" style={{ background:"#F0EDF8" }} />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-3 mt-4 pt-3" style={{ borderTop:"1px solid rgba(122,184,216,0.15)" }}>
            {[{icon:"🌸",label:"Tuyệt vời"},{icon:"🌼",label:"Vui vẻ"},{icon:"🌿",label:"Bình thường"},{icon:"🌱",label:"Khó khăn"}].map(l=>(
              <div key={l.label} className="flex items-center gap-1">
                <span className="text-xs">{l.icon}</span>
                <span className="text-[9px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Growing tree */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(122,184,216,0.08)] flex flex-col items-center gap-3">
          <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>Cây năm của bạn 🌳</p>
          <div className="relative flex items-center justify-center" style={{ height:130, width:140 }}>
            <motion.div className="absolute bottom-0 left-1/2 rounded-full"
              style={{ width:12, background:"#C3A882", transform:"translateX(-50%)" }}
              initial={{ height:0 }}
              animate={{ height: Math.min(88, 10 + streak*2.7) }}
              transition={{ duration:1.8, ease:"easeOut" }} />
            <motion.div className="absolute rounded-full flex items-center justify-center"
              style={{ width:streak>=7?80:60, height:streak>=7?80:60, background:"linear-gradient(135deg,#7BBFA8,#9BC5B8)", bottom:Math.min(70,10+streak*2.7)-10, left:"50%", transform:"translateX(-50%)" }}
              initial={{ scale:0 }} animate={{ scale:1 }}
              transition={{ duration:0.8, delay:1.4, type:"spring" }}>
              <span className="text-3xl">{streak>=30?"🌳":streak>=14?"🌿":"🌱"}</span>
            </motion.div>
            {streak >= 14 && (
              <motion.span className="absolute text-2xl" style={{ bottom:Math.min(88,10+streak*2.7)+30, left:"50%", transform:"translateX(-50%)" }}
                initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:2, type:"spring" }}>🌸</motion.span>
            )}
          </div>
          <p className="text-xs text-[#9490A4] text-center" style={{ fontFamily:"Be Vietnam Pro" }}>
            {streak>=30?"Cây đang nở hoa! Bạn thật tuyệt vời! 🌸":streak>=14?"Cây đang lớn mạnh! Tiếp tục nhé! 🌳":"Cây mới đang lớn... hãy chăm sóc mỗi ngày 🌱"}
          </p>
        </div>
        <div className="h-4" />
      </div>
    </PageShell>
  );
}

// ─── DailyMoodSummary ─────────────────────────────────────────────────────────
function DailyMoodSummary({ mCtx }: { mCtx: MoodCtx }) {
  const entry = mCtx.history.find(e => e.date === mCtx.selectedDate) ?? mCtx.history[mCtx.history.length-1];
  const journalEntry = mCtx.journalEntries.find(j => j.date === entry?.date);
  if (!entry) {
    return (
      <PageShell title="Chi tiết ngày" accent="#7AB8D8" bg="#EDF5FB" onBack={() => mCtx.navigate("mood-weekly")}>
        <div className="flex items-center justify-center py-20">
          <p className="text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>Không có dữ liệu ngày này</p>
        </div>
      </PageShell>
    );
  }
  const fmtDate = new Date(entry.date).toLocaleDateString("vi-VN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  return (
    <PageShell title="Chi tiết ngày 📋" accent={entry.moodColor} bg={`${entry.moodBg}88`} onBack={() => mCtx.navigate("mood-weekly")}>
      <div className="px-5 pt-4 pb-28 flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>{fmtDate}</p>
          <ScoreRing score={entry.score} color={entry.moodColor} size={140} />
          <MoodBadge emoji={entry.moodEmoji} label={entry.moodLabel} color={entry.moodColor} bg={entry.moodBg} />
          <div className="flex gap-1">{Array.from({length:Math.round(entry.score/20)}, (_,i) => <span key={i} className="text-xs" style={{ color:entry.moodColor }}>●</span>)}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
            <p className="text-2xl mb-1">📓</p>
            <p className="font-black text-xl" style={{ color:"#C3B4E8", fontFamily:"Nunito" }}>{entry.journalCount}</p>
            <p className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>Nhật ký</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
            <p className="text-2xl mb-1">🌿</p>
            <p className="font-black text-xl" style={{ color:"#7BBFA8", fontFamily:"Nunito" }}>{entry.selfCareCompleted}/9</p>
            <p className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>Tự chăm sóc</p>
          </div>
        </div>
        {journalEntry ? (
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] cursor-pointer"
            onClick={() => mCtx.navigate("journal-history")}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:journalEntry.moodBg }}>{journalEntry.moodEmoji}</div>
              <div>
                <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>{journalEntry.title}</p>
                <p className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>{journalEntry.time}</p>
              </div>
            </div>
            <p className="text-xs text-[#9490A4] leading-relaxed line-clamp-3" style={{ fontFamily:"Be Vietnam Pro" }}>{journalEntry.content}</p>
            <p className="text-xs font-bold mt-2" style={{ color:entry.moodColor, fontFamily:"Nunito" }}>Mở nhật ký →</p>
          </motion.div>
        ) : (
          <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-center">
            <p className="text-3xl mb-2">📓</p>
            <p className="text-sm text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>Chưa có nhật ký ngày này</p>
          </div>
        )}
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
          <p className="font-bold text-sm text-[#3D3547] mb-3" style={{ fontFamily:"Nunito" }}>Hoạt động tự chăm sóc</p>
          <div className="flex flex-wrap gap-2">
            {ACTS.slice(0, entry.selfCareCompleted).map(act => (
              <div key={act.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background:`${act.accent}22`, border:`1.5px solid ${act.accent}44` }}>
                <span className="text-sm">{act.emoji}</span>
                <span className="text-[10px] font-bold" style={{ color:act.accent, fontFamily:"Nunito" }}>{act.name}</span>
              </div>
            ))}
            {Array.from({length:9-entry.selfCareCompleted}, (_, i) => (
              <div key={i} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background:"#F0EDF8" }}>
                <div className="w-4 h-4 rounded-full border-2" style={{ borderColor:"#D0CCDE" }} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.96 }}
            onClick={() => mCtx.navigate("journal-history")}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm"
            style={{ background:entry.moodBg, color:entry.moodColor, border:`1.5px solid ${entry.moodColor}44`, fontFamily:"Nunito" }}>
            Mở nhật ký 📓
          </motion.button>
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.96 }}
            onClick={() => mCtx.navigate("mood-ai-insight")}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white"
            style={{ background:`linear-gradient(135deg,${entry.moodColor},${entry.moodColor}AA)`, fontFamily:"Nunito" }}>
            AI Insight 🤖
          </motion.button>
        </div>
      </div>
    </PageShell>
  );
}

// ─── EmotionalPattern ─────────────────────────────────────────────────────────
function EmotionalPattern({ mCtx }: { mCtx: MoodCtx }) {
  const history = mCtx.history;
  const moodCounts: Record<string, number> = {};
  history.forEach(e => { moodCounts[e.mood]=(moodCounts[e.mood]||0)+1; });
  const topMood = J_MOODS.find(m => m.id === Object.entries(moodCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]);

  const dayScores: Record<number, number[]> = {0:[],1:[],2:[],3:[],4:[],5:[],6:[]};
  history.forEach(e => { dayScores[new Date(e.date).getDay()].push(e.score); });
  const dayAvgs = [0,1,2,3,4,5,6].map(d => ({
    day: d, dayName: ["CN","T2","T3","T4","T5","T6","T7"][d],
    avg: dayScores[d].length > 0 ? dayScores[d].reduce((a,b)=>a+b,0)/dayScores[d].length : 0,
  }));
  const validDays = dayAvgs.filter(d => d.avg > 0);
  const bestDay  = validDays.length > 0 ? validDays.reduce((a,b)=>a.avg>b.avg?a:b, validDays[0]) : null;
  const worstDay = validDays.length > 0 ? validDays.reduce((a,b)=>a.avg<b.avg?a:b, validDays[0]) : null;

  const first7avg = history.slice(0,7).reduce((a,e)=>a+e.score,0)/7;
  const last7avg  = history.slice(-7).reduce((a,e)=>a+e.score,0)/7;
  const trend = last7avg - first7avg;
  const total = history.length;

  return (
    <PageShell title="Mẫu cảm xúc 🔍" accent="#7AB8D8" bg="#EDF5FB" onBack={() => mCtx.navigate("mood-dashboard")}>
      <div className="px-5 pt-4 flex flex-col gap-5">
        {topMood && (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgba(122,184,216,0.12)]">
            <p className="font-bold text-sm text-[#3D3547] mb-3" style={{ fontFamily:"Nunito" }}>Cảm xúc chủ đạo</p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background:topMood.bg }}>{topMood.emoji}</div>
              <div>
                <p className="font-black text-2xl" style={{ color:topMood.color, fontFamily:"Nunito" }}>{topMood.label}</p>
                <p className="text-xs text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>
                  {moodCounts[topMood.id]} / {total} ngày ({Math.round(moodCounts[topMood.id]/total*100)}%)
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Day of week pattern */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(122,184,216,0.1)]">
          <p className="font-bold text-sm text-[#3D3547] mb-4" style={{ fontFamily:"Nunito" }}>Mẫu theo ngày trong tuần</p>
          <div className="flex items-end gap-2 mb-3" style={{ height:72 }}>
            {dayAvgs.map(d => {
              const h = d.avg > 0 ? Math.max(8, (d.avg/100)*64) : 4;
              const isB = bestDay && d.day===bestDay.day;
              const isW = worstDay && d.day===worstDay.day;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div className="w-full rounded-xl"
                    style={{ background: isB?"#22C55E":isW?"#F43F5E":"#7AB8D8", opacity:0.8 }}
                    initial={{ height:0 }} animate={{ height:h }}
                    transition={{ duration:0.6, delay:d.day*0.08 }} />
                  <span className="text-[9px] font-bold" style={{ color:isB?"#22C55E":isW?"#F43F5E":"#9490A4", fontFamily:"Nunito" }}>{d.dayName}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 flex-wrap text-xs">
            {bestDay && <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" /><span style={{ color:"#22C55E", fontFamily:"Nunito" }}>Hạnh phúc nhất: {bestDay.dayName}</span></div>}
            {worstDay && <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]" /><span style={{ color:"#F43F5E", fontFamily:"Nunito" }}>Khó nhất: {worstDay.dayName}</span></div>}
          </div>
        </div>

        {/* Trend */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(122,184,216,0.08)]">
          <p className="font-bold text-sm text-[#3D3547] mb-3" style={{ fontFamily:"Nunito" }}>Xu hướng cải thiện</p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background:trend>=0?"#DCFCE7":"#FFE4E6" }}>
              {trend >= 0 ? "📈" : "📉"}
            </div>
            <div>
              <p className="font-black text-xl" style={{ color:trend>=0?"#22C55E":"#F43F5E", fontFamily:"Nunito" }}>
                {trend>=0?"+":""}{Math.round(trend)} điểm
              </p>
              <p className="text-xs text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>
                {trend>=0?"Tâm trạng đang cải thiện tốt! 🎉":"Hãy chú ý chăm sóc bản thân hơn 💙"}
              </p>
            </div>
          </div>
        </div>

        {/* Full distribution */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(122,184,216,0.08)]">
          <p className="font-bold text-sm text-[#3D3547] mb-4" style={{ fontFamily:"Nunito" }}>Phân bổ cảm xúc (30 ngày)</p>
          <div className="space-y-2.5">
            {J_MOODS.map(m => {
              const count = moodCounts[m.id] ?? 0;
              const pct   = Math.round((count/total)*100);
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="text-base w-6">{m.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-xs font-bold text-[#3D3547]" style={{ fontFamily:"Nunito" }}>{m.label}</span>
                      <span className="text-xs text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>{count} ngày</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background:"#F0EDF8" }}>
                      <motion.div className="h-full rounded-full" style={{ background:m.color }}
                        initial={{ width:0 }} animate={{ width:`${pct}%` }}
                        transition={{ duration:0.8, delay:0.2, ease:"easeOut" }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold w-8 text-right" style={{ color:m.color, fontFamily:"Nunito" }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="h-4" />
      </div>
    </PageShell>
  );
}

// ─── MoodAIInsight ────────────────────────────────────────────────────────────
function MoodAIInsight({ mCtx }: { mCtx: MoodCtx }) {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(()=>setLoading(false), 2200); return ()=>clearTimeout(t); }, []);
  const history  = mCtx.history;
  const avgScore = Math.round(history.slice(-7).reduce((a,e)=>a+e.score,0)/7);
  const trend    = history.slice(-7).reduce((a,e)=>a+e.score,0)/7 - history.slice(0,7).reduce((a,e)=>a+e.score,0)/7;
  const recs = [
    { icon:"🎧", title:"Podcast gợi ý", desc:"\"Tâm sự với chính mình\" — 15 phút mỗi sáng về chánh niệm", color:"#F5F0FB", accent:"#C3B4E8", dest:"home" as PageName },
    { icon:"🧘", title:"Thiền định",    desc:"Bài thiền 10 phút giúp ổn định tâm trạng mỗi tối",          color:"#EEF8F4", accent:"#7BBFA8", dest:"meditation" as PageName },
    { icon:"🌬️", title:"Hít thở",      desc:"Kỹ thuật thở 4-7-8 khi cảm thấy căng thẳng",               color:"#EEF5FB", accent:"#7AB8D8", dest:"breathing" as PageName },
    { icon:"📰", title:"Bài đọc",      desc:"\"Hiểu và yêu thương bản thân\" — Chuyên gia Thu Hương",     color:"#FFF4EE", accent:"#F5A87B", dest:"reading" as PageName },
    { icon:"👨‍👩‍👧", title:"Kết nối gia đình", desc:"Dành 30 phút chia sẻ bữa cơm cùng gia đình",         color:"#FFF0F6", accent:"#E87BA8", dest:"gratitude" as PageName },
    { icon:"🌿", title:"Tự chăm sóc", desc:"Uống đủ nước và ngủ 8 tiếng — điều đơn giản nhất",           color:"#EEF8F4", accent:"#7BBFA8", dest:"selfcare" as PageName },
  ];
  return (
    <PageShell title="AI Insight 🤖" accent="#7AB8D8" bg="#EDF5FB" onBack={() => mCtx.navigate("mood-dashboard")}>
      <div className="px-5 pt-4 flex flex-col gap-5">
        {loading ? (
          <div className="flex flex-col items-center py-16 gap-5">
            <motion.div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
              style={{ background:"linear-gradient(135deg,#7AB8D8,#A8C8E8)" }}
              animate={{ rotate:360 }} transition={{ duration:2, repeat:Infinity, ease:"linear" }}>🤖</motion.div>
            <div className="flex gap-1.5">
              {[0,1,2].map(i=>(
                <motion.div key={i} className="w-2.5 h-2.5 rounded-full bg-[#7AB8D8]"
                  animate={{ y:[0,-8,0] }} transition={{ duration:0.6, repeat:Infinity, delay:i*0.15 }} />
              ))}
            </div>
            <p className="text-sm text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>Đang phân tích xu hướng cảm xúc...</p>
          </div>
        ) : (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex flex-col gap-5">
            <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgba(122,184,216,0.12)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background:"linear-gradient(135deg,#7AB8D8,#A8C8E8)" }}>🤖</div>
                <div>
                  <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>Phân tích của AI</p>
                  <p className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>Dựa trên 30 ngày gần nhất · TB: {avgScore}/100</p>
                </div>
              </div>
              <p className="text-sm text-[#5E5870] leading-relaxed" style={{ fontFamily:"Be Vietnam Pro" }}>
                {avgScore>=70?"Tuyệt vời! Điểm tâm trạng của bạn rất tốt. Hãy tiếp tục duy trì những thói quen tích cực đang làm cho cuộc sống của bạn ngày càng tươi sáng hơn.":avgScore>=50?"Tâm trạng của bạn đang ở mức ổn định. Hãy chú ý hơn đến việc tự chăm sóc bản thân — đôi khi những điều nhỏ bé lại tạo nên sự khác biệt lớn.":"Mình nhận thấy bạn đang trải qua giai đoạn khó khăn. Hãy nhớ rằng mỗi ngày mới là cơ hội để bắt đầu lại — và bạn không đi một mình đâu nhé 💙"}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background:trend>=0?"#DCFCE7":"#FFE4E6" }}>
                  <span className="text-xs font-bold" style={{ color:trend>=0?"#22C55E":"#F43F5E", fontFamily:"Nunito" }}>
                    {trend>=0?"📈 +":"📉 "}{Math.abs(Math.round(trend))} điểm xu hướng
                  </span>
                </div>
              </div>
            </div>
            <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>Gợi ý dành cho bạn ✨</p>
            <div className="grid grid-cols-2 gap-3">
              {recs.map((r, i) => (
                <motion.button key={r.title} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}
                  whileHover={{ y:-4, boxShadow:`0 12px 30px ${r.accent}30` }} whileTap={{ scale:0.97 }}
                  onClick={() => mCtx.navigate(r.dest)}
                  className="rounded-2xl p-4 text-left transition-shadow"
                  style={{ background:r.color, border:`1.5px solid ${r.accent}33` }}>
                  <span className="text-2xl block mb-2">{r.icon}</span>
                  <p className="font-bold text-xs text-[#3D3547] mb-1" style={{ fontFamily:"Nunito" }}>{r.title}</p>
                  <p className="text-[10px] text-[#9490A4] leading-relaxed" style={{ fontFamily:"Be Vietnam Pro" }}>{r.desc}</p>
                </motion.button>
              ))}
            </div>
            <motion.button whileHover={{ scale:1.02, boxShadow:"0 10px 30px rgba(122,184,216,0.4)" }} whileTap={{ scale:0.97 }}
              onClick={() => mCtx.navigate("selfcare")}
              className="py-4 rounded-2xl font-black text-white text-base"
              style={{ background:"linear-gradient(135deg,#7AB8D8,#A8C8E8)", fontFamily:"Nunito" }}>
              Bắt đầu hoạt động ngay 🌿
            </motion.button>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}

// ─── CompareProgress ──────────────────────────────────────────────────────────
function CompareProgress({ mCtx }: { mCtx: MoodCtx }) {
  const [tab, setTab] = useState<"week"|"month">("week");
  const history   = mCtx.history;
  const thisWeek  = history.slice(-7);
  const lastWeek  = history.slice(-14,-7);
  const thisAvg   = Math.round(thisWeek.reduce((a,e)=>a+e.score,0)/Math.max(1,thisWeek.length));
  const lastAvg   = Math.round(lastWeek.reduce((a,e)=>a+e.score,0)/Math.max(1,lastWeek.length));
  const delta     = thisAvg - lastAvg;
  const chartData = Array.from({length:7}, (_,i) => ({
    day: ["T2","T3","T4","T5","T6","T7","CN"][i],
    thisWeek: Math.round(thisWeek[i]?.score ?? 0),
    lastWeek: Math.round(lastWeek[i]?.score ?? 0),
  }));
  return (
    <PageShell title="So sánh tiến độ ⚖️" accent="#7AB8D8" bg="#EDF5FB" onBack={() => mCtx.navigate("mood-dashboard")}>
      <div className="px-5 pt-4 flex flex-col gap-5">
        {/* Tab */}
        <div className="flex bg-white rounded-2xl p-1.5 shadow-[0_2px_10px_rgba(122,184,216,0.08)]">
          {[{key:"week",label:"Tuần"},{key:"month",label:"Tháng"}].map(t => (
            <motion.button key={t.key} whileTap={{ scale:0.97 }} onClick={() => setTab(t.key as "week"|"month")}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
              style={{ background:tab===t.key?"#7AB8D8":"transparent", color:tab===t.key?"#fff":"#9490A4", fontFamily:"Nunito" }}>
              {t.label}
            </motion.button>
          ))}
        </div>
        {/* Summary */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgba(122,184,216,0.12)]">
          <p className="font-bold text-sm text-[#3D3547] mb-4" style={{ fontFamily:"Nunito" }}>Tóm tắt so sánh</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label:tab==="week"?"Tuần này":"Tháng này",   value:thisAvg,                    color:"#7AB8D8" },
              { label:tab==="week"?"Tuần trước":"Tháng trước", value:lastAvg,                  color:"#9490A4" },
              { label:"Thay đổi", value:`${delta>=0?"+":""}${delta}`,                          color:delta>=0?"#22C55E":"#F43F5E" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background:"#F0F6FB" }}>
                <p className="font-black text-xl" style={{ color:s.color, fontFamily:"Nunito" }}>{s.value}</p>
                <p className="text-[9px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-2xl" style={{ background:delta>=0?"#DCFCE7":"#FFE4E6" }}>
            <p className="text-xs font-semibold" style={{ color:delta>=0?"#22C55E":"#F43F5E", fontFamily:"Nunito" }}>
              {delta>=5?"🎉 Tuyệt vời! Tâm trạng cải thiện đáng kể":delta>=0?"📈 Tâm trạng đang có xu hướng tốt hơn":"💙 Hãy chú ý chăm sóc bản thân thêm nhé"}
            </p>
          </div>
        </div>
        {/* Overlay chart */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(122,184,216,0.1)]">
          <p className="font-bold text-sm text-[#3D3547] mb-4" style={{ fontFamily:"Nunito" }}>Biểu đồ so sánh</p>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top:8, right:8, bottom:4, left:-20 }}>
                <defs>
                  <linearGradient id="cmpThisG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7AB8D8" stopOpacity={0.4}/><stop offset="100%" stopColor="#7AB8D8" stopOpacity={0.02}/></linearGradient>
                  <linearGradient id="cmpLastG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C3B4E8" stopOpacity={0.3}/><stop offset="100%" stopColor="#C3B4E8" stopOpacity={0.02}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDF8" />
                <XAxis dataKey="day" tick={{ fontSize:10, fill:"#9490A4" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0,100]} tick={{ fontSize:10, fill:"#9490A4" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:"#FFFFFF", border:"1.5px solid rgba(122,184,216,0.3)", borderRadius:16, fontFamily:"Nunito", fontSize:12 }} />
                <Area type="monotone" dataKey="thisWeek" name={tab==="week"?"Tuần này":"Tháng này"} stroke="#7AB8D8" strokeWidth={2.5} fill="url(#cmpThisG)" dot={{ r:4, fill:"#7AB8D8", stroke:"#fff", strokeWidth:2 }} />
                <Area type="monotone" dataKey="lastWeek" name={tab==="week"?"Tuần trước":"Tháng trước"} stroke="#C3B4E8" strokeWidth={2} strokeDasharray="5 3" fill="url(#cmpLastG)" dot={{ r:3, fill:"#C3B4E8", stroke:"#fff", strokeWidth:2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 justify-center mt-3">
            <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 rounded" style={{ background:"#7AB8D8" }} /><span className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>Kỳ này</span></div>
            <div className="flex items-center gap-1.5"><div className="w-6 border-t-2 border-dashed" style={{ borderColor:"#C3B4E8" }} /><span className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>Kỳ trước</span></div>
          </div>
        </div>
        <div className="h-4" />
      </div>
    </PageShell>
  );
}

// ─── Achievement ──────────────────────────────────────────────────────────────
function Achievement({ mCtx }: { mCtx: MoodCtx }) {
  const streak = mCtx.history.length;
  const milestones = [
    { days:7,   icon:"🌱", label:"Tuần đầu tiên",       desc:"7 ngày ghi lại cảm xúc",        color:"#7BBFA8", bg:"#EEF8F4" },
    { days:14,  icon:"🌿", label:"Hai tuần kiên trì",   desc:"14 ngày không bỏ lỡ",            color:"#7AB8D8", bg:"#EDF5FB" },
    { days:30,  icon:"🌸", label:"Một tháng đồng hành", desc:"30 ngày chăm sóc bản thân",      color:"#C3B4E8", bg:"#F5F0FB" },
    { days:100, icon:"🌳", label:"100 ngày huyền thoại", desc:"Hành trình đáng tự hào",        color:"#F59E0B", bg:"#FEF9C3" },
  ];
  return (
    <PageShell title="Thành tích 🏆" accent="#F5A87B" bg="#FFF4EE" onBack={() => mCtx.navigate("mood-dashboard")}>
      <div className="px-5 pt-4 flex flex-col gap-5">
        {/* Current streak */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(245,168,123,0.15)] flex flex-col items-center">
          <motion.div className="text-6xl mb-3" animate={{ y:[0,-8,0] }} transition={{ duration:1.5, repeat:Infinity }}>🔥</motion.div>
          <p className="font-black text-4xl text-[#3D3547]" style={{ fontFamily:"Nunito" }}>{streak} ngày</p>
          <p className="text-sm text-[#9490A4] mt-1" style={{ fontFamily:"Be Vietnam Pro" }}>chuỗi ngày ghi lại cảm xúc</p>
          <div className="flex gap-2 mt-4">
            {Array.from({length:7}, (_,i) => (
              <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
                style={{ background:i<Math.min(streak,7)?"#FDE68A":"#F0EDF8" }}>
                {i<Math.min(streak,7)?"⭐":""}
              </div>
            ))}
          </div>
        </motion.div>
        {/* Growing tree */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(245,168,123,0.1)] flex flex-col items-center gap-3">
          <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>Cây của bạn đang lớn 🌳</p>
          <div className="relative flex items-center justify-center" style={{ height:140, width:160 }}>
            <motion.div className="absolute bottom-0 left-1/2 rounded-full"
              style={{ width:14, background:"#C3A882", transform:"translateX(-50%)" }}
              initial={{ height:0 }} animate={{ height:Math.min(95, 10+streak*3) }}
              transition={{ duration:1.8, ease:"easeOut" }} />
            <motion.div className="absolute rounded-full flex items-center justify-center"
              style={{ width:streak>=14?90:70, height:streak>=14?90:70, background:"linear-gradient(135deg,#7BBFA8,#A8D4A8)", bottom:Math.min(80,10+streak*3)-12, left:"50%", transform:"translateX(-50%)" }}
              initial={{ scale:0 }} animate={{ scale:1 }} transition={{ duration:0.8, delay:1.5, type:"spring" }}>
              <span className="text-4xl">{streak>=30?"🌳":streak>=14?"🌿":"🌱"}</span>
            </motion.div>
            {streak>=14 && <motion.span className="absolute text-2xl" style={{ bottom:Math.min(95,10+streak*3)+36, left:"50%", transform:"translateX(-50%)" }} initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:2.2, type:"spring" }}>🌸</motion.span>}
          </div>
          <p className="text-xs text-[#9490A4] text-center" style={{ fontFamily:"Be Vietnam Pro" }}>
            {streak>=30?"Cây đang nở hoa! Bạn thật tuyệt vời! 🌸":streak>=14?"Cây đang lớn mạnh, hãy tiếp tục! 🌳":"Cây mới đang lớn... chăm sóc mỗi ngày nhé 🌱"}
          </p>
        </div>
        {/* Milestones */}
        <div className="flex flex-col gap-3">
          {milestones.map((m, i) => {
            const achieved  = streak >= m.days;
            const progress  = Math.min(1, streak / m.days);
            return (
              <motion.div key={m.days} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.08 }}
                className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(245,168,123,0.08)]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background:achieved?m.bg:"#F0EDF8", opacity:achieved?1:0.5 }}>{m.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-sm" style={{ color:achieved?"#3D3547":"#9490A4", fontFamily:"Nunito" }}>{m.label}</p>
                      {achieved && <span className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ background:m.color }}>Đạt được!</span>}
                    </div>
                    <p className="text-[10px] text-[#9490A4] mb-2" style={{ fontFamily:"Be Vietnam Pro" }}>{m.desc}</p>
                    <div className="h-1.5 rounded-full" style={{ background:"#F0EDF8" }}>
                      <motion.div className="h-full rounded-full" style={{ background:m.color }}
                        initial={{ width:0 }} animate={{ width:`${progress*100}%` }}
                        transition={{ duration:0.8, delay:i*0.1 }} />
                    </div>
                    <p className="text-[9px] text-[#9490A4] mt-0.5" style={{ fontFamily:"Be Vietnam Pro" }}>{Math.min(streak,m.days)} / {m.days} ngày</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        {streak >= 7 && (
          <motion.button whileHover={{ scale:1.02, boxShadow:"0 10px 30px rgba(245,168,123,0.4)" }} whileTap={{ scale:0.97 }}
            onClick={() => mCtx.navigate("mood-dashboard")}
            className="py-4 rounded-2xl font-black text-white text-base"
            style={{ background:"linear-gradient(135deg,#F5A87B,#F5D060)", fontFamily:"Nunito" }}>
            +1 Chấm Tròn Cảm Xúc 🌀
          </motion.button>
        )}
        <div className="h-4" />
      </div>
    </PageShell>
  );
}

// ─── ExportReport ─────────────────────────────────────────────────────────────
function ExportReport({ mCtx }: { mCtx: MoodCtx }) {
  const [exporting, setExporting] = useState<string|null>(null);
  const [done, setDone]           = useState<string|null>(null);
  const history  = mCtx.history;
  const avgScore = Math.round(history.reduce((a,e)=>a+e.score,0)/history.length);
  const today    = history[history.length-1];
  const handleExport = (type: string) => {
    setExporting(type);
    setTimeout(()=>{ setExporting(null); setDone(type); setTimeout(()=>setDone(null),2500); }, 1500);
  };
  return (
    <PageShell title="Xuất báo cáo 📤" accent="#C3B4E8" bg="#F5F0FB" onBack={() => mCtx.navigate("mood-dashboard")}>
      <div className="px-5 pt-4 flex flex-col gap-5">
        {/* Preview */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgba(195,180,232,0.15)]">
          <p className="font-bold text-sm text-[#3D3547] mb-4" style={{ fontFamily:"Nunito" }}>Xem trước báo cáo</p>
          <div className="rounded-2xl p-4" style={{ background:"linear-gradient(135deg,#EDF5FB,#F5F0FB)", border:"1.5px solid rgba(195,180,232,0.3)" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-black text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>Những Chấm Tròn Cảm Xúc</p>
                <p className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>Báo cáo cảm xúc tháng {new Date().getMonth()+1}/{new Date().getFullYear()}</p>
              </div>
              <ScoreRing score={avgScore} color={today.moodColor} size={60} />
            </div>
            <div className="flex gap-1.5">
              {history.slice(-14).map((e,i) => (
                <div key={i} className="flex-1 h-5 rounded-md" style={{ background:e.moodColor, opacity:0.6 }} />
              ))}
            </div>
            <p className="text-[10px] text-[#9490A4] mt-2" style={{ fontFamily:"Be Vietnam Pro" }}>{history.length} ngày · {history.reduce((a,e)=>a+e.journalCount,0)} nhật ký · {mCtx.emotionalCircles} chấm tròn</p>
          </div>
        </div>
        {/* Format options */}
        <div className="flex flex-col gap-3">
          {[
            { key:"pdf",   icon:"📄", label:"Xuất PDF",         desc:"Báo cáo chi tiết dạng PDF",      color:"#EEF5FB", accent:"#7AB8D8" },
            { key:"image", icon:"🖼️", label:"Xuất ảnh PNG",     desc:"Chia sẻ hình ảnh tóm tắt",       color:"#EEF8F4", accent:"#7BBFA8" },
            { key:"share", icon:"🔐", label:"Chia sẻ riêng tư", desc:"Gửi link bảo mật cho người thân", color:"#F5F0FB", accent:"#C3B4E8" },
          ].map(opt => {
            const isExp = exporting === opt.key;
            const isDone = done === opt.key;
            return (
              <motion.button key={opt.key} whileHover={{ scale:1.02, y:-2 }} whileTap={{ scale:0.97 }}
                onClick={() => handleExport(opt.key)}
                className="flex items-center gap-4 p-4 rounded-2xl text-left"
                style={{ background:opt.color, border:`1.5px solid ${opt.accent}33` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background:`${opt.accent}22` }}>
                  {isExp ? (
                    <motion.div className="w-5 h-5 rounded-full border-2 border-t-transparent"
                      style={{ borderColor:opt.accent, borderTopColor:"transparent" }}
                      animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:"linear" }} />
                  ) : isDone ? "✅" : opt.icon}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>{opt.label}</p>
                  <p className="text-xs text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>{isDone ? "Đã hoàn thành! 🎉" : opt.desc}</p>
                </div>
                {!isExp && !isDone && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke={opt.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </motion.button>
            );
          })}
        </div>
        <div className="p-4 rounded-2xl" style={{ background:"#F5F0FB" }}>
          <p className="text-xs text-[#9490A4] text-center leading-relaxed" style={{ fontFamily:"Be Vietnam Pro" }}>
            🔒 Dữ liệu cảm xúc của bạn được bảo mật tuyệt đối. Chỉ bạn mới có thể xem và chia sẻ báo cáo.
          </p>
        </div>
        <div className="h-4" />
      </div>
    </PageShell>
  );
}

export { MOOD_HISTORY, ScoreRing, MoodDashboard, WeeklyMood, MonthlyMood, YearOverview, DailyMoodSummary, EmotionalPattern, MoodAIInsight, CompareProgress, Achievement, ExportReport };
export type { MoodEntry, MoodCtx };
