require("dotenv").config();
const pool = require("./utils/db");

const staticData = {
  faculty: [
    { initials: "DV", name: "Divi Vamsi Krishna",   department: "Agriculture", experience: "Agriculture Faculty · Senior Lead", category: "agri", image: "gallery/1.png" },
    { initials: "SR", name: "Sudhineedi Ramesh",     department: "Agriculture · Science", experience: "Agriculture & Science Faculty", category: "agri", image: "gallery/2.png" },
    { initials: "PT", name: "Patchala Thomas",       department: "Agriculture", experience: "Agriculture Faculty", category: "agri", image: "gallery/3.png" },
    { initials: "SR", name: "Sudhineedi Ramesh",     department: "Biology", experience: "Biology & Science Faculty", category: "bio", image: "gallery/2.png" },
    { initials: "PT", name: "Patchala Thomas",       department: "Biology", experience: "Life Sciences Faculty", category: "bio", image: "gallery/3.png" },
    { initials: "DV", name: "Divi Vamsi Krishna",   department: "Chemistry", experience: "Chemistry Faculty", category: "chem", image: "gallery/1.png" },
    { initials: "SR", name: "Sudhineedi Ramesh",     department: "Chemistry", experience: "Chemistry Faculty", category: "chem", image: "gallery/2.png" },
    { initials: "PT", name: "Patchala Thomas",       department: "Zoology", experience: "Zoology Faculty", category: "zoo", image: "gallery/3.png" },
    { initials: "DV", name: "Divi Vamsi Krishna",   department: "Zoology", experience: "Zoology & Agriculture Faculty", category: "zoo", image: "gallery/1.png" },
  ],
  stories: [
    { name: "K. Rakesh",      place: "Agronomy Research Fellow", initials: "KR", category: "bsc-achievers", image: "gallery/1.png" },
    { name: "S. Anusha",      place: "Sustainable Farming Project", initials: "SA", category: "bsc-achievers", image: "gallery/2.png" },
    { name: "M. Rahul",       place: "Crop Science Specialist", initials: "MR", category: "bsc-achievers", image: "gallery/3.png" },
    { name: "P. Kavitha",     place: "Agri-Business Intern", initials: "PK", category: "bsc-achievers", image: "gallery/4.png" },
    { name: "V. Sanjay",      place: "Soil Health Expert", initials: "VS", category: "bsc-achievers", image: "gallery/5.png" },
    { name: "Dr. Vineeth",    place: "M.Sc Genetic Research", initials: "DV", category: "msc-achievers", image: "gallery/1.png" },
    { name: "A. Srikanth",    place: "Modern Biotechnology M.Sc", initials: "AS", category: "msc-achievers", image: "gallery/2.png" },
    { name: "B. Meena",       place: "National Science Scholar", initials: "BM", category: "msc-achievers", image: "gallery/3.png" },
    { name: "D. Satish",      place: "Sustainable Agriculture Award", initials: "DS", category: "msc-achievers", image: "gallery/4.png" },
    { name: "J. Naveen",      place: "Agricultural Officer", initials: "JN", category: "alumni", image: "gallery/1.png" },
    { name: "E. Sindhuja",    place: "Environmental Scientist", initials: "ES", category: "alumni", image: "gallery/2.png" },
  ],
  courses: [
    { title: "B.Sc Agriculture", description: "A comprehensive undergraduate program focusing on modern agricultural techniques, soil science, and sustainable farming.", stream: "Undergraduate", details: JSON.stringify(["Study of crops and soil management", "Genetic improvement of plants", "Fertility and chemistry of soil"]), image: "gallery/1.png" },
    { title: "M.Sc Agriculture", description: "Advanced research and specialized training in agricultural sciences and research methodology.", stream: "Postgraduate", details: JSON.stringify(["Advanced scientific research techniques", "Modern bio-tech in agriculture", "Advanced eco-friendly practices"]), image: "gallery/2.png" },
    { title: "M.Sc Biology, Chemistry & Zoology", description: "Specialized postgraduate programs in core sciences for research and academic careers.", stream: "Postgraduate", details: JSON.stringify(["Cellular and Molecular focus", "Organic and Inorganic research", "Focus on Animal Sciences"]), image: "gallery/3.png" },
  ],
  gallery: [
    { image: "gallery/1.png",  sub_label: "Main Campus",         label: "Main Academic Block" },
    { image: "gallery/2.png",  sub_label: "Research Lab",        label: "Advanced Soil Analysis" },
    { image: "gallery/3.png",  sub_label: "Field Work",          label: "Experimental Research Plot" },
    { image: "gallery/4.png",  sub_label: "Classrooms",          label: "Digital Learning Hall" },
    { image: "gallery/5.png",  sub_label: "Hostels",             label: "Modern Student Housing" },
    { image: "gallery/6.png",  sub_label: "Library",             label: "Scientific Resource Center" },
    { image: "gallery/7.png",  sub_label: "Agriculture Labs",    label: "Plant Pathology Unit" },
    { image: "gallery/8.png",  sub_label: "Practical Field",     label: "Agronomy Research Area" },
    { image: "gallery/9.png",  sub_label: "Campus Life",         label: "Green Campus Environment" },
    { image: "gallery/10.png", sub_label: "Admissions Hub",      label: "Enquiry & Counseling Center" },
  ],
  testimonials: [
    { initials: "KR", student_name: "K. Rakesh",    achievement: "B.Sc Agriculture Scholar",   quote: "The personalized attention at Sri Sai Institute made all the difference in my research projects. The faculty guided me through complex soil science analysis personally every single day.", stars: 5 },
    { initials: "SA", student_name: "S. Anusha",  achievement: "M.Sc Research Fellow",     quote: "I never felt overwhelmed by the scientific curriculum because of the structured field visits and lab hours. The professors provided extra individual sessions.", stars: 5 },
    { initials: "MR", student_name: "M. Rahul",  achievement: "Agri-Business Professional",   quote: "The practical field training at Sri Sai Institute showed me exactly how theory translates into real-world farming solutions.", stars: 5 },
  ],
  hero: [
    {
        bg_gradient: "linear-gradient(115deg,#071428 0%,#065f46 45%,#15803d 100%)",
        image: "gallery/1.png",
        tag: "🎓 Admissions Open 2026–27",
        h1: JSON.stringify(["Welcome to <em class=\"italic text-[#fde68a]\">Sri Sai Institute</em>", "of Agriculture", "Sciences."]),
        motto: "\"Empowering the Future of Agriculture through Excellence.\"",
        description: "Offering professional B.Sc and M.Sc programs in Agriculture and Core Sciences. A premier destination for agricultural research and higher scientific learning.",
        btn1_label: "Apply for Admissions →",
        btn1_href: "#contact",
        btn2_label: "Explore Our Programs",
        btn2_href: "/about"
    },
    {
        bg_gradient: "linear-gradient(115deg,#064e3b 0%,#065f46 45%,#047857 100%)",
        image: "gallery/2.png",
        tag: "Limited Intake – Register Today",
        h1: JSON.stringify(["Build Your Career in", "<em class=\"italic text-[#fde68a]\">Modern Agriculture</em>", "& Science Research."]),
        motto: "\"Practical knowledge and industry-focused professional education for tomorrow's scientists.\"",
        description: "Our comprehensive curriculum is designed to shape future agriculture professionals with hands-on field research, modern labs, and expert faculty guidance.",
        btn1_label: "Enquire Now →",
        btn1_href: "#contact",
        btn2_label: "About Our Institute",
        btn2_href: "/about"
    }
  ],
  directors: [
    {
      name: "Dr. K. S. Rao",
      position: "Chairman & Managing Director",
      qualification: "Ph.D. in Agronomy & Agricultural Economics",
      experience: "30+ Years in Agricultural Education & Leadership",
      message: "Dedicated to nurturing next-generation agricultural scientists, rural empowerment, and pioneering scientific innovations.",
      image: "gallery/1.png",
      order_num: 1
    },
    {
      name: "Prof. M. Ramachandra Reddy",
      position: "Director - Academic Affairs & Research",
      qualification: "M.Sc. (Agri), Ph.D. in Soil Science",
      experience: "25+ Years Academic & Research Excellence",
      message: "Fostering rigorous scientific discovery, student-centered mentoring, and transformative agricultural pedagogy.",
      image: "gallery/2.png",
      order_num: 2
    },
    {
      name: "Dr. V. Sudhakar",
      position: "Executive Director - Administration",
      qualification: "Ph.D. in Plant Pathology",
      experience: "20+ Years Institutional Management",
      message: "Committed to delivering world-class laboratory infrastructure, research farm ecosystems, and industry placements.",
      image: "gallery/3.png",
      order_num: 3
    }
  ]
};

async function seed() {
  console.log("🌱 Starting MySQL Seeding Process...");

  try {
    for (const [table, data] of Object.entries(staticData)) {
      console.log(`📡 Seeding table: ${table}...`);
      
      const [rows] = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      if (rows[0].count > 0) {
        console.log(`ℹ️ Table ${table} already has data. Skipping.`);
        continue;
      }

      for (const item of data) {
        const keys = Object.keys(item);
        const values = Object.values(item);
        const placeholders = keys.map(() => "?").join(", ");
        const query = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`;
        await pool.query(query, values);
      }
      console.log(`✅ Table ${table} seeded successfully!`);
    }
    console.log("✨ Seeding Completed!");
  } catch (err) {
    console.error("❌ Seeding Error:", err.message);
  } finally {
    process.exit(0);
  }
}

seed();
