import Reveal from "../ui/Reveal";
import { siteConfig } from "../../data/siteConfig";
import { scrollToContact } from "../../utils/scroll";

export default function CTABand() {
  return (
    <div className="py-[52px] md:py-[66px] relative overflow-hidden"
      style={{ background: "linear-gradient(130deg,#15803d 0%,#0b1220 100%)" }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 55% 80% at 80% 50%,rgba(255,255,255,.05) 0%,transparent 60%)" }} />

      <div className="max-w-site mx-auto px-5 md:px-7 flex flex-col md:flex-row items-start md:items-center
        justify-between gap-7 md:gap-9 relative">
        <Reveal>
          <h2 className="font-lora text-[1.6rem] md:text-[1.9rem] font-bold text-white mb-[10px]">
            Admissions are Open.<br />Make It Happen.
          </h2>
          <p className="text-[0.88rem] md:text-[0.9rem] text-white/60 leading-[1.7] max-w-[500px]">
            Seats are limited to 40 per batch. Once full, no new students are admitted for the
            academic year. Step into Sri Sai Institute — and reach the professional scientific destination you've been working towards.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="flex gap-3 flex-wrap flex-shrink-0">
            <a href="#contact"
              onClick={scrollToContact}
              className="inline-flex items-center gap-2 bg-orange text-white px-[22px] md:px-[26px]
                py-[12px] md:py-[14px] rounded-[10px] font-bold text-[0.88rem] md:text-[0.9rem]
                no-underline transition-all duration-200 shadow-[0_6px_18px_rgba(224,92,26,.38)]
                hover:bg-[#c94f14] hover:-translate-y-[2px] cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Apply Now
            </a>
            <a href={`tel:${siteConfig.phones[0]}`}
              className="inline-flex items-center gap-2 border-2 border-white/30 text-white
                px-[20px] md:px-[24px] py-[11px] md:py-[13px] rounded-[10px] font-semibold
                text-[0.88rem] md:text-[0.9rem] no-underline transition-all duration-200
                hover:border-white hover:bg-white/[.07]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72 19.79 19.79 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 19.79 19.79 0 002.81.7A2 2 0 0122 14.92z" />
              </svg>
              Call Us: {siteConfig.phones[0]}
            </a>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
