import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { siteConfig } from "../../data/siteConfig";

function PhoneIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07
        8.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72 19.79 19.79 0 00.7
        2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 19.79
        19.79 0 002.81.7A2 2 0 0122 14.92z" />
    </svg>
  );
}

function ChevronDown({ open }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function NavLink({ href, children, onClick }) {
  if (href.startsWith("#")) {
    return (
      <a href={`/${href}`} onClick={onClick}
        className="flex items-center gap-1 text-[0.83rem] font-medium text-[#374151] no-underline
          px-[13px] py-2 rounded-lg transition-all duration-[180ms]
          hover:bg-sky hover:text-blue whitespace-nowrap">
        {children}
      </a>
    );
  }
  return (
    <Link to={href} onClick={onClick}
      className="flex items-center gap-1 text-[0.83rem] font-medium text-[#374151] no-underline
        px-[13px] py-2 rounded-lg transition-all duration-[180ms]
        hover:bg-sky hover:text-blue whitespace-nowrap">
      {children}
    </Link>
  );
}

function NavDropdown({ label, href, items, onClose }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handler(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1 text-[0.83rem] font-medium text-[#374151]
          px-[13px] py-2 rounded-lg transition-all duration-[180ms] bg-transparent border-none
          cursor-pointer hover:bg-sky hover:text-blue whitespace-nowrap font-sora">
        {label} <ChevronDown open={open} />
      </button>
      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 bg-white border border-[#e2e8f0]
          rounded-xl p-[6px] min-w-[210px] shadow-[0_16px_48px_rgba(0,0,0,.11)] z-[300]">
          {items.map((item, i) => (
            <div key={i}>
              {item.divider
                ? <div className="h-px bg-[#e2e8f0] my-1" />
                : (item.href && item.href.startsWith("#")) ? 
                  <a href={`/${item.href}`}
                    onClick={() => { setOpen(false); onClose?.(); }}
                    className="block px-[13px] py-[9px] rounded-lg text-[0.81rem] font-medium
                      text-[#374151] no-underline transition-all duration-150
                      hover:bg-sky hover:text-blue focus:outline-none focus:bg-sky focus:text-blue">
                    {item.label}
                  </a>
                  :
                  <Link to={item.href || href}
                    onClick={() => { setOpen(false); onClose?.(); }}
                    className="block px-[13px] py-[9px] rounded-lg text-[0.81rem] font-medium
                      text-[#374151] no-underline transition-all duration-150
                      hover:bg-sky hover:text-blue focus:outline-none focus:bg-sky focus:text-blue">
                    {item.label}
                  </Link>
              }
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { type: "link", label: "Home",    href: "/" },
    { type: "link", label: "About",   href: "/about" },
    {
      type: "dropdown", label: "Programs", href: "/about",
      items: [
        { label: "B.Sc Agriculture",  href: "/about" },
        { divider: true },
        { label: "M.Sc Agriculture",  href: "/about" },
        { label: "M.Sc Biology",      href: "/about" },
        { label: "M.Sc Chemistry",    href: "/about" },
        { label: "M.Sc Zoology",      href: "/about" },
      ],
    },
    { type: "link", label: "Faculty",  href: "/faculty" },
    { type: "link", label: "Results",  href: "/results" },
    {
      type: "dropdown", label: "Activities", href: "/activities",
      items: [
        { label: "Internship",  href: "/activities#internship" },
        { label: "Field Visit",  href: "/activities#field-visit" },
        { label: "Events",      href: "/activities#events" },
        { label: "Trip Photos", href: "/activities#trip-photos" },
      ],
    },
    { type: "link", label: "Hostel",   href: "/hostel" },
  ];

  return (
    <header className="bg-white border-b border-[#e2e8f0] sticky top-0 z-[200]
      shadow-[0_2px_12px_rgba(0,0,0,.07)]">
      <div className="max-w-site mx-auto px-7 flex items-center justify-between h-[80px] md:h-[90px] gap-5">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 md:gap-3 no-underline flex-shrink-0 max-w-[70%] sm:max-w-none group">
          <div className="flex items-center gap-3 flex-shrink-0">
             <img 
               src="/logo.png" 
               alt="Sri Sai Agri Institute Logo" 
               className="h-[48px] md:h-[58px] w-auto transition-transform duration-300 group-hover:scale-105"
             />
            <div className="flex flex-col leading-tight">
              <span className="font-lora text-[0.85rem] xs:text-[1rem] md:text-[1.2rem] font-bold text-blue tracking-tight uppercase">Sri Sai Institute</span>
              <span className="text-[0.5rem] xs:text-[0.6rem] md:text-[0.65rem] font-black text-[#94a3b8] tracking-[0.14em] -mt-0.5 uppercase">Of Agriculture Sciences</span>
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-[2px]">
          {navItems.map((item, i) =>
            item.type === "dropdown"
              ? <NavDropdown key={i} label={item.label} href={item.href} items={item.items} />
              : <NavLink key={i} href={item.href}>{item.label}</NavLink>
          )}

          <a href={`tel:${siteConfig.phones[0]}`}
            className="flex items-center gap-[6px] border-[1.5px] border-[#e2e8f0] text-ink
              px-[14px] py-[9px] rounded-lg font-semibold text-[0.81rem] no-underline
              transition-all duration-200 whitespace-nowrap
              hover:border-blue hover:text-blue hover:bg-sky">
            <PhoneIcon /> Call Us
          </a>

          <Link to="/portal/register"
            className="flex items-center gap-2 border-[1.5px] border-orange/20 text-orange
              px-[14px] py-[9px] rounded-lg font-bold text-[0.81rem] no-underline
              transition-all duration-200 whitespace-nowrap bg-orange/5
              hover:bg-orange hover:text-white hover:border-orange">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
               <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
               <circle cx="8.5" cy="7" r="4"></circle>
               <line x1="20" y1="8" x2="20" y2="14"></line>
               <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            Register
          </Link>

          <Link to="/portal/login"
            className="flex items-center gap-2 border-[1.5px] border-blue/20 text-blue
              px-[14px] py-[9px] rounded-lg font-bold text-[0.81rem] no-underline
              transition-all duration-200 whitespace-nowrap bg-sky/30
              hover:bg-blue hover:text-white hover:border-blue">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Student Portal
          </Link>

          <a href="#contact"
            className="bg-orange text-white px-5 py-[10px] rounded-lg font-bold text-[0.83rem]
              no-underline shadow-[0_4px_12px_rgba(224,92,26,.28)] transition-all duration-200
              whitespace-nowrap hover:bg-[#c94f14] hover:-translate-y-[1px]
              hover:shadow-[0_6px_18px_rgba(224,92,26,.38)]">
            Admission Enquiry
          </a>
        </nav>

        {/* Mobile: CTA + Hamburger */}
        <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
          <Link to="/portal/login"
            className="flex items-center gap-1.5 border-[1.5px] border-blue/30 text-blue
              px-2.5 py-[6px] sm:px-3 sm:py-[7px] rounded-lg font-bold text-[0.75rem] sm:text-[0.8rem]
              no-underline bg-sky/30 hover:bg-blue hover:text-white transition-colors whitespace-nowrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Portal</span>
          </Link>

          <a href="#contact"
            className="hidden sm:inline-block bg-orange text-white px-3 sm:px-4 py-[7px] sm:py-[9px] rounded-lg font-bold text-[0.78rem] sm:text-[0.8rem]
              no-underline whitespace-nowrap">
            Enquire
          </a>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="w-[36px] h-[36px] md:w-[40px] md:h-[40px] flex flex-col items-center justify-center gap-[4px] md:gap-[5px]
              bg-transparent border-none cursor-pointer rounded-lg hover:bg-sky transition-colors">
            <span className={`block w-5 h-[2px] bg-ink rounded transition-all duration-200
              ${menuOpen ? "rotate-45 translate-y-[6px] md:translate-y-[7px]" : ""}`} />
            <span className={`block w-3 h-[2px] bg-ink rounded transition-all duration-200
              ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-[2px] bg-ink rounded transition-all duration-200
              ${menuOpen ? "-rotate-45 -translate-y-[6px] md:translate-y-[7px]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-[#e2e8f0] px-5 py-4 flex flex-col gap-1
          shadow-[0_8px_24px_rgba(0,0,0,.08)]">
          {navItems.map((item, i) =>
            item.type === "dropdown"
              ? (
                <MobileDropdown key={i} label={item.label} href={item.href} items={item.items}
                  onClose={() => setMenuOpen(false)} />
              )
              : (
                <Link key={i} to={item.href} onClick={() => setMenuOpen(false)}
                  className="px-3 py-[10px] text-[0.88rem] font-medium text-ink no-underline
                    rounded-lg hover:bg-sky hover:text-blue transition-colors">
                  {item.label}
                </Link>
              )
          )}
          <div className="border-t border-[#e2e8f0] mt-2 pt-3 flex flex-col gap-2">
            <Link to="/portal/login" onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 bg-blue text-white px-4 py-[11px] rounded-lg font-bold text-[0.88rem] no-underline shadow-[0_2px_8px_rgba(26,86,219,.25)] hover:bg-blue2 transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Student Portal Login
            </Link>

            <Link to="/portal/register" onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 border-[1.5px] border-orange/40 text-orange bg-orange/5 px-4 py-[10px] rounded-lg font-bold text-[0.88rem] no-underline hover:bg-orange hover:text-white transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                 <circle cx="8.5" cy="7" r="4"></circle>
                 <line x1="20" y1="8" x2="20" y2="14"></line>
                 <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
              Student Register
            </Link>

            <a href={`tel:${siteConfig.phones[0]}`}
              className="flex items-center gap-2 px-3 py-[10px] text-[0.88rem] font-semibold
                text-ink no-underline rounded-lg border border-[#e2e8f0] hover:border-blue
                hover:text-blue hover:bg-sky transition-colors">
              <PhoneIcon /> {siteConfig.phones[0]}
            </a>
            <a href="/#contact" onClick={() => setMenuOpen(false)}
              className="bg-orange text-white px-4 py-[11px] rounded-lg font-bold text-[0.88rem]
                no-underline text-center">
              Admission Enquiry
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileDropdown({ label, href, items, onClose }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-[10px] text-[0.88rem]
          font-medium text-ink rounded-lg hover:bg-sky hover:text-blue transition-colors
          bg-transparent border-none cursor-pointer font-sora text-left">
        {label}
        <ChevronDown open={open} />
      </button>
      {open && (
        <div className="ml-3 flex flex-col gap-[2px] mb-1">
          {items.filter((it) => !it.divider).map((item, i) => (
            <Link key={i} to={item.href || href} onClick={onClose}
              className="px-3 py-[8px] text-[0.83rem] text-muted no-underline rounded-lg
                hover:bg-sky hover:text-blue transition-colors">
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
