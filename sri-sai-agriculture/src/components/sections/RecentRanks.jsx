import React, { useState, useEffect } from "react";
import axios from "axios";
import SectionHeader from "../ui/SectionHeader";
import { getImageUrl } from "../../utils/imageUrl";

const staticRanks = [
  { studentName: "T. Sai Kumar", rank: "Top Researcher", exam: "B.Sc Agri", stream: "Agri Science", hallTicketNumber: "AG2401", image: "" },
  { studentName: "M. Sneha", rank: "M.Sc Scholar", exam: "M.Sc Agri", stream: "Agri Science", hallTicketNumber: "AG2442", image: "" },
  { studentName: "R. Rahul", rank: "Distinction", exam: "B.Sc Agri", stream: "Agri Science", hallTicketNumber: "AG2491", image: "" },
  { studentName: "K. Divya", rank: "Top Performer", exam: "M.Sc Biology", stream: "Biological Sci", hallTicketNumber: "BS2482", image: "" },
];

export default function RecentRanks() {
  const [ranks, setRanks] = useState(staticRanks);

  useEffect(() => {
    const fetchRanks = async () => {
      try {
        const res = await axios.get("/api/ranks");
        if (res.data && res.data.length > 0) {
          // Filter out old legacy streams if any
          const filteredRanks = res.data.filter(r => !['MPC', 'BiPC', 'MEC'].includes(r.stream?.toUpperCase()));
          if (filteredRanks.length > 0) {
            setRanks(filteredRanks);
          }
        }
      } catch (err) {
        console.error("Error fetching ranks:", err);
      }
    };
    fetchRanks();
  }, []);

  return (
    <section className="py-20 bg-cream">
      <div className="max-w-site mx-auto px-5 md:px-7">
        <div className="mb-14">
          <SectionHeader
            label="🏆 Top Scholars"
            title={`Our Achievers in <em>Agricultural Research</em>`}
            subtitle="Celebrating our top-performing students who have excelled in B.Sc and M.Sc academic research."
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {ranks.map((r, i) => (
            <div key={r.id || i} className="bg-white rounded-[2rem] overflow-hidden border border-blue/5 shadow-sm hover:shadow-xl transition-all duration-500 group h-full flex flex-col">
              {/* Photo Area */}
              <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden flex items-center justify-center">
                {/* Fallback avatar */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue/5 to-blue/10 text-blue/20">
                  <svg width="40%" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>

                {r.image ? (
                  <img 
                    src={getImageUrl(r.image)} 
                    alt={r.student_name || r.studentName || r.name} 
                    className="relative z-[1] w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : null}

                {/* Rank Badge */}
                <div className="absolute top-3 left-3 bg-blue text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg z-10">
                  {r.rank || r.place || r.achievement || 'TOPPER'}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-[0.95rem] text-ink leading-tight mb-1">{r.student_name || r.studentName || r.name}</h4>
                  <div className="text-[10px] font-bold text-blue tracking-wider uppercase mb-2">{(r.exam || 'PROGRAM')} • {(r.stream || 'AGRI')}</div>
                </div>
                <div className="pt-3 border-t border-gray-100 mt-auto">
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">ID / Roll No.</div>
                  <div className="text-[11px] font-black text-ink mt-1">{r.hall_ticket_number || r.hallTicketNumber || '-----'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
