import { useState } from "react";
import axios from "axios";

import { MapPin, Phone, Mail, Landmark, Target, Clock } from "lucide-react";
import { siteConfig } from "../../data/siteConfig";
import Reveal from "../ui/Reveal";
import SectionHeader from "../ui/SectionHeader";

const contactItems = [
  { Icon: MapPin,   label: "Address",                     val: siteConfig.address },
  { Icon: Phone,    label: "Contact Numbers",              val: siteConfig.phonesDisplay, href: `tel:${siteConfig.phones[0]}` },
  { Icon: Mail,     label: "Email",                        val: siteConfig.email, href: `mailto:${siteConfig.email}` },
  { Icon: Landmark, label: "Accreditation & College Code", val: `${siteConfig.accreditation}\nCollege Code: ${siteConfig.collegeCode}` },
  { Icon: Target,   label: "Admissions Status",            val: siteConfig.admissionsStatus, highlight: true },
  { Icon: Clock,    label: "Office Hours",                 val: `${siteConfig.officeHours}\nSunday: By appointment` },
];

const initialForm = { studentName: "", parentName: "", mobile: "", email: "", stream: "", batch: "", message: "" };

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.studentName.trim()) e.studentName = "Student name is required.";
    if (!form.parentName.trim())  e.parentName  = "Parent name is required.";
    if (!/^[6-9]\d{9}$/.test(form.mobile.replace(/\s/g, ""))) e.mobile = "Enter a valid 10-digit mobile number.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.stream || form.stream === "Select Stream") e.stream = "Please select a stream.";
    return e;
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        student_name: form.studentName,
        parent_name: form.parentName
      };
      await axios.post("/api/enquiries", payload);
      setSubmitted(true);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Submission failed. Please try again.";
      alert(`Submission Error: ${errorMsg}`);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <section id="contact" className="py-[60px] md:py-[78px] bg-white">
      <div className="max-w-site mx-auto px-5 md:px-7">
        <Reveal className="mb-10 md:mb-11">
          <SectionHeader label="⑦ Contact & Location" title='Find Us &amp; Begin<br/>Your <em>Journey Today</em>' />
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-10 lg:gap-14">

          <Reveal>
            <div className="flex flex-col gap-[16px] md:gap-[18px]">
              {contactItems.map((c, i) => (
                <div key={i} className="flex gap-[13px] items-start">
                  <div className="w-[40px] h-[40px] md:w-[42px] md:h-[42px] rounded-[10px] bg-sky
                    flex items-center justify-center flex-shrink-0">
                    <c.Icon size={17} className="text-blue" />
                  </div>
                  <div>
                    <div className="text-[0.65rem] md:text-[0.68rem] font-bold text-muted uppercase tracking-[.09em] mb-[3px]">
                      {c.label}
                    </div>
                    {c.href
                      ? <a href={c.href} className="text-[0.85rem] md:text-[0.88rem] font-semibold text-blue no-underline hover:underline leading-[1.55] block">{c.val}</a>
                      : <div className={`text-[0.85rem] md:text-[0.88rem] font-semibold leading-[1.55] whitespace-pre-line ${c.highlight ? "text-orange" : "text-ink"}`}>{c.val}</div>
                    }
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="bg-cream border-[1.5px] border-[#e2e8f0] rounded-[18px] p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[18px]"
                style={{ background: "linear-gradient(90deg,#15803d,#dc2626)" }} />

              <h3 className="font-lora text-[1.15rem] md:text-[1.25rem] text-ink mb-[5px]">Admission Enquiry Form</h3>
              <p className="text-[0.8rem] md:text-[0.82rem] text-muted mb-5 md:mb-6">
                Fill in your details and our admissions team will call you back within 24 hours.
              </p>

              {!submitted ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <Field label="Student Name *"           placeholder="Enter full name"  value={form.studentName} onChange={(v) => handleChange("studentName", v)} error={errors.studentName} />
                    <Field label="Parent / Guardian Name *" placeholder="Enter name"       value={form.parentName}  onChange={(v) => handleChange("parentName", v)}  error={errors.parentName} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <Field label="Mobile Number *"  placeholder="9XXXXXXXXX"        type="tel"   value={form.mobile} onChange={(v) => handleChange("mobile", v)} error={errors.mobile} />
                    <Field label="Email Address"    placeholder="email@example.com" type="email" value={form.email}  onChange={(v) => handleChange("email", v)}  error={errors.email} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <SelectField label="Stream of Interest *" options={["Select Program","B.Sc Agriculture","M.Sc Agriculture (Agronomy)","M.Sc Agriculture (Soil Science)","M.Sc Agriculture (Plant Pathology)","M.Sc Agriculture (Biotechnology)","Core Science Research"]}
                      value={form.stream} onChange={(v) => handleChange("stream", v)} error={errors.stream} />
                    <SelectField label="Batch Preference" options={["Select Preference","Day Scholar","Residential – Boys Hostel","Residential – Girls Hostel"]}
                      value={form.batch} onChange={(v) => handleChange("batch", v)} />
                  </div>
                  <div className="mb-3">
                    <label className="block text-[0.68rem] font-bold text-muted uppercase tracking-[.07em] mb-1">
                      Message / Questions (Optional)
                    </label>
                    <textarea placeholder="Any questions about fee structure, batch availability, hostel facilities..." rows={3}
                      value={form.message} onChange={(e) => handleChange("message", e.target.value)}
                      className="w-full px-3 py-[10px] border-[1.5px] border-[#e2e8f0] rounded-lg font-sora
                        text-[0.83rem] text-ink bg-white resize-y transition-[border-color] duration-200
                        focus:outline-none focus:border-blue" />
                  </div>
                  <button onClick={handleSubmit}
                    disabled={submitting}
                    className={`w-full py-[13px] bg-blue text-white border-none rounded-lg font-sora font-bold
                      text-[0.88rem] cursor-pointer flex items-center justify-center gap-2 mt-1
                      transition-all duration-200 hover:bg-blue2 hover:-translate-y-[1px] ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    {submitting ? 'Submitting Enquiry...' : 'Submit Enquiry'}
                  </button>
                  <p className="text-center text-[0.72rem] text-muted mt-[9px] flex items-center justify-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    Your information is confidential and used only for admission follow-up.
                  </p>
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0e7c4b" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  <h4 className="font-lora text-[1.2rem] text-ink mb-2">Enquiry Submitted!</h4>
                  <p className="text-[0.88rem] text-muted">Our admissions team will call you within 24 hours.</p>
                  <button onClick={() => { setSubmitted(false); setForm(initialForm); setErrors({}); }}
                    className="mt-6 text-[0.82rem] text-blue font-semibold bg-transparent border-none cursor-pointer underline">
                    Submit another enquiry
                  </button>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Field({ label, placeholder, type = "text", value, onChange, error }) {
  return (
    <div>
      <label className="block text-[0.68rem] font-bold text-muted uppercase tracking-[.07em] mb-1">{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-[10px] border-[1.5px] rounded-lg font-sora text-[0.83rem] text-ink bg-white
          transition-[border-color] duration-200 focus:outline-none
          ${error ? "border-red-400 focus:border-red-500" : "border-[#e2e8f0] focus:border-blue"}`} />
      {error && <p className="text-[0.7rem] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function SelectField({ label, options, value, onChange, error }) {
  return (
    <div>
      <label className="block text-[0.68rem] font-bold text-muted uppercase tracking-[.07em] mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-[10px] border-[1.5px] rounded-lg font-sora text-[0.83rem] text-ink bg-white
          transition-[border-color] duration-200 focus:outline-none
          ${error ? "border-red-400 focus:border-red-500" : "border-[#e2e8f0] focus:border-blue"}`}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      {error && <p className="text-[0.7rem] text-red-500 mt-1">{error}</p>}
    </div>
  );
}
