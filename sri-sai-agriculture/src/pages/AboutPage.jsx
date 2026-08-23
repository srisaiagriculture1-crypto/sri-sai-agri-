import React, { useEffect, useState } from "react";
import axios from "axios";
import PageHeader from "../components/ui/PageHeader";
import Reveal from "../components/ui/Reveal";
import Contact from "../components/sections/Contact";
import { getImageUrl } from "../utils/imageUrl";
import { Award, Briefcase, Sparkles } from "lucide-react";

const whyChooseUs = [
  { icon: "👨‍🏫", title: "Experienced & Dedicated Research Faculty", desc: "Our team of expert educators brings deep scientific knowledge and a passion for student research success." },
  { icon: "🔬", title: "Practical & Field-Based Learning", desc: "Hands-on biological experiments, field visits, and agricultural research projects are central to our curriculum." },
  { icon: "🏛️", title: "Modern Agriculture Lab Facilities", desc: "State-of-the-art laboratories equipped with the latest instruments for Agriculture, Biology, Chemistry, and Zoology." },
  { icon: "🎯", title: "Career-Oriented Professional Training", desc: "We bridge the gap between academic theory and agricultural industry with specialized internships and placement support." },
  { icon: "🤝", title: "Personalized Research Support", desc: "Small batch sizes ensure every student receives individual attention, research mentoring, and scientific guidance." },
];

const courses = [
  { code: "UG", name: "B.Sc Agriculture", duration: "4 Years", type: "Undergraduate" },
  { code: "PG", name: "M.Sc Agriculture", duration: "2 Years", type: "Postgraduate" },
  { code: "PG", name: "M.Sc Biology",     duration: "2 Years", type: "Postgraduate" },
  { code: "PG", name: "M.Sc Chemistry",   duration: "2 Years", type: "Postgraduate" },
  { code: "PG", name: "M.Sc Zoology",     duration: "2 Years", type: "Postgraduate" },
];

const defaultDirectors = [
  {
    id: "def-1",
    name: "Dr. K. S. Rao",
    position: "Chairman & Managing Director",
    image: "/gallery/1.png"
  },
  {
    id: "def-2",
    name: "Prof. M. Ramachandra Reddy",
    position: "Director - Academic Affairs & Research",
    image: "/gallery/2.png"
  },
  {
    id: "def-3",
    name: "Dr. V. Sudhakar",
    position: "Executive Director",
    image: "/gallery/3.png"
  }
];

