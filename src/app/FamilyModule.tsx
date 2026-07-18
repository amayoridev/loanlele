import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

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

export interface FamilyCtx {
  navigate: (p: PageName) => void;
  emotionalCircles: number;
  onComplete: (id: string, name: string, emoji: string) => void;
  selectedLesson: number | null;
  setSelectedLesson: (i: number | null) => void;
  selectedUser: SocialUser | null;
  setSelectedUser: (u: SocialUser | null) => void;
}

// ─── Social types ─────────────────────────────────────────────────────────────
export interface SocialUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  quote: string;
  streak: number;
  circles: number;
  treeLevel: number;
  favoriteEmotion: string;
  favoriteEmotionEmoji: string;
  favoriteEmotionColor: string;
  favoriteEmotionBg: string;
}

interface FriendRequest {
  id: string;
  user: SocialUser;
  type: "received" | "sent";
  date: string;
}

// ─── Shared mini components ───────────────────────────────────────────────────
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

function Sparkles({ count = 12, color: clr }: { count?: number; color?: string }) {
  const data = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: `${8 + Math.random() * 84}%`, y: `${8 + Math.random() * 84}%`,
    size: 4 + Math.random() * 8, delay: Math.random() * 1.5,
    color: clr || ["#FDE68A","#C3B4E8","#7BBFA8","#F4C0C0","#A8D4E8","#F5D0BE"][i % 6],
  })), []); // eslint-disable-line react-hooks/exhaustive-deps
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

function FlowerBloom({ color = "#C3B4E8" }: { color?: string }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ width: 28, height: 52, background: `${color}${i % 2 === 0 ? "DD" : "88"}`, transformOrigin: "50% 100%", rotate: `${i * 45}deg`, top: "50%", left: "50%", marginLeft: -14, marginTop: -52 }}
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.45, delay: i * 0.05, ease: "backOut" }} />
      ))}
      <motion.div className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center text-2xl"
        style={{ background: "#FDE68A", boxShadow: "0 4px 20px rgba(253,230,138,0.5)" }}
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 280 }}>🌸</motion.div>
    </div>
  );
}

// ─── Sample social data ───────────────────────────────────────────────────────
const SAMPLE_USERS: SocialUser[] = [
  { id:"u1", name:"Minh Anh", username:"minhanh.cxc", avatar:"🌸", bio:"Học cách yêu thương bản thân mỗi ngày 💕", quote:"Hãy dịu dàng với chính mình.", streak:14, circles:28, treeLevel:3, favoriteEmotion:"Vui vẻ", favoriteEmotionEmoji:"😊", favoriteEmotionColor:"#22C55E", favoriteEmotionBg:"#DCFCE7" },
  { id:"u2", name:"Gia Hân", username:"giahan.wellness", avatar:"🌻", bio:"Mỗi ngày là một cơ hội mới 🌱", quote:"Tiến một bước nhỏ mỗi ngày.", streak:7,  circles:15, treeLevel:2, favoriteEmotion:"Tuyệt vời", favoriteEmotionEmoji:"✨", favoriteEmotionColor:"#F59E0B", favoriteEmotionBg:"#FEF9C3" },
  { id:"u3", name:"Tuấn Khoa", username:"tuankhoa.journey", avatar:"🌿", bio:"Tìm bình yên trong những điều nhỏ bé 🍃", quote:"Bình yên bắt đầu từ bên trong.", streak:21, circles:42, treeLevel:4, favoriteEmotion:"Bình thường", favoriteEmotionEmoji:"😌", favoriteEmotionColor:"#38BDF8", favoriteEmotionBg:"#DBEAFE" },
  { id:"u4", name:"Phương Linh", username:"phuonglinh.cxc", avatar:"💜", bio:"Đang học cách chữa lành 🌸", quote:"Tha thứ là món quà cho chính mình.", streak:3,  circles:9,  treeLevel:1, favoriteEmotion:"Buồn bã", favoriteEmotionEmoji:"🥺", favoriteEmotionColor:"#8B5CF6", favoriteEmotionBg:"#EDE9FE" },
  { id:"u5", name:"Quốc Bảo", username:"quocbao.grow", avatar:"🌊", bio:"Tập thiền và viết nhật ký mỗi sáng ☀️", quote:"Hôm nay tốt hơn hôm qua một chút.", streak:30, circles:60, treeLevel:5, favoriteEmotion:"Tuyệt vời", favoriteEmotionEmoji:"✨", favoriteEmotionColor:"#F59E0B", favoriteEmotionBg:"#FEF9C3" },
];

const SAMPLE_COMPANIONS: SocialUser[] = [SAMPLE_USERS[0], SAMPLE_USERS[2]];

const INITIAL_REQUESTS: FriendRequest[] = [
  { id:"r1", user: SAMPLE_USERS[1], type:"received", date:"2 giờ trước" },
  { id:"r2", user: SAMPLE_USERS[3], type:"received", date:"Hôm qua" },
  { id:"r3", user: SAMPLE_USERS[4], type:"sent",     date:"3 ngày trước" },
];

const HEALING_QUOTES = [
  "Hãy dịu dàng với chính mình — bạn đang làm hết sức mình rồi. 💙",
  "Mỗi ngày tiến một bước nhỏ cũng là tiến bộ. 🌱",
  "Cảm xúc nào cũng xứng đáng được lắng nghe. 🌸",
  "Bạn không cần hoàn hảo để được yêu thương. 🤍",
  "Hôm nay khó khăn không có nghĩa là ngày mai cũng vậy. 🌤️",
  "Nghỉ ngơi là một phần của hành trình, không phải trốn tránh. 🌙",
];

const PODCAST_LIST = [
  { title:"Tâm sự với chính mình", duration:"15 phút", emoji:"🎧", desc:"Về chánh niệm buổi sáng" },
  { title:"Hiểu và yêu bản thân",   duration:"20 phút", emoji:"💛", desc:"Chuyên gia Thu Hương" },
  { title:"Bình yên trong cơn bão", duration:"12 phút", emoji:"🌊", desc:"Kỹ thuật thở và thư giãn" },
  { title:"Kết nối ý nghĩa",        duration:"18 phút", emoji:"🌸", desc:"Xây dựng mối quan hệ lành mạnh" },
];

const JOINT_CHALLENGES = [
  { id:"jc1", icon:"📓", title:"Cùng viết nhật ký",       desc:"Mỗi người viết một trang — chia sẻ cảm xúc trong ngày.", color:"#F5F0FB", accent:"#C3B4E8" },
  { id:"jc2", icon:"🎧", title:"Cùng nghe podcast",        desc:"Nghe cùng một tập podcast và chia sẻ điều bạn học được.", color:"#EDF5FB", accent:"#7AB8D8" },
  { id:"jc3", icon:"💧", title:"Uống đủ nước cùng nhau",   desc:"Cả hai cùng uống 8 ly nước hôm nay.", color:"#EEF8F4", accent:"#7BBFA8" },
  { id:"jc4", icon:"🌬️", title:"Cùng hít thở",             desc:"5 phút thở cùng nhau — mỗi người một góc.", color:"#EEF8F4", accent:"#7BBFA8" },
  { id:"jc5", icon:"🌸", title:"Cùng đọc bài học dịu dàng", desc:"Đọc cùng một bài học và chia sẻ điều mình cảm nhận.", color:"#FFF0F6", accent:"#E87BA8" },
];

// ─── Lesson data ──────────────────────────────────────────────────────────────
export interface Lesson {
  id: number;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  categoryBg: string;
  title: string;
  readMin: number;
  intro: string;
  body: string;
  example: string;
  tryToday: string;
  takeaway: string;
}

export const LESSON_CATEGORIES = [
  { id: "self",   icon: "🤍", label: "Hiểu chính mình", color: "#C3B4E8", bg: "#F5F0FB" },
  { id: "fam",    icon: "👨‍👩‍👧", label: "Gia đình",      color: "#F5A87B", bg: "#FFF4EE" },
  { id: "friend", icon: "🌻", label: "Bạn bè",          color: "#F5C842", bg: "#FFFBEE" },
  { id: "comm",   icon: "🌿", label: "Giao tiếp",       color: "#7BBFA8", bg: "#EEF8F4" },
  { id: "heal",   icon: "🌸", label: "Chữa lành",       color: "#E87BA8", bg: "#FFF0F6" },
];

