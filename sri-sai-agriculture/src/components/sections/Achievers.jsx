import { useState, useEffect } from "react";
import axios from "axios";
import { GraduationCap, Stethoscope, Award } from "lucide-react";
import { achieverGroups as staticGroups } from "../../data/achievers";
import Reveal from "../ui/Reveal";
import SectionHeader from "../ui/SectionHeader";
import { getImageUrl } from "../../utils/imageUrl";

const groupIcons = {
  jee:  GraduationCap,
  neet: Stethoscope,
  intermediate: Award,
};

function AchieverCard({ item, color }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-2xl flex-shrink-0 mx-2"
      style={{ background: color.bg, border: `1px solid ${color.border}`, minWidth: 240 }}>
      {/* Avatar */}
      {item.image ? (
        <img 
          src={getImageUrl(item.image)} 
          alt={item.name} 
          className="w-14 h-14 rounded-full object-cover flex-shrink-0" 
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="w-14 h-14 rounded-full flex items-center justify-center
          font-lora font-bold text-[1rem] flex-shrink-0 text-white"
          style={{ background: "rgba(255,255,255,.12)", border: "1.5px solid rgba(255,255,255,.18)" }}>
          {item.initials}
        </div>
      )}
      <div className="min-w-0">
        <div className="font-bold text-[0.95rem] text-white truncate">{item.name}</div>
        <div className="text-[0.75rem] font-bold px-2 py-[2px] rounded mt-[4px] inline-block truncate"
          style={{ color: color.tag, background: color.tagBg }}>
          {item.place}
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({ group, reverse }) {
  const Icon = groupIcons[group.id] || Award;
  const items = [...(group.items || []), ...(group.items || []), ...(group.items || []), ...(group.items || [])];

  return (
    <div className="mb-6">
      {/* Row label */}
      <div className="flex items-center gap-2 mb-2 px-7">
        <Icon size={13} className="text-white/40 flex-shrink-0" />
        <span className="text-[0.68rem] font-bold text-white/40 uppercase tracking-[.1em]">
          {group.title}
        </span>
      </div>
      {/* Full-width track */}
      <div className="overflow-hidden marquee-track w-full">
        <div className={`flex ${reverse ? "marquee-right" : "marquee-left"}`}
          style={{ width: "max-content" }}>
          {items.map((item, i) => (
            <AchieverCard key={i} item={item} color={group.color} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Achievers() {
  const [groups, setGroups] = useState(staticGroups);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/stories`);
        
        if (res.data && res.data.length > 0) {
          // Dynamic group generation from scratch
          const dynamicGroupsSet = new Set(res.data.map(s => s.category));
          const newGroups = [];
          
          dynamicGroupsSet.forEach(catId => {
              newGroups.push({
                 id: catId,
                 title: `${catId.toUpperCase()} Results`,
                 color: { bg: "rgba(255,255,255,.07)", border: "rgba(255,255,255,.12)", tag: "#fff", tagBg: "rgba(255,255,255,.1)" },
                 items: res.data.filter(story => story.category === catId)
              });
          });
          setGroups(newGroups);
        } else {
          setGroups(staticGroups); // Only use fallbacks if DB is empty
        }
      } catch (err) {
        console.error("Error fetching stories:", err);
      }
    };
    fetchStories();
  }, []);

  return (
    <section id="achievers" className="py-[78px] bg-ink relative overflow-hidden ach-section-bg">
      <div className="max-w-site mx-auto px-7 relative">
        <Reveal className="mb-11">
          <SectionHeader
            label="④ Hall of Fame"
            title={`Top Ranking <em>Achievers</em>`}
            subtitle="Celebrating our toppers who secured admissions in India's most prestigious institutions over the years."
            light
          />
        </Reveal>
      </div>

      <div className="w-full">
        {groups.map((group, i) => (
          <MarqueeRow key={group.id || `gr-${i}`} group={group} reverse={i % 2 !== 0} />
        ))}
      </div>
    </section>
  );
}
