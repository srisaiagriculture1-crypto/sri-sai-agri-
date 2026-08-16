import { useState, useEffect } from "react";
import axios from "axios";
import { useSlider } from "../../hooks/useSlider";
import { getImageUrl } from "../../utils/imageUrl";

const FALLBACK_SLIDES = [
  {
    bg: "linear-gradient(115deg,#071428 0%,#065f46 45%,#15803d 100%)",
    img: "/internship-photos/intern-1.png",
    tag: "🎓 Admissions Open 2026–27",
    h1: ['Welcome to <em class="italic text-[#fde68a]">Sri Sai Institute</em>', "of Agriculture", "Sciences."],
    motto: '"Empowering the Future of Agriculture through Excellence."',
    desc: "Offering professional B.Sc and M.Sc programs in Agriculture and Core Sciences. A premier destination for agricultural research and higher scientific learning.",
    btn1: { label: "Apply for Admissions →", href: "#contact" },
    btn2: { label: "Explore Our Programs", href: "/about" },
    stats: [
      { num: "9+",  lbl: "Years of Excellence" },
      { num: "5",   lbl: "Specialized Programs" },
      { num: "B.Sc", lbl: "Agriculture", yellow: true },
      { num: "M.Sc", lbl: "Research Degrees", yellow: true },
    ],
  },
  {
    bg: "linear-gradient(115deg,#064e3b 0%,#065f46 45%,#047857 100%)",
    img: "/field-visit-media/field-1.png",
    tag: "Limited Intake – Register Today",
    h1: ["Build Your Career in", '<em class="italic text-[#fde68a]">Modern Agriculture</em>', "& Science Research."],
    motto: '"Practical knowledge and industry-focused professional education for tomorrow\'s scientists."',
    desc: "Our comprehensive curriculum is designed to shape future agriculture professionals with hands-on field research, modern labs, and expert faculty guidance.",
    btn1: { label: "Enquire Now →", href: "#contact" },
    btn2: { label: "About Our Institute", href: "/about" },
    stats: [
      { num: "3",   lbl: "Core Research Faculty" },
      { num: "100+", lbl: "Research Alumni" },
      { num: "UG",  lbl: "B.Sc Degree", yellow: true },
      { num: "PG",  lbl: "M.Sc Programs", yellow: true },
    ],
  },
];


