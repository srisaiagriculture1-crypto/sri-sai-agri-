import React, { useEffect } from "react";
import { useImageModal } from "../hooks/useImageModal";
import PageHeader from "../components/ui/PageHeader";
import Contact from "../components/sections/Contact";
import Reveal from "../components/ui/Reveal";
import { getImageUrl } from "../utils/imageUrl";

export default function ActivitiesPage() {
  const { openModal } = useImageModal();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-cream min-h-screen">
      <PageHeader
        title="Student Activities"
        subtitle="Exploring learning beyond the classroom with practical exposure."
      />

      {/* ── Internship Section ─────────────────────────────── */}
      <section id="internship" className="py-20 bg-white">
        <div className="max-w-site mx-auto px-5 md:px-7">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-lora font-bold text-ink mb-6">
              <em className="text-blue">Internship</em> Programs
            </h2>
            <div className="bg-sky/50 rounded-2xl p-8 md:p-12 border border-[#e2e8f0] mb-8">
              <p className="text-ink/70 text-lg leading-relaxed mb-6">
                Our flagship internship program provides students with unparalleled
                hands-on experience in the agricultural sector. Most recently, our
                students successfully completed an intensive internship program at{" "}
                <strong>Prasad Seeds</strong>, a prestigious multinational corporation
                (MNC) and a global leader in the seed industry.
              </p>
              <ul className="list-disc list-inside text-ink/70 text-lg space-y-2">
                <li>Exclusive placement at Prasad Seeds (MNC) for real-world industry training.</li>
                <li>Exposure to state-of-the-art agricultural technologies and seed processing.</li>
                <li>Live projects, problem-solving, and direct mentorship by industry professionals.</li>
              </ul>
            </div>

            {/* Videos from DB (fallback to field-video) */}
            <DynamicVideoSection
              category="internship"
              fallbackSrc="/field-visit-media/field-video.mp4"
              className="mb-8"
            />

            {/* Images from DB (fallback to static) */}
            <DynamicMediaGrid
              category="internship"
              fallbackImages={[1, 2, 3, 4].map(i => `/internship-photos/intern-${i}.png`)}
              openModal={openModal}
              cols={4}
            />
          </Reveal>
        </div>
      </section>

      {/* ── Field Visit Section ────────────────────────────── */}
      <section id="field-visit" className="py-20 bg-cream">
        <div className="max-w-site mx-auto px-5 md:px-7">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-lora font-bold text-ink mb-6">
              <em className="text-blue">Field Visit</em>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-8">
              <div>
                <p className="text-ink/70 text-lg leading-relaxed mb-6">
                  Practical exposure is key to understanding agricultural sciences.
                  Our regular field visits to agricultural research stations,
                  progressive farms, and agro-industries expose students to the
                  latest farming techniques and crop management practices.
                </p>
                <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm">
                  <h4 className="font-bold text-ink mb-2">Key Highlights:</h4>
                  <ul className="list-disc list-inside text-ink/70 space-y-2">
                    <li>Visits to ICAR institutes and state agricultural universities.</li>
                    <li>Interaction with progressive farmers and agronomists.</li>
                    <li>Hands-on learning of modern irrigation and farming equipment.</li>
                  </ul>
                </div>
              </div>
              {/* Video column */}
              <DynamicVideoSection
                category="field-visit"
                fallbackSrc="/field-visit-media/field-video.mp4"
                inline
              />
            </div>

            <DynamicMediaGrid
              category="field-visit"
              fallbackImages={[1, 2, 3, 4, 5, 6, 7, 8].map(i => `/field-visit-media/field-${i}.png`)}
              openModal={openModal}
              cols={4}
            />
          </Reveal>
        </div>
      </section>

      {/* ── Events Section ─────────────────────────────────── */}
      <section id="events" className="py-20 bg-white">
        <div className="max-w-site mx-auto px-5 md:px-7">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-lora font-bold text-ink mb-6">
              Campus <em className="text-blue">Events</em>
            </h2>
            <p className="text-ink/70 text-lg leading-relaxed mb-10 max-w-3xl">
              Life at Sri Sai Institute extends beyond academics. We organize
              various technical fests, cultural events, and agricultural exhibitions
              that foster teamwork, creativity, and leadership among our students.
            </p>

            <DynamicMediaGrid
              category="event"
              fallbackImages={[1, 2, 3, 4, 5, 6].map(i => `/events-photos/event-${i}.png`)}
              openModal={openModal}
              cols={3}
            />

            <div className="mt-8">
              <DynamicVideoSection
                category="event"
                fallbackSrc="/field-visit-media/field-video.mp4"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Trip Photos Section ────────────────────────────── */}
      <section id="trip-photos" className="py-20 bg-cream">
        <div className="max-w-site mx-auto px-5 md:px-7">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-lora font-bold text-ink mb-6 text-center">
              Our <em className="text-blue">Trip Photos</em>
            </h2>
            <p className="text-ink/70 text-lg leading-relaxed mb-10 max-w-3xl mx-auto text-center">
              Memories from our educational excursions, field visits, and campus
              tours. We believe that learning is an adventure.
            </p>

            <DynamicMediaGrid
              category="trip"
              fallbackImages={[1, 2, 3, 4].map(i => `/trip-photos/trip-${i}.png`)}
              openModal={openModal}
              cols={4}
            />

            <div className="mt-8">
              <DynamicVideoSection
                category="trip"
                fallbackSrc="/field-visit-media/field-video.mp4"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <Contact />
    </div>
  );
}