export const LESSONS: Lesson[] = [
  { id:0,  category:"self",   categoryIcon:"🤍", categoryColor:"#C3B4E8", categoryBg:"#F5F0FB", title:"Khi mình không biết mình đang buồn vì điều gì", readMin:4, intro:"Đôi khi cảm xúc đến mà không có lý do rõ ràng. Điều đó hoàn toàn bình thường.", body:"Não bộ của chúng ta xử lý cảm xúc trước khi chúng ta kịp nhận ra. Những cảm giác mơ hồ, nặng nề hay trống rỗng đều là tín hiệu cơ thể đang cố giao tiếp với bạn.", example:"Minh thường thấy mệt mỏi vào chiều tối mà không rõ lý do. Khi ngồi yên và hỏi bản thân 'Mình đang cảm thấy gì nhỉ?', cô ấy nhận ra mình nhớ nhà.", tryToday:"Dành 3 phút ngồi yên và hỏi bản thân: 'Cơ thể mình đang mang điều gì?'", takeaway:"Không phải lúc nào ta cũng cần biết nguyên nhân. Đôi khi cảm nhận thôi đã là đủ." },
  { id:1,  category:"self",   categoryIcon:"🤍", categoryColor:"#C3B4E8", categoryBg:"#F5F0FB", title:"Cảm xúc nào cũng đáng được lắng nghe", readMin:3, intro:"Buồn, sợ, tức giận — không có cảm xúc nào là xấu. Tất cả đều có lý do tồn tại.", body:"Khi ta cố ép mình không được buồn hay không được sợ, cảm xúc không biến mất mà tìm cách khác để thoát ra — thường là không lành mạnh hơn.", example:"Tuấn học cách nói 'Mình đang buồn' thay vì 'Không sao' — và điều đó giúp anh cảm thấy nhẹ hơn rõ rệt.", tryToday:"Khi một cảm xúc xuất hiện, hãy gọi tên nó. Chỉ vậy thôi.", takeaway:"Gọi tên cảm xúc là bước đầu tiên để hiểu và chữa lành nó." },
  { id:2,  category:"self",   categoryIcon:"🤍", categoryColor:"#C3B4E8", categoryBg:"#F5F0FB", title:"Dịu dàng với chính mình", readMin:4, intro:"Bạn có hay tử tế với bạn bè hơn là với chính mình không?", body:"Tự phê bình gay gắt không giúp ta tiến bộ. Nó chỉ làm ta tê liệt. Nghiên cứu cho thấy lòng từ bi với bản thân thực ra giúp ta cố gắng hơn.", example:"Lan thường tự trách mình mỗi khi mắc lỗi. Khi cô ấy học cách nói 'Lần sau mình sẽ làm tốt hơn', mọi thứ bắt đầu thay đổi.", tryToday:"Nói với bản thân một câu khích lệ như bạn sẽ nói với người bạn yêu quý.", takeaway:"Hãy là người bạn tốt nhất của chính mình." },
  { id:3,  category:"self",   categoryIcon:"🤍", categoryColor:"#C3B4E8", categoryBg:"#F5F0FB", title:"Khi mình cảm thấy quá tải", readMin:5, intro:"Cảm giác không kịp thở vì quá nhiều thứ là dấu hiệu cơ thể đang cần được nghỉ ngơi.", body:"Quá tải không phải là yếu đuối. Đó là phản ứng tự nhiên khi yêu cầu vượt quá nguồn lực. Điều quan trọng là nhận ra và đặt ra ưu tiên.", example:"Khi Hương cảm thấy quá tải, cô ấy viết ra tất cả những việc đang lo, rồi chọn ra 3 việc quan trọng nhất. Phần còn lại có thể chờ.", tryToday:"Viết ra 3 điều đang chiếm không gian trong đầu bạn hôm nay.", takeaway:"Không phải mọi thứ đều khẩn cấp. Hơi thở đầu tiên." },
  { id:4,  category:"self",   categoryIcon:"🤍", categoryColor:"#C3B4E8", categoryBg:"#F5F0FB", title:"Học cách nghỉ ngơi mà không thấy có lỗi", readMin:4, intro:"Nghỉ ngơi không phải là lãng phí thời gian. Đó là đầu tư cho sức khỏe.", body:"Nhiều bạn trẻ cảm thấy tội lỗi khi không làm gì. Nhưng não bộ cần thời gian nghỉ ngơi để xử lý, sáng tạo và phục hồi.", example:"Nam tắt điện thoại 30 phút mỗi tối và chỉ đọc sách. Sau một tuần, anh ngủ ngon hơn và làm việc hiệu quả hơn.", tryToday:"Dành 15 phút không làm gì có mục đích — chỉ tồn tại.", takeaway:"Nghỉ ngơi là một phần của tiến bộ, không phải ngược lại." },
  { id:5,  category:"fam",    categoryIcon:"👨‍👩‍👧", categoryColor:"#F5A87B", categoryBg:"#FFF4EE", title:"Không phải bố mẹ nào cũng biết cách thể hiện tình yêu", readMin:5, intro:"Tình yêu của bố mẹ thường có hình dạng khác với những gì ta muốn nhận được.", body:"Mỗi thế hệ lớn lên với cách thể hiện tình cảm khác nhau. Bố mẹ có thể yêu thương rất nhiều nhưng không biết nói ra hay ôm con.", example:"Khoa nhận ra bố không bao giờ nói 'Ba yêu con' — nhưng mỗi sáng bố đều dậy sớm nấu cơm. Đó là ngôn ngữ yêu thương của bố.", tryToday:"Hãy quan sát một hành động nhỏ của bố hoặc mẹ hôm nay và tự hỏi đây có phải cách họ nói yêu không.", takeaway:"Hiểu cách người khác yêu thương giúp ta nhận được nhiều hơn." },
  { id:6,  category:"fam",    categoryIcon:"👨‍👩‍👧", categoryColor:"#F5A87B", categoryBg:"#FFF4EE", title:"Khi gia đình không hiểu mình", readMin:4, intro:"Cảm giác không được hiểu trong gia đình là một trong những nỗi cô đơn sâu nhất.", body:"Gia đình không hiểu không có nghĩa là họ không yêu. Đôi khi khoảng cách thế hệ, văn hóa hay tính cách tạo ra những bức tường vô hình.", example:"Mai học cách chia sẻ những điều nhỏ trước — sở thích âm nhạc, bộ phim yêu thích — thay vì ngay lập tức kỳ vọng được hiểu hoàn toàn.", tryToday:"Chia sẻ một điều nhỏ bé với thành viên gia đình hôm nay.", takeaway:"Kết nối được xây dựng từng bước nhỏ, không phải từ những cuộc trò chuyện lớn." },
  { id:7,  category:"fam",    categoryIcon:"👨‍👩‍👧", categoryColor:"#F5A87B", categoryBg:"#FFF4EE", title:"Những cuộc trò chuyện không cần người thắng", readMin:3, intro:"Trong gia đình, mục tiêu không phải là đúng hay sai — mà là được nghe và hiểu nhau.", body:"Khi tranh luận với gia đình, ta thường muốn thắng. Nhưng mối quan hệ quan trọng hơn việc đúng.", example:"Thay vì 'Con đúng và bố sai', Minh thử nói 'Con hiểu quan điểm của bố. Bố có muốn nghe suy nghĩ của con không?'", tryToday:"Trong cuộc trò chuyện tiếp theo, hãy lắng nghe để hiểu trước khi trả lời.", takeaway:"Mối quan hệ quan trọng hơn chiến thắng." },
  { id:8,  category:"comm",   categoryIcon:"🌿", categoryColor:"#7BBFA8", categoryBg:"#EEF8F4", title:"Đặt ranh giới một cách tử tế", readMin:5, intro:"Ranh giới không phải là bức tường. Đó là cách ta bảo vệ mình trong khi vẫn kết nối.", body:"Nhiều người sợ đặt ranh giới vì sợ làm người khác tổn thương. Nhưng không có ranh giới lại dẫn đến kiệt sức và oán giận.", example:"'Mình cần thời gian riêng tối nay nhưng ngày mai mình sẵn sàng nói chuyện.' — Đơn giản, rõ ràng và tôn trọng.", tryToday:"Xác định một điều bạn cần bảo vệ cho bản thân hôm nay.", takeaway:"Ranh giới lành mạnh là nền tảng của mọi mối quan hệ bền vững." },
  { id:9,  category:"comm",   categoryIcon:"🌿", categoryColor:"#7BBFA8", categoryBg:"#EEF8F4", title:"Học cách nói lời cảm ơn với gia đình", readMin:3, intro:"'Cảm ơn' là hai từ đơn giản nhưng thường bị bỏ quên nhất trong gia đình.", body:"Ta thường nói cảm ơn với người lạ nhiều hơn với người thân. Nhưng những lời cảm ơn nhỏ có sức mạnh xây dựng kết nối rất lớn.", example:"Hôm nay Linh nói 'Cảm ơn mẹ đã nấu cơm' — mẹ cô ấy mỉm cười cả ngày.", tryToday:"Nói lời cảm ơn chân thành với một thành viên trong gia đình hôm nay.", takeaway:"Biết ơn không chỉ làm người nhận vui — nó còn làm bạn hạnh phúc hơn." },
  { id:10, category:"friend", categoryIcon:"🌻", categoryColor:"#F5C842", categoryBg:"#FFFBEE", title:"Một người bạn tốt không cần hoàn hảo", readMin:3, intro:"Tình bạn không phải cuộc thi xem ai hoàn hảo hơn.", body:"Người bạn tốt nhất không phải người không bao giờ mắc lỗi. Đó là người ở lại khi mọi thứ khó khăn và thành thật dù không dễ nghe.", example:"Dù đôi khi cãi nhau, Hân và Ngọc vẫn là bạn thân 5 năm vì cả hai đều học cách xin lỗi và tha thứ.", tryToday:"Nhắn cho một người bạn một tin nhắn chân thành hôm nay.", takeaway:"Tình bạn thật sự được xây dựng trên sự trung thực và chấp nhận lẫn nhau." },
  { id:11, category:"friend", categoryIcon:"🌻", categoryColor:"#F5C842", categoryBg:"#FFFBEE", title:"Khi cảm thấy bị bỏ lại phía sau", readMin:4, intro:"Nhìn bạn bè tiến về phía trước trong khi mình đứng yên là một cảm giác rất cô đơn.", body:"Mỗi người có nhịp độ riêng. Cảm giác bị bỏ lại thường là dấu hiệu ta đang so sánh hành trình của mình với hành trình của người khác.", example:"Khi thấy bạn bè có việc làm tốt trong khi mình vẫn đang tìm kiếm, Trang học cách tập trung vào tiến trình của riêng mình.", tryToday:"Viết ra một điều bạn đã tiến bộ trong tháng này.", takeaway:"Con đường của bạn là của riêng bạn. Hãy đi với tốc độ của mình." },
  { id:12, category:"friend", categoryIcon:"🌻", categoryColor:"#F5C842", categoryBg:"#FFFBEE", title:"Khi tình bạn thay đổi", readMin:4, intro:"Có những tình bạn thay đổi theo thời gian — và điều đó không có lỗi.", body:"Con người thay đổi, và tình bạn cũng vậy. Một số tình bạn kết thúc không phải vì ai làm gì sai, mà vì hai người đang đi về những hướng khác nhau.", example:"Sau khi vào đại học, Quân và nhóm bạn cũ ít gặp hơn. Thay vì buồn, anh trân trọng những kỷ niệm đẹp và mở lòng với những kết nối mới.", tryToday:"Nhớ về một người bạn cũ và gửi cho họ một tin nhắn ấm áp.", takeaway:"Mọi giai đoạn tình bạn đều có giá trị, dù ngắn hay dài." },
  { id:13, category:"comm",   categoryIcon:"🌿", categoryColor:"#7BBFA8", categoryBg:"#EEF8F4", title:"Học cách xin lỗi chân thành", readMin:4, intro:"Một lời xin lỗi thật sự không phải 'Xin lỗi nếu bạn cảm thấy vậy' — mà là nhận trách nhiệm.", body:"Lời xin lỗi chân thành cần 3 phần: nhận ra điều mình đã làm, hiểu tác động của nó, và cam kết thay đổi.", example:"Thay vì 'Xin lỗi vì bạn buồn', Minh học cách nói 'Mình xin lỗi vì mình đã nói điều đó. Mình hiểu nó làm bạn tổn thương.'", tryToday:"Nghĩ về một người bạn chưa xin lỗi đúng cách và thử viết ra điều bạn muốn nói.", takeaway:"Xin lỗi chân thành là biểu hiện của sự dũng cảm và trưởng thành." },
  { id:14, category:"heal",   categoryIcon:"🌸", categoryColor:"#E87BA8", categoryBg:"#FFF0F6", title:"Học cách tha thứ mà không ép buộc bản thân", readMin:5, intro:"Tha thứ không có nghĩa là chấp nhận những gì sai. Đó là cách ta giải phóng chính mình.", body:"Tha thứ là một quá trình, không phải khoảnh khắc. Không cần ép bản thân tha thứ ngay lập tức.", example:"Sau nhiều năm, Linh nhận ra tha thứ người đã làm tổn thương mình không phải vì họ xứng đáng mà vì cô ấy muốn sống tự do hơn.", tryToday:"Viết một lá thư tha thứ cho ai đó — không cần gửi đi.", takeaway:"Tha thứ là quà tặng bạn dành cho chính mình." },
  { id:15, category:"heal",   categoryIcon:"🌸", categoryColor:"#E87BA8", categoryBg:"#FFF0F6", title:"Yêu bản thân bắt đầu từ những điều rất nhỏ", readMin:3, intro:"Yêu bản thân không phải là ích kỷ — đó là nền tảng để yêu thương người khác.", body:"Yêu bản thân không phải lúc nào cũng là những hành động lớn lao. Đôi khi là uống đủ nước, ngủ đủ giấc, hay tự nói 'Hôm nay mình đã cố gắng'.", example:"Mỗi tối trước khi ngủ, Phương tự nhắn cho bản thân một điều tốt mình đã làm hôm nay — dù nhỏ đến đâu.", tryToday:"Làm một điều tốt nhỏ cho bản thân hôm nay.", takeaway:"Những điều nhỏ bé, được làm đều đặn, tạo nên sự thay đổi lớn." },
  { id:16, category:"heal",   categoryIcon:"🌸", categoryColor:"#E87BA8", categoryBg:"#FFF0F6", title:"Mỗi ngày tiến một chút cũng là tiến bộ", readMin:3, intro:"Tiến bộ không phải lúc nào cũng nhìn thấy được. Nhưng nó vẫn đang xảy ra.", body:"Ta thường chỉ đánh giá bản thân dựa trên những ngày tốt. Nhưng những ngày khó khăn mà ta vẫn tiếp tục — đó mới là sức mạnh thật sự.", example:"Hôm nay Bình chỉ làm được một việc thay vì mười. Nhưng anh vẫn làm — và đó là điều quan trọng.", tryToday:"Ghi lại một điều nhỏ bạn đã làm hôm nay và nói 'Mình tự hào về điều này'.", takeaway:"Mỗi bước nhỏ đều đáng được ghi nhận." },
];

const DAILY_CHALLENGES = [
  { id:"c0", text:"Cảm ơn một người hôm nay",       icon:"💛", color:"#F5C842", bg:"#FFFBEE" },
  { id:"c1", text:"Hỏi thăm một người bạn",          icon:"💬", color:"#7AB8D8", bg:"#EDF5FB" },
  { id:"c2", text:"Ăn cơm cùng gia đình",            icon:"🍚", color:"#7BBFA8", bg:"#EEF8F4" },
  { id:"c3", text:"Mời ai đó một ly nước",            icon:"🥤", color:"#C3B4E8", bg:"#F5F0FB" },
  { id:"c4", text:"Kể một chuyện vui",               icon:"😄", color:"#F5A87B", bg:"#FFF4EE" },
  { id:"c5", text:"Chúc ai đó một ngày tốt lành",    icon:"🌞", color:"#E87BA8", bg:"#FFF0F6" },
  { id:"c6", text:"Ôm người thân (nếu thoải mái)",   icon:"🤗", color:"#7BBFA8", bg:"#EEF8F4" },
];

