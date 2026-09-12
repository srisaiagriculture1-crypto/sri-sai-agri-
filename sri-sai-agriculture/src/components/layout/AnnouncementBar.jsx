
import { scrollToContact } from "../../utils/scroll";

export default function AnnouncementBar() {
  return (
    <div className="ann-stripe relative bg-red-600 text-white text-center py-2 px-3 sm:px-6 text-[0.72rem] sm:text-[0.78rem] font-medium
      flex flex-wrap items-center justify-center gap-1.5 sm:gap-4 overflow-hidden w-full max-w-full">
      <span className="live-dot inline-flex items-center gap-1.5 bg-white/15 border border-white/30
        px-2.5 py-[2px] sm:px-3 sm:py-[3px] rounded-full text-[0.65rem] sm:text-[0.7rem] font-bold tracking-[.05em] sm:tracking-[.07em] uppercase whitespace-nowrap flex-shrink-0">
        🎓 Admissions Open 2026–27
      </span>
      <a
        href="#enquiry"
        onClick={scrollToContact}
        className="flex items-center gap-1.5 flex-wrap justify-center text-center text-white no-underline group cursor-pointer"
      >
        <span>Limited Seats Available&nbsp;–</span>
        <span className="text-[#fde68a] group-hover:text-white font-bold underline text-[0.72rem] sm:text-[0.78rem] inline-flex items-center transition-colors">
          Enquire Now →
        </span>
      </a>
    </div>
  );
}
