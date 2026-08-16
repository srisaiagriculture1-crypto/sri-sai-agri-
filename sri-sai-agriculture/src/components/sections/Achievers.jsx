import { useState, useEffect } from "react";
import axios from "axios";
import { achieverGroups as staticGroups } from "../../data/achievers";
import Reveal from "../ui/Reveal";
import SectionHeader from "../ui/SectionHeader";
import { getImageUrl } from "../../utils/imageUrl";

const fallbackItems = staticGroups.flatMap(g => g.items.map(item => ({
  ...item,
  category: g.title
})));

function AchieverCard({ item }) {
  const initials = item.initials || (item.name ? item.name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AG');

  return (
    <div 
      className="flex items-center gap-4 px-6 py-5 rounded-2xl flex-shrink-0 mx-3 bg-white/[0.08] hover:bg-white/[0.13] border border-white/15 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1"
      style={{ minWidth: 300, maxWidth: 380 }}
    >
      {/* Avatar */}
      <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-white/10 border-2 border-white/20 shadow-inner flex items-center justify-center relative">
        {item.image ? (
          <img 
            src={getImageUrl(item.image)} 
            alt={item.name || item.student_name || item.studentName} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center font-lora font-bold text-[1.15rem] text-white -z-0">
          {initials}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-bold text-[1.05rem] text-white truncate group-hover:text-emerald-300 transition-colors">
          {item.name || item.student_name || item.studentName}
        </div>
        <div className="text-[0.78rem] font-bold px-3 py-1 rounded-lg mt-1.5 inline-block truncate bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 shadow-sm">
          {item.place || item.achievement || item.category || 'Agricultural Scholar'}
        </div>
      </div>
    </div>
  );
}

function StreamRow({ items, reverse }) {
  // Ensure enough items to smoothly loop continuously across any screen size
  let streamItems = items;
  while (streamItems.length < 10 && streamItems.length > 0) {
    streamItems = [...streamItems, ...items];
  }
  const duplicated = [...streamItems, ...streamItems];

  return (
    <div className="overflow-hidden marquee-track w-full py-2">
      <div 
        className={`flex ${reverse ? "marquee-right" : "marquee-left"}`}
        style={{ width: "max-content" }}
      >
        {duplicated.map((item, i) => (
          <AchieverCard key={`${item.id || item.name || 'item'}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function Achievers() {
  const [stories, setStories] = useState(fallbackItems);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await axios.get("/api/stories");
        if (res.data && res.data.length > 0) {
          setStories(res.data);
        } else {
          setStories(fallbackItems);
        }
      } catch (err) {
        console.error("Error fetching stories:", err);
      }
    };
    fetchStories();
  }, []);

  // Split all stories evenly into exactly 2 horizontal streaming rows
  const row1 = stories.filter((_, i) => i % 2 === 0);
  const row2 = stories.filter((_, i) => i % 2 !== 0);

  return (
    <section id="achievers" className="py-[78px] bg-ink relative overflow-hidden ach-section-bg">
      <div className="max-w-site mx-auto px-7 relative">
        <Reveal className="mb-12">
          <SectionHeader
            label="④ Hall of Fame"
            title={`Top Ranking <em>Achievers</em>`}
            subtitle="Celebrating our toppers who secured admissions and career milestones across agricultural sciences."
            light
          />
        </Reveal>
      </div>

      <div className="w-full space-y-4">
        <StreamRow items={row1.length > 0 ? row1 : fallbackItems} reverse={false} />
        <StreamRow items={row2.length > 0 ? row2 : (row1.length > 0 ? row1 : fallbackItems)} reverse={true} />
      </div>
    </section>
  );
}
