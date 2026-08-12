const express = require("express");
const router = express.Router();
const pool = require("../utils/db");
const authenticate = require("../utils/authMiddleware");

const DATA = {
  staff: [
    { employee_id: "EMP001", name: "Admin Staff", email: "staff@srisai.com", password: "password123", department: "Administration", role: "Manager" },
    { employee_id: "EMP002", name: "Ramesh Staff", email: "ramesh@srisai.com", password: "password123", department: "Agri Science", role: "Assistant" }
  ],
  faculty: [
    { name: "Divi Vamsi Krishna", initials: "DV", department: "Agriculture", experience: "Lead Faculty", category: "Agriculture" },
    { name: "Sudhineedi Ramesh", initials: "SR", department: "Science", experience: "Research Expert", category: "Science" },
    { name: "Patchala Thomas", initials: "PT", department: "Agriculture", experience: "Senior Faculty", category: "Agriculture" },
  ],
  courses: [
    {
      stream: "Undergraduate",
      title: "B.Sc Agriculture",
      badge: "Agriculture Stream",
      description: "A comprehensive undergraduate program focusing on modern agricultural techniques, soil science, and sustainable farming.",
      details: JSON.stringify(["Agronomy · Study of crops and soil management", "Plant Breeding · Genetic improvement of plants", "Soil Science · Fertility and chemistry of soil"]),
      eligibility: "Intermediate/Higher Secondary Pass in Science",
      seats_label: "40 Seats — Limited",
      head_class: "bsc-agri"
    },
    {
      stream: "Postgraduate",
      title: "M.Sc Agriculture",
      badge: "Agriculture Stream",
      description: "Advanced research and specialized postgraduate training across multiple agriculture science disciplines.",
      details: JSON.stringify(["Msc Soil Science", "Msc Horticulture", "Msc Agronomy", "Msc Plant Breeding & Genetics", "Msc Zoology", "Msc Chemistry"]),
      eligibility: "B.Sc Agriculture or equivalent degree",
      seats_label: "Target 40 — Limited",
      head_class: "msc-agri"
    },
  ],
  stories: [
    { name: "K. Rakesh", initials: "KR", place: "Agronomy Research Fellow", category: "B.Sc Agriculture" },
    { name: "S. Anusha", initials: "SA", place: "Sustainable Farming Project", category: "B.Sc Agriculture" },
    { name: "M. Rahul", initials: "MR", place: "Crop Science Specialist", category: "B.Sc Agriculture" },
    { name: "P. Kavitha", initials: "PK", place: "Agri-Business Intern", category: "B.Sc Agriculture" },
    { name: "V. Sanjay", initials: "VS", place: "Soil Health Expert", category: "B.Sc Agriculture" },
    { name: "Dr. Vineeth", initials: "DV", place: "M.Sc Genetic Research", category: "M.Sc Research" },
    { name: "A. Srikanth", initials: "AS", place: "Modern Biotechnology M.Sc", category: "M.Sc Research" },
    { name: "B. Meena", initials: "BM", place: "National Science Scholar", category: "M.Sc Research" },
    { name: "D. Satish", initials: "DS", place: "Sustainable Agriculture Award", category: "M.Sc Research" },
    { name: "J. Naveen", initials: "JN", place: "Agricultural Officer", category: "Successful Alumni" },
    { name: "E. Sindhuja", initials: "ES", place: "Environmental Scientist", category: "Successful Alumni" },
  ],
  testimonials: [
    { student_name: "K. Rakesh", initials: "KR", achievement: "B.Sc Agriculture Scholar", quote: "Personalized attention made all the difference.", stars: 5 },
    { student_name: "S. Anusha", initials: "SA", achievement: "M.Sc Research Fellow", quote: "Structured field visits helped a lot.", stars: 5 },
  ],
  ranks: [
    { student_name: "T. Sai Kumar", rank: "Top Researcher", exam: "B.Sc Agri", stream: "Agri Science", hall_ticket_number: "AG2401", year: 2024 },
    { student_name: "M. Sneha", rank: "M.Sc Scholar", exam: "M.Sc Agri", stream: "Agri Science", hall_ticket_number: "AG2442", year: 2024 },
    { student_name: "R. Rahul", rank: "Distinction", exam: "B.Sc Agri", stream: "Agri Science", hall_ticket_number: "AG2491", year: 2024 },
    { student_name: "K. Divya", rank: "Top Performer", exam: "M.Sc Biology", stream: "Biological Sci", hall_ticket_number: "BS2482", year: 2024 },
  ],
  gallery: [
    // Internship Photos
    { image: "/internship-photos/intern-1.png", sub_label: "Internship", label: "Prasad Seeds MNC Placement", category: "internship" },
    { image: "/internship-photos/intern-2.png", sub_label: "Internship", label: "Quality Control Training", category: "internship" },
    { image: "/internship-photos/intern-3.png", sub_label: "Internship", label: "Seed Processing Visit", category: "internship" },
    { image: "/internship-photos/intern-4.png", sub_label: "Internship", label: "Industrial Exposure", category: "internship" },
    // Field Visits
    { image: "/field-visit-media/field-1.png", sub_label: "Field Visit", label: "Research Plot Analysis", category: "field-visit" },
    { image: "/field-visit-media/field-2.png", sub_label: "Field Visit", label: "Crop Health Monitoring", category: "field-visit" },
    { image: "/field-visit-media/field-3.png", sub_label: "Field Visit", label: "Modern Irrigation Study", category: "field-visit" },
    { image: "/field-visit-media/field-4.png", sub_label: "Field Work", label: "Hands-on Farming Experience", category: "field-visit" },
    { image: "/field-visit-media/field-5.png", sub_label: "Field Work", label: "Soil Testing Session", category: "field-visit" },
    { image: "/field-visit-media/field-6.png", sub_label: "Field Visit", label: "Expert Interaction", category: "field-visit" },
    { image: "/field-visit-media/field-7.png", sub_label: "Field Visit", label: "Livestock Management", category: "field-visit" },
    { image: "/field-visit-media/field-8.png", sub_label: "Field Work", label: "Sustainable Agriculture", category: "field-visit" },
    // Events
    { image: "/events-photos/event-1.png", sub_label: "Campus Event", label: "Agri-Fest Celebration", category: "event" },
    { image: "/events-photos/event-2.png", sub_label: "Campus Event", label: "Cultural Program", category: "event" },
    { image: "/events-photos/event-3.png", sub_label: "Campus Event", label: "Annual Symposium", category: "event" },
    { image: "/events-photos/event-4.png", sub_label: "Campus Event", label: "Sports Meet", category: "event" },
    { image: "/events-photos/event-5.png", sub_label: "Campus Event", label: "Technical Workshop", category: "event" },
    { image: "/events-photos/event-6.png", sub_label: "Campus Event", label: "Student Seminars", category: "event" },
    // Trip Photos
    { image: "/trip-photos/trip-1.png", sub_label: "Educational Trip", label: "Excursion Memories", category: "trip" },
    { image: "/trip-photos/trip-2.png", sub_label: "Educational Trip", label: "Nature Study Tour", category: "trip" },
    { image: "/trip-photos/trip-3.png", sub_label: "Educational Trip", label: "Industrial Visit", category: "trip" },
    { image: "/trip-photos/trip-4.png", sub_label: "Educational Trip", label: "Team Outing", category: "trip" },
    // Default Videos
    { image: "/field-visit-media/field-video.mp4", sub_label: "Field Visit", label: "Agriculture Field Research", category: "field-visit", type: "video" },
    { image: "/field-visit-media/field-video.mp4", sub_label: "Internship", label: "Student Internship Overview", category: "internship", type: "video" },
    { image: "/field-visit-media/field-video.mp4", sub_label: "Campus Event", label: "College Event Highlight", category: "event", type: "video" },
    { image: "/field-visit-media/field-video.mp4", sub_label: "Educational Trip", label: "Trip Memories", category: "trip", type: "video" },
  ],
  hero: [
    { 
      tag: "🎓 Admissions Open 2026–27", 
      h1: JSON.stringify(["Welcome to Sri Sai Institute", "of Agriculture", "Sciences."]), 
      motto: "\"Empowering the Future of Agriculture through Excellence.\"", 
      description: "Offering professional B.Sc and M.Sc programs in Agriculture and Core Sciences. A premier destination for agricultural research and higher scientific learning.", 
      btn1_label: "Apply for Admissions →", 
      btn1_href: "#contact",
      btn2_label: "Explore Our Programs",
      btn2_href: "/about",
      bg_gradient: "linear-gradient(115deg,#071428 0%,#065f46 45%,#15803d 100%)", 
      image: "/internship-photos/intern-1.png" 
    },
    { 
      tag: "Limited Intake – Register Today", 
      h1: JSON.stringify(["Build Your Career in", "Modern Agriculture", "& Science Research."]), 
      motto: "\"Practical knowledge and industry-focused professional education for tomorrow's scientists.\"", 
      description: "Our comprehensive curriculum is designed to shape future agriculture professionals with hands-on field research, modern labs, and expert faculty guidance.", 
      btn1_label: "Enquire Now →", 
      btn1_href: "#contact",
      btn2_label: "About Our Institute",
      btn2_href: "/about",
      bg_gradient: "linear-gradient(115deg,#064e3b 0%,#065f46 45%,#047857 100%)", 
      image: "/field-visit-media/field-1.png" 
    }
  ],
  students: [
    { email: "student@srisai.com", password: "password123", student_name: "Test Student", branch: "Agriculture", course_applied: "Ag. B.Sc.", academic_enrolled_year: "2024-2025" }
  ]
};

