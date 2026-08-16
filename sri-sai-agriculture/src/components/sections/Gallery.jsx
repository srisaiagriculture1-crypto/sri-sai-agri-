import { useState, useEffect } from "react";
import axios from "axios";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import Reveal from "../ui/Reveal";
import SectionHeader from "../ui/SectionHeader";

import { getImageUrl } from "../../utils/imageUrl";

// Robust API URL detection for development
const API_URL = "/api";

const FALLBACK_ITEMS = [
  // Internship Photos
  { image: "/internship-photos/intern-1.png", sub_label: "Internship", label: "Prasad Seeds MNC Placement" },
  { image: "/internship-photos/intern-2.png", sub_label: "Internship", label: "Quality Control Training" },
  { image: "/internship-photos/intern-3.png", sub_label: "Internship", label: "Seed Processing Visit" },
  { image: "/internship-photos/intern-4.png", sub_label: "Internship", label: "Industrial Exposure" },
  // Field Visits
  { image: "/field-visit-media/field-1.png", sub_label: "Field Visit", label: "Research Plot Analysis" },
  { image: "/field-visit-media/field-2.png", sub_label: "Field Visit", label: "Crop Health Monitoring" },
  { image: "/field-visit-media/field-3.png", sub_label: "Field Visit", label: "Modern Irrigation Study" },
  { image: "/field-visit-media/field-4.png", sub_label: "Field Work", label: "Hands-on Farming Experience" },
  { image: "/field-visit-media/field-5.png", sub_label: "Field Work", label: "Soil Testing Session" },
  { image: "/field-visit-media/field-6.png", sub_label: "Field Visit", label: "Expert Interaction" },
  { image: "/field-visit-media/field-7.png", sub_label: "Field Visit", label: "Livestock Management" },
  { image: "/field-visit-media/field-8.png", sub_label: "Field Work", label: "Sustainable Agriculture" },
  // Events
  { image: "/events-photos/event-1.png", sub_label: "Campus Event", label: "Agri-Fest Celebration" },
  { image: "/events-photos/event-2.png", sub_label: "Campus Event", label: "Cultural Program" },
  { image: "/events-photos/event-3.png", sub_label: "Campus Event", label: "Annual Symposium" },
  { image: "/events-photos/event-4.png", sub_label: "Campus Event", label: "Sports Meet" },
  { image: "/events-photos/event-5.png", sub_label: "Campus Event", label: "Technical Workshop" },
  { image: "/events-photos/event-6.png", sub_label: "Campus Event", label: "Student Seminars" },
  // Trip Photos
  { image: "/trip-photos/trip-1.png", sub_label: "Educational Trip", label: "Excursion Memories" },
  { image: "/trip-photos/trip-2.png", sub_label: "Educational Trip", label: "Nature Study Tour" },
  { image: "/trip-photos/trip-3.png", sub_label: "Educational Trip", label: "Industrial Visit" },
  { image: "/trip-photos/trip-4.png", sub_label: "Educational Trip", label: "Team Outing" },
].map((item, idx) => ({ ...item, id: `fallback-${idx}` }));

const isVideoMedia = (item) => {
  if (!item) return false;
  if (item.type && item.type.toLowerCase() === 'video') return true;
  const url = (item.image || item.photo || '').toLowerCase();
  return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || url.endsWith('.ogg') || url.endsWith('.mkv');
};

export default function Gallery() {
  const [items, setItems] = useState(FALLBACK_ITEMS);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  // Re-trigger scroll reveal whenever items change
  useScrollReveal([items]);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await axios.get("/api/gallery");
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setItems(res.data);
        }
      } catch (err) {
        console.error("Gallery fetch failed, using fallback:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-cream overflow-hidden">
      <div className="max-w-site mx-auto px-5 md:px-7">
        <Reveal className="text-center max-w-[600px] mx-auto mb-12">
          <SectionHeader label="Campus Life" title='Life at <em>Sri Sai Institute</em>' center />
          <p className="text-ink/60 text-sm mt-4">Exploring our modern infrastructure, research residencies, and state-of-the-art agricultural science laboratories.</p>
        </Reveal>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 grid-flow-row-dense gap-4 md:gap-6">
          {items.map((item, i) => {
            const isVideo = isVideoMedia(item);
            let spanClass = "col-span-1 row-span-1 h-[250px]";
            // Bento logic for first few items to keep it interesting
            if (i % 10 === 0) spanClass = "lg:col-span-2 lg:row-span-2 h-[350px] lg:h-[520px]";
            else if (i % 10 === 3) spanClass = "lg:col-span-1 lg:row-span-2 h-[250px] lg:h-[520px]";

            return (
              <Reveal key={item.id || i} delay={(i % 5) * 0.05}
                className={`rounded-2xl overflow-hidden relative group cursor-pointer border border-ink/5 shadow-md ${spanClass} bg-black/5`}
                onClick={() => setSelectedImage(item)}
              >
                {isVideo && (
                  <div className="absolute top-3.5 right-3.5 z-20 bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/20 text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    <span>VIDEO</span>
                  </div>
                )}
                {isVideo ? (
                  <video 
                    src={getImageUrl(item.image)} 
                    className="w-full h-full object-cover" 
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="metadata"
                  />
                ) : (
                  <img 
                    src={getImageUrl(item.image)} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    alt={item.label || "Gallery media"} 
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1592417817098-8f3d6eb228cc?q=80&w=800'; }}
                  />
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 z-10 flex flex-col justify-end p-6">
                   <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <p className="text-white font-bold text-lg leading-tight mb-1">{item.label}</p>
                      <p className="text-white/70 text-xs font-medium uppercase tracking-widest">{item.sub_label}</p>
                   </div>
                </div>

                <div className="absolute inset-4 border border-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-ink/95 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10"
            onClick={() => setSelectedImage(null)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>

          <div 
            className="relative max-w-5xl w-full flex flex-col items-center bg-transparent gap-4"
            onClick={e => e.stopPropagation()}
          >
            {isVideoMedia(selectedImage) ? (
              <video 
                src={getImageUrl(selectedImage.image)} 
                controls 
                autoPlay 
                playsInline
                className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl animate-scale-up bg-black border border-white/10"
              />
            ) : (
              <img 
                src={getImageUrl(selectedImage.image)} 
                alt={selectedImage.label} 
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl animate-scale-up"
              />
            )}
            <div className="text-center text-white px-4 animate-slide-up">
               <h3 className="text-2xl font-bold mb-2">{selectedImage.label}</h3>
               <p className="text-white/60 font-medium uppercase tracking-widest text-xs">{selectedImage.sub_label}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

