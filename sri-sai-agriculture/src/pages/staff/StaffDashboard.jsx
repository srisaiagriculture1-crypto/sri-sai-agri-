import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { LogOut, CheckCircle2, XCircle, Clock, Search, Filter, Calendar, Check, X, RotateCcw } from "lucide-react";

export default function StaffDashboard() {
  const [staff, setStaff] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const navigate = useNavigate();

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [courseFilter, setCourseFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [yearLevelFilter, setYearLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const API_URL = "/api";

  const calculateAcademicYear = (enrolledYearStr, currentYearField) => {
    if (currentYearField) {
      const lower = currentYearField.toLowerCase();
      if (lower.includes('1st')) return '1st Year';
      if (lower.includes('2nd')) return '2nd Year';
      if (lower.includes('3rd')) return '3rd Year';
      if (lower.includes('4th')) return '4th Year';
    }
    if (!enrolledYearStr) return '1st Year';
    const match = enrolledYearStr.match(/\d{4}/);
    if (!match) return '1st Year';
    const startYear = parseInt(match[0], 10);
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed: 0 = Jan, 5 = June, 6 = July
    
    const activeAcademicStartYear = currentMonth >= 6 ? currentYear : currentYear - 1;
    const diff = activeAcademicStartYear - startYear;
    
    if (diff <= 0) return '1st Year';
    if (diff === 1) return '2nd Year';
    if (diff === 2) return '3rd Year';
    return '4th Year';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const staffRes = await axios.get(`${API_URL}/staff/profile`, { withCredentials: true });
        setStaff(staffRes.data);
        
        const studentsRes = await axios.get(`${API_URL}/students/admin/list`, { withCredentials: true });
        setStudents(studentsRes.data || []);

        const attRes = await axios.get(`${API_URL}/staff/attendance/${selectedDate}`, { withCredentials: true });
        const attMap = {};
        (attRes.data || []).forEach(a => attMap[a.student_id] = a.status);
        setAttendance(attMap);
      } catch (err) {
        navigate("/staff/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate, navigate]);

  const markAttendance = async (studentId, status) => {
    try {
      await axios.post(`${API_URL}/staff/attendance`, {
        student_id: studentId,
        status,
        date: selectedDate
      }, { withCredentials: true });
      setAttendance(prev => ({ ...prev, [studentId]: status }));
    } catch (err) {
      alert("Failed to mark attendance");
    }
  };

  const markAllFiltered = async (status) => {
    if (filteredStudents.length === 0) return;
    const confirmMsg = `Mark ALL ${filteredStudents.length} visible student(s) as ${status.toUpperCase()} for ${selectedDate}?`;
    if (!window.confirm(confirmMsg)) return;

    setMarkingAll(true);
    try {
      for (const student of filteredStudents) {
        await axios.post(`${API_URL}/staff/attendance`, {
          student_id: student.id,
          status,
          date: selectedDate
        }, { withCredentials: true });
      }

      const updated = { ...attendance };
      filteredStudents.forEach(s => {
        updated[s.id] = status;
      });
      setAttendance(updated);
      alert(`Marked all ${filteredStudents.length} students as ${status}!`);
    } catch (err) {
      alert("Error marking bulk attendance: " + err.message);
    } finally {
      setMarkingAll(false);
    }
  };

  const downloadPDFReport = async () => {
    try {
      const res = await axios.get(`${API_URL}/staff/students-summary`, { withCredentials: true });
      const data = res.data;

      const doc = new jsPDF("p", "pt", "a4");

      // Header Bar (Green Accent)
      doc.setFillColor(29, 74, 58);
      doc.rect(0, 0, 595.28, 80, "F");

      // Header Text (White)
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("SRI SAI INSTITUTE OF AGRICULTURAL SCIENCES", 40, 36);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("FACULTY PORTAL | STUDENT ATTENDANCE REPORT & ANALYTICS", 40, 52);

      // Metadata Info Box
      doc.setFillColor(248, 250, 252);
      doc.rect(40, 100, 515.28, 45, "F");

      doc.setTextColor(51, 65, 85);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("GENERATED BY:", 55, 118);
      doc.setFont("helvetica", "normal");
      doc.text(String(staff?.name || 'FACULTY').toUpperCase(), 135, 118);

      doc.setFont("helvetica", "bold");
      doc.text("DEPARTMENT:", 55, 132);
      doc.setFont("helvetica", "normal");
      doc.text(String(staff?.department || 'AGRICULTURE').toUpperCase(), 135, 132);

      doc.setFont("helvetica", "bold");
      doc.text("REPORT DATE:", 360, 118);
      doc.setFont("helvetica", "normal");
      const todayDate = new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      doc.text(todayDate, 435, 118);

      doc.setFont("helvetica", "bold");
      doc.text("TOTAL ENROLLED:", 360, 132);
      doc.setFont("helvetica", "normal");
      doc.text(`${data.length} Students`, 435, 132);

      const tableHeaders = [
        ["#", "Student Name", "Roll Number", "Working Days", "Days Present", "Days Absent", "Attendance %"]
      ];

      const tableRows = data.map((student, idx) => [
        idx + 1,
        student.student_name.toUpperCase(),
        student.roll_no || 'N/A',
        student.total_days,
        student.present_days,
        student.absent_days,
        `${student.percentage}%`
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 165,
        margin: { left: 40, right: 40 },
        theme: 'striped',
        headStyles: {
          fillColor: [29, 74, 58],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 30 },
          1: { fontStyle: 'bold', fontSize: 9 },
          2: { halign: 'center', fontSize: 9 },
          3: { halign: 'center', fontSize: 9 },
          4: { halign: 'center', fontSize: 9 },
          5: { halign: 'center', fontSize: 9 },
          6: { halign: 'center', fontStyle: 'bold', fontSize: 9 }
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [30, 41, 59]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        didParseCell: function(dataCell) {
          if (dataCell.column.index === 6 && dataCell.section === 'body') {
            const pct = parseFloat(dataCell.cell.raw);
            if (pct < 75.0) {
              dataCell.cell.styles.textColor = [239, 68, 68];
              dataCell.cell.styles.fontStyle = 'bold';
            } else {
              dataCell.cell.styles.textColor = [22, 163, 74];
              dataCell.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.setFont("helvetica", "normal");
        doc.text(`Page ${i} of ${totalPages}`, 297.64, 820, { align: 'center' });
        doc.text("Official Sri Sai Portal Verification Stamp", 555.28, 820, { align: 'right' });
      }

      doc.save(`Student_Attendance_Report_${selectedDate}.pdf`);

    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate and download PDF report. Please try again.");
    }
  };

  const hasActiveFilters = courseFilter !== 'all' || branchFilter !== 'all' || yearLevelFilter !== 'all' || statusFilter !== 'all';

  const resetFilters = () => {
    setCourseFilter('all');
    setBranchFilter('all');
    setYearLevelFilter('all');
    setStatusFilter('all');
    setSearchTerm('');
  };

  const filteredStudents = students
    .filter(s => 
      s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.roll_no?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(s => courseFilter === 'all' || (s.course_applied || '').toLowerCase() === courseFilter.toLowerCase())
    .filter(s => branchFilter === 'all' || (s.branch || '').toLowerCase() === branchFilter.toLowerCase())
    .filter(s => yearLevelFilter === 'all' || calculateAcademicYear(s.academic_enrolled_year, s.current_year).toLowerCase() === yearLevelFilter.toLowerCase())
    .filter(s => {
      if (statusFilter === 'all') return true;
      const currentStatus = (attendance[s.id] || 'Not Marked').toLowerCase();
      return currentStatus === statusFilter.toLowerCase();
    });

  const presentCount = filteredStudents.filter(s => (attendance[s.id] || '').toLowerCase() === 'present').length;
  const absentCount = filteredStudents.filter(s => (attendance[s.id] || '').toLowerCase() === 'absent').length;
  const notMarkedCount = filteredStudents.length - presentCount - absentCount;

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-blue animate-pulse">LOADING DASHBOARD...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="h-11 w-11 bg-white rounded-2xl p-1 flex items-center justify-center border border-gray-100 shadow-md shrink-0">
              <img src="/logo.png" alt="Sri Sai Agricultural College Logo" className="h-full w-full object-contain" />
           </div>
           <div>
              <h1 className="text-xl font-black text-ink uppercase tracking-tight">Attendance Register</h1>
              <p className="text-[10px] text-muted font-bold tracking-widest uppercase">Sri Sai Staff Portal</p>
           </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="hidden md:flex flex-col text-right">
              <span className="font-bold text-sm text-ink">{staff?.name}</span>
              <span className="text-[10px] font-black text-[#15803d] uppercase tracking-widest">{staff?.department || 'Faculty'}</span>
           </div>
           <button 
             onClick={() => { document.cookie = "staffToken=; max-age=0; path=/;"; navigate("/staff/login"); }}
             className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5"
             title="Log Out"
           >
              <LogOut size={18} />
           </button>
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
         {/* Controls Bar */}
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 focus-within:border-blue transition-all">
               <Search className="text-gray-400 shrink-0" size={18} />
               <input 
                 placeholder="Search student by name or roll number..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="bg-transparent border-none outline-none font-bold text-ink text-sm w-full"
               />
               {searchTerm && (
                 <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-ink"><X size={16} /></button>
               )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
               {/* Select Date */}
               <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</span>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-sky/40 border-none outline-none font-black text-blue px-3 py-1.5 rounded-xl text-xs uppercase cursor-pointer"
                  />
               </div>

               {/* Filter Toggle Button */}
               <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm ${showFilters || hasActiveFilters ? 'bg-[#15803d] text-white shadow-green-600/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
               >
                  <Filter size={15} />
                  Filter {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
               </button>
            </div>
         </div>

         {/* Filter Panel (Like Super Admin Panel) */}
         {showFilters && (
           <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border-2 border-green-500/20 animate-fadeIn space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                 <div>
                    <h4 className="font-black text-ink text-sm uppercase tracking-widest">Filter Students for Attendance</h4>
                    <p className="text-xs text-muted mt-0.5">Filter class by course, branch, year level, and marked status.</p>
                 </div>
                 {hasActiveFilters && (
                   <button 
                     onClick={resetFilters} 
                     className="text-xs font-black text-red-500 hover:underline flex items-center gap-1 uppercase tracking-wider"
                   >
                     <RotateCcw size={13} /> Reset Filters
                   </button>
                 )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                 {/* Course Filter */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Course</label>
                    <select 
                       className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:border-blue outline-none transition-all font-bold text-ink text-xs appearance-none"
                       value={courseFilter}
                       onChange={(e) => {
                          setCourseFilter(e.target.value);
                          if (e.target.value !== 'Ag. M.Sc.') setBranchFilter('all');
                       }}
                    >
                       <option value="all">ALL COURSES</option>
                       <option value="Ag. B.Sc.">AG. B.SC.</option>
                       <option value="Ag. M.Sc.">AG. M.SC.</option>
                    </select>
                 </div>

                 {/* Specialization Filter (if M.Sc or all) */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Specialization / Branch</label>
                    <select 
                       className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:border-blue outline-none transition-all font-bold text-ink text-xs appearance-none"
                       value={branchFilter}
                       onChange={(e) => setBranchFilter(e.target.value)}
                    >
                       <option value="all">ALL SPECIALIZATIONS</option>
                       <option value="Msc soil science">Msc Soil Science</option>
                       <option value="Msc horticulture">Msc Horticulture</option>
                       <option value="Msc agronomy">Msc Agronomy</option>
                       <option value="Msc plant breeding and genetics">Msc Plant Breeding & Genetics</option>
                       <option value="Msc zoology">Msc Zoology</option>
                       <option value="Msc chemistry">Msc Chemistry</option>
                    </select>
                 </div>

                 {/* Year Level Filter */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Academic Year</label>
                    <select 
                       className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:border-blue outline-none transition-all font-bold text-ink text-xs appearance-none"
                       value={yearLevelFilter}
                       onChange={(e) => setYearLevelFilter(e.target.value)}
                    >
                       <option value="all">ALL YEARS</option>
                       <option value="1st Year">1ST YEAR</option>
                       <option value="2nd Year">2ND YEAR</option>
                       <option value="3rd Year">3RD YEAR</option>
                       <option value="4th Year">4TH YEAR</option>
                    </select>
                 </div>

                 {/* Attendance Status Filter */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Attendance Status</label>
                    <select 
                       className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:border-blue outline-none transition-all font-bold text-ink text-xs appearance-none"
                       value={statusFilter}
                       onChange={(e) => setStatusFilter(e.target.value)}
                    >
                       <option value="all">ALL STATUSES</option>
                       <option value="Present">PRESENT ONLY</option>
                       <option value="Absent">ABSENT ONLY</option>
                       <option value="Not Marked">NOT MARKED ONLY</option>
                    </select>
                 </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
                 <div className="text-xs font-bold text-muted">
                    Showing <strong className="text-ink">{filteredStudents.length}</strong> of {students.length} students
                 </div>
                 <div className="flex gap-3">
                    <button 
                       onClick={resetFilters}
                       className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-black text-xs uppercase tracking-wider transition-all"
                    >
                       Reset
                    </button>
                    <button 
                       onClick={() => setShowFilters(false)}
                       className="px-6 py-2.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-green-500/20"
                    >
                       Apply & Close
                    </button>
                 </div>
              </div>
           </div>
         )}

         {/* Summary & Bulk Attendance Action Bar */}
         <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
               <span className="text-xs font-black text-ink uppercase tracking-wider bg-ink/5 px-4 py-2 rounded-xl">
                  {filteredStudents.length} Students
               </span>
               <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl">
                  ✓ Present: <strong>{presentCount}</strong>
               </span>
               <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                  ✗ Absent: <strong>{absentCount}</strong>
               </span>
               {notMarkedCount > 0 && (
                 <span className="text-xs font-bold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
                    ⏳ Unmarked: <strong>{notMarkedCount}</strong>
                 </span>
               )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
               {/* Quick Bulk Actions */}
               <button
                  onClick={() => markAllFiltered('Present')}
                  disabled={markingAll || filteredStudents.length === 0}
                  className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
                  title="Mark all matching students as Present"
               >
                  <Check size={15} /> Mark All Present
               </button>

               <button
                  onClick={() => markAllFiltered('Absent')}
                  disabled={markingAll || filteredStudents.length === 0}
                  className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
                  title="Mark all matching students as Absent"
               >
                  <X size={15} /> Mark All Absent
               </button>

               <button 
                  onClick={downloadPDFReport}
                  className="px-4 py-2.5 bg-blue hover:bg-ink text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 active:scale-[0.98]"
               >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  PDF Report
               </button>
            </div>
         </div>

         {/* Student List Table */}
         <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full">
                  <thead>
                     <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Student Info</th>
                        <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Course & Year</th>
                        <th className="px-6 py-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Today's Status</th>
                        <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Mark Attendance</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {filteredStudents.length === 0 ? (
                       <tr>
                         <td colSpan={4} className="px-6 py-16 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">
                           No students match the selected filter criteria.
                         </td>
                       </tr>
                     ) : (
                       filteredStudents.map(student => {
                          const yearLevel = calculateAcademicYear(student.academic_enrolled_year, student.current_year);
                          const currentStatus = attendance[student.id];

                          return (
                            <tr key={student.id} className="hover:bg-sky/20 transition-colors">
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                     <div className="h-10 w-10 rounded-xl bg-blue/10 flex items-center justify-center text-blue font-black text-sm shrink-0 overflow-hidden">
                                        {student.photo ? <img src={student.photo} className="h-full w-full object-cover" alt="" /> : (student.student_name ? student.student_name[0].toUpperCase() : 'S')}
                                     </div>
                                     <div className="flex flex-col">
                                        <span className="font-black text-ink text-sm uppercase">{student.student_name}</span>
                                        <span className="text-[10px] font-mono font-bold text-muted">{student.roll_no || 'NO ROLL NO'}</span>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                     <span className="text-xs font-bold text-ink">{student.course_applied || 'Ag. B.Sc.'}</span>
                                     <span className="text-[10px] text-muted font-semibold">
                                       {yearLevel} {student.branch ? `• ${student.branch}` : ''}
                                     </span>
                                  </div>
                               </td>
                               <td className="px-6 py-4 text-center">
                                  {currentStatus ? (
                                     <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                       currentStatus.toLowerCase() === 'present' 
                                         ? 'bg-green-100 text-green-800 border-green-200' 
                                         : 'bg-red-50 text-red-600 border-red-200'
                                     }`}>
                                        {currentStatus}
                                     </span>
                                  ) : (
                                     <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic bg-gray-50 px-3 py-1.5 rounded-xl">
                                       Not Marked
                                     </span>
                                  )}
                               </td>
                               <td className="px-6 py-4">
                                  <div className="flex items-center justify-end gap-2">
                                     <button 
                                       onClick={() => markAttendance(student.id, 'Present')}
                                       className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                         currentStatus?.toLowerCase() === 'present' 
                                           ? 'bg-green-600 text-white shadow-md shadow-green-600/30' 
                                           : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-800'
                                       }`}
                                       title="Mark Present"
                                     >
                                        <CheckCircle2 size={16} /> Present
                                     </button>
                                     <button 
                                       onClick={() => markAttendance(student.id, 'Absent')}
                                       className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                         currentStatus?.toLowerCase() === 'absent' 
                                           ? 'bg-red-600 text-white shadow-md shadow-red-600/30' 
                                           : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700'
                                       }`}
                                       title="Mark Absent"
                                     >
                                        <XCircle size={16} /> Absent
                                     </button>
                                  </div>
                               </td>
                            </tr>
                          );
                       })
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </main>
    </div>
  );
}
