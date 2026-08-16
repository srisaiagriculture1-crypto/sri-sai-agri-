import { useState, useEffect } from "react";
import axios from "axios";
import Reveal from "../ui/Reveal";
import SectionHeader from "../ui/SectionHeader";
import { getImageUrl } from "../../utils/imageUrl";
import { useScrollReveal } from "../../hooks/useScrollReveal";

const staticFaculty = [
  { initials: "DV", name: "Divi Vamsi Krishna",  role: "Faculty", department: "Agriculture", experience: "Agriculture Faculty · Senior Lead" },
  { initials: "SR", name: "Sudhineedi Ramesh",    role: "Faculty", department: "Science", experience: "Agriculture & Science Faculty" },
  { initials: "PT", name: "Patchala Thomas",      role: "Faculty", department: "Agriculture", experience: "Life Sciences Faculty" },
];

function FacultyCard({ f, delay = 0 }) {
  const initials = f.initials || (f.name ? f.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'FC');

  return (
    <Reveal delay={delay} className="h-full">
      <div className="h-full p-6 md:p-8 bg-white border-[1.5px] border-[#e2e8f0] rounded-2xl
        transition-all duration-300 hover:border-blue hover:shadow-xl hover:-translate-y-1 flex flex-col items-center text-center group">
        <div 
          className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center
            text-white font-lora font-bold text-xl mb-4 shrink-0 shadow-md relative group-hover:scale-105 transition-transform"
          style={{ background: "linear-gradient(135deg,#15803d,#0b1220)" }}
        >
          <span className="select-none">{initials}</span>
          {f.image && (
            <img 
              src={getImageUrl(f.image)} 
              className="absolute inset-0 w-full h-full object-cover" 
              alt={f.name} 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
        </div>
        <span className="font-bold text-base text-ink block mb-1.5">{f.name}</span>
        <span className="text-[0.72rem] text-blue font-bold uppercase tracking-[.08em] bg-blue/5 border border-blue/10 px-3 py-1 rounded-full">
          {f.department || f.role || 'Faculty'}
        </span>
        {f.experience && (
          <p className="text-xs text-gray-500 mt-3 font-medium leading-relaxed">
            {f.experience}
          </p>
        )}
      </div>
    </Reveal>
  );
}

export default function Faculty() {
  const [facultyList, setFacultyList] = useState(staticFaculty);

  useScrollReveal([facultyList]);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const res = await axios.get("/api/faculty");
        if (res.data && res.data.length > 0) {
          setFacultyList(res.data);
        }
      } catch (err) {
        console.error("Error fetching faculty:", err);
      }
    };
    fetchFaculty();
  }, []);

  return (
    <section id="faculty" className="py-[60px] md:py-[78px] bg-white">
      <div className="max-w-site mx-auto px-5 md:px-7">
        <Reveal className="mb-[30px]">
          <SectionHeader
            label="⑤ Faculty Profiles"
            title='Our <em>Dedicated</em> Faculty'
            subtitle="Our experienced educators bring deep subject knowledge and a passion for student success."
          />
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {facultyList.map((f, i) => (
            <FacultyCard key={f.id || f.name || i} f={f} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>
  );
}