export default function AboutPage() {
  const [directors, setDirectors] = useState([]);
  const [loadingDirectors, setLoadingDirectors] = useState(true);

  useEffect(() => { 
    window.scrollTo(0, 0); 
  }, []);

  useEffect(() => {
    const fetchDirectors = async () => {
      try {
        const res = await axios.get("/api/directors");
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setDirectors(res.data);
        } else if (res.data && Array.isArray(res.data) && res.data.length === 0) {
          // If database is empty, provide fallback
          setDirectors(defaultDirectors);
        } else {
          setDirectors(defaultDirectors);
        }
      } catch (err) {
        console.error("Failed to fetch directors, using fallback:", err);
        setDirectors(defaultDirectors);
      } finally {
        setLoadingDirectors(false);
      }
    };
    fetchDirectors();
  }, []);

  return (
    <div className="bg-cream min-h-screen">
      <PageHeader
        title="About Our Institute"
        subtitle="Empowering students with practical knowledge, research skills, and industry-focused agricultural education."
      />

      {/* ── Mission Statement ── */}
      <section className="py-20 bg-white">
        <div className="max-w-site mx-auto px-5 md:px-7">
          <Reveal className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[0.72rem] font-bold text-blue uppercase tracking-[.12em] mb-3 block">① Excellence in Agricultural Education</span>
            <h2 className="font-lora text-3xl md:text-5xl font-bold text-ink leading-[1.2] mb-6">
              Build Your Future with <em className="text-blue">Advanced Agriculture</em> &amp; Science Programs
            </h2>
            <div className="mt-5 px-6 py-4 bg-sky2 border-l-4 border-blue rounded-r-xl text-left">
              <p className="font-lora italic text-[1rem] md:text-[1.1rem] text-blue2 m-0 leading-[1.65]">
                "Empowering students with practical knowledge, research skills, and industry-focused education."
              </p>
            </div>
            <p className="text-ink/65 text-lg leading-relaxed mt-6">
              We offer comprehensive undergraduate and postgraduate programs designed to shape future scientists
              and agriculture professionals. Sri Sai Institute of Agriculture Sciences is a premier destination
              for higher scientific learning and research excellence.
            </p>
          </Reveal>

          {/* Stats row */}
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
              {[
                { num: "9+",  lbl: "Years of Excellence" },
                { num: "5",   lbl: "Specialized Programs" },
                { num: "100+", lbl: "Research Alumni" },
                { num: "3",   lbl: "Expert Faculty" },
              ].map((s, i) => (
                <div key={i} className="text-center p-6 rounded-2xl border border-[#e2e8f0] bg-cream hover:border-blue hover:shadow-md transition-all">
                  <div className="font-lora text-3xl font-bold text-blue">{s.num}</div>
                  <div className="text-xs font-bold text-ink/55 uppercase tracking-wider mt-2">{s.lbl}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Board of Directors Section ── */}
      <section className="py-24 bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9] border-t border-b border-gray-100 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#15803d]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-site mx-auto px-5 md:px-7 relative z-10">
          <Reveal className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue/10 border border-blue/20 text-blue text-xs font-bold uppercase tracking-widest mb-4">
              <Sparkles size={14} className="text-blue" />
              <span>Leadership &amp; Governance</span>
            </div>
            <h2 className="font-lora text-3xl md:text-5xl font-bold text-ink leading-[1.25] mb-4">
              Board of <em className="text-blue not-italic">Directors</em>
            </h2>
            <p className="text-ink/65 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              Visionary leaders and eminent personalities guiding Sri Sai Institute of Agriculture Sciences.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {directors.map((director, i) => {
              const initials = director.name
                ? director.name.split(" ").filter(Boolean).map(n => n[0]).join("").substring(0, 2).toUpperCase()
                : "BD";

              return (
                <Reveal key={director.id || i} delay={i * 0.1}>
                  <div className="group bg-white rounded-3xl p-6 md:p-8 border border-gray-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(19,71,160,0.12)] hover:border-blue/40 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden h-full">
                    {/* Top gradient highlight accent */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue via-[#15803d] to-blue group-hover:h-2.5 transition-all duration-300" />
                    
                    {/* Director Photo / Avatar */}
                    <div className="relative mb-6 pt-2">
                      <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-blue/10 to-[#15803d]/10 border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300 flex items-center justify-center">
                        {director.image ? (
                          <img
                            src={getImageUrl(director.image)}
                            alt={director.name}
                            className="w-full h-full object-cover object-top"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-lora text-3xl md:text-4xl font-black text-blue bg-blue/10">
                            {initials}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-[#15803d] text-white p-2 rounded-xl shadow-md border-2 border-white">
                        <Award size={16} />
                      </div>
                    </div>

                    {/* Director Name */}
                    <h3 className="font-lora text-xl md:text-2xl font-bold text-ink group-hover:text-blue transition-colors duration-200 leading-snug mb-3">
                      {director.name}
                    </h3>

                    {/* Position / Designation */}
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue/10 text-blue border border-blue/20 rounded-full text-xs font-bold uppercase tracking-wider">
                      <Briefcase size={13} className="shrink-0 text-blue" />
                      <span>{director.position}</span>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="py-20 bg-cream">
        <div className="max-w-site mx-auto px-5 md:px-7">
          <Reveal className="text-center max-w-xl mx-auto mb-14">
            <span className="text-[0.72rem] font-bold text-blue uppercase tracking-[.12em] mb-3 block">② Why Choose Our Institute</span>
            <h2 className="font-lora text-3xl md:text-4xl font-bold text-ink">
              What Makes <em className="text-blue">Sri Sai Agri</em> Different
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyChooseUs.map((item, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="bg-white border border-[#e2e8f0] rounded-2xl p-7 hover:border-blue hover:shadow-lg transition-all duration-200 h-full">
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <h3 className="font-bold text-ink text-[1rem] mb-2">{item.title}</h3>
                  <p className="text-ink/60 text-[0.88rem] leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Courses Offered ── */}
      <section className="py-20 bg-[#0b1220] text-white">
        <div className="max-w-site mx-auto px-5 md:px-7">
          <Reveal className="text-center max-w-xl mx-auto mb-14">
            <span className="text-[0.72rem] font-bold text-[#93c5fd] uppercase tracking-[.12em] mb-3 block">③ Academic Programs</span>
            <h2 className="font-lora text-3xl md:text-4xl font-bold text-white">
              Degrees <em className="text-[#fde68a]">Offered</em>
            </h2>
            <p className="text-white/55 mt-4 text-[0.92rem] leading-relaxed">
              Our professional programs are designed to give students a competitive edge in Agriculture and Life Sciences.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((c, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="rounded-2xl p-6 border border-white/10 hover:border-[#fde68a]/50 hover:bg-white/5 transition-all duration-200"
                  style={{ background: "rgba(255,255,255,.05)" }}>
                  <span className={`text-[0.62rem] font-black uppercase tracking-[.12em] px-3 py-1 rounded-full mb-4 inline-block
                    ${c.code === "UG" ? "bg-blue/20 text-[#93c5fd]" : "bg-[#fde68a]/15 text-[#fde68a]"}`}>
                    {c.type}
                  </span>
                  <h3 className="font-lora font-bold text-xl text-white mt-2 mb-1">{c.name}</h3>
                  <p className="text-white/45 text-[0.8rem]">Duration: {c.duration}</p>
                  <div className="mt-5 pt-4 border-t border-white/10">
                    <a href="#contact" className="text-[0.8rem] font-bold text-blue hover:text-[#93c5fd] transition-colors">
                      Enquire Now →
                    </a>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Contact />
    </div>
  );
}