const isVideoItem = (d) => {
  if (!d) return false;
  if (d.type && d.type.toLowerCase() === 'video') return true;
  const s = (d.image || d.photo || '').toLowerCase();
  return s.endsWith('.mp4') || s.endsWith('.webm') || s.endsWith('.mov') || s.endsWith('.ogg') || s.endsWith('.mkv');
};

/* ─────────────────────────────────────────────────────────────────────────── *
 *  DynamicMediaGrid
 *  Fetches DB images for `category` (e.g. "internship", "field-visit", "event", "trip").
 *  Falls back to static file paths when the DB has nothing for that category.
 * ─────────────────────────────────────────────────────────────────────────── */
function DynamicMediaGrid({ category, fallbackImages = [], openModal, cols = 4 }) {
  const [items, setItems] = React.useState(null); // null = loading

  React.useEffect(() => {
    fetch(`/api/gallery`)
      .then(r => r.json())
      .then(data => {
        const filtered = Array.isArray(data)
          ? data.filter(d => (d.category || '').toLowerCase().includes(category.toLowerCase()) && !isVideoItem(d))
          : [];
        setItems(filtered);
      })
      .catch(() => setItems([]));
  }, [category]);

  const colClass = cols === 3 ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2 md:grid-cols-4";

  // Loading skeleton
  if (items === null) {
    return (
      <div className={`grid ${colClass} gap-4`}>
        {[...Array(cols === 3 ? 6 : 4)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const mediaItems =
    items.length > 0
      ? items.map(item => ({
          src: getImageUrl(item.image),
          label: item.label,
        }))
      : fallbackImages.map(src => ({ src: getImageUrl(src), label: '' }));

  return (
    <div className={`grid ${colClass} gap-4`}>
      {mediaItems.map((media, i) => (
        <div
          key={i}
          className="overflow-hidden bg-sky rounded-xl border border-[#e2e8f0] hover:scale-[1.03] hover:shadow-xl transition-all duration-300 relative group"
        >
          <img
            src={media.src}
            alt={media.label || `${category} photo`}
            className="w-full h-full aspect-square object-cover object-center cursor-pointer"
            onClick={() => openModal(media.src)}
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1592417817098-8f3d6eb228cc?q=80&w=800'; }}
          />
          {media.label && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs font-bold px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity truncate">
              {media.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  DynamicVideoSection
 *  Shows videos uploaded for a category via Admin Panel.
 *  Falls back to the original static MP4 if nothing is in the DB yet.
 * ─────────────────────────────────────────────────────────────────────────── */
function DynamicVideoSection({ category, fallbackSrc, inline = false, className = "" }) {
  const [videos, setVideos] = React.useState(null);

  React.useEffect(() => {
    fetch(`/api/gallery`)
      .then(r => r.json())
      .then(data => {
        const filtered = Array.isArray(data)
          ? data.filter(d => (d.category || '').toLowerCase().includes(category.toLowerCase()) && isVideoItem(d))
          : [];
        setVideos(filtered);
      })
      .catch(() => setVideos([]));
  }, [category]);

  const wrapClass = `rounded-2xl overflow-hidden border border-[#e2e8f0] shadow-sm hover:scale-[1.01] transition-transform ${inline ? 'h-full min-h-[300px]' : `min-h-[300px] ${className}`}`;

  if (videos === null) {
    return <div className={`${wrapClass} bg-gray-100 animate-pulse`} />;
  }

  // DB has videos → show them all
  if (videos.length > 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {videos.map((v, i) => {
          const src = getImageUrl(v.image);
          return (
            <div key={i} className={wrapClass}>
              <video
                src={src}
                controls
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover max-h-[420px] bg-slate-900"
              >
                Your browser does not support the video tag.
              </video>
              {v.label && (
                <p className="text-xs font-bold text-ink/60 px-4 py-2 bg-gray-50 border-t border-gray-100">
                  {v.label}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback to original static video
  return (
    <div className={wrapClass}>
      <video
        src={fallbackSrc}
        controls
        autoPlay
        loop
        muted
        playsInline
        className={`w-full h-full object-cover bg-slate-900 ${inline ? 'aspect-video md:aspect-auto' : 'max-h-[400px]'}`}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