// ─── Relationship tree ────────────────────────────────────────────────────────
function RelationshipTree({ leaves }: { leaves: number }) {
  const lp = [{ x:56,y:38 },{ x:82,y:25 },{ x:108,y:38 },{ x:44,y:60 },{ x:120,y:60 },{ x:56,y:82 },{ x:108,y:82 }];
  return (
    <svg width={164} height={140} viewBox="0 0 164 140" fill="none">
      <rect x={75} y={90} width={14} height={44} rx={7} fill="#C3A882" />
      <ellipse cx={82} cy={72} rx={42} ry={38} fill="#7BBFA8" opacity={0.25} />
      <ellipse cx={82} cy={72} rx={32} ry={28} fill="#7BBFA8" opacity={0.4} />
      {lp.slice(0, Math.min(leaves, 7)).map((pos, i) => (
        <motion.g key={i} initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }}
          transition={{ delay:i*0.15, type:"spring" }} style={{ originX:pos.x, originY:pos.y }}>
          <ellipse cx={pos.x} cy={pos.y} rx={10} ry={7} fill="#22C55E" opacity={0.85}
            transform={`rotate(${i*26})`} style={{ transformOrigin:`${pos.x}px ${pos.y}px` }} />
        </motion.g>
      ))}
      <ellipse cx={82} cy={52} rx={14} ry={12} fill="#7BBFA8" />
      {leaves>=3 && <circle cx={82} cy={40} r={6} fill="#E87BA8" opacity={0.9} />}
      {leaves>=5 && <circle cx={65} cy={58} r={5} fill="#E87BA8" opacity={0.8} />}
      {leaves>=7 && <circle cx={99} cy={58} r={5} fill="#F5C842" opacity={0.9} />}
    </svg>
  );
}

// ─── Success popup ────────────────────────────────────────────────────────────
function FamilySuccessPopup({ onClose, circles, message = "Cảm ơn bạn đã dành thời gian nuôi dưỡng những mối quan hệ quan trọng." }: {
  onClose: () => void; circles: number; message?: string;
}) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background:"rgba(61,53,71,0.55)", backdropFilter:"blur(8px)" }}
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}>
      <motion.div className="w-full rounded-t-[2.5rem] p-8 pb-12 flex flex-col items-center gap-4 relative overflow-hidden"
        style={{ background:"#FFFBEE", maxWidth:480 }}
        initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
        transition={{ type:"spring", damping:28, stiffness:280 }}
        onClick={e => e.stopPropagation()}>
        <Sparkles count={14} color="#F5C842" />
        <motion.div className="text-5xl" animate={{ scale:[1,1.25,1], rotate:[0,8,-8,0] }} transition={{ duration:1.2 }}>💛</motion.div>
        <h2 className="font-black text-2xl text-[#3D3547] text-center" style={{ fontFamily:"Nunito" }}>+1 Chấm Tròn Cảm Xúc 🌀</h2>
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-full" style={{ background:"#FFF8F3", border:"2px solid #F5C84244" }}>
          <span className="text-2xl">🌀</span>
          <span className="font-black text-xl" style={{ color:"#F5C842", fontFamily:"Nunito" }}>{circles}</span>
        </div>
        <p className="text-sm text-[#9490A4] text-center leading-relaxed px-4" style={{ fontFamily:"Be Vietnam Pro" }}>{message}</p>
        <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={onClose}
          className="w-full py-4 rounded-2xl font-black text-white text-base"
          style={{ background:"linear-gradient(135deg,#F5C842,#F5A87B)", fontFamily:"Nunito" }}>
          Tuyệt vời! 🌸
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── Connection success popup ─────────────────────────────────────────────────
function ConnectionSuccessPopup({ onClose, circles }: { onClose: () => void; circles: number }) {
  return (
    <FamilySuccessPopup
      onClose={onClose}
      circles={circles}
      message="Bạn vừa tạo thêm một kết nối tích cực." />
  );
}

