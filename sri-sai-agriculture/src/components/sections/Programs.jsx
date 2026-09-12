import { useState, useEffect } from "react";
import axios from "axios";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import Reveal from "../ui/Reveal";
import SectionHeader from "../ui/SectionHeader";
import { scrollToContact } from "../../utils/scroll";

const API_URL = '';

// Head gradients mapped by head_class or stream
const headGradients = {
  "bsc-agri":    "linear-gradient(130deg,#041a0e,#15803d)",
  "msc-agri":    "linear-gradient(130deg,#041a0e,#065f46)",
  "msc-sciences":"linear-gradient(130deg,#0b1220,#15803d)",
  "Undergraduate":"linear-gradient(130deg,#041a0e,#15803d)",
  "Postgraduate": "linear-gradient(130deg,#041a0e,#065f46)",
};

const eligStyle = { bg: "#f0fdf4", border: "#15803d", text: "#15803d" };

function ProgramCard({ p, delay = 0 }) {
  const gradient = headGradients[p.head_class] || headGradients[p.stream] || headGradients["Undergraduate"];

  // details can be JSON string or array
  let detailList = [];
  try {
    detailList = typeof p.details === 'string' ? JSON.parse(p.details || '[]') : (p.details || p.exams || []);
  } catch { detailList = []; }

  return (
    <Reveal delay={delay} className="h-full">
      <div className="border-[1.5px] border-[#e2e8f0] rounded-2xl overflow-hidden bg-white h-full flex flex-col
        transition-all duration-[250ms] hover:-translate-y-[5px]
        hover:shadow-[0_18px_48px_rgba(0,0,0,.10)] hover:border-transparent min-h-[380px]">

        {/* Card Header */}
        <div className="px-8 pt-10 pb-8 relative overflow-hidden" style={{ background: gradient, minHeight: 160 }}>
          <div className="absolute top-2 right-4 font-lora text-[5rem] font-black text-white/[.07] leading-none select-none">
            {p.stream}
          </div>
          <span className="inline-block text-[0.7rem] font-bold tracking-[.09em] uppercase px-[12px] py-[5px] rounded-full mb-[14px]"
            style={{ background: "rgba(52,211,153,.2)", color: "#34d399" }}>
            {p.badge || p.stream}
          </span>
          <h3 className="font-lora text-[1.5rem] text-white mb-[8px] relative font-bold"
            dangerouslySetInnerHTML={{ __html: (p.title || "").replace("&", "&amp;") }} />
          <p className="text-[0.85rem] text-white/55 leading-[1.6] relative">{p.desc || p.description}</p>
        </div>

        {/* Card Body */}
        <div className="px-8 pt-6 pb-8 flex flex-col flex-1">
          {detailList.length > 0 && (
            <div className="grid grid-cols-3 gap-x-3 gap-y-3 mb-5 flex-1">
              {detailList.map((e, i) => (
                <div key={i} className="flex flex-col items-center justify-center text-center bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl px-2 py-3">
                  <span className="w-2 h-2 rounded-full bg-[#15803d] mb-2 flex-shrink-0" />
                  <span className="text-[0.72rem] font-bold text-[#15803d] leading-[1.35]">
                    {typeof e === 'string' ? e : `${e.label}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {(p.eligibility) && (
            <div className="px-[13px] py-[11px] rounded-lg text-[0.77rem] font-semibold border-l-[3px] mb-3"
              style={{ background: eligStyle.bg, borderColor: eligStyle.border, color: eligStyle.text }}>
              Eligibility: {p.eligibility}
            </div>
          )}

          <div className="flex items-center justify-between mt-[14px] pt-[14px] border-t border-[#e2e8f0]">
            <a href="#contact"
              onClick={scrollToContact}
              className="text-[0.8rem] font-bold no-underline flex items-center gap-1 transition-all duration-200 hover:gap-2 cursor-pointer"
              style={{ color: "#15803d" }}>
              Enquire for {p.stream} →
            </a>
            {(p.seats_label || p.seatsLabel) && (
              <span className="text-[0.72rem] font-bold text-orange bg-[#fff7ed] px-[9px] py-1 rounded-md border border-[#fed7aa]">
                {p.seats_label || p.seatsLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export default function Programs() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  useScrollReveal(["all"]);

  useEffect(() => {
    axios.get(`${API_URL}/api/courses`)
      .then(res => {
        setPrograms(Array.isArray(res.data) ? res.data : []);
      })
      .catch(err => {
        console.error("Error fetching courses:", err);
        setPrograms([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="programs" className="py-[60px] md:py-[78px] bg-cream overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">
            <SectionHeader label="Academic Programs" title='Our Agriculture &amp; <em>Science Degrees</em>' />
            <p className="text-[0.85rem] md:text-[0.9rem] text-muted leading-[1.75] lg:max-w-[400px] lg:text-right">
              Explore our comprehensive range of B.Sc and M.Sc programs designed for the future of agriculture.
            </p>
          </div>
        </Reveal>

        {loading ? (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[420px] bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {programs.map((p, i) => (
              <ProgramCard key={p.id || p._id || i} p={p} delay={i * 0.1} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
