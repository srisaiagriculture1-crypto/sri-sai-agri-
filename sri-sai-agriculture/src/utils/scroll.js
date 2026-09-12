/**
 * Utility to reliably scroll directly to the Admission Enquiry Form across all devices and pages
 */
export function scrollToContact(e) {
  if (e && typeof e.preventDefault === "function") {
    e.preventDefault();
  }

  const isHome = window.location.pathname === "/" || window.location.pathname === "";

  if (!isHome) {
    window.location.href = "/#enquiry";
    return;
  }

  // Target the Admission Enquiry Form directly first, then fall back to contact section
  const el = document.getElementById("enquiry") || document.getElementById("contact");
  if (el) {
    const yOffset = -90; // Account for sticky header
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
    try {
      window.history.pushState(null, "", "#enquiry");
    } catch (err) {}

    // Focus the first input field in the Admission Enquiry Form for immediate typing
    setTimeout(() => {
      const firstInput = el.querySelector("input");
      if (firstInput) {
        firstInput.focus({ preventScroll: true });
      }
    }, 450);
  } else {
    window.location.href = "/#enquiry";
  }
}
