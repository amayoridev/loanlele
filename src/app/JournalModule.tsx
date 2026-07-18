import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

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
interface DraftEntry {
  mood: string; moodEmoji: string; moodLabel: string;
  moodColor: string; moodBg: string; moodIntensity: number;
  title: string; content: string; tags: string[]; emojis: string[];
  hasVoice: boolean; hasPhoto: boolean;
}
interface JournalCtx {
  entries: JournalEntry[]; draft: DraftEntry;
  setDraft: (d: Partial<DraftEntry>) => void;
  selectedId: string | null; setSelectedId: (id: string | null) => void;
  addEntry: (entry: Omit<JournalEntry, "id" | "date" | "time" | "wordCount">) => void;
  updateEntry: (id: string, data: Partial<JournalEntry>) => void;
  deleteEntry: (id: string) => void;
  navigate: (p: PageName) => void;
  onJournalComplete: () => void;
  showJournalReward: boolean; setShowJournalReward: (v: boolean) => void;
}

// ─── Journal constants ────────────────────────────────────────────────────────
const J_MOODS = [
  { id: "rad",   emoji: "✨", label: "Tuyệt vời",   color: "#F59E0B", bg: "#FEF9C3" },
  { id: "good",  emoji: "😊", label: "Vui vẻ",      color: "#22C55E", bg: "#DCFCE7" },
  { id: "okay",  emoji: "😌", label: "Bình thường",  color: "#38BDF8", bg: "#DBEAFE" },
  { id: "sad",   emoji: "🥺", label: "Buồn bã",      color: "#8B5CF6", bg: "#EDE9FE" },
  { id: "awful", emoji: "😔", label: "Mệt mỏi",     color: "#F43F5E", bg: "#FFE4E6" },
] as const;

const DEFAULT_DRAFT: DraftEntry = {
  mood: "", moodEmoji: "", moodLabel: "",
  moodColor: "#7BBFA8", moodBg: "#EEF8F4",
  moodIntensity: 3, title: "", content: "",
  tags: [], emojis: [], hasVoice: false, hasPhoto: false,
};

const SAMPLE_ENTRIES: JournalEntry[] = [
  {
    id: "j3", date: "2025-07-15", time: "21:45",
    mood: "good", moodEmoji: "😊", moodLabel: "Vui vẻ", moodColor: "#22C55E", moodBg: "#DCFCE7", moodIntensity: 4,
    title: "Ngày bình yên",
    content: "Hôm nay học bài được nhiều lắm. Cảm giác khi hiểu bài thật tuyệt vời. Mẹ nấu canh chua, ăn ngon quá trời, nhớ mùi vị đó mãi mãi.",
    tags: ["học tập", "gia đình", "bình yên"], emojis: ["📚", "💛", "🍲"], hasVoice: false, hasPhoto: false, wordCount: 38,
  },
  {
    id: "j2", date: "2025-07-14", time: "20:15",
    mood: "rad", moodEmoji: "✨", moodLabel: "Tuyệt vời", moodColor: "#F59E0B", moodBg: "#FEF9C3", moodIntensity: 5,
    title: "Ngày đẹp bên Hân",
    content: "Hôm nay đi cà phê với Hân, ngồi nói chuyện mãi không thấy chán. Cảm giác thật nhẹ nhàng khi được chia sẻ với người bạn hiểu mình. Cảm ơn vũ trụ đã cho mình người bạn tốt như vậy.",
    tags: ["bạn bè", "cà phê", "hạnh phúc"], emojis: ["☕", "💛", "🌸"], hasVoice: false, hasPhoto: true, wordCount: 52,
  },
  {
    id: "j1", date: "2025-07-13", time: "22:00",
    mood: "sad", moodEmoji: "🥺", moodLabel: "Buồn bã", moodColor: "#8B5CF6", moodBg: "#EDE9FE", moodIntensity: 2,
    title: "Nhớ nhà quá...",
    content: "Hôm nay tự nhiên nhớ nhà lắm. Nhớ mẹ, nhớ con chó ở nhà, nhớ mùi cơm mẹ nấu. Gọi video call nhưng thấy mẹ già đi nhiều, tự nhiên buồn muốn khóc.",
    tags: ["nhớ nhà", "gia đình", "cô đơn"], emojis: ["🏠", "💜", "😢"], hasVoice: true, hasPhoto: false, wordCount: 46,
  },
];

// ─── Journal shared components ────────────────────────────────────────────────
function Sparkles({ count = 12, active = true }: { count?: number; active?: boolean }) {
  const data = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: `${8 + Math.random() * 84}%`,
    y: `${8 + Math.random() * 84}%`,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 1.5,
    color: ["#FDE68A","#C3B4E8","#7BBFA8","#F4C0C0","#A8D4E8","#F5D0BE"][i % 6],
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

function FloatingEmotionalCircles() {
  const data = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    size: 14 + Math.random() * 28,
    x: `${4 + Math.random() * 92}%`,
    color: ["#7BBFA8","#C3B4E8","#F5D0BE","#A8D4E8","#F4C0C0","#FDE68A","#BBF7D0","#DDD6FE","#F5A87B","#7AB8D8"][i],
    delay: Math.random() * 3,
    dur: 5 + Math.random() * 5,
  })), []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="fixed inset-0 pointer-events-none z-[56] overflow-hidden">
      {data.map((c, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ width: c.size, height: c.size, background: c.color, left: c.x, bottom: -c.size - 10, opacity: 0.7 }}
          animate={{ y: "-110vh" }}
          transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: "easeInOut" }} />
      ))}
    </div>
  );
}

function FlowerBloom({ color = "#C3B4E8" }: { color?: string }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{
            width: 28, height: 52,
            background: `${color}${i % 2 === 0 ? "DD" : "88"}`,
            transformOrigin: "50% 100%",
            rotate: `${i * 45}deg`,
            top: "50%", left: "50%", marginLeft: -14, marginTop: -52,
          }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.45, delay: i * 0.05, ease: "backOut" }} />
      ))}
      <motion.div className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center text-2xl"
        style={{ background: "#FDE68A", boxShadow: "0 4px 20px rgba(253,230,138,0.5)" }}
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 280 }}>
        🌸
      </motion.div>
    </div>
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