router.post("/sync", authenticate, async (req, res) => {
  try {
    const results = {};

    for (const table of Object.keys(DATA)) {
      try {
        const data = DATA[table];
        // 1. Check if table has data
        const [existing] = await pool.query(`SELECT id FROM ${table} LIMIT 1`);
        
        if (existing.length === 0) {
          for (const item of data) {
            const keys = Object.keys(item);
            const values = Object.values(item);
            if (keys.includes('password')) {
               const bcrypt = require("bcryptjs");
               values[keys.indexOf('password')] = await bcrypt.hash(item.password, 10);
            }
            const quotedKeys = keys.map(k => `\`${k}\``).join(", ");
            const placeholders = keys.map(() => "?").join(", ");
            await pool.query(
              `INSERT INTO \`${table}\` (${quotedKeys}) VALUES (${placeholders})`,
              values
            );
          }
          results[table] = `Synced ${data.length} records`;
        } else {
          results[table] = "Skipped (Table already has data)";
        }
      } catch (tableErr) {
        console.error(`Sync Error for ${table}:`, tableErr.message);
        results[table] = `Error: ${tableErr.message}`;
      }
    }

    res.json({ message: "Sync process completed", details: results });
  } catch (err) {
    console.error("CRITICAL SYNC ERROR:", err);
    res.status(500).json({ message: "Sync failed", error: err.message });
  }
});

module.exports = router;
