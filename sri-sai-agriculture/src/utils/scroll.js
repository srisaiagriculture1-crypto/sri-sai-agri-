/**
 * Utility to reliably scroll to the Contact / Enquiry form across all devices and pages
 */
export function scrollToContact(e) {
  if (e && typeof e.preventDefault === "function") {
    e.preventDefault();
  }

  const isHome = window.location.pathname === "/" || window.location.pathname === "";

  if (!isHome) {
    window.location.href = "/#contact";
    return;
  }

  const el = document.getElementById("contact");
  if (el) {
    const yOffset = -80; // Account for sticky header
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
    try {
      window.history.pushState(null, "", "#contact");
    } catch (err) {}
  } else {
    window.location.href = "/#contact";
  }
}