export default function HeroSlider() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await axios.get("/api/hero");
        if (res.data && res.data.length > 0) {
          const mapped = res.data.map(s => {
            let h1Array = [];
            try {
              h1Array = typeof s.h1 === 'string' && s.h1.startsWith('[') ? JSON.parse(s.h1) : [s.h1];
            } catch (e) {
              h1Array = [s.h1];
            }

            return {
              tag: s.tag,
              h1: h1Array,
              motto: s.motto,
              desc: s.description,
              img: s.image ? getImageUrl(s.image) : "/internship-photos/intern-1.png",
              bg: s.bg_gradient || "linear-gradient(115deg,#071428 0%,#065f46 45%,#15803d 100%)",
              btn1: s.btn1_label ? { label: s.btn1_label, href: s.btn1_href || "#" } : null,
              btn2: s.btn2_label ? { label: s.btn2_label, href: s.btn2_href || "#" } : null,
              stats: Array.isArray(s.stats) ? s.stats : []
            };
          });
          setSlides(mapped);
        } else {
          setSlides(FALLBACK_SLIDES);
        }
      } catch (err) {
        console.error("Hero fetch error:", err);
        setSlides(FALLBACK_SLIDES);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  const slider = useSlider(slides.length || 1);
  const current = slider.current;
  const goTo = slider.goTo;
  const prev = slider.prev;
  const next = slider.next;

  if (loading && slides.length === 0) {
    return <div className="w-full bg-ink" style={{ height: "88vh" }} />;
  }

  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: "88vh" }}>
      {slides.map((s, i) => (
        <div key={i}
          className="absolute inset-0 w-full transition-opacity duration-[800ms] ease-in-out flex items-center"
          style={{
            opacity: i === current ? 1 : 0,
            zIndex: i === current ? 1 : 0,
            pointerEvents: i === current ? "all" : "none",
          }}>

          {/* BG */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {s.img && (
              <img 
                src={s.img} 
                className="w-full h-full object-cover" 
                alt="" 
                onError={(e) => { e.target.style.display = 'none'; }} 
              />
            )}
            <div className="absolute inset-0 hero-bg-pattern opacity-60" style={{ background: s.bg }} />
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* Content */}
          <div className="relative z-[2] w-full max-w-site mx-auto px-5 md:px-7
            grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-12 items-center
            pt-16 pb-16 lg:pt-0 lg:pb-0">

            <div className="w-full">
              {/* Tag */}
              <div className="inline-flex items-center bg-white/[.12] border border-white/[.22]
                text-white/90 text-[0.62rem] md:text-[0.7rem] font-bold tracking-[.08em] uppercase
                px-3 py-[5px] rounded-full mb-4 leading-tight">
                {s.tag}
              </div>

              {/* Heading */}
              <h1 className="font-lora font-bold text-white leading-[1.2] mb-3"
                style={{ fontSize: "clamp(1.6rem,6vw,3.4rem)" }}>
                {s.h1.map((line, li) => (
                  <span key={li}>
                    <span dangerouslySetInnerHTML={{ __html: line }} />
                    {li < s.h1.length - 1 && <br />}
                  </span>
                ))}
              </h1>

              {/* Motto */}
              <div className="font-lora italic text-[0.9rem] md:text-[1.05rem] text-white/70
                border-l-[3px] border-[rgba(253,230,138,.6)] pl-4 mb-4 leading-[1.6]">
                {s.motto}
              </div>

              {/* Desc */}
              <p className="text-[0.85rem] md:text-[0.93rem] text-white/65 leading-[1.75] mb-6 max-w-[520px]">
                {s.desc}
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {s.btn1 && (
                  <a href={s.btn1.href}
                    className="inline-flex items-center justify-center gap-2 bg-white text-ink
                      px-5 py-3 rounded-[9px] font-bold text-[0.85rem] no-underline
                      transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,.14)]
                      hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,.20)]">
                    {s.btn1.label}
                  </a>
                )}
                {s.btn2 && (
                  <a href={s.btn2.href}
                    className="inline-flex items-center justify-center gap-2 border-2 border-white/30
                    text-white px-5 py-3 rounded-[9px] font-semibold text-[0.85rem] no-underline
                    transition-all duration-200 hover:border-white hover:bg-white/[.08]">
                    {s.btn2.label}
                  </a>
                )}
              </div>
            </div>

            {/* Stat card — desktop only */}
            {s.stats && s.stats.length > 0 && (
              <div className="hidden lg:grid rounded-[18px] p-7 grid-cols-2 gap-4"
                style={{
                  background: "rgba(255,255,255,.09)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,.18)",
                }}>
                {s.stats.map((st, si) => (
                  <div key={si} className="text-center px-[10px] py-4 rounded-xl"
                    style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.08)" }}>
                    <span className={`font-lora text-[1.8rem] font-bold block leading-none
                      ${st.yellow ? "text-[#fde68a]" : st.green ? "text-[#6ee7b7]" : "text-white"}`}>
                      {st.num}
                    </span>
                    <span className="text-[0.68rem] text-white/55 uppercase tracking-[.07em] mt-[5px] block">
                      {st.lbl}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Arrows — pushed below content on mobile */}
      {slides.length > 1 && (
        <>
          <button onClick={prev}
            className="absolute left-3 bottom-16 md:bottom-auto md:top-1/2 md:-translate-y-1/2
              w-[36px] h-[36px] md:w-[42px] md:h-[42px] rounded-full flex items-center justify-center
              z-10 text-white transition-all duration-200 hover:bg-white/[.22]"
            style={{ background: "rgba(255,255,255,.13)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.18)" }}>
            ←
          </button>
          <button onClick={next}
            className="absolute right-3 bottom-16 md:bottom-auto md:top-1/2 md:-translate-y-1/2
              w-[36px] h-[36px] md:w-[42px] md:h-[42px] rounded-full flex items-center justify-center
              z-10 text-white transition-all duration-200 hover:bg-white/[.22]"
            style={{ background: "rgba(255,255,255,.13)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.18)" }}>
            →
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className="h-2 rounded-[4px] border-none cursor-pointer transition-all duration-300"
              style={{
                width: i === current ? 26 : 8,
                background: i === current ? "#fff" : "rgba(255,255,255,.35)",
              }} />
          ))}
        </div>
      )}
    </div>
  );
}