// ─── EmotionCheckIn ───────────────────────────────────────────────────────────
function EmotionCheckIn({ jCtx }: { jCtx: JournalCtx }) {
  const [selected, setSelected] = useState(jCtx.draft.mood || "");
  const [intensity, setIntensity] = useState(jCtx.draft.moodIntensity || 3);
  const [bodyTags, setBodyTags] = useState<string[]>(jCtx.draft.tags || []);

  const bodyOptions = ["Nhẹ nhõm","Nặng nề","Căng thẳng","Thư giãn","Hồi hộp","Mệt mỏi","Tim đập nhanh","Tràn đầy năng lượng","Cô đơn","Ấm áp"];
  const prompts: Record<string, string> = {
    rad: "Điều gì tuyệt vời đã xảy ra hôm nay?",
    good: "Bạn muốn ghi lại khoảnh khắc vui nào?",
    okay: "Điều gì đang chiếm nhiều suy nghĩ nhất?",
    sad: "Bạn có thể chia sẻ điều gì đang nặng lòng không?",
    awful: "Mình ở đây lắng nghe. Hôm nay điều gì đã xảy ra?",
  };

  const selectedMood = J_MOODS.find(m => m.id === selected);

  const next = () => {
    if (!selectedMood) return;
    jCtx.setDraft({ mood: selectedMood.id, moodEmoji: selectedMood.emoji, moodLabel: selectedMood.label, moodColor: selectedMood.color, moodBg: selectedMood.bg, moodIntensity: intensity, tags: bodyTags });
    jCtx.navigate("journal-write");
  };

  return (
    <PageShell title="Cảm xúc hôm nay" accent="#C3B4E8" bg="#F5F0FB" onBack={() => jCtx.navigate("journal-history")}>
      <div className="px-5 pt-6 flex flex-col gap-6">
        <p className="text-center text-sm text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>
          Hãy dành một khoảnh khắc nhận diện cảm xúc của bạn 💙
        </p>
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(195,180,232,0.12)]">
          <div className="flex justify-around flex-wrap gap-3">
            {J_MOODS.map(m => (
              <motion.button key={m.id} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.88 }}
                onClick={() => setSelected(m.id)} className="flex flex-col items-center gap-2">
                <motion.div className="rounded-full flex items-center justify-center text-3xl"
                  style={{ width: 68, height: 68, background: selected === m.id ? m.bg : "#F0EDF8", boxShadow: selected === m.id ? `0 0 0 4px ${m.color}44` : "none", border: `2px solid ${selected === m.id ? m.color : "transparent"}` }}
                  animate={selected === m.id ? { scale: [1, 1.12, 1] } : {}} transition={{ duration: 0.35 }}>
                  {m.emoji}
                </motion.div>
                <span className="text-[10px] font-bold" style={{ color: selected === m.id ? m.color : "#9490A4", fontFamily: "Nunito" }}>{m.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
        <AnimatePresence>
          {selectedMood && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(195,180,232,0.1)]">
              <p className="font-bold text-sm text-[#3D3547] mb-3" style={{ fontFamily: "Nunito" }}>Mức độ cảm xúc này</p>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>Nhẹ</span>
                <div className="flex-1 flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <motion.button key={n} whileTap={{ scale: 0.85 }} onClick={() => setIntensity(n)}
                      className="flex-1 h-8 rounded-xl transition-all"
                      style={{ background: n <= intensity ? selectedMood.color : "#F0EDF8" }} />
                  ))}
                </div>
                <span className="text-xs text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>Mạnh</span>
              </div>
              <div className="mt-4 p-3.5 rounded-2xl" style={{ background: selectedMood.bg }}>
                <p className="text-xs font-semibold" style={{ color: selectedMood.color, fontFamily: "Nunito" }}>
                  💬 {prompts[selected]}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(195,180,232,0.08)]">
              <p className="font-bold text-sm text-[#3D3547] mb-3" style={{ fontFamily: "Nunito" }}>Cơ thể bạn đang cảm thấy thế nào?</p>
              <div className="flex flex-wrap gap-2">
                {bodyOptions.map(tag => {
                  const active = bodyTags.includes(tag);
                  return (
                    <motion.button key={tag} whileTap={{ scale: 0.92 }}
                      onClick={() => setBodyTags(prev => active ? prev.filter(t => t !== tag) : [...prev, tag])}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{ background: active ? "#C3B4E8" : "#F0EDF8", color: active ? "#fff" : "#9490A4", fontFamily: "Nunito" }}>
                      {tag}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button whileHover={{ scale: selected ? 1.02 : 1 }} whileTap={{ scale: selected ? 0.97 : 1 }}
          onClick={next} className="py-4 rounded-2xl font-black text-base transition-all"
          style={{ background: selected ? "linear-gradient(135deg,#C3B4E8,#A8C8E8)" : "#E8E4F4", color: selected ? "#fff" : "#C0B8D0", fontFamily: "Nunito", boxShadow: selected ? "0 8px 24px rgba(195,180,232,0.4)" : "none" }}>
          {selected ? "Viết nhật ký →" : "Chọn cảm xúc để tiếp tục"}
        </motion.button>
      </div>
    </PageShell>
  );
}

// ─── JournalWrite ─────────────────────────────────────────────────────────────
const EMOJI_OPTIONS = ["🌸","😊","💙","🌿","✨","☕","🌙","🌈","💛","🥺","🫂","🔥","🌺","⭐","💜","🌊"];
const WRITING_PROMPTS = [
  "Hôm nay điều gì làm bạn cảm thấy ấm lòng?",
  "Bạn học được điều gì mới hôm nay?",
  "Nếu tâm trạng là một màu, đó sẽ là màu gì?",
  "Điều bạn tự hào về bản thân hôm nay?",
  "Ai đã khiến bạn mỉm cười hôm nay?",
];

function JournalWrite({ jCtx }: { jCtx: JournalCtx }) {
  const [title, setTitle]       = useState(jCtx.draft.title || "");
  const [content, setContent]   = useState(jCtx.draft.content || "");
  const [emojis, setEmojis]     = useState<string[]>(jCtx.draft.emojis || []);
  const [hasVoice, setHasVoice] = useState(jCtx.draft.hasVoice || false);
  const [hasPhoto, setHasPhoto] = useState(jCtx.draft.hasPhoto || false);
  const [recording, setRecording]       = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPrompts, setShowPrompts]   = useState(false);
  const [activePrompt, setActivePrompt] = useState("");
  const [autoSaved, setAutoSaved]       = useState(true);
  const [saving, setSaving]             = useState(false);
  const [tagInput, setTagInput]         = useState("");
  const [tags, setTags]                 = useState<string[]>(jCtx.draft.tags || []);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const mood = J_MOODS.find(m => m.id === jCtx.draft.mood);

  useEffect(() => {
    if (!content && !title) return;
    setAutoSaved(false); setSaving(true);
    const t = setTimeout(() => { setSaving(false); setAutoSaved(true); }, 1500);
    return () => clearTimeout(t);
  }, [content, title]);

  const toggleRecording = () => {
    if (!recording) {
      setRecording(true); setHasVoice(false);
      setTimeout(() => { setRecording(false); setHasVoice(true); }, 3000);
    } else { setRecording(false); setHasVoice(true); }
  };

  const addEmoji = (e: string) => { if (!emojis.includes(e)) setEmojis(prev => [...prev, e]); setShowEmojiPicker(false); };

  const addTag = (e: { key: string }) => {
    if (e.key === "Enter" && tagInput.trim()) { setTags(prev => [...prev, tagInput.trim()]); setTagInput(""); }
  };

  const selectPrompt = (p: string) => { setActivePrompt(p); setShowPrompts(false); if (!content) setContent(p + " "); };

  const save = () => {
    if (!jCtx.draft.mood) { jCtx.navigate("journal-checkin"); return; }
    jCtx.addEntry({ mood: jCtx.draft.mood, moodEmoji: jCtx.draft.moodEmoji, moodLabel: jCtx.draft.moodLabel, moodColor: jCtx.draft.moodColor, moodBg: jCtx.draft.moodBg, moodIntensity: jCtx.draft.moodIntensity, title: title || "Nhật ký ngày " + new Date().toLocaleDateString("vi-VN"), content: content || "(Không có nội dung)", tags, emojis, hasVoice, hasPhoto });
  };

  return (
    <PageShell title="Viết nhật ký" accent="#C3B4E8" bg="#F5F0FB" onBack={() => jCtx.navigate("journal-checkin")}>
      <div className="px-5 pt-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          {mood ? (
            <MoodBadge emoji={mood.emoji} label={mood.label} color={mood.color} bg={mood.bg} />
          ) : (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => jCtx.navigate("journal-checkin")}
              className="text-xs text-[#C3B4E8] font-semibold" style={{ fontFamily: "Nunito" }}>
              + Chọn cảm xúc
            </motion.button>
          )}
          <div className="flex items-center gap-1.5">
            {saving ? (
              <div className="flex gap-0.5">
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[#C3B4E8]"
                    animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>{autoSaved ? "✓ Đã lưu nháp" : ""}</span>
            )}
          </div>
        </div>
        <AnimatePresence>
          {activePrompt && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="px-4 py-3 rounded-2xl" style={{ background: "#F0EBF8" }}>
              <p className="text-xs text-[#9490A4] italic" style={{ fontFamily: "Be Vietnam Pro" }}>💬 {activePrompt}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Tiêu đề (không bắt buộc)..."
          className="w-full rounded-2xl px-4 py-3.5 font-bold text-base outline-none"
          style={{ background: "#FFFFFF", color: "#3D3547", fontFamily: "Nunito", border: "1.5px solid rgba(195,180,232,0.3)" }} />
        <div className="relative">
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder={mood?.id === "sad" ? "Cứ viết ra đây... không có gì phải hoàn hảo cả 💙" : mood?.id === "rad" ? "Khoảnh khắc tuyệt vời này xứng đáng được lưu lại! ✨" : "Hôm nay bạn suy nghĩ gì? Không cần hoàn hảo, cứ viết thôi... 🌿"}
            rows={8} className="w-full resize-none rounded-2xl p-4 text-sm outline-none leading-relaxed"
            style={{ background: "#FFFFFF", color: "#3D3547", fontFamily: "Be Vietnam Pro", border: "1.5px solid rgba(195,180,232,0.3)" }} />
          <span className="absolute bottom-3 right-4 text-[10px] text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>{wordCount} từ</span>
        </div>
        <AnimatePresence>
          {(recording || hasVoice) && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: recording ? "#FFE4E6" : "#EEF8F4", border: `1.5px solid ${recording ? "#F43F5E44" : "#7BBFA844"}` }}>
              {recording ? (
                <>
                  <motion.div className="w-3 h-3 rounded-full bg-red-500" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                  <span className="text-xs font-bold text-red-500" style={{ fontFamily: "Nunito" }}>Đang ghi âm...</span>
                </>
              ) : (
                <>
                  <span className="text-base">🎙️</span>
                  <span className="text-xs font-bold text-[#7BBFA8]" style={{ fontFamily: "Nunito" }}>Đã ghi âm giọng nói ✓</span>
                </>
              )}
              <button onClick={() => { setRecording(false); setHasVoice(false); }} className="ml-auto text-xs text-[#9490A4]">✕</button>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {hasPhoto && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="relative rounded-2xl overflow-hidden" style={{ height: 140, background: "linear-gradient(135deg,#EEF8F4,#EDF5FB)" }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <span className="text-3xl">🖼️</span>
                <span className="text-xs text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>Ảnh đã được thêm vào</span>
              </div>
              <button onClick={() => setHasPhoto(false)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-xs text-[#9490A4]">✕</button>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {emojis.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 overflow-hidden">
              {emojis.map((e, i) => (
                <motion.button key={i} whileTap={{ scale: 0.88 }} onClick={() => setEmojis(prev => prev.filter((_, j) => j !== i))}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xl" style={{ background: "#F0EDF8" }}>
                  {e}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
              className="rounded-2xl p-4 shadow-[0_8px_30px_rgba(195,180,232,0.2)]" style={{ background: "#FFFFFF", border: "1.5px solid rgba(195,180,232,0.3)" }}>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map(e => (
                  <motion.button key={e} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }} onClick={() => addEmoji(e)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "#F7F4FC" }}>
                    {e}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showPrompts && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl p-4 shadow-[0_8px_30px_rgba(195,180,232,0.2)]" style={{ background: "#FFFFFF", border: "1.5px solid rgba(195,180,232,0.3)" }}>
              <p className="text-xs font-bold text-[#3D3547] mb-3" style={{ fontFamily: "Nunito" }}>Gợi ý viết</p>
              {WRITING_PROMPTS.map((p, i) => (
                <motion.button key={i} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }} onClick={() => selectPrompt(p)}
                  className="w-full text-left text-xs py-2.5 px-3 rounded-xl mb-1.5"
                  style={{ background: "#F7F4FC", color: "#5E5870", fontFamily: "Be Vietnam Pro" }}>
                  {p}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex flex-wrap gap-2 items-center">
          {tags.map((tag, i) => (
            <span key={i} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "#F0EDF8", color: "#9490A4", fontFamily: "Nunito" }}>
              #{tag}
              <button onClick={() => setTags(prev => prev.filter((_, j) => j !== i))} className="ml-0.5 opacity-60">✕</button>
            </span>
          ))}
          <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
            placeholder="+ Thêm thẻ" className="text-xs outline-none bg-transparent"
            style={{ color: "#9490A4", fontFamily: "Nunito", minWidth: 70 }} />
        </div>
        <div className="flex items-center gap-2 py-3 border-t border-[rgba(195,180,232,0.2)]">
          {[
            { icon: "😊", label: "Cảm xúc", action: () => setShowEmojiPicker(v => !v) },
            { icon: recording ? "🔴" : "🎙️", label: recording ? "Dừng" : "Ghi âm", action: toggleRecording },
            { icon: "🖼️", label: "Ảnh", action: () => setHasPhoto(true) },
            { icon: "💡", label: "Gợi ý", action: () => setShowPrompts(v => !v) },
          ].map(btn => (
            <motion.button key={btn.label} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }} onClick={btn.action}
              className="flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl"
              style={{ background: recording && btn.label === "Dừng" ? "#FFE4E6" : "#F7F4FC" }}>
              <span className="text-lg">{btn.icon}</span>
              <span className="text-[9px] text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>{btn.label}</span>
            </motion.button>
          ))}
        </div>
        <motion.button whileHover={{ scale: 1.02, boxShadow: "0 12px 36px rgba(195,180,232,0.4)" }} whileTap={{ scale: 0.97 }}
          onClick={save} className="py-4 rounded-2xl font-black text-white text-base"
          style={{ background: "linear-gradient(135deg,#C3B4E8,#A8C8E8)", fontFamily: "Nunito" }}>
          Lưu nhật ký ✨
        </motion.button>
        <div className="h-6" />
      </div>
    </PageShell>
  );
}

// ─── SaveSuccessOverlay ───────────────────────────────────────────────────────
function SaveSuccessOverlay({ entry, onClose, onSkip }: { entry: JournalEntry; onClose: () => void; onSkip: () => void; }) {
  return (
    <motion.div className="fixed inset-0 z-[80] flex flex-col items-center justify-center px-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: "rgba(240,235,248,0.97)", backdropFilter: "blur(16px)" }}>
      <FloatingEmotionalCircles />
      <Sparkles count={16} />
      <motion.div className="flex flex-col items-center text-center max-w-sm w-full relative z-10"
        initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.1 }}>
        <FlowerBloom color="#C3B4E8" />
        <motion.h2 className="mt-6 font-black text-2xl text-[#3D3547]"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ fontFamily: "Nunito" }}>
          Nhật ký đã được lưu! 🌸
        </motion.h2>
        <motion.p className="mt-2 text-sm text-[#9490A4]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
          style={{ fontFamily: "Be Vietnam Pro" }}>
          Cảm ơn bạn đã dành thời gian cho chính mình 💙
        </motion.p>
        <motion.div className="mt-5 flex items-center gap-3 flex-wrap justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}>
          {[{ icon: entry?.moodEmoji, text: entry?.moodLabel, color: entry?.moodColor },
            { icon: "📝", text: `${entry?.wordCount || 0} từ`, color: "#9490A4" },
            { icon: "⏰", text: entry?.time || "--:--", color: "#9490A4" }].map((s, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#FFFFFF" }}>
              <span className="text-base">{s.icon}</span>
              <span className="text-xs font-bold" style={{ color: s.color, fontFamily: "Nunito" }}>{s.text}</span>
            </div>
          ))}
        </motion.div>
        <motion.div className="mt-8 flex flex-col gap-3 w-full"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onClose}
            className="w-full py-4 rounded-2xl font-black text-white text-sm"
            style={{ background: "linear-gradient(135deg,#C3B4E8,#A8C8E8)", fontFamily: "Nunito" }}>
            Xem gợi ý từ AI 🤖
          </motion.button>
          <button onClick={onSkip} className="text-xs text-[#9490A4] underline" style={{ fontFamily: "Be Vietnam Pro" }}>
            Bỏ qua, về lịch sử nhật ký
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─── AIInsight ────────────────────────────────────────────────────────────────
function AIInsight({ jCtx }: { jCtx: JournalCtx }) {
  const [loading, setLoading] = useState(true);
  const entry = jCtx.entries[0];
  const mood  = J_MOODS.find(m => m.id === (entry?.mood ?? "okay"));

  useEffect(() => { const t = setTimeout(() => setLoading(false), 2000); return () => clearTimeout(t); }, []);

  const insights: Record<string, { keywords: string[]; insight: string; affirmation: string }> = {
    rad:   { keywords: ["Niềm vui","Năng lượng tích cực","Kết nối xã hội"], insight: "Bạn đang trải qua một chuỗi cảm xúc tích cực. Tâm trạng tốt thường liên quan đến các kết nối xã hội và thành tích cá nhân.", affirmation: "Hãy trân trọng khoảnh khắc này và lan tỏa năng lượng tốt đẹp đến những người xung quanh! ✨" },
    good:  { keywords: ["Hài lòng","Bình an","Lạc quan"], insight: "Bạn đang duy trì trạng thái cảm xúc ổn định và tích cực. Đây là nền tảng tốt cho sức khỏe tâm thần lâu dài.", affirmation: "Tiếp tục những thói quen tốt đang tạo ra sự bình yên này trong cuộc sống của bạn 🌿" },
    okay:  { keywords: ["Trung tính","Chấp nhận","Bình thường hóa"], insight: "Cảm xúc 'bình thường' là hoàn toàn hợp lệ. Đây có thể là thời điểm tốt để suy nghĩ về điều gì sẽ mang lại thêm niềm vui cho bạn.", affirmation: "Bình thường cũng ổn thôi. Mỗi ngày bình yên là một món quà 🌙" },
    sad:   { keywords: ["Buồn bã","Nhớ nhung","Nhạy cảm"], insight: "Cảm giác buồn là phản ứng tự nhiên của con người. Việc nhận ra và ghi lại cảm xúc này là bước đầu tiên quan trọng để chữa lành.", affirmation: "Bạn rất dũng cảm khi đối mặt với những cảm xúc khó khăn. Mình luôn ở đây bên bạn 💜" },
    awful: { keywords: ["Mệt mỏi","Quá tải","Cần nghỉ ngơi"], insight: "Cảm giác kiệt sức thường xuất phát từ việc bạn đã nỗ lực rất nhiều. Cơ thể và tâm trí bạn đang gửi tín hiệu cần được chăm sóc.", affirmation: "Hôm nay, hãy cho phép bản thân nghỉ ngơi. Nghỉ không phải là từ bỏ 🫂" },
  };
  const cur = insights[entry?.mood ?? "okay"] ?? insights["okay"];

  return (
    <PageShell title="Gợi ý từ AI 🤖" accent="#C3B4E8" bg="#F5F0FB" onBack={() => jCtx.navigate("journal-history")}>
      <div className="px-5 pt-6 flex flex-col gap-5">
        {loading ? (
          <div className="flex flex-col items-center py-16 gap-5">
            <motion.div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
              style={{ background: "linear-gradient(135deg,#C3B4E8,#A8C8E8)" }}
              animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>🤖</motion.div>
            <div className="flex gap-1.5">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-2.5 h-2.5 rounded-full bg-[#C3B4E8]"
                  animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
            <p className="text-sm text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>Đang phân tích nhật ký của bạn...</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="flex flex-col gap-5">
            {entry && (
              <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgba(195,180,232,0.12)]">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily: "Nunito" }}>Nhật ký vừa viết</p>
                  <MoodBadge emoji={entry.moodEmoji} label={entry.moodLabel} color={entry.moodColor} bg={entry.moodBg} />
                </div>
                <p className="text-xs text-[#9490A4] leading-relaxed line-clamp-3" style={{ fontFamily: "Be Vietnam Pro" }}>{entry.content}</p>
              </div>
            )}
            <div className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(195,180,232,0.1)]">
              <p className="font-bold text-sm text-[#3D3547] mb-3" style={{ fontFamily: "Nunito" }}>🏷️ Cảm xúc phát hiện được</p>
              <div className="flex flex-wrap gap-2">
                {cur.keywords.map((kw, i) => (
                  <motion.span key={kw} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                    className="px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ background: mood?.bg ?? "#F0EDF8", color: mood?.color ?? "#9490A4", fontFamily: "Nunito" }}>
                    {kw}
                  </motion.span>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(195,180,232,0.1)]">
              <p className="font-bold text-sm text-[#3D3547] mb-3" style={{ fontFamily: "Nunito" }}>🔍 Nhận xét</p>
              <p className="text-sm text-[#5E5870] leading-relaxed" style={{ fontFamily: "Be Vietnam Pro" }}>{cur.insight}</p>
            </div>
            <div className="rounded-3xl p-5 relative overflow-hidden"
              style={{ background: mood?.bg ?? "#F0EDF8", border: `1.5px solid ${mood?.color ?? "#C3B4E8"}33` }}>
              <FloatCircle size={60} color={mood?.color ?? "#C3B4E8"} x="82%" y="-10px" opacity={0.15} dur={7} />
              <p className="font-bold text-sm text-[#3D3547] mb-2 relative z-10" style={{ fontFamily: "Nunito" }}>💌 Lời nhắn</p>
              <p className="text-sm text-[#5E5870] leading-relaxed relative z-10" style={{ fontFamily: "Be Vietnam Pro" }}>{cur.affirmation}</p>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => jCtx.navigate("journal-activities")}
              className="py-4 rounded-2xl font-black text-white text-base"
              style={{ background: "linear-gradient(135deg,#C3B4E8,#A8C8E8)", fontFamily: "Nunito", boxShadow: "0 8px 24px rgba(195,180,232,0.4)" }}>
              Xem hoạt động gợi ý 🌿
            </motion.button>
            <button onClick={() => jCtx.navigate("journal-history")}
              className="text-center text-xs text-[#9490A4] pb-4" style={{ fontFamily: "Be Vietnam Pro" }}>
              Bỏ qua, về lịch sử nhật ký
            </button>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}

// ─── SuggestedActivities ──────────────────────────────────────────────────────
type SugAct = { emoji: string; title: string; desc: string; dur: string; page: PageName; color: string; accent: string };
const SUGGESTED: Record<string, SugAct[]> = {
  rad:   [
    { emoji: "🏃", title: "Vận động vui",       desc: "Kênh năng lượng tích cực vào vận động thể chất.", dur: "10 phút", page: "exercise",  color: "#FFF4EE", accent: "#F5A87B" },
    { emoji: "📚", title: "Đọc sách",           desc: "Hoàn hảo khi tâm trạng đang tốt — đọc sâu hơn.", dur: "20 phút", page: "reading",   color: "#FFF8F0", accent: "#F5A87B" },
    { emoji: "🌸", title: "Viết biết ơn",       desc: "Ghi lại những điều bạn biết ơn hôm nay.",          dur: "5 phút",  page: "gratitude", color: "#FFF0F6", accent: "#E87BA8" },
  ],
  good:  [
    { emoji: "🧘", title: "Thiền nhẹ nhàng",    desc: "Duy trì trạng thái bình yên với bài thiền.",       dur: "10 phút", page: "meditation",color: "#F0EEF8", accent: "#9B8FD8" },
    { emoji: "🌸", title: "Viết biết ơn",       desc: "Ghi lại những điều tốt đẹp hôm nay.",              dur: "5 phút",  page: "gratitude", color: "#FFF0F6", accent: "#E87BA8" },
    { emoji: "🎵", title: "Thư giãn",           desc: "Nghe nhạc nhẹ nhàng thưởng thức khoảng lặng.",     dur: "15 phút", page: "relax",     color: "#EEF5FB", accent: "#A8C8E8" },
  ],
  okay:  [
    { emoji: "🌬️", title: "Hít thở",           desc: "Bài thở ô vuông giúp tăng năng lượng ngay.",       dur: "5 phút",  page: "breathing", color: "#EEF8F4", accent: "#7BBFA8" },
    { emoji: "🚶", title: "Vận động nhẹ",       desc: "Đi bộ hoặc giãn cơ nhẹ nhàng.",                   dur: "10 phút", page: "exercise",  color: "#FFF4EE", accent: "#F5A87B" },
    { emoji: "🎵", title: "Thư giãn với âm thanh", desc: "Thiên nhiên, mưa hoặc tiếng biển.",             dur: "15 phút", page: "relax",     color: "#EEF5FB", accent: "#A8C8E8" },
  ],
  sad:   [
    { emoji: "🌬️", title: "Hít thở sâu",       desc: "Kỹ thuật thở 4-7-8 giúp bạn bình tâm.",           dur: "5 phút",  page: "breathing", color: "#EEF8F4", accent: "#7BBFA8" },
    { emoji: "🌸", title: "Viết biết ơn",       desc: "3 điều nhỏ bé đáng trân trọng.",                   dur: "5 phút",  page: "gratitude", color: "#FFF0F6", accent: "#E87BA8" },
    { emoji: "🧘", title: "Thiền từ bi",        desc: "Bài thiền nhẹ nhàng dành cho những ngày khó.",     dur: "10 phút", page: "meditation",color: "#F0EEF8", accent: "#9B8FD8" },
  ],
  awful: [
    { emoji: "🌬️", title: "Hít thở ngay bây giờ", desc: "Bắt đầu từ hơi thở. Chỉ 5 phút thôi.",       dur: "5 phút",  page: "breathing", color: "#EEF8F4", accent: "#7BBFA8" },
    { emoji: "💧", title: "Uống nước",          desc: "Đôi khi mệt mỏi vì thiếu nước.",                  dur: "2 phút",  page: "water",     color: "#EDF5FB", accent: "#7AB8D8" },
    { emoji: "🌙", title: "Ngủ đủ giấc",       desc: "Nghỉ ngơi là điều bạn cần nhất lúc này.",          dur: "Tùy",    page: "sleep",     color: "#F5F0FB", accent: "#C3B4E8" },
  ],
};

function SuggestedActivities({ jCtx }: { jCtx: JournalCtx }) {
  const [added, setAdded] = useState<string[]>([]);
  const mood = jCtx.entries[0]?.mood ?? "okay";
  const acts = SUGGESTED[mood] ?? SUGGESTED["okay"];

  return (
    <PageShell title="Hoạt động gợi ý 🌿" accent="#7BBFA8" bg="#EEF8F4" onBack={() => jCtx.navigate("journal-insight")}>
      <div className="px-5 pt-6 flex flex-col gap-5">
        <p className="text-sm text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>
          Dựa trên nhật ký hôm nay, mình gợi ý những hoạt động phù hợp với bạn:
        </p>
        {acts.map((act, i) => (
          <motion.div key={act.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="rounded-3xl p-5 relative overflow-hidden"
            style={{ background: act.color, border: `1.5px solid ${act.accent}33`, boxShadow: `0 4px 20px ${act.accent}15` }}>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${act.accent}22` }}>{act.emoji}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm text-[#3D3547]" style={{ fontFamily: "Nunito" }}>{act.title}</h4>
                  <span className="text-[10px] text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>{act.dur}</span>
                </div>
                <p className="text-xs text-[#9490A4] mb-3 leading-relaxed" style={{ fontFamily: "Be Vietnam Pro" }}>{act.desc}</p>
                <div className="flex gap-2">
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                    onClick={() => jCtx.navigate(act.page)}
                    className="flex-1 py-2 rounded-xl font-bold text-xs text-white"
                    style={{ background: act.accent, fontFamily: "Nunito" }}>
                    Bắt đầu ngay ▶
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.92 }}
                    onClick={() => setAdded(prev => prev.includes(act.title) ? prev.filter(t => t !== act.title) : [...prev, act.title])}
                    className="px-3 py-2 rounded-xl font-bold text-xs transition-all"
                    style={{ background: added.includes(act.title) ? `${act.accent}22` : "#FFFFFF", border: `1.5px solid ${act.accent}44`, color: act.accent, fontFamily: "Nunito" }}>
                    {added.includes(act.title) ? "✓ Đã lưu" : "+ Lưu"}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        <motion.button whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(123,191,168,0.4)" }} whileTap={{ scale: 0.97 }}
          onClick={() => jCtx.setShowJournalReward(true)}
          className="py-4 rounded-2xl font-black text-white text-base mt-2"
          style={{ background: "linear-gradient(135deg,#7BBFA8,#9BC5B8)", fontFamily: "Nunito" }}>
          Hoàn thành hành trình hôm nay 🎉
        </motion.button>
        <div className="h-4" />
      </div>
    </PageShell>
  );
}

// ─── JournalHistory ───────────────────────────────────────────────────────────
function JournalHistory({ jCtx }: { jCtx: JournalCtx }) {
  const [filterMood, setFilterMood] = useState<string | null>(null);
  const filtered = filterMood ? jCtx.entries.filter(e => e.mood === filterMood) : jCtx.entries;
  const grouped: Record<string, JournalEntry[]> = {};
  filtered.forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e); });
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const formatDate = (d: string) => {
    const now = new Date(); const yd = new Date(now); yd.setDate(now.getDate() - 1);
    if (d === now.toISOString().split("T")[0]) return "Hôm nay";
    if (d === yd.toISOString().split("T")[0]) return "Hôm qua";
    return new Date(d).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <motion.div className="min-h-screen flex flex-col" style={{ background: "#F5F0FB", maxWidth: 480, margin: "0 auto" }}
      initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}>
      <div className="sticky top-0 z-20 px-5 pt-12 pb-4"
        style={{ background: "rgba(245,240,251,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(195,180,232,0.15)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => jCtx.navigate("home")}
              className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.8)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="#C3B4E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </motion.button>
            <h1 className="font-black text-xl text-[#3D3547]" style={{ fontFamily: "Nunito" }}>Nhật ký cảm xúc 📓</h1>
          </div>
          <div className="flex gap-2">
            {[{ icon: "🔍", dest: "journal-search" as PageName }, { icon: "📅", dest: "journal-calendar" as PageName }].map(btn => (
              <motion.button key={btn.dest} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => jCtx.navigate(btn.dest)}
                className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#FFFFFF" }}>
                {btn.icon}
              </motion.button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <motion.button whileTap={{ scale: 0.93 }} onClick={() => setFilterMood(null)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{ background: filterMood === null ? "#C3B4E8" : "#FFFFFF", color: filterMood === null ? "#fff" : "#9490A4", fontFamily: "Nunito" }}>
            Tất cả
          </motion.button>
          {J_MOODS.map(m => (
            <motion.button key={m.id} whileTap={{ scale: 0.93 }} onClick={() => setFilterMood(filterMood === m.id ? null : m.id)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold"
              style={{ background: filterMood === m.id ? m.bg : "#FFFFFF", color: filterMood === m.id ? m.color : "#9490A4", border: `1.5px solid ${filterMood === m.id ? m.color + "55" : "transparent"}`, fontFamily: "Nunito" }}>
              {m.emoji} {m.label}
            </motion.button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-28" style={{ scrollbarWidth: "none" }}>
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center py-16 gap-5">
            <div className="relative w-24 h-24 flex items-center justify-center mx-auto">
              <FloatCircle size={100} color="#C3B4E8" x="10%" y="10px" opacity={0.4} dur={7} />
              <FloatCircle size={60} color="#7BBFA8" x="70%" y="30px" delay={1} opacity={0.4} dur={8} />
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl relative z-10" style={{ background: "linear-gradient(135deg,#F5F0FB,#EEF8F4)" }}>📓</div>
            </div>
            <div>
              <h3 className="font-black text-xl text-[#3D3547] mb-2" style={{ fontFamily: "Nunito" }}>{filterMood ? "Không có nhật ký nào" : "Chưa có nhật ký nào"}</h3>
              <p className="text-sm text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>{filterMood ? "Thử đổi bộ lọc khác nhé!" : "Hãy viết nhật ký đầu tiên của bạn 🌸"}</p>
            </div>
            {!filterMood && (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => jCtx.navigate("journal-checkin")}
                className="px-6 py-3.5 rounded-2xl font-black text-white text-sm"
                style={{ background: "linear-gradient(135deg,#C3B4E8,#A8C8E8)", fontFamily: "Nunito" }}>
                Viết nhật ký đầu tiên ✨
              </motion.button>
            )}
          </motion.div>
        ) : (
          sortedDates.map(date => (
            <div key={date} className="mb-6">
              <p className="text-[10px] font-bold text-[#9490A4] uppercase tracking-wider mb-2" style={{ fontFamily: "Be Vietnam Pro" }}>{formatDate(date)}</p>
              <div className="flex flex-col gap-3">
                {grouped[date].map((entry, i) => (
                  <motion.button key={entry.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    whileHover={{ scale: 1.01, x: 4 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { jCtx.setSelectedId(entry.id); jCtx.navigate("journal-detail"); }}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white text-left shadow-[0_4px_16px_rgba(195,180,232,0.08)]">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: entry.moodBg }}>{entry.moodEmoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm text-[#3D3547] truncate" style={{ fontFamily: "Nunito" }}>{entry.title}</p>
                        <span className="text-[10px] text-[#9490A4] flex-shrink-0 ml-2" style={{ fontFamily: "Be Vietnam Pro" }}>{entry.time}</span>
                      </div>
                      <p className="text-xs text-[#9490A4] mt-0.5 truncate" style={{ fontFamily: "Be Vietnam Pro" }}>{entry.content}</p>
                      {entry.emojis.length > 0 && <div className="flex gap-1 mt-1">{entry.emojis.slice(0,4).map((e,j)=><span key={j} className="text-sm">{e}</span>)}</div>}
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0"><path d="M6 4l4 4-4 4" stroke="#C3B4E8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </motion.button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      <motion.button whileHover={{ scale: 1.08, boxShadow: "0 12px 36px rgba(195,180,232,0.5)" }} whileTap={{ scale: 0.93 }}
        onClick={() => jCtx.navigate("journal-checkin")}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-xl z-30 text-xl"
        style={{ background: "linear-gradient(135deg,#C3B4E8,#A8C8E8)" }}>
        ✏️
      </motion.button>
    </motion.div>
  );
}

// ─── CalendarView ─────────────────────────────────────────────────────────────
function CalendarView({ jCtx }: { jCtx: JournalCtx }) {
  const now = new Date();
  const [year, setYear]     = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth());
  const [preview, setPreview] = useState<JournalEntry | null>(null);

  const monthNames = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
  const dayNames   = ["CN","T2","T3","T4","T5","T6","T7"];
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMth  = new Date(year, month + 1, 0).getDate();

  const entryMap: Record<string, JournalEntry[]> = {};
  jCtx.entries.forEach(e => { if (!entryMap[e.date]) entryMap[e.date] = []; entryMap[e.date].push(e); });

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setPreview(null); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); setPreview(null); };

  const clickDay = (day: number) => {
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const e = entryMap[dateStr];
    setPreview(e?.length ? e[0] : null);
  };

  return (
    <PageShell title="Lịch nhật ký 📅" accent="#C3B4E8" bg="#F5F0FB" onBack={() => jCtx.navigate("journal-history")}>
      <div className="px-5 pt-6 flex flex-col gap-5">
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgba(195,180,232,0.12)]">
          <div className="flex items-center justify-between mb-5">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={prevMonth}
              className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#F0EDF8" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="#C3B4E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </motion.button>
            <h3 className="font-black text-[#3D3547]" style={{ fontFamily: "Nunito" }}>{monthNames[month]} {year}</h3>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={nextMonth}
              className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#F0EDF8" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="#C3B4E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </motion.button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map(d => <div key={d} className="text-center text-[10px] font-bold text-[#9490A4] py-1" style={{ fontFamily: "Nunito" }}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMth }, (_, i) => {
              const day = i + 1;
              const ds  = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const es  = entryMap[ds];
              const isT = ds === now.toISOString().split("T")[0];
              const fe  = es?.[0];
              return (
                <motion.button key={day} whileTap={{ scale: 0.85 }} onClick={() => clickDay(day)}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5"
                  style={{ background: fe ? fe.moodBg : isT ? "#F0EDF8" : "transparent", border: isT ? "2px solid #C3B4E8" : "2px solid transparent" }}>
                  <span className="text-[11px] font-bold" style={{ color: fe ? fe.moodColor : isT ? "#C3B4E8" : "#9490A4", fontFamily: "Nunito" }}>{day}</span>
                  {fe && <span className="text-[10px]">{fe.moodEmoji}</span>}
                  {(es?.length ?? 0) > 1 && <span className="text-[8px] font-bold" style={{ color: fe?.moodColor }}>+{es.length-1}</span>}
                </motion.button>
              );
            })}
          </div>
          <div className="flex justify-center gap-3 mt-4">
            {J_MOODS.slice(0,4).map(m => (
              <div key={m.id} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ background: m.bg, border: `1.5px solid ${m.color}55` }} />
                <span className="text-[9px] text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>{m.emoji}</span>
              </div>
            ))}
          </div>
        </div>
        <AnimatePresence>
          {preview && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(195,180,232,0.1)] cursor-pointer"
              onClick={() => { jCtx.setSelectedId(preview.id); jCtx.navigate("journal-detail"); }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: preview.moodBg }}>{preview.moodEmoji}</div>
                <div>
                  <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily: "Nunito" }}>{preview.title}</p>
                  <p className="text-[10px] text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>{preview.time} · {preview.moodLabel}</p>
                </div>
              </div>
              <p className="text-xs text-[#9490A4] line-clamp-2" style={{ fontFamily: "Be Vietnam Pro" }}>{preview.content}</p>
              <p className="text-xs font-bold text-[#C3B4E8] mt-2" style={{ fontFamily: "Nunito" }}>Xem chi tiết →</p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(195,180,232,0.08)]">
          <p className="font-bold text-sm text-[#3D3547] mb-3" style={{ fontFamily: "Nunito" }}>Thống kê tháng này</p>
          <div className="flex gap-3">
            {[
              { label: "Tổng nhật ký", value: jCtx.entries.length, color: "#C3B4E8" },
              { label: "Ngày tuyệt vời", value: `✨×${jCtx.entries.filter(e=>e.mood==="rad").length}`, color: "#F59E0B" },
              { label: "Tổng từ viết", value: jCtx.entries.reduce((a,e)=>a+(e.wordCount||0),0), color: "#7BBFA8" },
            ].map(s => (
              <div key={s.label} className="flex-1 text-center p-3 rounded-2xl" style={{ background: `${s.color}15` }}>
                <p className="font-black text-lg" style={{ color: s.color, fontFamily: "Nunito" }}>{s.value}</p>
                <p className="text-[9px] text-[#9490A4] mt-0.5" style={{ fontFamily: "Be Vietnam Pro" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ─── SearchFilter ─────────────────────────────────────────────────────────────
function SearchFilter({ jCtx }: { jCtx: JournalCtx }) {
  const [query, setQuery]   = useState("");
  const [filter, setFilter] = useState<string|null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = jCtx.entries.filter(e => {
    const matchMood = !filter || e.mood === filter;
    const matchText = !query || [e.title, e.content, ...e.tags].some(t => t.toLowerCase().includes(query.toLowerCase()));
    return matchMood && matchText;
  });

  return (
    <PageShell title="Tìm kiếm 🔍" accent="#C3B4E8" bg="#F5F0FB" onBack={() => jCtx.navigate("journal-history")}>
      <div className="px-5 pt-4 flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5 bg-white shadow-[0_4px_16px_rgba(195,180,232,0.1)]">
          <span className="text-lg">🔍</span>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm kiếm nhật ký..."
            className="flex-1 text-sm bg-transparent outline-none" style={{ color: "#3D3547", fontFamily: "Be Vietnam Pro" }} />
          {query && <button onClick={() => setQuery("")} className="text-[#9490A4] text-xs">✕</button>}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {[null, ...J_MOODS.map(m => m.id)].map((id, i) => {
            const m = J_MOODS.find(x => x.id === id);
            return (
              <motion.button key={i} whileTap={{ scale: 0.93 }} onClick={() => setFilter(filter === id ? null : (id ?? null))}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: filter === id ? (m?.bg ?? "#C3B4E8") : "#FFFFFF", color: filter === id ? (m?.color ?? "#fff") : "#9490A4", border: `1.5px solid ${filter === id ? (m?.color ?? "#C3B4E8") + "55" : "transparent"}`, fontFamily: "Nunito" }}>
                {id ? `${m?.emoji} ${m?.label}` : "Tất cả"}
              </motion.button>
            );
          })}
        </div>
        <p className="text-xs text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>{results.length > 0 ? `${results.length} kết quả` : "Không tìm thấy kết quả nào"}</p>
        <div className="flex flex-col gap-3">
          {results.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-sm text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>Không tìm thấy nhật ký nào phù hợp</p>
            </motion.div>
          ) : results.map((entry, i) => (
            <motion.button key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={() => { jCtx.setSelectedId(entry.id); jCtx.navigate("journal-detail"); }}
              className="flex items-center gap-3 p-4 rounded-2xl bg-white text-left shadow-[0_4px_16px_rgba(195,180,232,0.08)]">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: entry.moodBg }}>{entry.moodEmoji}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[#3D3547] truncate" style={{ fontFamily: "Nunito" }}>{entry.title}</p>
                <p className="text-xs text-[#9490A4] truncate" style={{ fontFamily: "Be Vietnam Pro" }}>{entry.date} · {entry.content.slice(0,60)}...</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

// ─── JournalDetail ────────────────────────────────────────────────────────────
function JournalDetail({ jCtx }: { jCtx: JournalCtx }) {
  const [showDelete, setShowDelete] = useState(false);
  const entry = jCtx.entries.find(e => e.id === jCtx.selectedId);

  if (!entry) {
    return (
      <PageShell title="Chi tiết" accent="#C3B4E8" bg="#F5F0FB" onBack={() => jCtx.navigate("journal-history")}>
        <div className="flex items-center justify-center py-20">
          <p className="text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>Không tìm thấy nhật ký</p>
        </div>
      </PageShell>
    );
  }

  const fmtDate = new Date(entry.date).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <PageShell title="Chi tiết nhật ký" accent={entry.moodColor} bg={`${entry.moodBg}88`} onBack={() => jCtx.navigate("journal-history")}>
      <div className="px-5 pt-4 pb-28 flex flex-col gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MoodBadge emoji={entry.moodEmoji} label={entry.moodLabel} color={entry.moodColor} bg={entry.moodBg} />
            <div className="flex gap-0.5">{Array.from({length: entry.moodIntensity}, (_,i) => <span key={i} className="text-xs" style={{ color: entry.moodColor }}>●</span>)}</div>
          </div>
          <h2 className="font-black text-2xl text-[#3D3547] mt-2 mb-1" style={{ fontFamily: "Nunito" }}>{entry.title}</h2>
          <p className="text-xs text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>{fmtDate} · {entry.time}</p>
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(195,180,232,0.1)]">
          <p className="text-sm text-[#3D3547] leading-[1.9] whitespace-pre-wrap" style={{ fontFamily: "Be Vietnam Pro" }}>{entry.content}</p>
        </div>
        {entry.emojis.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {entry.emojis.map((e, i) => <div key={i} className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: entry.moodBg }}>{e}</div>)}
          </div>
        )}
        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((tag, i) => <span key={i} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: entry.moodBg, color: entry.moodColor, fontFamily: "Nunito" }}>#{tag}</span>)}
          </div>
        )}
        {(entry.hasVoice || entry.hasPhoto) && (
          <div className="flex gap-3">
            {entry.hasVoice && <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: entry.moodBg, border: `1.5px solid ${entry.moodColor}33` }}><span>🎙️</span><span className="text-xs font-bold" style={{ color: entry.moodColor, fontFamily: "Nunito" }}>Ghi âm</span></div>}
            {entry.hasPhoto && <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: entry.moodBg, border: `1.5px solid ${entry.moodColor}33` }}><span>🖼️</span><span className="text-xs font-bold" style={{ color: entry.moodColor, fontFamily: "Nunito" }}>Ảnh</span></div>}
          </div>
        )}
        <p className="text-xs text-[#9490A4] text-center" style={{ fontFamily: "Be Vietnam Pro" }}>{entry.wordCount} từ · Cường độ cảm xúc {entry.moodIntensity}/5</p>
        <div className="flex gap-3">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={() => jCtx.navigate("journal-edit")}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm"
            style={{ background: entry.moodBg, color: entry.moodColor, border: `1.5px solid ${entry.moodColor}44`, fontFamily: "Nunito" }}>
            ✏️ Chỉnh sửa
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={() => setShowDelete(true)}
            className="py-3.5 px-5 rounded-2xl font-bold text-sm"
            style={{ background: "#FFF0F0", color: "#E87B7B", border: "1.5px solid #E87B7B33", fontFamily: "Nunito" }}>
            🗑️ Xóa
          </motion.button>
        </div>
      </div>
      <AnimatePresence>
        {showDelete && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: "rgba(61,53,71,0.55)", backdropFilter: "blur(10px)" }}
            onClick={() => setShowDelete(false)}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280 }}
              className="bg-white rounded-[2rem] p-6 max-w-xs w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-4"><span className="text-5xl">🗑️</span></div>
              <h3 className="font-black text-xl text-[#3D3547] text-center mb-2" style={{ fontFamily: "Nunito" }}>Xóa nhật ký?</h3>
              <p className="text-sm text-[#9490A4] text-center mb-6" style={{ fontFamily: "Be Vietnam Pro" }}>Hành động này không thể hoàn tác. Nhật ký "{entry.title}" sẽ bị xóa vĩnh viễn.</p>
              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowDelete(false)}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm" style={{ background: "#F0EDF8", color: "#9490A4", fontFamily: "Nunito" }}>
                  Hủy bỏ
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }}
                  onClick={() => { jCtx.deleteEntry(entry.id); setShowDelete(false); jCtx.navigate("journal-history"); }}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm text-white" style={{ background: "#E87B7B", fontFamily: "Nunito" }}>
                  Xóa ngay
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}

// ─── EditJournal ──────────────────────────────────────────────────────────────
function EditJournal({ jCtx }: { jCtx: JournalCtx }) {
  const entry = jCtx.entries.find(e => e.id === jCtx.selectedId);
  const [title, setTitle]     = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [tags, setTags]       = useState<string[]>(entry?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [saved, setSaved]     = useState(false);

  if (!entry) {
    return (
      <PageShell title="Chỉnh sửa" accent="#C3B4E8" bg="#F5F0FB" onBack={() => jCtx.navigate("journal-detail")}>
        <div className="flex items-center justify-center py-20">
          <p className="text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>Không tìm thấy nhật ký</p>
        </div>
      </PageShell>
    );
  }

  const addTag = (e: { key: string }) => { if (e.key === "Enter" && tagInput.trim()) { setTags(prev => [...prev, tagInput.trim()]); setTagInput(""); } };

  const saveChanges = () => {
    jCtx.updateEntry(entry.id, { title, content, tags });
    setSaved(true);
    setTimeout(() => { setSaved(false); jCtx.navigate("journal-detail"); }, 1000);
  };

  return (
    <PageShell title="Chỉnh sửa nhật ký ✏️" accent={entry.moodColor} bg={`${entry.moodBg}88`} onBack={() => jCtx.navigate("journal-detail")}>
      <div className="px-5 pt-4 flex flex-col gap-4">
        <MoodBadge emoji={entry.moodEmoji} label={entry.moodLabel} color={entry.moodColor} bg={entry.moodBg} />
        <input value={title} onChange={e => setTitle(e.target.value)}
          className="w-full rounded-2xl px-4 py-3.5 font-bold text-base outline-none"
          style={{ background: "#FFFFFF", color: "#3D3547", fontFamily: "Nunito", border: `1.5px solid ${entry.moodColor}33` }} />
        <div className="relative">
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={8}
            className="w-full resize-none rounded-2xl p-4 text-sm outline-none leading-relaxed"
            style={{ background: "#FFFFFF", color: "#3D3547", fontFamily: "Be Vietnam Pro", border: `1.5px solid ${entry.moodColor}33` }} />
          <span className="absolute bottom-3 right-4 text-[10px] text-[#9490A4]" style={{ fontFamily: "Be Vietnam Pro" }}>
            {content.trim().split(/\s+/).filter(Boolean).length} từ
          </span>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {tags.map((tag, i) => (
            <span key={i} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: entry.moodBg, color: entry.moodColor, fontFamily: "Nunito" }}>
              #{tag}
              <button onClick={() => setTags(prev => prev.filter((_, j) => j !== i))} className="ml-0.5 opacity-60">✕</button>
            </span>
          ))}
          <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
            placeholder="+ Thêm thẻ" className="text-xs outline-none bg-transparent"
            style={{ color: entry.moodColor, fontFamily: "Nunito", minWidth: 70 }} />
        </div>
        <AnimatePresence>
          {saved && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="text-center py-2 rounded-xl" style={{ background: entry.moodBg }}>
              <span className="text-sm font-bold" style={{ color: entry.moodColor, fontFamily: "Nunito" }}>✓ Đã lưu thay đổi!</span>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={saveChanges}
          className="py-4 rounded-2xl font-black text-white text-base"
          style={{ background: `linear-gradient(135deg,${entry.moodColor},${entry.moodColor}AA)`, fontFamily: "Nunito" }}>
          Lưu thay đổi ✓
        </motion.button>
        <div className="h-6" />
      </div>
    </PageShell>
  );
}

// ─── JournalRewardPopup ───────────────────────────────────────────────────────
function JournalRewardPopup({ circles, streak, onClose }: { circles: number; streak: number; onClose: () => void; }) {
  const [step, setStep] = useState(0);

  const steps = [
    <motion.div key="done" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="bg-white rounded-[2rem] p-8 flex flex-col items-center text-center max-w-xs w-full mx-4 shadow-2xl">
      <motion.div className="text-6xl mb-4" animate={{ rotate: [0,-15,15,-10,10,0], scale: [1,1.2,1] }} transition={{ duration: 0.8 }}>📓</motion.div>
      <h3 className="font-black text-2xl text-[#3D3547] mb-1" style={{ fontFamily: "Nunito" }}>Nhật ký hoàn thành!</h3>
      <p className="text-[#9490A4] text-sm mb-6" style={{ fontFamily: "Be Vietnam Pro" }}>Bạn đã hoàn thành hành trình nhật ký hôm nay 🌸</p>
      <div className="w-full h-px mb-4" style={{ background: "rgba(195,180,232,0.3)" }} />
      <p className="text-[#C3B4E8] font-bold text-sm mb-6" style={{ fontFamily: "Nunito" }}>+1 Chấm Tròn Cảm Xúc đang đến ✨</p>
      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setStep(1)}
        className="w-full py-3.5 rounded-2xl font-black text-white text-sm"
        style={{ background: "linear-gradient(135deg,#C3B4E8,#A8C8E8)", fontFamily: "Nunito" }}>
        Tiếp theo ›
      </motion.button>
    </motion.div>,

    <motion.div key="circle" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="bg-white rounded-[2rem] p-8 flex flex-col items-center text-center max-w-xs w-full mx-4 shadow-2xl">
      <div className="relative mb-6">
        <motion.div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl"
          style={{ background: "linear-gradient(135deg,#C3B4E8,#A8C8E8)" }}
          animate={{ scale: [1,1.1,1] }} transition={{ duration: 1.2, repeat: Infinity }}>🌀</motion.div>
        <motion.div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#FDE68A] flex items-center justify-center font-black text-sm text-[#3D3547]"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} style={{ fontFamily: "Nunito" }}>+1</motion.div>
      </div>
      <h3 className="font-black text-xl text-[#3D3547] mb-1" style={{ fontFamily: "Nunito" }}>Chấm Tròn Cảm Xúc</h3>
      <motion.p className="font-black text-4xl mb-2" style={{ color: "#C3B4E8", fontFamily: "Nunito" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>{circles}</motion.p>
      <p className="text-[#9490A4] text-xs mb-6" style={{ fontFamily: "Be Vietnam Pro" }}>tổng số chấm tròn của bạn</p>
      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setStep(2)}
        className="w-full py-3.5 rounded-2xl font-black text-white text-sm"
        style={{ background: "linear-gradient(135deg,#C3B4E8,#A8C8E8)", fontFamily: "Nunito" }}>
        Xem chuỗi ngày 🔥
      </motion.button>
    </motion.div>,

    <motion.div key="streak" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="bg-white rounded-[2rem] p-8 flex flex-col items-center text-center max-w-xs w-full mx-4 shadow-2xl">
      <motion.div className="text-6xl mb-3" animate={{ y: [0,-10,0] }} transition={{ duration: 1, repeat: Infinity }}>🔥</motion.div>
      <h3 className="font-black text-3xl text-[#3D3547] mb-1" style={{ fontFamily: "Nunito" }}>{streak} ngày</h3>
      <p className="text-[#F5A87B] font-bold text-sm mb-2" style={{ fontFamily: "Nunito" }}>viết nhật ký liên tiếp!</p>
      <p className="text-[#9490A4] text-xs mb-8 leading-relaxed" style={{ fontFamily: "Be Vietnam Pro" }}>Duy trì thói quen viết nhật ký giúp bạn hiểu rõ bản thân hơn mỗi ngày 💙</p>
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
            style={{ background: i < Math.min(streak, 7) ? "#FDE68A" : "#F0EDF8" }}>
            {i < Math.min(streak, 7) ? "⭐" : ""}
          </div>
        ))}
      </div>
      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={onClose}
        className="w-full py-3.5 rounded-2xl font-black text-white text-sm"
        style={{ background: "linear-gradient(135deg,#F5A87B,#F5D060)", fontFamily: "Nunito" }}>
        Về trang chủ 🏠
      </motion.button>
    </motion.div>,
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(61,53,71,0.6)", backdropFilter: "blur(12px)" }}>
      <Confetti />
      <FloatingEmotionalCircles />
      <AnimatePresence mode="wait">{steps[step]}</AnimatePresence>
    </div>
  );
}

export { DEFAULT_DRAFT, SAMPLE_ENTRIES, J_MOODS, Sparkles, FloatingEmotionalCircles, FlowerBloom, MoodBadge, EmotionCheckIn, JournalWrite, SaveSuccessOverlay, AIInsight, SuggestedActivities, JournalHistory, CalendarView, SearchFilter, JournalDetail, EditJournal, JournalRewardPopup };
