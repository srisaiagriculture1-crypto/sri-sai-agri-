import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getImageUrl } from "../../utils/imageUrl";

const API_URL = "/api";

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [showPayModal, setShowPayModal] = useState(false);
  const [payData, setPayData] = useState({ type: '', amount: 0, year: '' });
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFeeType, setSelectedFeeType] = useState("Academic Fee");
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const navigate = useNavigate();


  const downloadFeeInvoice = (payment, studentData) => {
    try {
      const doc = new jsPDF("p", "pt", "a4");
      const greenColor = [21, 128, 61];

      // Header Banner
      doc.setFillColor(...greenColor);
      doc.rect(0, 0, 595.28, 90, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("SRI SAI INSTITUTE OF AGRICULTURAL SCIENCES", 40, 40);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("OFFICIAL FEE PAYMENT RECEIPT & INVOICE", 40, 58);
      doc.text("Sri Sai Agricultural College, Andhra Pradesh", 40, 72);

      const receiptNo = `INV-${new Date(payment.created_at || Date.now()).getFullYear()}-${String(payment.id || Math.floor(Math.random() * 90000 + 10000)).padStart(6, '0')}`;
      const paidDate = payment.created_at ? new Date(payment.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB');

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`RECEIPT NO: ${receiptNo}`, 555, 45, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.text(`DATE: ${paidDate}`, 555, 60, { align: "right" });
      doc.text(`STATUS: ${String(payment.status || 'APPROVED').toUpperCase()}`, 555, 75, { align: "right" });

      // Student Info Card
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(40, 110, 515.28, 85, 8, 8, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(40, 110, 515.28, 85, 8, 8, "D");

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("STUDENT DETAILS", 55, 130);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Student Name:", 55, 148);
      doc.setFont("helvetica", "normal");
      doc.text(studentData?.student_name || "N/A", 140, 148);

      doc.setFont("helvetica", "bold");
      doc.text("Roll / ID No:", 55, 164);
      doc.setFont("helvetica", "normal");
      doc.text(String(studentData?.roll_no || studentData?.id || "N/A"), 140, 164);

      doc.setFont("helvetica", "bold");
      doc.text("Course & Branch:", 55, 180);
      doc.setFont("helvetica", "normal");
      doc.text(`${studentData?.course_applied || 'B.Sc. Agriculture'} (${studentData?.branch || 'General'})`, 140, 180);

      doc.setFont("helvetica", "bold");
      doc.text("Academic Year:", 320, 148);
      doc.setFont("helvetica", "normal");
      doc.text(payment.academic_year || "1st year", 410, 148);

      doc.setFont("helvetica", "bold");
      doc.text("Contact Mobile:", 320, 164);
      doc.setFont("helvetica", "normal");
      doc.text(studentData?.mobile1 || "N/A", 410, 164);

      // Particulars Table
      const tableHeaders = [["S.NO", "FEE DESCRIPTION / CATEGORY", "ACADEMIC YEAR", "PAYMENT STATUS", "AMOUNT PAID"]];
      const tableRows = [[
        "1",
        payment.fee_type || payment.type || selectedFeeType || "Academic Fee",
        payment.academic_year || "1st year",
        String(payment.status || "APPROVED").toUpperCase(),
        `INR ${Number(payment.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      ]];

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 215,
        margin: { left: 40, right: 40 },
        theme: 'grid',
        headStyles: {
          fillColor: greenColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 40 },
          1: { fontStyle: 'bold', fontSize: 9 },
          2: { halign: 'center', fontSize: 9 },
          3: { halign: 'center', fontStyle: 'bold', textColor: [21, 128, 61], fontSize: 9 },
          4: { halign: 'right', fontStyle: 'bold', fontSize: 10 }
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [30, 41, 59]
        }
      });

      const finalY = (doc.lastAutoTable?.previous?.finalY || 270) + 25;

      // Summary Total Box
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(315, finalY, 240.28, 45, 6, 6, "F");
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(315, finalY, 240.28, 45, 6, 6, "D");

      doc.setTextColor(21, 128, 61);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL AMOUNT PAID:", 330, finalY + 27);
      doc.setFontSize(12);
      doc.text(`Rs. ${Number(payment.amount || 0).toLocaleString('en-IN')}/-`, 540, finalY + 27, { align: "right" });

      // Verification footer
      const noticeY = finalY + 75;
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("Note: This is a computer-generated fee payment receipt issued by Sri Sai Agricultural College Management.", 40, noticeY);
      doc.text("No physical signature required. Verification ID: " + Math.random().toString(36).substring(2, 10).toUpperCase(), 40, noticeY + 12);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("AUTHORISED SIGNATORY", 555, noticeY + 40, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Sri Sai Agricultural College Accounts Dept.", 555, noticeY + 52, { align: "right" });

      doc.save(`Fee_Receipt_${studentData?.roll_no || 'Student'}_${payment.fee_type || 'Fee'}.pdf`);
    } catch(e) {
      console.error("PDF generation error:", e);
      alert("Could not generate PDF invoice: " + e.message);
    }
  };

  const getFeeStats = (fee, type) => {
    let allocated = 0;
    let directPaid = 0;

    const normType = (type || '').toLowerCase().trim();

    if (normType === 'academic fee' || normType === 'college fee') {
      allocated = Number(fee.total_fee || 0);
      directPaid = Number(fee.paid_amount || 0);
    } else if (normType === 'hostel fee') {
      allocated = Number(fee.hostel_fee || 0);
      directPaid = Number(fee.hostel_fee_paid || 0);
    } else if (normType === 'examination fee' || normType === 'exam fee') {
      allocated = Number(fee.exam_fee || 0);
      directPaid = Number(fee.exam_fee_paid || 0);
    } else if (normType === 'practical fee') {
      allocated = Number(fee.practical_fee || 0);
      directPaid = Number(fee.practical_fee_paid || 0);
    } else if (normType === 'travelling expenses' || normType === 'travelling fee') {
      allocated = Number(fee.travelling_fee || 0);
      directPaid = Number(fee.travelling_fee_paid || 0);
    }

    const matchedProofs = (student?.payment_proofs || []).filter(p => {
      const pType = (p.fee_type || '').toLowerCase().trim();
      const pYear = (p.academic_year || '').toLowerCase().trim();
      const fYear = (fee.academic_year || '').toLowerCase().trim();

      const typeMatches = pType === normType || 
        (normType.includes('academic') && (pType.includes('academic') || pType.includes('college'))) ||
        (normType.includes('college') && (pType.includes('academic') || pType.includes('college'))) ||
        (normType.includes('travelling') && pType.includes('travelling')) ||
        (normType.includes('exam') && pType.includes('exam'));

      return typeMatches && pYear === fYear;
    });

    const pendingPaid = matchedProofs
      .filter(p => (p.status || '').toLowerCase() === 'pending')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const paid = directPaid;
    const balance = Math.max(0, allocated - paid);

    return { allocated, paid, pendingPaid, balance };
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/students/profile`, { withCredentials: true });
        if (res.data) {
          setStudent(res.data);
        } else {
          navigate("/portal/login");
        }
      } catch (err) {
        console.error("Fetch profile failed", err);
        navigate("/portal/login");
      }
    };
    fetchProfile();
  }, [navigate]);

   const openPayModal = (type, amount, year) => {
      setPayData({ type, amount, maxAmount: amount, year });
      setShowPayModal(true);
      // Re-fetch to get latest balances from Admin Panel
      axios.get(`${API_URL}/students/profile`, { withCredentials: true })
         .then(res => setStudent(res.data))
         .catch(err => console.error("Sync failed", err));
   };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate PNG
    if (file.type !== "image/png") {
      alert("Only PNG files are allowed!");
      e.target.value = "";
      return;
    }

    // Validate 100KB
    if (file.size > 100 * 1024) {
      alert("File size must be less than 100KB!");
      e.target.value = "";
      return;
    }

    setScreenshot(file);
  };

  const handlePaymentSubmit = async () => {
    if (!screenshot) return alert("Please upload payment screenshot");
    
    setUploading(true);
    const formData = new FormData();
    formData.append("screenshot", screenshot);
    formData.append("fee_type", payData.type);
    formData.append("amount", payData.amount);
    formData.append("academic_year", payData.year);

    try {
      await axios.post(`${API_URL}/student-fees/upload-proof`, formData, { withCredentials: true });
      alert("Payment proof uploaded successfully! Submitted for Management Approval.");
      setShowPayModal(false);
      setScreenshot(null);
      // Re-fetch profile to update pending status & history immediately
      const profileRes = await axios.get(`${API_URL}/students/profile`, { withCredentials: true });
      setStudent(profileRes.data);
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  if (!student) return <div className="min-h-screen flex items-center justify-center bg-white text-blue font-bold">Loading Sri Sai Portal...</div>;

  return (
    <div className="min-h-screen bg-[#F3F4F9] flex font-sora text-ink">
      
      {/* --- Sidebar (Desktop) --- */}
      <aside className="hidden lg:flex w-72 bg-blue flex-col shadow-2xl">
        <div className="p-8 border-b border-white/10">
          <div className="flex items-center gap-3">
             <div className="h-11 w-11 bg-white rounded-xl p-1 flex items-center justify-center shadow-lg shrink-0">
                <img src="/logo.png" alt="Sri Sai Agricultural College Logo" className="h-full w-full object-contain" />
             </div>
             <div className="flex flex-col">
                <span className="text-white font-bold text-sm tracking-tight leading-tight">Sri Sai Institute</span>
                <span className="text-white/50 text-[10px] uppercase font-black tracking-widest">Agri Sciences</span>
             </div>
          </div>
        </div>
        
        <nav className="p-6 space-y-2 flex-grow">
          <SidebarLink active={activeTab === 'home'} icon="Home" label="Home" onClick={() => setActiveTab('home')} />
          <SidebarLink active={activeTab === 'profile'} icon="User" label="My Profile" onClick={() => setActiveTab('profile')} />
          <SidebarLink active={activeTab === 'fees'} icon="Wallet" label="Fee Payments" onClick={() => setActiveTab('fees')} />
        </nav>

        <div className="p-6 border-t border-white/10">
          <button 
            onClick={() => { document.cookie = "studentToken=; max-age=0; path=/;"; navigate("/"); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all font-bold text-sm"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-grow flex flex-col h-screen overflow-y-auto">
        
        {/* Top Header */}
        <header className="bg-white px-8 py-5 flex items-center justify-between sticky top-0 z-10 border-b border-gray-100">
           <div className="flex flex-col">
              <h1 className="text-xl font-black text-ink uppercase tracking-tight">
                {activeTab === 'home' ? 'Student Dashboard' : activeTab.toUpperCase()}
              </h1>
              <p className="text-[10px] text-muted font-bold tracking-widest -mt-0.5">SRI SAI AGRICULTURAL COLLEGE</p>
           </div>

           <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end mr-2">
                 <span className="text-sm font-bold text-ink">{student.student_name}</span>
                 <span className="text-[10px] text-muted font-bold tracking-widest uppercase">ROLL NO: {student.roll_no}</span>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-sky flex items-center justify-center border-2 border-white shadow-lg overflow-hidden">
                 {student.photo ? <img src={student.photo} className="h-full w-full object-cover" /> : <span className="text-blue font-black text-lg">{student.student_name[0]}</span>}
              </div>
           </div>
        </header>

        <div className="p-8">
          
          {activeTab === 'home' && (
            <div className="animate-fadeIn space-y-10">
              
              {/* Profile Card Summary */}
              <div className="bg-gradient-to-r from-blue to-[#1e40af] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
                 <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-110"></div>
                 <div className="relative z-1 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <div className="h-20 w-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-1">
                          {student.photo ? <img src={student.photo} className="h-full w-full object-cover rounded-[20px]" /> : <div className="h-full w-full flex items-center justify-center text-3xl font-black">{student.student_name[0]}</div>}
                       </div>
                       <div className="flex flex-col">
                          <h2 className="text-2xl font-black tracking-tight">{student.student_name}</h2>
                          <p className="text-white/60 text-sm font-medium tracking-wide uppercase">Roll No: {student.roll_no} | Batch: {student.course_applied}</p>
                       </div>
                    </div>
                    <button onClick={() => setActiveTab('profile')} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10">
                       <ArrowRight size={24} />
                    </button>
                 </div>
              </div>

              <section>
                 <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Essentials</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <PortalCard color="green" icon="BarChart3" title="Attendance" subtitle={`${student.attendance_percentage || "0.00"}%`} detail="Click to View Attendance Records" onClick={() => setShowAttendanceModal(true)} />
                    <PortalCard color="pink" icon="Wallet" title="Fee Payments" subtitle="View Details" detail="Check Dues & Payments" onClick={() => setActiveTab('fees')} />
                 </div>
              </section>

              

            </div>
          )}

          {activeTab === 'fees' && (
            <div className="animate-fadeIn space-y-8">
               <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm text-center">
                  <div className="h-20 w-20 bg-sky rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue shadow-lg shadow-blue/10">
                     <Wallet size={40} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl font-black text-ink mb-2">Sri Sai Fee Portal</h2>
                  <p className="text-muted font-medium mb-8">Select a Fee Category to View Details & Upload Payment Screenshots</p>
                  
                  {/* Showcased Fee Breakdown Structure from Admin */}
                  {student.student_fees && student.student_fees.length > 0 && (
                     <div className="mb-8 p-6 bg-gray-50/70 rounded-2xl border border-gray-100 text-left">
                        <h3 className="text-xs font-black uppercase tracking-wider text-ink mb-3 flex items-center gap-2">
                           <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Official Fee Structure Breakdown
                        </h3>
                        <div className="overflow-x-auto rounded-xl border border-gray-200/60 bg-white">
                           <table className="w-full text-xs text-left border-collapse">
                              <thead className="bg-[#15803d] text-white">
                                 <tr>
                                    <th className="p-3 text-[9px] font-black uppercase tracking-widest">Academic Year</th>
                                    <th className="p-3 text-[9px] font-black uppercase tracking-widest">Total Fee</th>
                                    <th className="p-3 text-[9px] font-black uppercase tracking-widest">Committed Fee</th>
                                    <th className="p-3 text-[9px] font-black uppercase tracking-widest">Admission Fee</th>
                                    <th className="p-3 text-[9px] font-black uppercase tracking-widest">Practical Fee</th>
                                    <th className="p-3 text-[9px] font-black uppercase tracking-widest">Hostel</th>
                                    <th className="p-3 text-[9px] font-black uppercase tracking-widest">Travelling Expenses</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                 {student.student_fees.map((fee, fIdx) => (
                                    <tr key={fIdx} className="hover:bg-gray-50/50">
                                       <td className="p-3 font-black text-ink uppercase text-[10px]">{fee.academic_year}</td>
                                       <td className="p-3 font-bold text-gray-700">₹{Number(fee.breakdown_total_fee || 0).toLocaleString()}</td>
                                       <td className="p-3 font-bold text-gray-700">₹{Number(fee.committed_fee || 0).toLocaleString()}</td>
                                       <td className="p-3 font-bold text-gray-700">₹{Number(fee.admission_fee || 0).toLocaleString()}</td>
                                       <td className="p-3 font-bold text-gray-700">₹{Number(fee.breakdown_practical_fee || 0).toLocaleString()}</td>
                                       <td className="p-3 font-bold text-gray-700">₹{Number(fee.breakdown_hostel_fee || 0).toLocaleString()}</td>
                                       <td className="p-3 font-bold text-gray-700">₹{Number(fee.breakdown_travelling_fee || 0).toLocaleString()}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                     <PaymentOption 
                        icon="Book" 
                        title="Academic Fees" 
                        detail="College Tuition Fees" 
                        active={selectedFeeType === 'Academic Fee'}
                        onClick={() => setSelectedFeeType('Academic Fee')}
                     />
                     <PaymentOption 
                        icon="FlaskConical" 
                        title="Practical Fees" 
                        detail="Laboratory & Lab Charges" 
                        active={selectedFeeType === 'Practical Fee'}
                        onClick={() => setSelectedFeeType('Practical Fee')}
                     />
                     <PaymentOption 
                        icon="Home" 
                        title="Hostel Fees" 
                        detail="Hostel & Mess Charges" 
                        active={selectedFeeType === 'Hostel Fee'}
                        onClick={() => setSelectedFeeType('Hostel Fee')}
                     />
                     <PaymentOption 
                        icon="Bus" 
                        title="Travelling Expenses" 
                        detail="Transport & Travel Fee" 
                        active={selectedFeeType === 'Travelling Expenses'}
                        onClick={() => setSelectedFeeType('Travelling Expenses')}
                     />
                     <PaymentOption 
                        icon="FileText" 
                        title="Examination Fees" 
                        detail="Regular & Supplementary" 
                        active={selectedFeeType === 'Examination Fee'}
                        onClick={() => setSelectedFeeType('Examination Fee')}
                     />
                  </div>
               </div>

               {/* Dynamic Fee Summary / Year breakdown */}
               <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                  <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <span className="font-black text-sm uppercase tracking-wider text-ink">
                           {selectedFeeType} Structure
                        </span>
                        <span className="px-3 py-1 bg-blue/10 text-blue text-[10px] font-black rounded-full uppercase tracking-wider">
                           Active Category
                        </span>
                     </div>
                     <span className="px-3 py-1 bg-green-100 text-green-600 text-[10px] font-black rounded-full uppercase">Live Status</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="border-b border-gray-100">
                             <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Academic Year</th>
                             <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Allocated Amount</th>
                             <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Paid (Receipts)</th>
                             {selectedFeeType === 'Academic Fee' && (
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Paid Amount</th>
                             )}
                             <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                             <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          {student.student_fees?.map((fee, idx) => {
                             const { allocated, paid, pendingPaid, balance } = getFeeStats(fee, selectedFeeType);
                             
                             return (
                               <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-8 py-6">
                                     <span className="font-black text-ink text-sm uppercase">{fee.academic_year}</span>
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                     {allocated === 0 ? (
                                       <span className="text-[10px] font-bold text-gray-300 uppercase italic">Not Allocated</span>
                                     ) : (
                                       <span className="text-sm font-black text-ink">₹{allocated.toLocaleString()}</span>
                                     )}
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                     <div className="flex flex-col items-center">
                                        <span className="text-sm font-black text-green-600">₹{paid.toLocaleString()}</span>
                                        {pendingPaid > 0 && (
                                          <span className="text-[9px] font-bold text-yellow-500 mt-0.5">₹{pendingPaid.toLocaleString()} pending verification</span>
                                        )}
                                     </div>
                                  </td>
                                  {selectedFeeType === 'Academic Fee' && (
                                     <td className="px-8 py-6 text-center">
                                        <span className="text-xs font-bold text-gray-400">₹{Number(fee.paid_amount || 0).toLocaleString()}</span>
                                     </td>
                                  )}
                                  <td className="px-8 py-6 text-center">
                                     {allocated === 0 ? (
                                       <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[9px] font-black uppercase rounded-lg border border-gray-100">Waiting for Admin</span>
                                     ) : pendingPaid > 0 ? (
                                       <div className="flex flex-col items-center">
                                          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[9px] font-black uppercase rounded-lg border border-amber-300 shadow-sm animate-pulse">Wait for Management Approval</span>
                                          <span className="text-[9px] font-bold text-amber-600 mt-1">₹{pendingPaid.toLocaleString()} payment submitted</span>
                                       </div>
                                     ) : balance <= 0 ? (
                                       <span className="px-3 py-1 bg-green-100 text-green-600 text-[9px] font-black uppercase rounded-lg border border-green-200">Fully Paid</span>
                                     ) : (
                                       <div className="flex flex-col items-center">
                                          <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[9px] font-black uppercase rounded-lg border border-orange-100">Due Remaining</span>
                                          <span className="text-[9px] font-bold text-orange-500 mt-1">₹{balance.toLocaleString()} due</span>
                                       </div>
                                     )}
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                     {balance > 0 && allocated > 0 ? (
                                       <button 
                                          onClick={() => openPayModal(selectedFeeType, balance, fee.academic_year)}
                                          className="px-5 py-2 bg-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-ink transition-all shadow-lg shadow-blue/20"
                                       >
                                          Pay Now
                                       </button>
                                     ) : allocated > 0 ? (
                                       <div className="flex items-center justify-center">
                                          <span className="px-5 py-2 bg-[#10b981] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-200/50 flex items-center gap-2 border border-green-600/20">
                                             <Check size={12} strokeWidth={4} /> Fully Paid
                                          </span>
                                       </div>
                                     ) : (
                                       <span className="text-[10px] font-bold text-gray-300 uppercase italic">N/A</span>
                                     )}
                                  </td>
                               </tr>
                             );
                          })}
                       </tbody>
                    </table>
                  </div>
               </div>

               {/* Detailed Dynamic Fee Breakdown / History List */}
               <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                  <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                     <h3 className="font-black text-sm uppercase tracking-wider text-ink">
                        {selectedFeeType} Payment History
                     </h3>
                     <span className="px-3 py-1 bg-blue/10 text-blue text-[10px] font-black rounded-full uppercase tracking-wider">
                        Submission Log
                     </span>
                  </div>
                  
                  <div className="p-8">
                     {(() => {
                        const uploadedProofs = (student.payment_proofs || []).filter(p => p.fee_type === selectedFeeType);
                         
                         const officialPayments = [];
                         if (selectedFeeType === 'Academic Fee' && student.student_fees) {
                            student.student_fees.forEach(fee => {
                               const officialPaid = Number(fee.paid_amount || 0);
                               if (officialPaid > 0) {
                                  const hasUploadedApproved = uploadedProofs.some(p => 
                                     p.academic_year.toLowerCase().trim() === fee.academic_year.toLowerCase().trim() && 
                                     p.status.toLowerCase() === 'approved'
                                  );
                                  
                                  if (!hasUploadedApproved) {
                                     officialPayments.push({
                                        id: `official-${fee.id}`,
                                        fee_type: 'Academic Fee',
                                        amount: officialPaid,
                                        academic_year: fee.academic_year,
                                        screenshot: null,
                                        status: 'Approved',
                                        is_official: true,
                                        created_at: fee.updated_at || student.created_at
                                     });
                                  }
                               }
                            });
                         }

                         const feeHistory = [...uploadedProofs, ...officialPayments].sort((a, b) => 
                            new Date(b.created_at) - new Date(a.created_at)
                         );
                        
                        if (feeHistory.length === 0) {
                           return (
                              <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-100 max-w-lg mx-auto">
                                 <div className="h-14 w-14 bg-sky rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                 </div>
                                 <h4 className="font-black text-sm text-ink mb-1">No payment history found</h4>
                                 <p className="text-xs text-muted max-w-xs mx-auto">
                                    You haven't submitted any payment screenshots for {selectedFeeType} yet. If you pay outstanding dues, submit the PNG receipt to get approval.
                                 </p>
                              </div>
                           );
                        }

                        return (
                           <div className="space-y-4">
                              {feeHistory.map((history, hIdx) => {
                                 const uploadDate = new Date(history.created_at).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                 });

                                 let statusColor = "bg-yellow-50 text-yellow-600 border border-yellow-200";
                                 if (history.is_official) {
                                    statusColor = "bg-indigo-50 text-indigo-600 border border-indigo-200";
                                 } else if (history.status.toLowerCase() === 'approved') {
                                    statusColor = "bg-green-50 text-green-600 border border-green-200";
                                 } else if (history.status.toLowerCase() === 'rejected') {
                                    statusColor = "bg-red-50 text-red-600 border border-red-200";
                                 }

                                 return (
                                    <div key={hIdx} className="p-6 bg-white border border-gray-100 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-blue/30 hover:shadow-lg hover:shadow-blue/5 transition-all">
                                       <div className="flex items-center gap-4">
                                          <div className="h-12 w-12 bg-sky rounded-2xl flex items-center justify-center text-blue shadow-inner font-bold">
                                             ₹
                                          </div>
                                          <div>
                                             <div className="flex items-center gap-2">
                                                <h4 className="font-black text-lg text-ink">₹{Number(history.amount || 0).toLocaleString()}</h4>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${statusColor}`}>
                                                   {history.is_official ? 'College Ledger' : (history.status?.toLowerCase() === 'pending' ? 'Wait for Management Approval' : history.status)}
                                                </span>
                                             </div>
                                             <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-0.5">
                                                Academic Year: {history.academic_year} | {history.is_official ? 'Verified Ledger Record' : `Submitted: ${uploadDate}`}
                                             </p>
                                          </div>
                                       </div>
                                       
                                       <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                          {history.screenshot && (
                                             <a 
                                                href={getImageUrl(history.screenshot)} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="px-5 py-2.5 bg-sky hover:bg-blue hover:text-white text-blue border border-sky rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center flex-grow md:flex-grow-0"
                                             >
                                                View Screenshot
                                             </a>
                                          )}
                                          <button
                                             type="button"
                                             onClick={() => downloadFeeInvoice({ ...history, fee_type: selectedFeeType }, student)}
                                             className="px-5 py-2.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 shadow-md flex-grow md:flex-grow-0"
                                          >
                                             <Download size={14} /> Download Invoice
                                          </button>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        );
                     })()}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="animate-fadeIn max-w-4xl mx-auto space-y-10">
               <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-10">
                  <div className="h-40 w-40 rounded-[2.5rem] bg-sky border-4 border-white shadow-2xl overflow-hidden shrink-0">
                     {student.photo ? <img src={student.photo} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-6xl font-black text-blue">{student.student_name[0]}</div>}
                  </div>
                  <div className="flex-grow text-center md:text-left">
                     <h2 className="text-4xl font-black text-ink mb-1">{student.student_name}</h2>
                     <p className="text-blue font-bold tracking-widest uppercase text-xs mb-6">Roll No: {student.roll_no || String(student.id).toUpperCase()}</p>
                     
                     <div className="flex flex-wrap justify-center md:justify-start gap-4">
                        <ProfileTag label="Course" value={student.course_applied} color="blue" />
                        <ProfileTag label="Branch" value={student.branch} color="orange" />
                        <ProfileTag label="Medium" value={student.medium} color="purple" />
                     </div>
                  </div>
               </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <InfoSection title="Personal Details">
                     <InfoField 
                        label="Date of Birth" 
                        value={student.dob ? (() => {
                           const d = new Date(student.dob);
                           return isNaN(d.getTime()) ? student.dob : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
                        })() : 'Not Provided'} 
                     />
                     <InfoField label="Gender" value={student.gender || 'Not Provided'} />
                     <InfoField label="Nationality" value={(student.nationality === 'null' || !student.nationality) ? 'Indian' : student.nationality} />
                  </InfoSection>
                  <InfoSection title="Parent Details">
                     <InfoField label="Father's Name" value={student.father_name} />
                     <InfoField label="Mother's Name" value={student.mother_name} />
                  </InfoSection>
                  <InfoSection title="Contact Details">
                     <InfoField label="Mobile" value={student.mobile1} />
                     <InfoField label="Alternate" value={student.mobile2 || 'N/A'} />
                     <InfoField label="Email" value={student.email} />
                  </InfoSection>
                  <InfoSection title="Address" full>
                     <p className="text-sm font-bold text-ink leading-relaxed">
                        {student.door_no}, {student.village}, {student.mandal}, {student.district} - {student.pin}
                     </p>
                  </InfoSection>
               </div>

               {/* Fee Breakdown Structure in Profile */}
               {student.student_fees && student.student_fees.length > 0 && (
                  <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm p-6 space-y-6">
                     <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                              <RefreshCw size={20} />
                           </div>
                           <div>
                              <h3 className="font-black text-sm uppercase tracking-wider text-ink">FEE BREAKDOWN</h3>
                              <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Yearly Fee Structure Specified by College Management</p>
                           </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase border border-green-200">Verified Record</span>
                     </div>

                     <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-xs">
                        <table className="w-full text-xs text-left border-collapse bg-white">
                           <thead className="bg-[#15803d] text-white">
                              <tr>
                                 <th className="p-4 text-[10px] font-black uppercase tracking-widest">Academic Year</th>
                                 <th className="p-4 text-[10px] font-black uppercase tracking-widest">Total Fee</th>
                                 <th className="p-4 text-[10px] font-black uppercase tracking-widest">Committed Fee</th>
                                 <th className="p-4 text-[10px] font-black uppercase tracking-widest">Admission Fee</th>
                                 <th className="p-4 text-[10px] font-black uppercase tracking-widest">Practical Fee</th>
                                 <th className="p-4 text-[10px] font-black uppercase tracking-widest">Hostel</th>
                                 <th className="p-4 text-[10px] font-black uppercase tracking-widest">Travelling Expenses</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100">
                              {['1st year', '2nd year', '3rd year', '4th year'].map((year) => {
                                 const fee = student.student_fees.find(f => (f.academic_year || '').toLowerCase() === year.toLowerCase()) || {
                                    academic_year: year, breakdown_total_fee: 0, committed_fee: 0, admission_fee: 0, breakdown_practical_fee: 0, breakdown_hostel_fee: 0, breakdown_travelling_fee: 0
                                 };
                                 return (
                                    <tr key={year} className="hover:bg-gray-50/50">
                                       <td className="p-4 font-black text-ink uppercase text-xs tracking-wider">{year}</td>
                                       <td className="p-4 font-bold text-gray-700">₹{Number(fee.breakdown_total_fee || 0).toLocaleString()}</td>
                                       <td className="p-4 font-bold text-gray-700">₹{Number(fee.committed_fee || 0).toLocaleString()}</td>
                                       <td className="p-4 font-bold text-gray-700">₹{Number(fee.admission_fee || 0).toLocaleString()}</td>
                                       <td className="p-4 font-bold text-gray-700">₹{Number(fee.breakdown_practical_fee || 0).toLocaleString()}</td>
                                       <td className="p-4 font-bold text-gray-700">₹{Number(fee.breakdown_hostel_fee || 0).toLocaleString()}</td>
                                       <td className="p-4 font-bold text-gray-700">₹{Number(fee.breakdown_travelling_fee || 0).toLocaleString()}</td>
                                    </tr>
                                 );
                              })}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}
            </div>
          )}

        </div>
      </main>

      {/* --- Payment Modal --- */}
      {showPayModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-ink/40 animate-fadeIn">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-slideUp">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue/10 rounded-xl flex items-center justify-center text-blue">
                       <Wallet size={20} />
                    </div>
                    <div>
                       <h3 className="font-black text-ink leading-tight">Pay {payData.type}</h3>
                       <p className="text-[10px] text-muted font-black uppercase tracking-widest">{payData.year}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowPayModal(false)} className="p-2 hover:bg-red-50 text-red-400 rounded-xl transition-all">
                    <X size={20} />
                 </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                 {/* Year Selector */}
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Academic Year</label>
                    <select 
                       value={payData.year} 
                       onChange={(e) => {
                          const year = e.target.value;
                          // Robust finding logic
                          const fee = student.student_fees?.find(f => 
                             f.academic_year.toLowerCase().trim() === year.toLowerCase().trim()
                          );
                          
                          let amount = 0;
                           if (fee) {
                              const { balance } = getFeeStats(fee, payData.type);
                              amount = balance;
                           }
                           
                           setPayData({ ...payData, year, amount, maxAmount: amount });
                       }}
                       className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-ink focus:outline-none focus:ring-2 focus:ring-blue/20 transition-all"
                    >
                       <option value="" disabled>Select Year</option>
                       <option value="1st year">1st Year</option>
                       <option value="2nd year">2nd Year</option>
                       <option value="3rd year">3rd Year</option>
                       <option value="4th year">4th Year</option>
                    </select>
                 </div>

                 {/* Amount Alert & Partial Payment Input */}
                 <div className="bg-blue/5 border border-blue/10 p-6 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black text-blue uppercase tracking-widest">Total Remaining Due</p>
                          <h3 className="text-xl font-black text-ink mt-0.5">₹{Number(payData.maxAmount || payData.amount || 0).toLocaleString()}</h3>
                       </div>
                       <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-xl border border-amber-200">
                          Partial Payment Enabled
                       </span>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Enter Amount You Are Paying Now (₹)</label>
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-blue text-lg">₹</span>
                          <input 
                             type="number" 
                             className="w-full pl-9 pr-4 py-4 bg-white border border-gray-200 rounded-2xl font-black text-blue text-xl focus:border-blue outline-none transition-all shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                             value={payData.amount === 0 || payData.amount === '0' ? '' : payData.amount}
                             placeholder={`Enter amount up to ₹${payData.maxAmount || payData.amount || 0}`}
                             onFocus={(e) => e.target.select()}
                             onChange={(e) => {
                                setPayData({ ...payData, amount: e.target.value });
                             }}
                          />
                       </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                       <button
                          type="button"
                          onClick={() => setPayData({ ...payData, amount: payData.maxAmount })}
                          className="px-3 py-1.5 bg-blue text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-ink transition-all"
                       >
                          Pay Full Due (₹{Number(payData.maxAmount || 0).toLocaleString()})
                       </button>
                       {Number(payData.maxAmount) > 0 && (
                          <button
                             type="button"
                             onClick={() => setPayData({ ...payData, amount: Math.round(Number(payData.maxAmount) / 2) })}
                             className="px-3 py-1.5 bg-white text-blue border border-blue/20 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue/5 transition-all"
                          >
                             Pay Half (₹{Math.round(Number(payData.maxAmount) / 2).toLocaleString()})
                          </button>
                       )}
                    </div>

                    {Number(payData.amount) > 0 && Number(payData.amount) < Number(payData.maxAmount) && (
                       <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between text-[11px]">
                          <span className="font-bold text-amber-700">Remaining Balance after this payment:</span>
                          <span className="font-black text-amber-800">₹{Math.max(0, Number(payData.maxAmount) - Number(payData.amount)).toLocaleString()}</span>
                       </div>
                    )}

                    {payData.maxAmount === 0 && payData.year && <p className="text-[10px] font-bold text-green-500 uppercase text-center mt-2">No Dues for this year! ✨</p>}
                 </div>

                 {/* QR Code Section */}
                 <div className="text-center space-y-3">
                    <div className="h-48 w-48 bg-white border-4 border-sky rounded-3xl mx-auto flex items-center justify-center p-2 shadow-inner">
                       <img 
                          src="/payment_qr.png" 
                          alt="Payment QR" 
                          className="h-full w-full object-contain" 
                          onError={(e) => {
                             e.target.src = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=43564790508@sbi&pn=SRI%20SAI%20INSTITUTE%20OF%20AGRICULTURE&cu=INR";
                          }} 
                       />
                    </div>
                    <div className="flex flex-col items-center">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">UPI ID</span>
                       <span className="text-sm font-bold text-ink">43564790508@sbi</span>
                    </div>
                 </div>

                 {/* Bank Details Section */}
                 <div className="bg-sky/30 p-6 rounded-3xl border border-sky/50 space-y-4">
                    <div className="flex items-center gap-3 border-b border-sky pb-3">
                       <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue shadow-sm font-bold text-xs">SBI</div>
                       <span className="font-black text-[10px] text-blue uppercase tracking-widest">Official Bank Details</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4">
                       <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Bank Name</p>
                          <p className="text-xs font-bold text-ink">State Bank Of India</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">IFSC Code</p>
                          <p className="text-xs font-bold text-blue">SBIN0018251</p>
                       </div>
                       <div className="col-span-2">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Account Number</p>
                          <p className="text-base font-black text-ink tracking-widest">43564790508</p>
                       </div>
                       <div className="col-span-2">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Account Name</p>
                          <p className="text-xs font-bold text-ink">SRI SAI INSTITUTE OF AGRICULTURE</p>
                       </div>
                    </div>
                 </div>

                 {/* Upload Section */}
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Upload Payment Screenshot (PNG only, Max 100KB)</label>
                    <div className="relative group">
                       <input 
                          type="file" 
                          accept=".png" 
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                       />
                       <div className={`p-6 border-2 border-dashed rounded-3xl text-center transition-all ${screenshot ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50 group-hover:border-blue'}`}>
                          {screenshot ? (
                            <div className="flex items-center justify-center gap-3 text-green-600">
                               <Check size={20} />
                               <span className="text-sm font-bold">Screenshot Attached!</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                               <Plus size={24} />
                               <span className="text-xs font-bold uppercase tracking-widest">Click to Upload PNG</span>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100">
                 <button 
                    disabled={!screenshot || uploading}
                    onClick={handlePaymentSubmit}
                    className="w-full bg-blue text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue/20 hover:bg-ink transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                 >
                    {uploading ? 'Processing...' : 'Confirm Payment Submission'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* --- Attendance History Modal --- */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-ink/40 animate-fadeIn">
           <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-slideUp">
              {/* Modal Header */}
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-600">
                       <BarChart3 size={20} />
                    </div>
                    <div>
                       <h3 className="font-black text-ink leading-tight">Attendance Logs</h3>
                       <p className="text-[10px] text-muted font-black uppercase tracking-widest">Roll No: {student.roll_no}</p>
                    </div>
                 </div>
                 <button 
                    onClick={() => setShowAttendanceModal(false)} 
                    className="p-2 hover:bg-red-50 text-red-400 rounded-xl transition-all"
                 >
                    <X size={20} />
                 </button>
              </div>

              {/* Attendance Statistics Grid */}
              <div className="px-8 pt-6 grid grid-cols-3 gap-4">
                 <div className="bg-gray-50 p-4 rounded-2xl text-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Days</p>
                    <h4 className="text-xl font-black text-ink">
                       {student.attendance_records?.length || 0}
                    </h4>
                 </div>
                 <div className="bg-green-50 p-4 rounded-2xl text-center border border-green-100">
                    <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-1">Present</p>
                    <h4 className="text-xl font-black text-green-600">
                       {student.attendance_records?.filter(r => r.status === 'Present').length || 0}
                    </h4>
                 </div>
                 <div className="bg-red-50 p-4 rounded-2xl text-center border border-red-100">
                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Absent</p>
                    <h4 className="text-xl font-black text-red-600">
                       {student.attendance_records?.filter(r => r.status === 'Absent').length || 0}
                    </h4>
                 </div>
              </div>

              {/* Scrollable Timeline List */}
              <div className="p-8 space-y-4 overflow-y-auto max-h-[50vh]">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Daily Log Timeline</label>
                 
                 {!student.attendance_records || student.attendance_records.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                       <p className="text-sm font-bold">No attendance records found.</p>
                       <p className="text-[10px] uppercase tracking-widest mt-1">Live record will sync once marked by faculty.</p>
                    </div>
                 ) : (
                    <div className="space-y-3">
                       {student.attendance_records.map((record, index) => {
                          const dateObj = new Date(record.date);
                          const formattedDate = dateObj.toLocaleDateString('en-IN', {
                             weekday: 'long', 
                             day: 'numeric', 
                             month: 'short', 
                             year: 'numeric'
                          });
                          
                          const isPresent = record.status === 'Present';
                          
                          return (
                             <div 
                                key={index} 
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                   isPresent 
                                   ? 'bg-green-50/30 border-green-100 hover:bg-green-50/50' 
                                   : 'bg-red-50/30 border-red-100 hover:bg-red-50/50'
                                }`}
                             >
                                <div className="flex flex-col">
                                   <span className="text-xs font-bold text-ink">{formattedDate}</span>
                                   {record.remarks && (
                                      <span className="text-[10px] text-muted font-medium mt-0.5">Note: {record.remarks}</span>
                                   )}
                                </div>
                                <div>
                                   {isPresent ? (
                                      <span className="px-3 py-1.5 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-xl border border-green-200 flex items-center gap-1.5 shadow-sm shadow-green-100">
                                         <Check size={12} strokeWidth={3} /> Present
                                      </span>
                                   ) : (
                                      <span className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-black uppercase rounded-xl border border-red-600 flex items-center gap-1.5 shadow-lg shadow-red-500/20">
                                         <X size={12} strokeWidth={3} /> Absent
                                      </span>
                                   )}
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 )}
              </div>

              {/* Close Footer Action */}
              <div className="p-8 bg-gray-50 border-t border-gray-100">
                 <button 
                    onClick={() => setShowAttendanceModal(false)}
                    className="w-full bg-ink text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:bg-gray-800 active:scale-[0.98]"
                 >
                    Close Log View
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// --- Helper Components ---

function SidebarLink({ active, icon, label, onClick }) {
  const Icon = require('lucide-react')[icon];
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${active ? 'bg-white/10 text-white shadow-inner' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
    >
      <Icon size={20} /> {label}
    </button>
  );
}

function PortalCard({ color, icon, title, subtitle, detail, onClick }) {
  const Icon = require('lucide-react')[icon];
  const colors = {
    green: "bg-[#D4F1E1] text-[#1D4A3A]",
    pink: "bg-[#FDE2E4] text-[#7B2E35]",
    purple: "bg-[#E6E1F9] text-[#42377A]",
    sky: "bg-[#E1F3F9] text-[#1E485A]"
  };
  const iconColors = {
    green: "bg-[#7BB28D]",
    pink: "bg-[#E76D7B]",
    purple: "bg-[#8072C7]",
    sky: "bg-[#5FB4D1]"
  };

  return (
    <div onClick={onClick} className={`${colors[color]} p-8 rounded-[2.5rem] shadow-sm hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden group`}>
       <div className={`h-12 w-12 ${iconColors[color]} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-black/5`}>
          <Icon size={24} strokeWidth={2.5} />
       </div>
       <h4 className="font-bold text-lg mb-1">{title}</h4>
       <div className="flex flex-col">
          <span className="text-2xl font-black tracking-tight">{subtitle}</span>
          <span className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-2">{detail}</span>
       </div>
    </div>
  );
}

function ToolCard({ icon, title, onClick }) {
  const Icon = require('lucide-react')[icon];
  return (
    <div onClick={onClick} className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center cursor-pointer hover:bg-sky/30 transition-colors">
       <div className="h-16 w-16 bg-[#F3F4F9] text-blue rounded-[2rem] flex items-center justify-center mb-6">
          <Icon size={32} />
       </div>
       <span className="font-black text-xl text-ink tracking-tight">{title}</span>
    </div>
  );
}

function PaymentOption({ icon, title, detail, active, onClick }) {
  const Icon = require('lucide-react')[icon];
  return (
    <div 
      onClick={onClick} 
      className={`p-8 border rounded-3xl transition-all cursor-pointer group text-center flex flex-col items-center ${
        active 
          ? 'border-blue bg-sky/30 shadow-lg shadow-blue/5 scale-[1.02]' 
          : 'border-gray-100 bg-white hover:border-blue hover:bg-sky/10'
      }`}
    >
       <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
         active ? 'bg-blue text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-blue group-hover:text-white'
       }`}>
          <Icon size={24} />
       </div>
       <h4 className={`font-black text-sm mb-1 ${active ? 'text-blue' : 'text-ink'}`}>{title}</h4>
       <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-60">{detail}</p>
    </div>
  );
}

function ProfileTag({ label, value, color }) {
  const colors = {
    blue: "bg-blue/10 text-blue border-blue/20",
    orange: "bg-orange/10 text-orange border-orange/20",
    purple: "bg-purple-100 text-purple-600 border-purple-200"
  };
  return (
    <div className={`px-5 py-2 rounded-2xl border ${colors[color]} flex flex-col`}>
       <span className="text-[8px] uppercase font-black tracking-[0.2em] mb-0.5 opacity-60">{label}</span>
       <span className="text-sm font-black">{value}</span>
    </div>
  );
}

function InfoSection({ title, children, full }) {
  return (
    <div className={`bg-white rounded-3xl p-8 border border-gray-100 shadow-sm ${full ? 'md:col-span-2' : ''}`}>
       <h3 className="text-xs font-black text-blue uppercase tracking-widest mb-6 pb-2 border-b border-gray-50">{title}</h3>
       <div className="space-y-4">{children}</div>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="flex flex-col">
       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
       <span className="text-sm font-bold text-ink">{value}</span>
    </div>
  );
}

function CourseCard({ initials, title, teacher, color }) {
  const colors = {
    sky: "bg-sky text-blue",
    green: "bg-green-100 text-green-700",
    pink: "bg-pink-100 text-pink-700"
  };
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all cursor-pointer">
       <div className={`h-16 w-16 ${colors[color]} rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-black/5`}>{initials}</div>
       <div className="flex flex-col">
          <h4 className="font-black text-ink text-sm uppercase leading-tight group-hover:text-blue transition-colors">{title}</h4>
          <span className="text-[11px] font-bold text-muted mt-1">{teacher}</span>
       </div>
    </div>
  );
}

function CalendarItem({ type, title, date, color }) {
  const colors = {
    blue: "bg-blue text-white shadow-blue/20",
    orange: "bg-orange text-white shadow-orange/20"
  };
  return (
    <div className="pl-12 relative group">
       <div className={`absolute left-[7px] top-1 h-5 w-5 rounded-full border-4 border-white ${colors[color]} z-10 transition-transform group-hover:scale-125`}></div>
       <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 group-hover:bg-sky/40 transition-colors">
          <span className={`text-[8px] font-black uppercase tracking-[0.2em] mb-1 block ${color === 'blue' ? 'text-blue' : 'text-orange'}`}>{type}</span>
          <h4 className="font-black text-ink text-base mb-2">{title}</h4>
          <div className={`inline-block px-4 py-1 rounded-lg text-[10px] font-bold ${color === 'blue' ? 'bg-blue/10 text-blue' : 'bg-orange/10 text-orange'}`}>
             {date}
          </div>
       </div>
    </div>
  );
}

function LogOut(props) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>; }
function ArrowRight(props) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>; }
function Wallet(props) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path></svg>; }
function X(props) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>; }
function Plus(props) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>; }
function Check(props) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>; }
function BarChart3(props) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg>; }
function RefreshCw(props) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 16h5v5"></path></svg>; }
function Download(props) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>; }