// ─── UserCard ─────────────────────────────────────────────────────────────────
function UserCard({ user, onInvite, onProfile, invited }: {
  user: SocialUser; onInvite: () => void; onProfile: () => void; invited: boolean;
}) {
  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      whileHover={{ y:-3, boxShadow:"0 12px 28px rgba(245,200,66,0.15)" }}
      className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-start gap-3">
        <motion.button whileTap={{ scale:0.95 }} onClick={onProfile}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background:"#FFFBEE", border:"2px solid rgba(245,200,66,0.3)" }}>
            {user.avatar}
          </div>
        </motion.button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>{user.name}</p>
              <p className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>@{user.username}</p>
            </div>
            <div className="flex items-center gap-1 text-[10px]" style={{ color:"#F5A87B", fontFamily:"Nunito" }}>
              🔥 {user.streak}
            </div>
          </div>
          <p className="text-xs text-[#9490A4] mt-1 line-clamp-2 leading-relaxed" style={{ fontFamily:"Be Vietnam Pro" }}>{user.bio}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background:user.favoriteEmotionBg, color:user.favoriteEmotionColor, fontFamily:"Nunito" }}>
              {user.favoriteEmotionEmoji} {user.favoriteEmotion}
            </span>
            <span className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>🌀 {user.circles}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <motion.button whileTap={{ scale:0.96 }} onClick={onInvite}
          className="flex-1 py-2.5 rounded-xl font-bold text-xs"
          style={{ background:invited?"#EEF8F4":"linear-gradient(135deg,#F5C842,#F5A87B)", color:invited?"#7BBFA8":"#fff", fontFamily:"Nunito" }}>
          {invited ? "✅ Đã gửi lời mời" : "Mời làm bạn đồng hành"}
        </motion.button>
        <motion.button whileTap={{ scale:0.96 }} onClick={onProfile}
          className="px-3 py-2.5 rounded-xl font-bold text-xs"
          style={{ background:"#F5F0FB", color:"#C3B4E8", border:"1.5px solid #C3B4E833", fontFamily:"Nunito" }}>
          Hồ sơ
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── PrivacySettingsModal ─────────────────────────────────────────────────────
function PrivacySettingsModal({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState({
    allowSearchById:    true,
    allowSearchByEmail: false,
    allowSearchByPhone: false,
    hideFromSuggestions:false,
    showActivity:       true,
    showStreak:         true,
    showAchievements:   true,
  });
  const toggle = (k: keyof typeof settings) => setSettings(s => ({ ...s, [k]: !s[k] }));
  const items: { key: keyof typeof settings; label: string; desc: string }[] = [
    { key:"allowSearchById",    label:"Cho phép tìm bằng ID",     desc:"Người khác có thể tìm bạn qua ID" },
    { key:"allowSearchByEmail", label:"Cho phép tìm bằng email",  desc:"Tìm kiếm qua địa chỉ email của bạn" },
    { key:"allowSearchByPhone", label:"Cho phép tìm bằng SĐT",    desc:"Tìm kiếm qua số điện thoại" },
    { key:"hideFromSuggestions",label:"Ẩn khỏi gợi ý",            desc:"Không xuất hiện trong danh sách gợi ý" },
    { key:"showActivity",       label:"Hiển thị hoạt động",       desc:"Người khác thấy bạn đang hoạt động" },
    { key:"showStreak",         label:"Hiển thị chuỗi ngày",      desc:"Hiển thị streak công khai" },
    { key:"showAchievements",   label:"Hiển thị thành tích",      desc:"Hiển thị huy hiệu và thành tích" },
  ];
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background:"rgba(61,53,71,0.55)", backdropFilter:"blur(8px)" }}
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}>
      <motion.div className="w-full rounded-t-[2rem] p-6 pb-10 flex flex-col gap-4"
        style={{ background:"#FFF8F3", maxWidth:480, maxHeight:"85vh", overflowY:"auto" }}
        initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
        transition={{ type:"spring", damping:28, stiffness:280 }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-black text-lg text-[#3D3547]" style={{ fontFamily:"Nunito" }}>Cài đặt riêng tư 🔒</h2>
          <motion.button whileTap={{ scale:0.9 }} onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9490A4]"
            style={{ background:"#F0EDF8" }}>✕</motion.button>
        </div>
        <div className="flex flex-col gap-3">
          {items.map(it => (
            <div key={it.key} className="flex items-center justify-between gap-3 bg-white rounded-2xl p-4"
              style={{ boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
              <div>
                <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>{it.label}</p>
                <p className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>{it.desc}</p>
              </div>
              <motion.button whileTap={{ scale:0.92 }} onClick={() => toggle(it.key)}
                className="w-12 h-6 rounded-full flex-shrink-0 relative"
                style={{ background:settings[it.key]?"#7BBFA8":"#D0CCDE" }}>
                <motion.div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                  animate={{ left:settings[it.key]?"calc(100% - 22px)":"2px" }}
                  transition={{ type:"spring", stiffness:400, damping:25 }} />
              </motion.button>
            </div>
          ))}
        </div>
        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} onClick={onClose}
          className="py-4 rounded-2xl font-black text-white"
          style={{ background:"linear-gradient(135deg,#7BBFA8,#9BC5B8)", fontFamily:"Nunito" }}>
          Lưu cài đặt ✓
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── EncouragementCard sender ──────────────────────────────────────────────────
function SendEncouragementModal({ user, onClose, onSend }: { user: SocialUser; onClose: () => void; onSend: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background:"rgba(61,53,71,0.55)", backdropFilter:"blur(8px)" }}
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}>
      <motion.div className="w-full rounded-t-[2rem] p-6 pb-10 flex flex-col gap-4"
        style={{ background:"#FFF8F3", maxWidth:480, maxHeight:"80vh", overflowY:"auto" }}
        initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
        transition={{ type:"spring", damping:28, stiffness:280 }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background:"#FFFBEE" }}>{user.avatar}</div>
          <div>
            <p className="font-black text-base text-[#3D3547]" style={{ fontFamily:"Nunito" }}>Gửi lời động viên 💌</p>
            <p className="text-xs text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>đến {user.name}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {HEALING_QUOTES.map((q, i) => (
            <motion.button key={i} whileTap={{ scale:0.98 }} onClick={() => setSelected(i)}
              className="text-left p-4 rounded-2xl text-sm leading-relaxed"
              style={{
                background:selected===i?"#EEF8F4":"#FFFBEE",
                border:`1.5px solid ${selected===i?"#7BBFA8":"rgba(245,200,66,0.25)"}`,
                color:"#5E5870", fontFamily:"Be Vietnam Pro"
              }}>
              {selected===i && <span className="font-bold text-[#7BBFA8]" style={{ fontFamily:"Nunito" }}>✓ </span>}{q}
            </motion.button>
          ))}
        </div>
        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
          onClick={() => { if (selected !== null) onSend(); }}
          disabled={selected === null}
          className="py-4 rounded-2xl font-black text-white"
          style={{ background:selected!==null?"linear-gradient(135deg,#F5C842,#F5A87B)":"#E8E4F0", fontFamily:"Nunito" }}>
          Gửi lời động viên 💌
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── ShareModal (podcast / quote) ─────────────────────────────────────────────
function ShareModal({ type, companion, onClose, onShare }: {
  type: "podcast" | "quote"; companion: SocialUser; onClose: () => void; onShare: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const items = type === "podcast" ? PODCAST_LIST : HEALING_QUOTES.map((q, i) => ({ text: q, id: i }));
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background:"rgba(61,53,71,0.55)", backdropFilter:"blur(8px)" }}
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}>
      <motion.div className="w-full rounded-t-[2rem] p-6 pb-10 flex flex-col gap-4"
        style={{ background:"#FFF8F3", maxWidth:480, maxHeight:"80vh", overflowY:"auto" }}
        initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
        transition={{ type:"spring", damping:28, stiffness:280 }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-black text-base text-[#3D3547]" style={{ fontFamily:"Nunito" }}>
            {type==="podcast" ? "Chia sẻ Podcast 🎧" : "Chia sẻ câu nói chữa lành 🌸"}
          </p>
          <motion.button whileTap={{ scale:0.9 }} onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background:"#F0EDF8", color:"#9490A4" }}>✕</motion.button>
        </div>
        <p className="text-xs text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>Gửi đến {companion.name} {companion.avatar}</p>
        <div className="flex flex-col gap-2">
          {type === "podcast"
            ? PODCAST_LIST.map((p, i) => (
              <motion.button key={i} whileTap={{ scale:0.98 }} onClick={() => setSelected(i)}
                className="flex items-center gap-3 p-4 rounded-2xl text-left"
                style={{ background:selected===i?"#EDF5FB":"white", border:`1.5px solid ${selected===i?"#7AB8D8":"rgba(0,0,0,0.05)"}` }}>
                <span className="text-2xl">{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#3D3547] truncate" style={{ fontFamily:"Nunito" }}>{p.title}</p>
                  <p className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>{p.desc} · {p.duration}</p>
                </div>
                {selected===i && <span className="text-[#7AB8D8] font-bold text-sm">✓</span>}
              </motion.button>
            ))
            : HEALING_QUOTES.map((q, i) => (
              <motion.button key={i} whileTap={{ scale:0.98 }} onClick={() => setSelected(i)}
                className="text-left p-4 rounded-2xl text-sm leading-relaxed"
                style={{ background:selected===i?"#FFF0F6":"white", border:`1.5px solid ${selected===i?"#E87BA8":"rgba(0,0,0,0.05)"}`, color:"#5E5870", fontFamily:"Be Vietnam Pro" }}>
                {q}
              </motion.button>
            ))
          }
        </div>
        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
          onClick={() => { if (selected !== null) onShare(); }}
          disabled={selected === null}
          className="py-4 rounded-2xl font-black text-white"
          style={{ background:selected!==null?"linear-gradient(135deg,#7AB8D8,#C3B4E8)":"#E8E4F0", fontFamily:"Nunito" }}>
          Chia sẻ ngay →
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── JointChallengeModal ──────────────────────────────────────────────────────
function JointChallengeModal({ companion, onClose, onStart }: {
  companion: SocialUser; onClose: () => void; onStart: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background:"rgba(61,53,71,0.55)", backdropFilter:"blur(8px)" }}
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}>
      <motion.div className="w-full rounded-t-[2rem] p-6 pb-10 flex flex-col gap-4"
        style={{ background:"#FFF8F3", maxWidth:480, maxHeight:"85vh", overflowY:"auto" }}
        initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
        transition={{ type:"spring", damping:28, stiffness:280 }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-black text-base text-[#3D3547]" style={{ fontFamily:"Nunito" }}>Thử thách cùng nhau 🌱</p>
            <p className="text-xs text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>cùng {companion.name} {companion.avatar} · Nhận +2 🌀</p>
          </div>
          <motion.button whileTap={{ scale:0.9 }} onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background:"#F0EDF8", color:"#9490A4" }}>✕</motion.button>
        </div>
        <div className="flex flex-col gap-2">
          {JOINT_CHALLENGES.map(ch => (
            <motion.button key={ch.id} whileTap={{ scale:0.98 }} onClick={() => setSelected(ch.id)}
              className="flex items-center gap-3 p-4 rounded-2xl text-left"
              style={{ background:selected===ch.id?ch.color:"white", border:`1.5px solid ${selected===ch.id?ch.accent:"rgba(0,0,0,0.05)"}` }}>
              <span className="text-2xl flex-shrink-0">{ch.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>{ch.title}</p>
                <p className="text-[10px] text-[#9490A4] leading-relaxed" style={{ fontFamily:"Be Vietnam Pro" }}>{ch.desc}</p>
              </div>
              {selected===ch.id && <span style={{ color:ch.accent }} className="font-bold text-sm">✓</span>}
            </motion.button>
          ))}
        </div>
        <div className="p-3 rounded-2xl text-center" style={{ background:"#FFFBEE", border:"1.5px solid rgba(245,200,66,0.3)" }}>
          <p className="text-xs font-bold text-[#F5C842]" style={{ fontFamily:"Nunito" }}>✨ Hoàn thành cùng nhau → +2 Chấm Tròn Cảm Xúc!</p>
        </div>
        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
          onClick={() => { if (selected) onStart(); }}
          disabled={!selected}
          className="py-4 rounded-2xl font-black text-white"
          style={{ background:selected?"linear-gradient(135deg,#7BBFA8,#9BC5B8)":"#E8E4F0", fontFamily:"Nunito" }}>
          Bắt đầu thử thách 🌱
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── Tab: Kết nối ─────────────────────────────────────────────────────────────
function ConnectTab({ fCtx }: { fCtx: FamilyCtx }) {
  const [query,       setQuery]       = useState("");
  const [invited,     setInvited]     = useState<Set<string>>(new Set());
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [invitedUser, setInvitedUser] = useState<SocialUser | null>(null);

  const filtered = query.trim()
    ? SAMPLE_USERS.filter(u =>
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.username.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleInvite = (u: SocialUser) => {
    setInvited(p => new Set([...p, u.id]));
    setInvitedUser(u);
    setShowSuccess(true);
  };

  return (
    <div className="px-5 pt-4 flex flex-col gap-4 pb-8">
      {/* Search bar */}
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9490A4]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#9490A4" strokeWidth="1.5"/><path d="M11 11l3 3" stroke="#9490A4" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <input
          className="w-full pl-9 pr-10 py-3 rounded-2xl text-sm text-[#3D3547] outline-none"
          style={{ background:"white", border:"1.5px solid rgba(245,200,66,0.35)", fontFamily:"Be Vietnam Pro" }}
          placeholder="Tìm bạn bè (tên, @username, email, SĐT)..."
          value={query} onChange={e => setQuery(e.target.value)} />
        {query && (
          <motion.button whileTap={{ scale:0.9 }} onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
            style={{ background:"#F0EDF8", color:"#9490A4" }}>✕</motion.button>
        )}
      </div>

      {/* Privacy + settings */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[#9490A4]" style={{ fontFamily:"Nunito" }}>
          {query.trim() ? `${filtered.length} kết quả` : "Gợi ý cho bạn"}
        </p>
        <motion.button whileTap={{ scale:0.95 }} onClick={() => setShowPrivacy(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ background:"#F5F0FB", color:"#C3B4E8", border:"1.5px solid #C3B4E833", fontFamily:"Nunito" }}>
          🔒 Riêng tư
        </motion.button>
      </div>

      {/* Results or suggestions */}
      {query.trim() ? (
        filtered.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filtered.map((u, i) => (
              <motion.div key={u.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
                <UserCard user={u} invited={invited.has(u.id)}
                  onInvite={() => handleInvite(u)}
                  onProfile={() => { fCtx.setSelectedUser(u); fCtx.navigate("family-user-profile"); }} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-12 gap-3">
            <span className="text-4xl">🔍</span>
            <p className="text-sm text-[#9490A4] text-center" style={{ fontFamily:"Be Vietnam Pro" }}>Không tìm thấy người dùng nào.<br/>Hãy thử từ khóa khác!</p>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-3">
          {SAMPLE_USERS.map((u, i) => (
            <motion.div key={u.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}>
              <UserCard user={u} invited={invited.has(u.id)}
                onInvite={() => handleInvite(u)}
                onProfile={() => { fCtx.setSelectedUser(u); fCtx.navigate("family-user-profile"); }} />
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showPrivacy && <PrivacySettingsModal onClose={() => setShowPrivacy(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showSuccess && invitedUser && (
          <ConnectionSuccessPopup circles={fCtx.emotionalCircles + 1}
            onClose={() => { setShowSuccess(false); fCtx.onComplete("family-connect", "Kết nối mới", "💛"); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tab: Lời mời ─────────────────────────────────────────────────────────────
function InvitationsTab({ fCtx }: { fCtx: FamilyCtx }) {
  const [requests, setRequests] = useState<FriendRequest[]>(INITIAL_REQUESTS);
  const [viewTab,  setViewTab]  = useState<"received"|"sent">("received");
  const [showSuccess, setShowSuccess] = useState(false);

  const received = requests.filter(r => r.type === "received");
  const sent     = requests.filter(r => r.type === "sent");
  const current  = viewTab === "received" ? received : sent;

  const accept  = (id: string) => { setRequests(r => r.filter(x => x.id !== id)); setShowSuccess(true); };
  const decline = (id: string) => setRequests(r => r.filter(x => x.id !== id));
  const cancel  = (id: string) => setRequests(r => r.filter(x => x.id !== id));

  return (
    <div className="px-5 pt-4 flex flex-col gap-4 pb-8">
      {/* Sub-tab */}
      <div className="flex bg-white rounded-2xl p-1.5 shadow-[0_2px_10px_rgba(245,200,66,0.08)]">
        {[{k:"received",l:`Nhận được (${received.length})`},{k:"sent",l:`Đã gửi (${sent.length})`}].map(t => (
          <motion.button key={t.k} whileTap={{ scale:0.97 }} onClick={() => setViewTab(t.k as "received"|"sent")}
            className="flex-1 py-2.5 rounded-xl font-bold text-xs transition-all"
            style={{ background:viewTab===t.k?"#F5C842":"transparent", color:viewTab===t.k?"#fff":"#9490A4", fontFamily:"Nunito" }}>
            {t.l}
          </motion.button>
        ))}
      </div>

      {current.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <span className="text-5xl">📨</span>
          <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>
            {viewTab === "received" ? "Chưa có lời mời nào" : "Chưa gửi lời mời nào"}
          </p>
          <p className="text-xs text-[#9490A4] text-center" style={{ fontFamily:"Be Vietnam Pro" }}>
            {viewTab === "received" ? "Khi ai đó mời bạn, bạn sẽ thấy ở đây." : "Hãy tìm và kết nối với những người bạn mới!"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {current.map((req, i) => (
            <motion.div key={req.id} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.07 }}
              className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
              <div className="flex items-start gap-3">
                <motion.button whileTap={{ scale:0.95 }}
                  onClick={() => { fCtx.setSelectedUser(req.user); fCtx.navigate("family-user-profile"); }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background:"#FFFBEE", border:"2px solid rgba(245,200,66,0.3)" }}>
                    {req.user.avatar}
                  </div>
                </motion.button>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>{req.user.name}</p>
                  <p className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>@{req.user.username} · {req.date}</p>
                  <p className="text-xs text-[#9490A4] mt-1 line-clamp-1" style={{ fontFamily:"Be Vietnam Pro" }}>{req.user.bio}</p>
                </div>
              </div>
              {viewTab === "received" ? (
                <div className="flex gap-2 mt-3">
                  <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.96 }} onClick={() => accept(req.id)}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white"
                    style={{ background:"linear-gradient(135deg,#7BBFA8,#9BC5B8)", fontFamily:"Nunito" }}>
                    ✅ Chấp nhận
                  </motion.button>
                  <motion.button whileTap={{ scale:0.96 }} onClick={() => decline(req.id)}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs"
                    style={{ background:"#F5F0FB", color:"#9490A4", fontFamily:"Nunito" }}>
                    Từ chối
                  </motion.button>
                </div>
              ) : (
                <div className="flex gap-2 mt-3">
                  <div className="flex-1 py-2.5 rounded-xl text-xs font-bold text-center"
                    style={{ background:"#FFFBEE", color:"#F5C842", border:"1.5px solid #F5C84233", fontFamily:"Nunito" }}>
                    ⏳ Đang chờ phản hồi
                  </div>
                  <motion.button whileTap={{ scale:0.96 }} onClick={() => cancel(req.id)}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs"
                    style={{ background:"#FFE4E6", color:"#F43F5E", fontFamily:"Nunito" }}>
                    Hủy
                  </motion.button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showSuccess && (
          <ConnectionSuccessPopup circles={fCtx.emotionalCircles + 1}
            onClose={() => { setShowSuccess(false); fCtx.onComplete("family-accept", "Kết nối mới", "💛"); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tab: Bạn đồng hành ──────────────────────────────────────────────────────
function CompanionsTab({ fCtx }: { fCtx: FamilyCtx }) {
  const [modal, setModal] = useState<{ type:"encourage"|"podcast"|"quote"|"challenge"; user: SocialUser } | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [rewardCircles, setRewardCircles] = useState(0);
  const [completedJoints, setCompletedJoints] = useState<Set<string>>(new Set());

  const handleReward = (extra = 1) => {
    setRewardCircles(fCtx.emotionalCircles + extra);
    setShowReward(true);
    setModal(null);
  };

  return (
    <div className="px-5 pt-4 flex flex-col gap-4 pb-8">
      {SAMPLE_COMPANIONS.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <span className="text-5xl">🌟</span>
          <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>Chưa có bạn đồng hành</p>
          <p className="text-xs text-[#9490A4] text-center" style={{ fontFamily:"Be Vietnam Pro" }}>Hãy tìm và kết nối với những người bạn tốt trong tab Kết nối!</p>
        </div>
      ) : (
        SAMPLE_COMPANIONS.map((companion, ci) => (
          <motion.div key={companion.id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:ci*0.1 }}
            className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(245,200,66,0.1)]">
            {/* Companion header */}
            <motion.button className="flex items-center gap-3 mb-4 w-full text-left"
              whileTap={{ scale:0.98 }}
              onClick={() => { fCtx.setSelectedUser(companion); fCtx.navigate("family-user-profile"); }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background:"#FFFBEE", border:"2px solid rgba(245,200,66,0.3)" }}>
                {companion.avatar}
              </div>
              <div className="flex-1">
                <p className="font-black text-base text-[#3D3547]" style={{ fontFamily:"Nunito" }}>{companion.name}</p>
                <p className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>@{companion.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold" style={{ color:"#F5A87B", fontFamily:"Nunito" }}>🔥 {companion.streak} ngày</span>
                  <span className="text-[10px]" style={{ color:"#9490A4", fontFamily:"Be Vietnam Pro" }}>🌀 {companion.circles}</span>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="#C3B4E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </motion.button>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { icon:"🌱", label:"Làm thử thách cùng", action:"challenge", bg:"#EEF8F4", color:"#7BBFA8" },
                { icon:"💌", label:"Gửi lời động viên",  action:"encourage",  bg:"#FFF0F6", color:"#E87BA8" },
                { icon:"🎧", label:"Chia sẻ Podcast",    action:"podcast",   bg:"#EDF5FB", color:"#7AB8D8" },
                { icon:"🌸", label:"Câu nói chữa lành",  action:"quote",     bg:"#FFFBEE", color:"#F5C842" },
              ].map(btn => (
                <motion.button key={btn.action} whileHover={{ scale:1.03 }} whileTap={{ scale:0.96 }}
                  onClick={() => setModal({ type: btn.action as "encourage"|"podcast"|"quote"|"challenge", user: companion })}
                  className="flex items-center gap-2 p-3 rounded-2xl text-left"
                  style={{ background:btn.bg, border:`1.5px solid ${btn.color}33` }}>
                  <span className="text-lg">{btn.icon}</span>
                  <span className="text-[10px] font-bold leading-snug" style={{ color:btn.color, fontFamily:"Nunito" }}>{btn.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Joint challenges progress */}
            <div>
              <p className="text-xs font-bold text-[#9490A4] mb-2" style={{ fontFamily:"Nunito" }}>Thử thách đang làm cùng</p>
              <div className="flex flex-col gap-2">
                {JOINT_CHALLENGES.slice(0, 2).map(ch => {
                  const key = `${companion.id}-${ch.id}`;
                  const done = completedJoints.has(key);
                  return (
                    <motion.button key={ch.id} whileTap={{ scale:0.97 }}
                      onClick={() => { if (!done) { setCompletedJoints(p => new Set([...p, key])); handleReward(2); } }}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl"
                      style={{ background:done?"#EEF8F4":ch.color, border:`1.5px solid ${ch.accent}44` }}>
                      <span className="text-base">{ch.icon}</span>
                      <p className="flex-1 text-xs font-bold text-left" style={{ color:done?"#7BBFA8":"#3D3547", fontFamily:"Nunito" }}>{ch.title}</p>
                      <span className="text-xs">{done ? "✅" : "○"}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ))
      )}

      <AnimatePresence>
        {modal?.type === "challenge" && (
          <JointChallengeModal companion={modal.user} onClose={() => setModal(null)}
            onStart={() => handleReward(2)} />
        )}
        {modal?.type === "encourage" && (
          <SendEncouragementModal user={modal.user} onClose={() => setModal(null)}
            onSend={() => handleReward(1)} />
        )}
        {(modal?.type === "podcast" || modal?.type === "quote") && (
          <ShareModal type={modal.type} companion={modal.user} onClose={() => setModal(null)}
            onShare={() => handleReward(1)} />
        )}
        {showReward && (
          <FamilySuccessPopup circles={rewardCircles}
            message="Bạn vừa tạo thêm một kết nối tích cực."
            onClose={() => { setShowReward(false); fCtx.onComplete("family-companion", "Bạn đồng hành", "🌟"); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ConnectChallenges (main — 4 tabs) ────────────────────────────────────────
export function ConnectChallenges({ fCtx }: { fCtx: FamilyCtx }) {
  const [tab, setTab] = useState<"today"|"connect"|"invitations"|"companions">("today");
  const todayIdx        = new Date().getDay();
  const todayChallenge  = DAILY_CHALLENGES[todayIdx % DAILY_CHALLENGES.length];
  const [completed,   setCompleted]   = useState<Set<string>>(new Set());
  const [skipped,     setSkipped]     = useState<Set<string>>(new Set());
  const [showPopup,   setShowPopup]   = useState(false);
  const [leaves,      setLeaves]      = useState(3);
  const [listTab,     setListTab]     = useState<"today"|"all">("today");
  const weekDays = ["T2","T3","T4","T5","T6","T7","CN"];
  const weekDone = [true,true,false,false,false,false,false];

  const handleComplete = (id: string) => {
    if (completed.has(id)) return;
    setCompleted(c => new Set([...c, id]));
    setLeaves(l => Math.min(7, l + 1));
    if (id === todayChallenge.id) setTimeout(() => setShowPopup(true), 600);
  };

  const TABS = [
    { key:"today",       label:"📝", title:"Thử thách" },
    { key:"connect",     label:"👥", title:"Kết nối" },
    { key:"invitations", label:"📨", title:"Lời mời" },
    { key:"companions",  label:"🌟", title:"Đồng hành" },
  ];

  return (
    <PageShell title="Thử thách kết nối 🌱" accent="#7BBFA8" bg="#EEF8F4" onBack={() => fCtx.navigate("family-home")}>
      {/* Tab bar */}
      <div className="sticky top-[73px] z-10 px-5 pt-3 pb-0"
        style={{ background:"rgba(238,248,244,0.95)", backdropFilter:"blur(12px)" }}>
        <div className="flex bg-white rounded-2xl p-1 shadow-[0_2px_10px_rgba(123,191,168,0.12)]">
          {TABS.map(t => (
            <motion.button key={t.key} whileTap={{ scale:0.95 }}
              onClick={() => setTab(t.key as typeof tab)}
              className="flex-1 flex flex-col items-center py-2 rounded-xl transition-all"
              style={{ background:tab===t.key?"#7BBFA8":"transparent" }}>
              <span className="text-base leading-tight">{t.label}</span>
              <span className="text-[9px] font-bold leading-tight mt-0.5"
                style={{ color:tab===t.key?"#fff":"#9490A4", fontFamily:"Nunito" }}>{t.title}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === "today" && (
          <motion.div key="today" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
            transition={{ duration:0.2 }} className="px-5 pt-4 flex flex-col gap-5">
            {/* Weekly progress */}
            <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(123,191,168,0.12)]">
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>Tiến trình tuần này</p>
                <span className="text-xs font-bold text-[#7BBFA8]" style={{ fontFamily:"Nunito" }}>{weekDone.filter(Boolean).length}/7 ngày</span>
              </div>
              <div className="flex gap-1.5 mb-4">
                {weekDays.map((d, i) => (
                  <div key={d} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div className="w-full h-8 rounded-xl flex items-center justify-center text-xs"
                      style={{ background:weekDone[i]?"#EEF8F4":"#F0EDF8" }} whileHover={{ scale:1.05 }}>
                      {weekDone[i] ? "✅" : ""}
                    </motion.div>
                    <span className="text-[9px] text-[#9490A4]" style={{ fontFamily:"Nunito" }}>{d}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-4">
                <RelationshipTree leaves={leaves} />
                <div>
                  <p className="font-black text-2xl" style={{ color:"#7BBFA8", fontFamily:"Nunito" }}>{leaves}</p>
                  <p className="text-xs text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>lá trên cây 🌿</p>
                  <p className="text-[10px] text-[#9490A4] mt-1" style={{ fontFamily:"Be Vietnam Pro" }}>Mỗi thử thách hoàn thành<br/>giúp cây thêm lá mới!</p>
                </div>
              </div>
            </div>

            {/* Today/All sub-tab */}
            <div className="flex bg-white rounded-2xl p-1.5 shadow-[0_2px_10px_rgba(123,191,168,0.08)]">
              {[{k:"today",l:"Hôm nay"},{k:"all",l:"Tất cả"}].map(t => (
                <motion.button key={t.k} whileTap={{ scale:0.97 }} onClick={() => setListTab(t.k as "today"|"all")}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
                  style={{ background:listTab===t.k?"#7BBFA8":"transparent", color:listTab===t.k?"#fff":"#9490A4", fontFamily:"Nunito" }}>
                  {t.l}
                </motion.button>
              ))}
            </div>

            {listTab === "today" ? (
              <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgba(123,191,168,0.12)]">
                <p className="text-xs font-bold text-[#9490A4] mb-3" style={{ fontFamily:"Nunito" }}>
                  {new Date().toLocaleDateString("vi-VN",{weekday:"long",day:"numeric",month:"long"})}
                </p>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ background:todayChallenge.bg }}>{todayChallenge.icon}</div>
                  <div>
                    <p className="font-black text-base text-[#3D3547] leading-snug" style={{ fontFamily:"Nunito" }}>{todayChallenge.text}</p>
                    {completed.has(todayChallenge.id) && <span className="text-xs font-bold text-[#22C55E]" style={{ fontFamily:"Nunito" }}>✅ Hoàn thành!</span>}
                  </div>
                </div>
                {!completed.has(todayChallenge.id) && !skipped.has(todayChallenge.id) ? (
                  <div className="flex gap-2">
                    <motion.button whileHover={{ scale:1.03, boxShadow:"0 10px 28px rgba(123,191,168,0.4)" }} whileTap={{ scale:0.97 }}
                      onClick={() => handleComplete(todayChallenge.id)}
                      className="flex-1 py-3.5 rounded-2xl font-black text-white text-sm"
                      style={{ background:"linear-gradient(135deg,#7BBFA8,#9BC5B8)", fontFamily:"Nunito" }}>
                      ✅ Đã làm rồi!
                    </motion.button>
                    <motion.button whileTap={{ scale:0.97 }}
                      onClick={() => setSkipped(s => new Set([...s, todayChallenge.id]))}
                      className="flex-1 py-3.5 rounded-2xl font-bold text-sm"
                      style={{ background:"#F0EDF8", color:"#9490A4", fontFamily:"Nunito" }}>Để mai nhé</motion.button>
                  </div>
                ) : completed.has(todayChallenge.id) ? (
                  <div className="p-3 rounded-2xl text-center" style={{ background:"#EEF8F4" }}>
                    <p className="text-sm font-bold text-[#7BBFA8]" style={{ fontFamily:"Nunito" }}>Tuyệt vời! Bạn đã kết nối hôm nay 🌿</p>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl text-center" style={{ background:"#F5F0FB" }}>
                    <p className="text-sm font-bold text-[#9490A4]" style={{ fontFamily:"Nunito" }}>Hẹn ngày mai nhé! Bạn đã cố gắng 💙</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {DAILY_CHALLENGES.map((c, i) => {
                  const done = completed.has(c.id);
                  return (
                    <motion.div key={c.id} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.06 }}
                      className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(123,191,168,0.07)] flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background:c.bg, opacity:done?0.7:1 }}>{c.icon}</div>
                      <p className="flex-1 text-sm font-bold text-[#3D3547]" style={{ fontFamily:"Nunito", opacity:done?0.6:1 }}>{c.text}</p>
                      <motion.button whileTap={{ scale:0.9 }} onClick={() => handleComplete(c.id)}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                        style={{ background:done?"#EEF8F4":"#F0EDF8" }}>
                        {done ? "✅" : "○"}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            )}
            <div className="h-4" />
          </motion.div>
        )}

        {tab === "connect" && (
          <motion.div key="connect" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.2 }}>
            <ConnectTab fCtx={fCtx} />
          </motion.div>
        )}

        {tab === "invitations" && (
          <motion.div key="invitations" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.2 }}>
            <InvitationsTab fCtx={fCtx} />
          </motion.div>
        )}

        {tab === "companions" && (
          <motion.div key="companions" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.2 }}>
            <CompanionsTab fCtx={fCtx} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPopup && (
          <FamilySuccessPopup circles={fCtx.emotionalCircles + 1}
            onClose={() => { setShowPopup(false); fCtx.onComplete("family-challenge", "Thử thách kết nối", "🌱"); }} />
        )}
      </AnimatePresence>
    </PageShell>
  );
}

// ─── FamilyUserProfile ────────────────────────────────────────────────────────
export function FamilyUserProfile({ fCtx }: { fCtx: FamilyCtx }) {
  const user = fCtx.selectedUser ?? SAMPLE_USERS[0];
  const [following,     setFollowing]     = useState(false);
  const [invited,       setInvited]       = useState(false);
  const [showEncourage, setShowEncourage] = useState(false);
  const [showSuccess,   setShowSuccess]   = useState(false);
  const [successMsg,    setSuccessMsg]    = useState("");

  const treeLevelLabel = ["🌱 Mầm","🌿 Chồi","🌳 Cây","🌸 Hoa","🌟 Rừng"][Math.min(user.treeLevel - 1, 4)];

  return (
    <PageShell title="Hồ sơ 👤" accent="#F5C842" bg="#FFFBEE" onBack={() => fCtx.navigate("family-challenges")}>
      <div className="px-5 pt-4 pb-28 flex flex-col gap-5">
        {/* Hero */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          className="rounded-3xl p-6 flex flex-col items-center gap-3"
          style={{ background:"linear-gradient(135deg,#FFFBEE,#FFF0F6)", border:"1.5px solid rgba(245,200,66,0.25)" }}>
          <motion.div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
            style={{ background:"rgba(255,255,255,0.8)", border:"3px solid rgba(245,200,66,0.3)" }}
            animate={{ scale:[1,1.04,1] }} transition={{ duration:3, repeat:Infinity }}>
            {user.avatar}
          </motion.div>
          <div className="text-center">
            <h2 className="font-black text-2xl text-[#3D3547]" style={{ fontFamily:"Nunito" }}>{user.name}</h2>
            <p className="text-sm text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>@{user.username}</p>
          </div>
          <p className="text-sm text-[#5E5870] text-center leading-relaxed" style={{ fontFamily:"Be Vietnam Pro" }}>{user.bio}</p>
          <div className="p-3 rounded-2xl w-full text-center" style={{ background:"rgba(255,255,255,0.7)", border:"1.5px solid rgba(245,200,66,0.2)" }}>
            <p className="text-xs text-[#9490A4] mb-0.5" style={{ fontFamily:"Be Vietnam Pro" }}>Câu nói yêu thích</p>
            <p className="text-sm italic text-[#3D3547] font-semibold" style={{ fontFamily:"Be Vietnam Pro" }}>"{user.quote}"</p>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon:"🔥", label:"Chuỗi",    value:`${user.streak}`, color:"#F5A87B" },
            { icon:"🌀", label:"Chấm Tròn", value:`${user.circles}`, color:"#C3B4E8" },
            { icon:"🌳", label:"Cây",       value:treeLevelLabel,   color:"#7BBFA8" },
            { icon:"",  label:"Cảm xúc",   value:user.favoriteEmotionEmoji, color:user.favoriteEmotionColor },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              className="bg-white rounded-2xl p-3 text-center shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              {s.icon && <div className="text-lg mb-0.5">{s.icon}</div>}
              <p className="font-black text-base leading-tight" style={{ color:s.color, fontFamily:"Nunito" }}>{s.value}</p>
              <p className="text-[9px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Favorite emotion badge */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background:user.favoriteEmotionBg }}>
            {user.favoriteEmotionEmoji}
          </div>
          <div>
            <p className="text-xs text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>Cảm xúc thường gặp nhất</p>
            <p className="font-black text-base" style={{ color:user.favoriteEmotionColor, fontFamily:"Nunito" }}>{user.favoriteEmotion}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <motion.button whileHover={{ scale:1.02, boxShadow:"0 10px 28px rgba(245,200,66,0.4)" }} whileTap={{ scale:0.97 }}
            onClick={() => { setInvited(true); setSuccessMsg("Bạn vừa tạo thêm một kết nối tích cực."); setShowSuccess(true); }}
            className="py-4 rounded-2xl font-black text-white text-base"
            style={{ background:invited?"#EEF8F4":"linear-gradient(135deg,#F5C842,#F5A87B)", color:invited?"#7BBFA8":"#fff", fontFamily:"Nunito" }}>
            {invited ? "✅ Đã gửi lời mời" : "Mời làm bạn đồng hành 💛"}
          </motion.button>
          <div className="flex gap-3">
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
              onClick={() => setFollowing(f => !f)}
              className="flex-1 py-3.5 rounded-2xl font-bold text-sm"
              style={{ background:following?"#EEF8F4":"#F5F0FB", color:following?"#7BBFA8":"#C3B4E8", border:`1.5px solid ${following?"#7BBFA833":"#C3B4E833"}`, fontFamily:"Nunito" }}>
              {following ? "✅ Đang theo dõi" : "Theo dõi"}
            </motion.button>
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
              onClick={() => setShowEncourage(true)}
              className="flex-1 py-3.5 rounded-2xl font-bold text-sm"
              style={{ background:"#FFF0F6", color:"#E87BA8", border:"1.5px solid #E87BA833", fontFamily:"Nunito" }}>
              Gửi động viên 💌
            </motion.button>
          </div>
          <motion.button whileTap={{ scale:0.97 }} onClick={() => fCtx.navigate("family-challenges")}
            className="py-3 rounded-2xl font-bold text-sm text-[#9490A4]"
            style={{ background:"#F5F0FB", fontFamily:"Nunito" }}>
            ← Quay lại
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showEncourage && (
          <SendEncouragementModal user={user} onClose={() => setShowEncourage(false)}
            onSend={() => { setShowEncourage(false); setSuccessMsg("Bạn vừa tạo thêm một kết nối tích cực."); setShowSuccess(true); }} />
        )}
        {showSuccess && (
          <ConnectionSuccessPopup circles={fCtx.emotionalCircles + 1}
            onClose={() => { setShowSuccess(false); fCtx.onComplete("family-social", "Kết nối xã hội", "💛"); }} />
        )}
      </AnimatePresence>
    </PageShell>
  );
}

// ─── Remaining family pages (unchanged) ──────────────────────────────────────

export function FamilyHome({ fCtx }: { fCtx: FamilyCtx }) {
  const cards = [
    { icon:"💌", title:"Hộp thư chưa gửi",        desc:"Viết những điều trong lòng chưa nói ra.",           page:"family-letters"    as PageName, color:"#FFF0F6", accent:"#E87BA8" },
    { icon:"🌱", title:"Thử thách kết nối",         desc:"Mỗi ngày một hành động nhỏ kết nối yêu thương.",    page:"family-challenges" as PageName, color:"#EEF8F4", accent:"#7BBFA8" },
    { icon:"🌸", title:"Những bài học dịu dàng",   desc:"Đọc và học cách yêu thương bản thân và người khác.", page:"family-lessons"    as PageName, color:"#FFF8F3", accent:"#F5A87B" },
    { icon:"🌼", title:"Lời cảm ơn hôm nay",       desc:"Gửi lòng biết ơn đến những người quan trọng.",      page:"family-gratitude"  as PageName, color:"#FFFBEE", accent:"#F5C842" },
  ];
  return (
    <motion.div className="min-h-screen" style={{ background:"#FFFBEE", maxWidth:480, margin:"0 auto" }}
      initial={{ x:40, opacity:0 }} animate={{ x:0, opacity:1 }} exit={{ x:-30, opacity:0 }}
      transition={{ duration:0.28, ease:"easeOut" }}>
      <div className="sticky top-0 z-20 px-5 pt-12 pb-4"
        style={{ background:"rgba(255,251,238,0.92)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(245,200,66,0.15)" }}>
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale:0.9 }} onClick={() => fCtx.navigate("home")}
            className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background:"rgba(255,255,255,0.8)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="#F5C842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </motion.button>
          <div>
            <h1 className="font-black text-xl text-[#3D3547]" style={{ fontFamily:"Nunito" }}>Gia đình & Bạn bè 💛</h1>
            <p className="text-xs text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>Nuôi dưỡng những kết nối quan trọng</p>
          </div>
        </div>
      </div>
      <div className="px-5 pb-28 flex flex-col gap-5">
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          className="rounded-3xl p-5" style={{ background:"linear-gradient(135deg,#FFFBEE,#FFF0F6)", border:"1.5px solid rgba(245,200,66,0.25)" }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background:"#FFF8F3" }}>🌻</div>
            <div>
              <p className="font-black text-base text-[#3D3547] mb-1" style={{ fontFamily:"Nunito" }}>Mỗi kết nối đều quý giá</p>
              <p className="text-xs text-[#9490A4] leading-relaxed" style={{ fontFamily:"Be Vietnam Pro" }}>Những mối quan hệ không cần hoàn hảo để có giá trị. Mỗi hành động nhỏ bé đều có thể tạo nên sự khác biệt lớn.</p>
            </div>
          </div>
        </motion.div>
        <div className="grid grid-cols-2 gap-3">
          {cards.map((c, i) => (
            <motion.button key={c.title}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12+i*0.07 }}
              whileHover={{ y:-5, boxShadow:`0 16px 36px ${c.accent}25` }} whileTap={{ scale:0.97 }}
              onClick={() => fCtx.navigate(c.page)}
              className="rounded-3xl p-4 text-left flex flex-col gap-2 transition-shadow"
              style={{ background:c.color, border:`1.5px solid ${c.accent}33`, minHeight:140 }}>
              <span className="text-3xl">{c.icon}</span>
              <p className="font-black text-sm text-[#3D3547] leading-snug" style={{ fontFamily:"Nunito" }}>{c.title}</p>
              <p className="text-[10px] text-[#9490A4] leading-relaxed" style={{ fontFamily:"Be Vietnam Pro" }}>{c.desc}</p>
            </motion.button>
          ))}
        </div>
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }} className="flex gap-3">
          {[
            { icon:"📊", label:"Tiến trình", sub:"Xem hành trình", page:"family-progress" as PageName, bg:"#EDF5FB", accent:"#7AB8D8" },
            { icon:"🤖", label:"AI gợi ý",  sub:"Gợi ý cho bạn",  page:"family-ai"       as PageName, bg:"#F5F0FB", accent:"#C3B4E8" },
          ].map(btn => (
            <motion.button key={btn.label} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
              onClick={() => fCtx.navigate(btn.page)}
              className="flex-1 rounded-2xl p-4 text-left" style={{ background:btn.bg, border:`1.5px solid ${btn.accent}33` }}>
              <div className="text-xl mb-1">{btn.icon}</div>
              <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>{btn.label}</p>
              <p className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>{btn.sub}</p>
            </motion.button>
          ))}
        </motion.div>
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
          className="rounded-3xl p-5 text-center" style={{ background:"#FFF0F6", border:"1.5px solid rgba(232,123,168,0.2)" }}>
          <p className="text-sm text-[#9490A4] italic leading-relaxed" style={{ fontFamily:"Be Vietnam Pro" }}>
            "Những mối quan hệ không cần hoàn hảo để mang lại hạnh phúc. Chỉ cần chân thành."
          </p>
          <p className="text-xs font-bold text-[#E87BA8] mt-2" style={{ fontFamily:"Nunito" }}>— Những Chấm Tròn Cảm Xúc</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function LetterEditor({ fCtx }: { fCtx: FamilyCtx }) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [activePrompt, setActivePrompt] = useState<string|null>(null);
  const [saved, setSaved] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [drafts, setDrafts] = useState<{title:string;preview:string;fav:boolean}[]>([{title:"Lá thư chưa gửi #1",preview:"Mình muốn nói với...",fav:false}]);
  const [favs, setFavs] = useState<Set<number>>(new Set());
  const [view, setView] = useState<"write"|"drafts">("write");
  const prompts = ["Mình muốn nói với...","Nếu hôm nay đủ can đảm...","Điều mình chưa từng nói..."];

  const handleSave = () => {
    if (!text.trim()) return;
    setDrafts(d => [{title: title||`Lá thư ${new Date().toLocaleDateString("vi-VN")}`, preview:text.slice(0,60), fav:false},...d]);
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowSuccess(true); }, 400);
  };

  if (showSuccess) {
    return (
      <motion.div className="min-h-screen flex flex-col items-center justify-center px-8 gap-6"
        style={{ background:"#FFF0F6", maxWidth:480, margin:"0 auto" }}
        initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }}>
        <Sparkles count={16} color="#E87BA8" />
        <FlowerBloom />
        <h2 className="font-black text-2xl text-[#3D3547] text-center" style={{ fontFamily:"Nunito" }}>Lá thư đã được lưu 💌</h2>
        <p className="text-sm text-[#9490A4] text-center leading-relaxed" style={{ fontFamily:"Be Vietnam Pro" }}>
          Không phải mọi lá thư đều cần được gửi đi. Đôi khi, việc viết ra cũng đã là một bước chữa lành.
        </p>
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-full" style={{ background:"#FFF8F3", border:"2px solid #E87BA844" }}>
          <span className="text-2xl">🌀</span><span className="font-black text-xl" style={{ color:"#E87BA8", fontFamily:"Nunito" }}>+1 Chấm Tròn</span>
        </div>
        <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
          onClick={() => { fCtx.onComplete("family-letter","Hộp thư chưa gửi","💌"); fCtx.navigate("family-home"); }}
          className="w-full py-4 rounded-2xl font-black text-white" style={{ background:"linear-gradient(135deg,#E87BA8,#C3B4E8)", fontFamily:"Nunito" }}>
          Tuyệt vời! Về trang chủ 🌸
        </motion.button>
        <motion.button whileTap={{ scale:0.97 }} onClick={() => setShowSuccess(false)}
          className="text-sm font-bold" style={{ color:"#9490A4", fontFamily:"Nunito" }}>Viết thêm</motion.button>
      </motion.div>
    );
  }
  return (
    <PageShell title="Hộp thư chưa gửi 💌" accent="#E87BA8" bg="#FFF0F6" onBack={() => fCtx.navigate("family-home")}>
      <div className="px-5 pt-4 flex flex-col gap-4">
        <div className="flex bg-white rounded-2xl p-1.5 shadow-[0_2px_10px_rgba(232,123,168,0.08)]">
          {[{k:"write",l:"Viết thư"},{k:"drafts",l:`Bản nháp (${drafts.length})`}].map(t=>(
            <motion.button key={t.k} whileTap={{ scale:0.97 }} onClick={() => setView(t.k as "write"|"drafts")}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
              style={{ background:view===t.k?"#E87BA8":"transparent", color:view===t.k?"#fff":"#9490A4", fontFamily:"Nunito" }}>
              {t.l}
            </motion.button>
          ))}
        </div>
        {view==="write" ? (
          <>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-[#9490A4]" style={{ fontFamily:"Nunito" }}>Gợi ý mở đầu</p>
              <div className="flex flex-wrap gap-2">
                {prompts.map(p=>(
                  <motion.button key={p} whileTap={{ scale:0.96 }}
                    onClick={() => { setActivePrompt(p); if(!text) setText(p+" "); }}
                    className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={{ background:activePrompt===p?"#E87BA8":"#FFF0F6", color:activePrompt===p?"#fff":"#E87BA8", border:"1.5px solid #E87BA844", fontFamily:"Nunito" }}>
                    {p}
                  </motion.button>
                ))}
              </div>
            </div>
            <input className="w-full px-4 py-3 rounded-2xl font-bold text-sm text-[#3D3547] outline-none"
              style={{ background:"white", border:"1.5px solid rgba(232,123,168,0.25)", fontFamily:"Nunito" }}
              placeholder="Tiêu đề lá thư (tuỳ chọn)..." value={title} onChange={e=>setTitle(e.target.value)} />
            <textarea className="w-full px-4 py-4 rounded-2xl text-sm text-[#3D3547] outline-none resize-none leading-relaxed"
              style={{ background:"white", border:"1.5px solid rgba(232,123,168,0.25)", fontFamily:"Be Vietnam Pro", minHeight:220 }}
              placeholder="Bắt đầu viết những điều trong lòng..." value={text} onChange={e=>setText(e.target.value)} />
            <div className="flex gap-2">
              <motion.button whileHover={{ scale:1.03, boxShadow:"0 10px 28px rgba(232,123,168,0.4)" }} whileTap={{ scale:0.97 }}
                onClick={handleSave} disabled={!text.trim()}
                className="flex-1 py-4 rounded-2xl font-black text-white text-sm"
                style={{ background:text.trim()?"linear-gradient(135deg,#E87BA8,#C3B4E8)":"#E8E4F0", fontFamily:"Nunito" }}>
                {saved?"Đang lưu... 💌":"Lưu lá thư 💌"}
              </motion.button>
              <motion.button whileTap={{ scale:0.97 }} onClick={() => { setText(""); setTitle(""); setActivePrompt(null); }}
                className="w-14 rounded-2xl flex items-center justify-center" style={{ background:"#FFF0F6", border:"1.5px solid rgba(232,123,168,0.2)" }}>
                🗑️
              </motion.button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            {drafts.length===0 ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <span className="text-5xl">💌</span>
                <p className="text-sm text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>Chưa có bản nháp nào</p>
              </div>
            ) : drafts.map((d,i) => (
              <motion.div key={i} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.07 }}
                className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(232,123,168,0.08)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background:"#FFF0F6" }}>💌</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#3D3547] truncate" style={{ fontFamily:"Nunito" }}>{d.title}</p>
                  <p className="text-xs text-[#9490A4] truncate" style={{ fontFamily:"Be Vietnam Pro" }}>{d.preview}...</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <motion.button whileTap={{ scale:0.9 }} onClick={() => setFavs(p=>{const n=new Set(p);n.has(i)?n.delete(i):n.add(i);return n;})}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ background:favs.has(i)?"#FFF0F6":"#F5F0FB" }}>
                    {favs.has(i)?"❤️":"🤍"}
                  </motion.button>
                  <motion.button whileTap={{ scale:0.9 }} onClick={() => setDrafts(d=>d.filter((_,j)=>j!==i))}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ background:"#FFF4EE" }}>🗑️</motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        <div className="h-8" />
      </div>
    </PageShell>
  );
}

export function LessonList({ fCtx }: { fCtx: FamilyCtx }) {
  const [selectedCat, setSelectedCat] = useState<string|null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set([0,2]));
  const filtered = selectedCat ? LESSONS.filter(l=>l.category===selectedCat) : LESSONS;
  return (
    <PageShell title="Bài học dịu dàng 🌸" accent="#F5A87B" bg="#FFF8F3" onBack={() => fCtx.navigate("family-home")}>
      <div className="px-5 pt-4 flex flex-col gap-5">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:"none" }}>
          <motion.button whileTap={{ scale:0.96 }} onClick={() => setSelectedCat(null)}
            className="flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-bold"
            style={{ background:!selectedCat?"#F5A87B":"#FFF4EE", color:!selectedCat?"#fff":"#F5A87B", border:"1.5px solid #F5A87B44", fontFamily:"Nunito" }}>
            Tất cả
          </motion.button>
          {LESSON_CATEGORIES.map(cat=>(
            <motion.button key={cat.id} whileTap={{ scale:0.96 }} onClick={() => setSelectedCat(cat.id===selectedCat?null:cat.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold"
              style={{ background:selectedCat===cat.id?cat.color:cat.bg, color:selectedCat===cat.id?"#fff":cat.color, border:`1.5px solid ${cat.color}44`, fontFamily:"Nunito" }}>
              {cat.icon} {cat.label}
            </motion.button>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(245,168,123,0.08)]">
          <div className="flex justify-between mb-2">
            <p className="text-xs font-bold text-[#3D3547]" style={{ fontFamily:"Nunito" }}>Đã hoàn thành</p>
            <p className="text-xs font-bold text-[#F5A87B]" style={{ fontFamily:"Nunito" }}>{completed.size}/{LESSONS.length} bài</p>
          </div>
          <div className="h-2 rounded-full" style={{ background:"#F0EDF8" }}>
            <motion.div className="h-full rounded-full" style={{ background:"linear-gradient(90deg,#F5A87B,#F5C842)" }}
              initial={{ width:0 }} animate={{ width:`${(completed.size/LESSONS.length)*100}%` }} transition={{ duration:0.8 }} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {filtered.map((lesson,i) => {
            const isDone = completed.has(lesson.id);
            return (
              <motion.button key={lesson.id} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                whileHover={{ y:-3, boxShadow:`0 12px 28px ${lesson.categoryColor}20` }} whileTap={{ scale:0.98 }}
                onClick={() => { fCtx.setSelectedLesson(lesson.id); fCtx.navigate("family-lesson-detail"); }}
                className="flex items-center gap-4 bg-white rounded-2xl p-4 text-left shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background:lesson.categoryBg, opacity:isDone?0.7:1 }}>{lesson.categoryIcon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#3D3547] leading-snug mb-1" style={{ fontFamily:"Nunito", opacity:isDone?0.7:1 }}>{lesson.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background:lesson.categoryBg, color:lesson.categoryColor, fontFamily:"Nunito" }}>
                      {lesson.categoryIcon} {LESSON_CATEGORIES.find(c=>c.id===lesson.category)?.label}
                    </span>
                    <span className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>⏱ {lesson.readMin} phút</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {isDone ? <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background:"#EEF8F4" }}>✅</div>
                    : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke={lesson.categoryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
              </motion.button>
            );
          })}
        </div>
        <div className="h-4" />
      </div>
    </PageShell>
  );
}

export function LessonDetail({ fCtx }: { fCtx: FamilyCtx }) {
  const lesson = LESSONS.find(l=>l.id===fCtx.selectedLesson) ?? LESSONS[0];
  const [done, setDone] = useState(false);
  const [faved, setFaved] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const nextLesson = LESSONS.find(l=>l.id>lesson.id);
  return (
    <PageShell title="Bài học 🌸" accent={lesson.categoryColor} bg={`${lesson.categoryBg}CC`} onBack={() => fCtx.navigate("family-lessons")}>
      <div className="px-5 pt-4 pb-28 flex flex-col gap-5">
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          className="rounded-3xl p-6 flex flex-col gap-3"
          style={{ background:`linear-gradient(135deg,${lesson.categoryBg},white)`, border:`1.5px solid ${lesson.categoryColor}33` }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background:lesson.categoryBg, color:lesson.categoryColor, fontFamily:"Nunito" }}>
              {lesson.categoryIcon} {LESSON_CATEGORIES.find(c=>c.id===lesson.category)?.label}
            </span>
            <motion.button whileTap={{ scale:0.9 }} onClick={() => setFaved(f=>!f)}
              className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background:"rgba(255,255,255,0.8)" }}>
              {faved?"❤️":"🤍"}
            </motion.button>
          </div>
          <div className="text-5xl text-center py-4">{lesson.categoryIcon}</div>
          <h2 className="font-black text-xl text-[#3D3547] leading-snug" style={{ fontFamily:"Nunito" }}>{lesson.title}</h2>
        </motion.div>
        {[
          { label:null, text:lesson.intro, bg:"transparent", color:"#5E5870", bold:true },
          { label:null, text:lesson.body, bg:"transparent", color:"#5E5870", bold:false },
          { label:"📖 Ví dụ thực tế", text:lesson.example, bg:`${lesson.categoryBg}BB`, color:"#3D3547", bold:false },
          { label:"✨ Thử một điều nhỏ hôm nay", text:lesson.tryToday, bg:"#EEF8F4", color:"#3D3547", bold:true },
          { label:"💙 Mang theo hôm nay", text:lesson.takeaway, bg:"#F5F0FB", color:"#3D3547", bold:true },
        ].map((block,i) => (
          <motion.div key={i} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1+i*0.08 }}
            className={block.bg!=="transparent"?"rounded-2xl p-4":""} style={block.bg!=="transparent"?{background:block.bg}:{}}>
            {block.label && <p className="text-xs font-black text-[#9490A4] mb-2" style={{ fontFamily:"Nunito" }}>{block.label}</p>}
            <p className={`text-sm leading-relaxed ${block.bold?"font-semibold":""}`} style={{ color:block.color, fontFamily:"Be Vietnam Pro" }}>{block.text}</p>
          </motion.div>
        ))}
        <div className="flex flex-col gap-3 mt-2">
          {!done ? (
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} onClick={() => { setDone(true); setTimeout(()=>setShowPopup(true),600); }}
              className="py-4 rounded-2xl font-black text-white text-base"
              style={{ background:`linear-gradient(135deg,${lesson.categoryColor},${lesson.categoryColor}AA)`, fontFamily:"Nunito" }}>
              ✅ Đánh dấu hoàn thành
            </motion.button>
          ) : (
            <div className="py-4 rounded-2xl font-black text-center" style={{ background:"#EEF8F4", color:"#7BBFA8", fontFamily:"Nunito" }}>✅ Đã hoàn thành!</div>
          )}
          {nextLesson && (
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
              onClick={() => fCtx.setSelectedLesson(nextLesson.id)}
              className="py-3.5 rounded-2xl font-bold text-sm"
              style={{ background:lesson.categoryBg, color:lesson.categoryColor, border:`1.5px solid ${lesson.categoryColor}44`, fontFamily:"Nunito" }}>
              Bài tiếp: {nextLesson.title.slice(0,35)}... →
            </motion.button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {showPopup && (
          <FamilySuccessPopup circles={fCtx.emotionalCircles+1}
            onClose={() => { setShowPopup(false); fCtx.onComplete("family-lesson","Bài học dịu dàng","🌸"); fCtx.navigate("family-lessons"); }} />
        )}
      </AnimatePresence>
    </PageShell>
  );
}

export function GratitudeNote({ fCtx }: { fCtx: FamilyCtx }) {
  const [text, setText] = useState("");
  const [person, setPerson] = useState("");
  const [sent, setSent] = useState(false);
  const [notes, setNotes] = useState<{person:string;text:string;date:string}[]>([{person:"Mẹ",text:"Cảm ơn mẹ đã luôn ở bên con.",date:"Hôm qua"}]);
  if (sent) {
    return (
      <motion.div className="min-h-screen flex flex-col items-center justify-center px-8 gap-6"
        style={{ background:"#FFFBEE", maxWidth:480, margin:"0 auto" }}
        initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }}>
        <Sparkles count={18} color="#F5C842" />
        <FlowerBloom />
        <h2 className="font-black text-2xl text-[#3D3547] text-center" style={{ fontFamily:"Nunito" }}>Cảm ơn đã biết ơn 🌼</h2>
        <div className="rounded-3xl p-5 w-full" style={{ background:"rgba(245,200,66,0.12)", border:"1.5px solid rgba(245,200,66,0.3)" }}>
          <p className="text-xs font-bold text-[#9490A4] mb-1" style={{ fontFamily:"Nunito" }}>Gửi đến: {person||"Một người thân yêu"} 🌼</p>
          <p className="text-sm text-[#3D3547] leading-relaxed italic" style={{ fontFamily:"Be Vietnam Pro" }}>"{text}"</p>
        </div>
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-full" style={{ background:"#FFF8F3", border:"2px solid #F5C84244" }}>
          <span className="text-2xl">🌀</span><span className="font-black text-xl" style={{ color:"#F5C842", fontFamily:"Nunito" }}>+1 Chấm Tròn</span>
        </div>
        <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
          onClick={() => { fCtx.onComplete("family-gratitude","Lời cảm ơn","🌼"); fCtx.navigate("family-home"); }}
          className="w-full py-4 rounded-2xl font-black text-white" style={{ background:"linear-gradient(135deg,#F5C842,#F5A87B)", fontFamily:"Nunito" }}>
          Tuyệt vời! 🌸
        </motion.button>
        <motion.button whileTap={{ scale:0.97 }} onClick={() => { setText(""); setPerson(""); setSent(false); }}
          className="text-sm font-bold" style={{ color:"#9490A4", fontFamily:"Nunito" }}>Viết thêm lời cảm ơn</motion.button>
      </motion.div>
    );
  }
  return (
    <PageShell title="Lời cảm ơn hôm nay 🌼" accent="#F5C842" bg="#FFFBEE" onBack={() => fCtx.navigate("family-home")}>
      <div className="px-5 pt-4 flex flex-col gap-5">
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(245,200,66,0.1)]">
          <p className="font-black text-base text-[#3D3547] mb-1" style={{ fontFamily:"Nunito" }}>Hôm nay bạn biết ơn ai? 🌻</p>
          <p className="text-xs text-[#9490A4] mb-4" style={{ fontFamily:"Be Vietnam Pro" }}>Một lời cảm ơn nhỏ có thể thay đổi ngày của người đó.</p>
          <input className="w-full px-4 py-3 rounded-2xl font-bold text-sm text-[#3D3547] outline-none mb-3"
            style={{ background:"#FFFBEE", border:"1.5px solid rgba(245,200,66,0.35)", fontFamily:"Nunito" }}
            placeholder="Tên người bạn muốn cảm ơn..." value={person} onChange={e=>setPerson(e.target.value)} />
          <textarea className="w-full px-4 py-4 rounded-2xl text-sm text-[#3D3547] outline-none resize-none leading-relaxed"
            style={{ background:"#FFFBEE", border:"1.5px solid rgba(245,200,66,0.35)", fontFamily:"Be Vietnam Pro", minHeight:160 }}
            placeholder="Cảm ơn vì..." value={text} onChange={e=>setText(e.target.value)} />
          <div className="flex gap-2 mt-3 flex-wrap">
            {["đã luôn ở bên","đã lắng nghe","đã giúp đỡ mình","đã tin tưởng mình","đã làm mình cười"].map(s=>(
              <motion.button key={s} whileTap={{ scale:0.95 }} onClick={() => setText(t=>t+(t?" ":"")+s)}
                className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background:"#FFFBEE", color:"#F5C842", border:"1.5px solid #F5C84244", fontFamily:"Nunito" }}>+ {s}</motion.button>
            ))}
          </div>
        </div>
        <motion.button whileHover={{ scale:1.02, boxShadow:"0 10px 30px rgba(245,200,66,0.4)" }} whileTap={{ scale:0.97 }}
          onClick={() => { if(text.trim()){setNotes(n=>[{person:person||"Người thân yêu",text,date:"Hôm nay"},...n]);setSent(true);} }}
          disabled={!text.trim()}
          className="py-4 rounded-2xl font-black text-white text-base"
          style={{ background:text.trim()?"linear-gradient(135deg,#F5C842,#F5A87B)":"#E8E4F0", fontFamily:"Nunito" }}>
          Gửi lời cảm ơn 🌼
        </motion.button>
        {notes.length>0 && (
          <div className="flex flex-col gap-3">
            <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>Những lời cảm ơn trước 💛</p>
            {notes.map((n,i)=>(
              <div key={i} className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(245,200,66,0.08)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#F5C842]" style={{ fontFamily:"Nunito" }}>🌼 {n.person}</span>
                  <span className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>{n.date}</span>
                </div>
                <p className="text-sm text-[#5E5870] italic leading-relaxed" style={{ fontFamily:"Be Vietnam Pro" }}>"{n.text}"</p>
              </div>
            ))}
          </div>
        )}
        <div className="h-4" />
      </div>
    </PageShell>
  );
}

export function FamilyProgress({ fCtx }: { fCtx: FamilyCtx }) {
  const stats = [
    { icon:"💌", label:"Lá thư đã viết",     value:"3", color:"#E87BA8", bg:"#FFF0F6" },
    { icon:"🌱", label:"Thử thách hoàn thành", value:"12", color:"#7BBFA8", bg:"#EEF8F4" },
    { icon:"🌸", label:"Bài học đọc xong",   value:"7", color:"#F5A87B", bg:"#FFF4EE" },
    { icon:"🌼", label:"Lời cảm ơn",         value:"5", color:"#F5C842", bg:"#FFFBEE" },
  ];
  const weekDays = ["T2","T3","T4","T5","T6","T7","CN"];
  const acts = [3,2,0,1,3,2,0];
  const maxAct = Math.max(...acts,1);
  return (
    <PageShell title="Tiến trình 📊" accent="#7AB8D8" bg="#EDF5FB" onBack={() => fCtx.navigate("family-home")}>
      <div className="px-5 pt-4 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s,i)=>(
            <motion.div key={s.label} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}
              className="rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)]" style={{ background:s.bg }}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="font-black text-2xl" style={{ color:s.color, fontFamily:"Nunito" }}>{s.value}</p>
              <p className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(122,184,216,0.1)]">
          <p className="font-bold text-sm text-[#3D3547] mb-4" style={{ fontFamily:"Nunito" }}>Hoạt động 7 ngày qua</p>
          <div className="flex items-end gap-2" style={{ height:80 }}>
            {weekDays.map((d,i) => {
              const h = acts[i]>0?Math.max(16,(acts[i]/maxAct)*70):6;
              return (
                <div key={d} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div className="w-full rounded-xl" style={{ background:acts[i]>0?"#F5C842":"#F0EDF8" }}
                    initial={{ height:0 }} animate={{ height:h }} transition={{ duration:0.6, delay:i*0.08 }} />
                  <span className="text-[9px] text-[#9490A4]" style={{ fontFamily:"Nunito" }}>{d}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.05)] flex flex-col items-center gap-3">
          <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>Cây kết nối của bạn 🌳</p>
          <RelationshipTree leaves={5} />
          <p className="text-xs text-[#9490A4] text-center" style={{ fontFamily:"Be Vietnam Pro" }}>5 lá — Cây đang lớn dần! Tiếp tục kết nối mỗi ngày 🌿</p>
        </div>
        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} onClick={() => fCtx.navigate("family-ai")}
          className="py-4 rounded-2xl font-black text-white text-base"
          style={{ background:"linear-gradient(135deg,#F5C842,#F5A87B)", fontFamily:"Nunito" }}>
          Xem gợi ý AI 🤖
        </motion.button>
        <div className="h-4" />
      </div>
    </PageShell>
  );
}

export function FamilyAIRecommend({ fCtx }: { fCtx: FamilyCtx }) {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(()=>setLoading(false),2000); return ()=>clearTimeout(t); }, []);
  const recs = [
    { icon:"💌", title:"Viết lá thư cho mẹ",   desc:"Dựa trên hành trình của bạn, đây là thời điểm tốt để chia sẻ điều bạn chưa nói.", page:"family-letters"    as PageName, color:"#FFF0F6", accent:"#E87BA8" },
    { icon:"🌱", title:"Thử thách hôm nay",     desc:"Hãy thử 'Cảm ơn một người hôm nay' — chỉ mất 30 giây nhưng có thể thay đổi cả ngày của họ.", page:"family-challenges" as PageName, color:"#EEF8F4", accent:"#7BBFA8" },
    { icon:"🌸", title:"Bài học cho bạn",       desc:"'Lắng nghe để hiểu' — đây là kỹ năng phù hợp với giai đoạn bạn đang trải qua.", page:"family-lessons"    as PageName, color:"#FFF4EE", accent:"#F5A87B" },
    { icon:"👥", title:"Kết nối mới",           desc:"Hãy tìm một người bạn đồng hành để cùng nhau xây dựng thói quen tốt.", page:"family-challenges" as PageName, color:"#EDF5FB", accent:"#7AB8D8" },
    { icon:"🌼", title:"Lời cảm ơn chưa nói",  desc:"Còn ai bạn muốn cảm ơn hôm nay không? Đừng để ngày trôi qua.", page:"family-gratitude"  as PageName, color:"#FFFBEE", accent:"#F5C842" },
    { icon:"🤍", title:"Bài học tự hiểu",       desc:"'Dịu dàng với chính mình' — bởi vì bạn xứng đáng được đối xử tốt.", page:"family-lessons"    as PageName, color:"#F5F0FB", accent:"#C3B4E8" },
  ];
  return (
    <PageShell title="AI gợi ý 🤖" accent="#C3B4E8" bg="#F5F0FB" onBack={() => fCtx.navigate("family-home")}>
      <div className="px-5 pt-4 flex flex-col gap-5">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-5">
            <motion.div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
              style={{ background:"linear-gradient(135deg,#C3B4E8,#E8A8D0)" }}
              animate={{ rotate:360 }} transition={{ duration:2, repeat:Infinity, ease:"linear" }}>🤖</motion.div>
            <div className="flex gap-1.5">
              {[0,1,2].map(i=>(
                <motion.div key={i} className="w-2.5 h-2.5 rounded-full bg-[#C3B4E8]"
                  animate={{ y:[0,-8,0] }} transition={{ duration:0.6, repeat:Infinity, delay:i*0.15 }} />
              ))}
            </div>
            <p className="text-sm text-[#9490A4] text-center" style={{ fontFamily:"Be Vietnam Pro" }}>Đang phân tích hành trình kết nối của bạn...</p>
          </div>
        ) : (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex flex-col gap-5">
            <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgba(195,180,232,0.12)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background:"linear-gradient(135deg,#C3B4E8,#E8A8D0)" }}>🤖</div>
                <div>
                  <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>Nhận xét của AI</p>
                  <p className="text-[10px] text-[#9490A4]" style={{ fontFamily:"Be Vietnam Pro" }}>Dựa trên hành trình của bạn</p>
                </div>
              </div>
              <p className="text-sm text-[#5E5870] leading-relaxed" style={{ fontFamily:"Be Vietnam Pro" }}>
                Bạn đang xây dựng những kết nối thật sự có giá trị. Hành trình chưa cần hoàn hảo — điều quan trọng là bạn đang cố gắng mỗi ngày. 🌸
              </p>
            </div>
            <p className="font-bold text-sm text-[#3D3547]" style={{ fontFamily:"Nunito" }}>Gợi ý dành riêng cho bạn ✨</p>
            <div className="grid grid-cols-2 gap-3">
              {recs.map((r,i)=>(
                <motion.button key={r.title} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
                  whileHover={{ y:-4, boxShadow:`0 12px 28px ${r.accent}30` }} whileTap={{ scale:0.97 }}
                  onClick={() => fCtx.navigate(r.page)}
                  className="rounded-2xl p-4 text-left" style={{ background:r.color, border:`1.5px solid ${r.accent}33` }}>
                  <span className="text-2xl block mb-2">{r.icon}</span>
                  <p className="font-bold text-xs text-[#3D3547] mb-1" style={{ fontFamily:"Nunito" }}>{r.title}</p>
                  <p className="text-[10px] text-[#9490A4] leading-relaxed" style={{ fontFamily:"Be Vietnam Pro" }}>{r.desc}</p>
                </motion.button>
              ))}
            </div>
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} onClick={() => fCtx.navigate("family-challenges")}
              className="py-4 rounded-2xl font-black text-white text-base"
              style={{ background:"linear-gradient(135deg,#F5C842,#F5A87B)", fontFamily:"Nunito" }}>
              Bắt đầu kết nối ngay 🌻
            </motion.button>
          </motion.div>
        )}
        <div className="h-4" />
      </div>
    </PageShell>
  );
}
