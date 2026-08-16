import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getImageUrl } from '../../utils/imageUrl';
import { 
  Users, 
  BookOpen, 
  Award, 
  History, 
  LayoutDashboard, 
  Image as ImageIcon, 
  LogOut, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  ChevronRight, 
  Bell, 
  Settings,
  X,
  Filter,
  FileSpreadsheet,
  Eye,
  EyeOff,
  Check,
  Download,
  UserCheck,
  CheckCircle2,
  XCircle,
  CreditCard,
  ExternalLink,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Clock,
  PhoneCall,
  MessageSquare,
  MessageCircle,
  FileText
} from 'lucide-react';

const API_URL = '/api';

export default function AdminDashboard() {
  const excelInputRef = useRef(null);
  const [isAdmin, setIsAdmin] = useState(() => !!localStorage.getItem("adminToken"));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("students");
  const [siteSettings, setSiteSettings] = useState({});
  const [regFields, setRegFields] = useState([]);
  const [students, setStudents] = useState([]);
  const [excelImports, setExcelImports] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentFees, setStudentFees] = useState([]);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [data, setData] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedCourse, setAppliedCourse] = useState("all");
  const [appliedYear, setAppliedYear] = useState("all");
  const [appliedBatch, setAppliedBatch] = useState("all");

  const [formData, setFormData] = useState({});
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [galleryFilter, setGalleryFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('all');
  const [studentBranchFilter, setStudentBranchFilter] = useState('all');
  const [showStudentFilters, setShowStudentFilters] = useState(false);
  const [filterAcademicYear, setFilterAcademicYear] = useState('all');
  const [filterYearLevel, setFilterYearLevel] = useState('all');
  const [staffList, setStaffList] = useState([]);
  
  // Fee Management Notifications state
  const [paymentProofs, setPaymentProofs] = useState([]);
  const [proofFilter, setProofFilter] = useState('Pending');
  const [previewProof, setPreviewProof] = useState(null);
  const [feeNoticeBanner, setFeeNoticeBanner] = useState(null);

  const calculateAcademicYear = (enrolledYearStr) => {
    if (!enrolledYearStr) return '1st Year';
    const match = enrolledYearStr.match(/\d{4}/);
    if (!match) return '1st Year';
    const startYear = parseInt(match[0], 10);
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed: 0 = Jan, 5 = June, 6 = July
    
    // Academic session starts in July (month index 6)
    const activeAcademicStartYear = currentMonth >= 6 ? currentYear : currentYear - 1;
    const diff = activeAcademicStartYear - startYear;
    
    if (diff <= 0) return '1st Year';
    if (diff === 1) return '2nd Year';
    if (diff === 2) return '3rd Year';
    return '4th Year';
  };

  const downloadFeeInvoice = (payment, studentData) => {
    try {
      const doc = new jsPDF("p", "pt", "a4");
      const greenColor = [21, 128, 61];

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

      const tableHeaders = [["S.NO", "FEE DESCRIPTION / CATEGORY", "ACADEMIC YEAR", "PAYMENT STATUS", "AMOUNT PAID"]];
      const tableRows = [[
        "1",
        payment.fee_type || payment.type || "Academic Fee",
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

  const parseDateForInput = (dob) => {
    if (!dob) return '';
    let dateObj = new Date(dob);
    if (isNaN(dateObj.getTime()) && typeof dob === 'string' && dob.includes('-')) {
      const parts = dob.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) dateObj = new Date(dob); // YYYY-MM-DD
        else if (parts[2].length === 4) dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // DD-MM-YYYY
      }
    }
    if (!isNaN(dateObj.getTime())) return dateObj.toISOString().split('T')[0];
    return '';
  };

  const tabs = [
    { id: 'enquiries', label: 'Admission Enquiries', icon: PhoneCall },
    { id: 'online-registrations', label: 'Online Registrations', icon: UserCheck },
    { id: 'students', label: 'Student Accounts', icon: Users },
    { id: 'feeNotifications', label: 'Fee Notifications', icon: Bell },
    { id: 'imports', label: 'Excel Imports', icon: FileSpreadsheet },
    { id: 'staff', label: 'Staff Accounts', icon: Users },
    { id: 'hero', label: 'Hero Slider Management', icon: LayoutDashboard },
    { id: 'faculty', label: 'Faculty Management', icon: Users },
    { id: 'courses', label: 'Course Management', icon: BookOpen },
    { id: 'ranks', label: 'Rankings & Results', icon: Award },
    { id: 'stories', label: 'Success Stories', icon: History },
    { id: 'gallery', label: 'Gallery Management', icon: ImageIcon },
    { id: 'settings', label: 'Site Settings & Form', icon: Settings },
  ];

  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem("adminToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setIsAdmin(false);
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/admin/auth`, { headers, withCredentials: true });
      if (res.data && res.data.authenticated) {
        setIsAdmin(true);
      } else {
        localStorage.removeItem("adminToken");
        setIsAdmin(false);
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("adminToken");
        setIsAdmin(false);
      }
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      let endpoint = `/${activeTab}`;
      const res = await axios.get(`${API_URL}${endpoint}`, { withCredentials: true });
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/settings`, { withCredentials: true });
      const settingsMap = {};
      res.data.forEach(s => settingsMap[s.setting_key] = s.setting_value);
      setSiteSettings(settingsMap);
    } catch (err) { console.error(err); }
  };

  const fetchRegFields = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/registration-fields`, { withCredentials: true });
      setRegFields(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchStaff = async () => {
    try {
      const res = await axios.get(`${API_URL}/staff/admin/list`, { withCredentials: true });
      setStaffList(res.data);
    } catch (err) { console.error(err); }
  };

  const saveSetting = async (key, value) => {
    try {
      await axios.post(`${API_URL}/admin/settings`, { key, value }, { withCredentials: true });
      fetchSettings();
      alert('Setting updated successfully!');
    } catch (err) { alert('Failed to update setting'); }
  };

  const saveFields = async (fields) => {
    try {
      await axios.post(`${API_URL}/admin/registration-fields`, { fields }, { withCredentials: true });
      fetchRegFields();
      alert('Registration fields updated!');
    } catch (err) { alert('Failed to update fields'); }
  };

  const deleteField = async (id) => {
    if (window.confirm('Delete this field?')) {
      try {
        await axios.delete(`${API_URL}/admin/registration-fields/${id}`, { withCredentials: true });
        fetchRegFields();
      } catch (err) { alert('Failed to delete field'); }
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === 'settings') {
      fetchSettings();
      fetchRegFields();
    }
  }, [isAdmin, activeTab]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const fetchExcelImports = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/students/admin/imports`, { withCredentials: true });
      setExcelImports(res.data);
    } catch (err) {
      console.error("Fetch excel imports failed");
    }
  }, []);

  const fetchPaymentProofs = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/student-fees/admin/proofs`, { withCredentials: true });
      setPaymentProofs(res.data || []);
    } catch (err) {
      console.error("Fetch payment proofs failed", err);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/students/admin/list`);
      setStudents(res.data);
    } catch (err) {
      console.error("Fetch students failed");
    }
  }, []);

  const handleOpenStudentAccount = async (proof) => {
    try {
      setLoading(true);
      const studentsRes = await axios.get(`${API_URL}/students/admin/list`);
      setStudents(studentsRes.data);

      const targetStudent = studentsRes.data.find(s => String(s.id) === String(proof.student_id));
      if (targetStudent) {
        setSelectedStudent(targetStudent);
        let mapped = { ...targetStudent };
        if (mapped.dob) mapped.dob = parseDateForInput(mapped.dob);
        setFormData(mapped);

        const feeRes = await axios.get(`${API_URL}/student-fees/${targetStudent.id}`);
        setStudentFees(feeRes.data);
        setActiveTab("students");
        setViewMode("student-manage");
        setFeeNoticeBanner({
          studentName: targetStudent.student_name,
          feeType: proof.fee_type,
          amount: proof.amount,
          year: proof.academic_year,
          screenshot: proof.screenshot
        });
      } else {
        alert(`Student profile for ${proof.student_name || 'ID ' + proof.student_id} not found in database.`);
      }
    } catch (err) {
      alert("Failed to open student account: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProof = async (proof) => {
    try {
      setLoading(true);
      if ((proof.status || '').toLowerCase() !== 'approved') {
        await axios.put(`${API_URL}/student-fees/proofs/${proof.id}/status`, { status: 'Approved' }, { withCredentials: true });
      }
      await fetchPaymentProofs();
      await handleOpenStudentAccount(proof);
    } catch (err) {
      alert("Failed to approve payment proof: " + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  const handleRejectProof = async (proofId) => {
    if (!window.confirm("Reject this payment proof submission?")) return;
    try {
      setLoading(true);
      await axios.put(`${API_URL}/student-fees/proofs/${proofId}/status`, { status: 'Rejected' }, { withCredentials: true });
      alert("Payment proof rejected.");
      fetchPaymentProofs();
    } catch (err) {
      alert("Failed to reject proof: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPaymentProofs();

      if (activeTab === "students") {
        fetchStudents();
      } else if (activeTab === "feeNotifications") {
        fetchPaymentProofs();
      } else if (activeTab === "imports") {
        fetchExcelImports();
      } else if (activeTab === "staff") {
        fetchStaff();
      } else {
        fetchData();
      }
    }
  }, [isAdmin, activeTab, fetchData, refresh, fetchExcelImports, fetchPaymentProofs, fetchStudents]);

  useEffect(() => {
    const fetchFees = async () => {
      if (selectedStudent) {
        try {
          const res = await axios.get(`${API_URL}/student-fees/${selectedStudent.id}`);
          setStudentFees(res.data);
        } catch (err) {
          console.error("Fetch fees failed");
        }
      }
    };
    fetchFees();
  }, [selectedStudent]);



  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/admin/login`, { username, password }, { withCredentials: true });
      if (res.data && res.data.token) {
        localStorage.setItem("adminToken", res.data.token);
      }
      setIsAdmin(true);
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.message || 'Invalid credentials');
      } else if (err.request) {
        setError('Server connection failed. Is the backend running on port 5000?');
      } else {
        setError('Login error: ' + err.message);
      }
    }
    setLoading(false);
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotInput) return;
    setForgotLoading(true);
    setForgotErrorMsg('');
    setForgotSuccessMsg('');
    try {
      const res = await axios.post(`${API_URL}/admin/forgot-password`, { username: forgotInput, email: forgotInput });
      setForgotSuccessMsg(res.data.message || 'Reset link created! Check your email or follow instructions.');
    } catch (err) {
      setForgotErrorMsg(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await axios.delete(`${API_URL}/${activeTab}/${id}`, { withCredentials: true });
      setRefresh(r => r + 1);
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (activeTab === 'imports') {
      if (!file) return alert("Please select an Excel file (.xlsx or .csv) to import.");
      
      const confirmImport = window.confirm(`Are you sure you want to import students from "${file.name}"?`);
      if (!confirmImport) return;

      const excelFormData = new FormData();
      excelFormData.append("file", file);

      try {
        setLoading(true);
        const res = await axios.post(`${API_URL}/students/admin/import`, excelFormData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true
        });

        const { message, importedCount, skippedCount, skippedStudents } = res.data;
        let alertMsg = message || `Successfully imported ${importedCount} students.`;
        if (skippedCount > 0) {
          alertMsg += `\n\nSkipped ${skippedCount} student(s):`;
          skippedStudents.forEach((s) => {
            alertMsg += `\n• ${s.name || "Unknown"}${s.email ? " (" + s.email + ")" : ""}: ${s.reason}`;
          });
        }
        alert(alertMsg);
        setFormData({});
        setFile(null);
        setEditingId(null);
        setViewMode('list');
        fetchExcelImports();
        fetchStudents();
      } catch (err) {
        console.error("Excel import error:", err);
        const errMsg = err.response?.data?.message || err.message || "Failed to parse and import Excel file.";
        alert(`Failed to import Excel file.\n\nReason: ${errMsg}`);
      } finally {
        setLoading(false);
      }
      return;
    }

    const payload = new FormData();
    Object.keys(formData).forEach(key => {
      if (!['_id', 'id', 'image', 'created_at', 'existing_image'].includes(key)) {
        payload.append(key, formData[key]);
      }
    });

    if (activeTab === 'ranks' || activeTab === 'testimonials') {
      const sName = formData.name || formData.studentName || formData.student_name || '';
      if (sName) {
        payload.set('student_name', sName);
        payload.set('studentName', sName);
        payload.set('name', sName);
      }
    }
    if (activeTab === 'ranks') {
      const htNo = formData.hallTicketNumber || formData.hall_ticket_number || '';
      if (htNo) {
        payload.set('hall_ticket_number', htNo);
        payload.set('hallTicketNumber', htNo);
      }
    }

    if (activeTab === 'courses' && formData.details) {
      const lines = formData.details.split('\n').map(l => l.trim()).filter(Boolean);
      payload.set('details', JSON.stringify(lines));
    }

    if (!payload.has('initials') && (activeTab === 'stories' || activeTab === 'faculty' || activeTab === 'testimonials')) {
      const name = formData.name || formData.studentName || formData.student_name || '';
      if (name) {
        const generatedInitials = name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
        payload.append('initials', generatedInitials);
      }
    }

    if (file) {
      payload.append(activeTab === 'students' ? 'photo' : 'image', file);
    }

    try {
      const endpoint = `/${activeTab}`;
      const method = editingId ? 'put' : 'post';
      let url = editingId ? `${API_URL}${endpoint}/${editingId}` : `${API_URL}${endpoint}`;
      
      if (activeTab === 'students' && !editingId) {
        url = `${API_URL}/students/register`;
      }

      const res = await axios({
        method,
        url,
        data: payload,
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      if (activeTab === 'students' && !editingId && res.data.studentId) {
        await axios.put(`${API_URL}/student-fees/admin/update/${res.data.studentId}`, { fees: studentFees }, { withCredentials: true });
      }

      setFormData({});
      setFile(null);
      setEditingId(null);
      setViewMode('list');
      setRefresh(r => r + 1);
      alert(editingId ? 'Successfully updated' : 'Successfully added');
    } catch (err) {
      console.error("Action error:", err);
      alert(err.response?.data?.message || 'Operation failed');
    }
  };



  const handleEdit = (item) => {
    setEditingId(item.id || item._id);
    let mapped = { ...item };
    
    // Format Date of Birth for HTML date input (YYYY-MM-DD)
    if (activeTab === 'students' && mapped.dob) {
      mapped.dob = parseDateForInput(mapped.dob);
    }

    if (activeTab === 'testimonials' || activeTab === 'ranks') {
       const sName = item.student_name || item.studentName || item.name || '';
       mapped.name = sName;
       mapped.studentName = sName;
       mapped.student_name = sName;
    }
    
    if (activeTab === 'ranks') {
       const htNo = item.hall_ticket_number || item.hallTicketNumber || '';
       mapped.hallTicketNumber = htNo;
       mapped.hall_ticket_number = htNo;
    }
    
    if (activeTab === 'courses' && item.details) {
      try {
        const arr = typeof item.details === 'string' ? JSON.parse(item.details) : item.details;
        mapped.details = Array.isArray(arr) ? arr.join('\n') : item.details;
      } catch { mapped.details = item.details; }
    }
    if (activeTab === 'hero' && item.h1) {
      mapped.h1 = Array.isArray(item.h1) ? JSON.stringify(item.h1) : item.h1;
    }

    if (activeTab === 'gallery') {
      mapped.label = item.label;
      mapped.sub_label = item.sub_label;
      mapped.category = item.category;
      mapped.type = item.type;
    }

    if (item.image) {
      mapped.existing_image = item.image;
    }

    delete mapped.image;
    delete mapped.created_at;

    setFormData(mapped);
    setViewMode('form');
  };

  const logout = async () => {
    localStorage.removeItem("adminToken");
    try {
      await axios.post(`${API_URL}/admin/logout`, {}, { withCredentials: true });
    } catch (err) {}
    setIsAdmin(false);
  };

  const handleSync = async () => {
    if (!window.confirm("This will import default website content for any empty sections. It will NOT delete your existing uploads. Continue?")) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/admin/sync`, {}, { withCredentials: true });
      const details = res.data.details ? Object.entries(res.data.details).map(([k, v]) => `• ${k}: ${v}`).join('\n') : "";
      alert(`${res.data.message || "Sync completed!"}\n\n${details}`);
      setRefresh(prev => prev + 1);
    } catch (err) {
      alert("Sync failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const confirmImport = window.confirm(`Are you sure you want to import students from "${file.name}"?`);
    if (!confirmImport) {
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/students/admin/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
      });
      
      const { message, importedCount, skippedCount, skippedStudents } = res.data;
      let alertMsg = message || `Successfully imported ${importedCount} students.`;
      if (skippedCount > 0) {
        alertMsg += `\n\nSkipped ${skippedCount} student(s):`;
        skippedStudents.forEach((s) => {
          alertMsg += `\n• ${s.name || "Unknown"}${s.email ? " (" + s.email + ")" : ""}: ${s.reason}`;
        });
      }
      alert(alertMsg);
      setRefresh(prev => prev + 1);
      fetchExcelImports();
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert("Import failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6 font-sora">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10 border border-gray-100">
          <div className="text-center mb-8">
             <div className="w-20 h-20 bg-white rounded-2xl p-1.5 mx-auto mb-4 flex items-center justify-center shadow-lg border border-gray-100">
                <img src="/logo.png" alt="Sri Sai Agricultural College Logo" className="h-full w-full object-contain" />
             </div>
             <h2 className="text-2xl font-bold text-ink">Super Admin Panel</h2>
             <p className="text-gray-400 text-sm mt-1">
               {showForgotPassword ? 'Enter your username or email to reset password' : 'Please enter your credentials to continue'}
             </p>
          </div>

          {showForgotPassword ? (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
              {forgotSuccessMsg && (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-medium border border-green-100">
                  {forgotSuccessMsg}
                </div>
              )}
              {forgotErrorMsg && (
                <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-medium border border-red-100">
                  {forgotErrorMsg}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Username or Email
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue/20 focus:border-blue focus:outline-none transition-all" 
                  placeholder="admin or admin@example.com"
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={forgotLoading}
                className="w-full bg-ink text-white py-4 rounded-xl font-bold hover:bg-blue transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                {forgotLoading ? 'Sending Reset Request...' : 'Send Password Reset Request'}
              </button>
              <div className="text-center pt-2">
                <button 
                  type="button" 
                  onClick={() => { setShowForgotPassword(false); setForgotSuccessMsg(''); setForgotErrorMsg(''); }}
                  className="text-xs font-bold text-gray-500 hover:text-ink transition-colors"
                >
                  ← Back to Super Admin Sign In
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">{error}</div>}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Username</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue/20 focus:border-blue focus:outline-none transition-all" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                  <button 
                    type="button" 
                    onClick={() => { setShowForgotPassword(true); setError(''); }}
                    className="text-xs font-bold text-blue hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue/20 focus:border-blue focus:outline-none transition-all pr-12" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-ink text-white py-4 rounded-xl font-bold hover:bg-blue transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const activeTabLabel = tabs.find(t => t.id === activeTab)?.label;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sora">
      <aside className="w-72 bg-ink text-white flex flex-col sticky top-0 h-screen shadow-2xl z-20">
        <div className="p-8 border-b border-white/10 flex items-center gap-4">
          <div className="w-11 h-11 bg-white rounded-xl p-1 flex items-center justify-center shadow-lg shrink-0">
             <img src="/logo.png" alt="Sri Sai Agricultural College Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Super Admin Panel</h1>
            <p className="text-[10px] text-white/50 uppercase font-black tracking-widest">Control Center</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto scrollbar-hide">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 ml-2">Navigation</p>
          {(() => {
            const pendingCount = paymentProofs.filter(p => (p.status || '').toLowerCase() === 'pending').length;
            return tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setViewMode('list');
                  setEditingId(null);
                  setFormData({});
                  setFile(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 group ${activeTab === tab.id ? 'bg-blue text-white shadow-lg shadow-blue/20' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                <tab.icon size={18} className={`${activeTab === tab.id ? 'text-white' : 'text-white/40 group-hover:text-white'} transition-colors`} />
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.id === 'feeNotifications' && pendingCount > 0 && (
                  <span className="px-2.5 py-0.5 text-[10px] font-black bg-red-500 text-white rounded-full animate-bounce shadow-md">
                    {pendingCount}
                  </span>
                )}
                {activeTab === tab.id && <ChevronRight size={14} className="opacity-50" />}
              </button>
            ));
          })()}
        </nav>

        <div className="p-6 border-t border-white/10">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all group"
          >
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-10 backdrop-blur-md bg-white/80">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-ink">{activeTabLabel}</h2>
            <div className="h-4 w-[1px] bg-gray-200"></div>
            <p className="text-xs text-muted font-medium">Dashboard / {activeTabLabel}</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input placeholder="Search entries..." className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue/10 focus:border-blue focus:outline-none transition-all w-64" />
              </div>
              
              {activeTab === 'students' && (
                <>
                  <button 
                    onClick={() => excelInputRef.current.click()}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl font-bold text-xs hover:bg-amber-100 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span className="hidden sm:inline">Import Students</span>
                  </button>
                  <input 
                    type="file"
                    ref={excelInputRef}
                    onChange={handleExcelImport}
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                  />
                </>
              )}

              <button className="relative w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                <Bell size={18} className="text-muted" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            </div>
            
            <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
               <div className="text-right">
                  <p className="text-xs font-bold text-ink">Administrator</p>
                  <p className="text-[10px] text-muted">Super User</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-sky border border-blue/20 flex items-center justify-center text-blue font-bold">A</div>
            </div>
          </div>
        </header>

        <div className="p-10 max-w-6xl w-full mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
               <h3 className="text-2xl font-bold text-ink">{viewMode === 'list' ? `Existing ${activeTabLabel}` : (editingId ? `Edit ${activeTabLabel}` : `Add New ${activeTabLabel}`)}</h3>
               <p className="text-sm text-muted mt-1">Manage and update your website content efficiently</p>
            </div>
            
            <div className="flex gap-3">
              {activeTab !== 'enquiries' && activeTab !== 'staff' && activeTab !== 'feeNotifications' && activeTab !== 'online-registrations' && activeTab !== 'settings' && activeTab !== 'imports' && (
                <button 
                  onClick={() => {
                    if (viewMode === 'form' || viewMode === 'student-manage') {
                      setViewMode('list');
                      setEditingId(null);
                      setFormData({});
                      setFile(null);
                    } else {
                      setViewMode('form');
                      if (activeTab === 'students') {
                        setStudentFees([
                          { academic_year: '1st year', total_fee: 0, committed_fee: 0, admission_fee: 0, practical_fee: 0, hostel_fee: 0, travelling_fee: 0 },
                          { academic_year: '2nd year', total_fee: 0, committed_fee: 0, admission_fee: 0, practical_fee: 0, hostel_fee: 0, travelling_fee: 0 },
                          { academic_year: '3rd year', total_fee: 0, committed_fee: 0, admission_fee: 0, practical_fee: 0, hostel_fee: 0, travelling_fee: 0 },
                          { academic_year: '4th year', total_fee: 0, committed_fee: 0, admission_fee: 0, practical_fee: 0, hostel_fee: 0, travelling_fee: 0 },
                        ]);
                      }
                    }
                  }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 ${viewMode === 'form' ? 'bg-white text-red-500 border border-red-100' : 'bg-blue text-white hover:bg-ink'}`}
                >
                  {viewMode === 'form' ? <><X size={18} /> Back to List</> : <><Plus size={18} /> Create New {activeTabLabel}</>}
                </button>
              )}
            </div>
          </div>

          {viewMode === 'form' && activeTab === 'hero' && (
            <div className="bg-white rounded-3xl shadow-xl shadow-ink/5 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="p-8 border-b border-gray-50 flex items-center gap-3 bg-gray-50/30">
                <div className="w-10 h-10 bg-blue/10 rounded-lg flex items-center justify-center text-blue">
                   <LayoutDashboard size={20} />
                </div>
                <div>
                   <h4 className="font-bold text-ink">Hero Section Configuration</h4>
                   <p className="text-[10px] text-muted uppercase font-black tracking-widest">Main Landing Content</p>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Small Tag</label>
                  <input required placeholder="Admissions Open 2026" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, tag: e.target.value})} value={formData.tag || ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Heading lines (JSON array)</label>
                  <input required placeholder='["Line 1", "Line 2"]' className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, h1: e.target.value})} value={formData.h1 || ''} />
                </div>
                <div className="space-y-2 md:col-span-2">
                   <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                   <textarea required className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all h-24" onChange={e => setFormData({...formData, description: e.target.value})} value={formData.description || ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Motto Text</label>
                  <input required placeholder="Nurturing the future of agriculture" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, motto: e.target.value})} value={formData.motto || ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Button 1 Label</label>
                  <input placeholder="Apply Now" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, btn1_label: e.target.value})} value={formData.btn1_label || ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Button 1 Link</label>
                  <input placeholder="#contact" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, btn1_href: e.target.value})} value={formData.btn1_href || ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Button 2 Label</label>
                  <input placeholder="Explore More" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, btn2_label: e.target.value})} value={formData.btn2_label || ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Button 2 Link</label>
                  <input placeholder="/programs" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, btn2_href: e.target.value})} value={formData.btn2_href || ''} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Background Gradient (CSS)</label>
                  <input placeholder="linear-gradient(...)" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, bg_gradient: e.target.value})} value={formData.bg_gradient || ''} />
                </div>
                <div className="md:col-span-2">
                   <div className="p-10 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 text-center space-y-4 hover:border-blue/50 hover:bg-blue/5 transition-all">
                      {formData.existing_image && (
                        <img src={getImageUrl(formData.existing_image)} className="h-32 mx-auto rounded-xl mb-4 shadow-md" alt="Current hero" onError={e => e.target.style.display = 'none'} />
                      )}
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto text-blue">
                         <ImageIcon size={32} />
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="block w-full text-xs text-gray-400 file:mr-4 file:py-3 file:px-8 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-ink file:text-white hover:file:bg-blue file:transition-all file:cursor-pointer" 
                        onChange={e => setFile(e.target.files[0])} 
                      />
                   </div>
                </div>
                <div className="md:col-span-2">
                  <button type="submit" className="w-full bg-blue text-white py-5 rounded-2xl font-bold text-lg hover:bg-ink transition-all active:scale-[0.98] shadow-xl shadow-blue/20">
                    {editingId ? 'Update Hero Slide' : 'Create New Slide'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {viewMode === 'form' && activeTab !== 'hero' ? (
            <div className={activeTab === 'students' ? 'animate-fadeIn' : 'bg-white rounded-3xl shadow-xl shadow-ink/5 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500'}>
              <form onSubmit={handleSubmit} className={activeTab === 'students' ? 'p-0' : 'p-10'}>
                {activeTab === 'students' ? (
                  <div className="flex justify-between items-center mb-10 p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-2 bg-blue opacity-20"></div>
                     <div className="flex items-center gap-8 flex-grow">
                        <div className="relative h-24 w-24 rounded-[2rem] bg-sky flex items-center justify-center overflow-hidden border-4 border-white shadow-xl group cursor-pointer hover:scale-105 transition-all">
                           {file ? (
                             <img src={URL.createObjectURL(file)} className="h-full w-full object-cover" alt="Preview" />
                           ) : (
                             <span className="text-blue font-black text-3xl">S</span>
                           )}
                           <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                              <Plus className="text-white" size={24} />
                           </div>
                           <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files[0])} />
                        </div>
                        <div>
                           <h2 className="text-3xl font-black text-ink leading-tight">{formData.student_name || 'NEW STUDENT'}</h2>
                           <p className="text-muted font-bold text-[10px] uppercase tracking-[0.3em]">CREATE STUDENT ACCOUNT</p>
                        </div>
                     </div>
                     <button 
                        type="button"
                        onClick={() => { setViewMode('list'); setEditingId(null); setFormData({}); setFile(null); }}
                        className="flex items-center gap-3 px-8 py-4 bg-white text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/5 hover:bg-red-50 transition-all border border-red-50 shrink-0"
                     >
                        <X size={18} /> Back to List
                     </button>
                  </div>
                ) : (
                  <div className="p-8 border-b border-gray-50 flex items-center gap-3 bg-gray-50/30">
                    <div className="w-10 h-10 bg-blue/10 rounded-lg flex items-center justify-center text-blue">
                       {editingId ? <Edit3 size={20} /> : <Plus size={20} />}
                    </div>
                    <div>
                       <h4 className="font-bold text-ink">{editingId ? 'Update Information' : 'Entry Details'}</h4>
                       <p className="text-[10px] text-muted uppercase font-black tracking-widest">Please fill all required fields</p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {activeTab === 'faculty' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                        <input required placeholder="Dr. John Doe" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, name: e.target.value})} value={formData.name || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Department / Subject</label>
                        <input required placeholder="Agriculture / Agronomy / Science" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, department: e.target.value})} value={formData.department || ''} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Designation & Experience</label>
                        <input required placeholder="12+ Years Experience · Senior Lead Faculty" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, experience: e.target.value})} value={formData.experience || ''} />
                      </div>
                    </>
                  )}

                  {activeTab === 'courses' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Course Title</label>
                        <input required placeholder="B.Sc Agriculture" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, title: e.target.value})} value={formData.title || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Stream</label>
                        <select required className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, stream: e.target.value})} value={formData.stream || ''}>
                          <option value="">Select Stream</option>
                          <option value="Agri">Agriculture</option>
                          <option value="Horti">Horticulture</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Badge Label</label>
                        <input placeholder="Agriculture Stream" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, badge: e.target.value})} value={formData.badge || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Eligibility</label>
                        <input placeholder="Intermediate/Higher Secondary Pass in Science" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, eligibility: e.target.value})} value={formData.eligibility || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Seats Label</label>
                        <input placeholder="40 Seats — Limited" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, seats_label: e.target.value})} value={formData.seats_label || ''} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Short Description</label>
                        <input required placeholder="Brief overview of the course" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, description: e.target.value})} value={formData.description || ''} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Branches / Subjects (one per line)</label>
                        <textarea
                          placeholder={'Msc Soil Science\nMsc Horticulture\nMsc Agronomy\nMsc Plant Breeding & Genetics'}
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all h-36"
                          onChange={e => setFormData({...formData, details: e.target.value})}
                          value={formData.details || ''}
                        />
                      </div>
                    </>
                  )}

                  {activeTab === 'ranks' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Student Name</label>
                        <input required placeholder="e.g. R. Rahul" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, name: e.target.value, studentName: e.target.value, student_name: e.target.value})} value={formData.name || formData.studentName || formData.student_name || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Hall Ticket / Roll No</label>
                        <input required placeholder="e.g. AG2491" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, hallTicketNumber: e.target.value, hall_ticket_number: e.target.value})} value={formData.hallTicketNumber || formData.hall_ticket_number || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Rank / Achievement</label>
                        <input required placeholder="e.g. Distinction / Top Researcher / State 1st" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, rank: e.target.value})} value={formData.rank || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Program / Exam Name</label>
                        <input required placeholder="e.g. B.Sc Agri / M.Sc Agri" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, exam: e.target.value})} value={formData.exam || ''} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Stream / Specialization</label>
                        <input placeholder="e.g. Agri Science / Biological Sci" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, stream: e.target.value})} value={formData.stream || ''} />
                      </div>
                    </>
                  )}

                  {activeTab === 'stories' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Student Name</label>
                        <input required placeholder="Name" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, name: e.target.value})} value={formData.name || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Achievement</label>
                        <input required placeholder="Rank 45" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, place: e.target.value})} value={formData.place || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                        <input list="categories" required className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, category: e.target.value})} value={formData.category || ''} />
                        <datalist id="categories">
                          <option value="jee">JEE Mains</option>
                          <option value="neet">NEET achievers</option>
                          <option value="intermediate">Board Toppers</option>
                        </datalist>
                      </div>
                    </>
                  )}

                  {activeTab === 'testimonials' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Student Name</label>
                        <input required placeholder="Name" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, studentName: e.target.value})} value={formData.studentName || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Achievement</label>
                        <input required placeholder="Course / Year" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, achievement: e.target.value})} value={formData.achievement || ''} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Quote</label>
                        <textarea required className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all h-24" onChange={e => setFormData({...formData, quote: e.target.value})} value={formData.quote || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Initials</label>
                        <input required placeholder="KR" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, initials: e.target.value})} value={formData.initials || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Stars (1-5)</label>
                        <input type="number" min="1" max="5" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, stars: e.target.value})} value={formData.stars || 5} />
                      </div>
                    </>
                  )}

                  {activeTab === 'gallery' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Asset Label</label>
                        <input required placeholder="Activity Title" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, label: e.target.value})} value={formData.label || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Sub Label / Date</label>
                        <input required placeholder="Short description" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, sub_label: e.target.value})} value={formData.sub_label || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                        <select required className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all appearance-none" onChange={e => setFormData({...formData, category: e.target.value})} value={formData.category || ''}>
                            <option value="">Select Category</option>
                            <option value="internship">Internship</option>
                            <option value="field-visit">Field Visit</option>
                            <option value="event">Event</option>
                            <option value="trip">Trip</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Media Type</label>
                        <select required className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all appearance-none" onChange={e => setFormData({...formData, type: e.target.value})} value={formData.type || 'image'}>
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                        </select>
                      </div>
                    </>
                  )}
                  
                  {activeTab === 'students' && (
                    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { label: 'STUDENT NAME', key: 'student_name', required: true },
                        { label: 'ROLL NUMBER', key: 'roll_no', required: true, placeholder: 'e.g. AG-2026-001' },
                        { label: 'LOGIN EMAIL', key: 'email', required: true, type: 'email' },
                        { label: 'FATHER NAME', key: 'father_name' },
                        { label: 'MOTHER NAME', key: 'mother_name' },
                        { label: 'DATE OF BIRTH', key: 'dob', type: 'date' },
                        { label: 'GENDER', key: 'gender', type: 'select', options: ['Male', 'Female', 'Other'] },
                        { label: 'MOBILE 1', key: 'mobile1' },
                        { label: 'MOBILE 2', key: 'mobile2' },
                        { label: 'NATIONALITY', key: 'nationality' },
                        { label: 'MEDIUM', key: 'medium', placeholder: 'English Medium' },
                        { label: 'DOOR NO', key: 'door_no' },
                        { label: 'VILLAGE', key: 'village' },
                        { label: 'MANDAL', key: 'mandal' },
                        { label: 'DISTRICT', key: 'district' },
                        { label: 'PINCODE', key: 'pin' },
                        { label: 'NATIONALITY', key: 'nationality' },
                      ].map(field => (
                        <div key={field.key} className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{field.label}</label>
                          {field.type === 'select' ? (
                            <select 
                              required={field.required}
                              className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all appearance-none font-bold text-ink"
                              onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                              value={formData[field.key] || ''}
                            >
                              <option value="">Select {field.label}</option>
                              {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          ) : (
                            <input 
                              required={field.required}
                              type={field.type || 'text'}
                              placeholder={field.placeholder}
                              className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all font-bold text-ink"
                              onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                              value={formData[field.key] || ''}
                            />
                          )}
                        </div>
                      ))}
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">COURSE APPLIED</label>
                        <select 
                          required 
                          className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all appearance-none font-bold text-ink" 
                          onChange={e => {
                            const val = e.target.value;
                            setFormData({
                              ...formData, 
                              course_applied: val,
                              branch: val === 'Ag. B.Sc.' ? 'NULL' : ''
                            });
                          }} 
                          value={formData.course_applied || ''}
                        >
                          <option value="">Select Course</option>
                          <option value="Ag. B.Sc.">Ag. B.Sc.</option>
                          <option value="Ag. M.Sc.">Ag. M.Sc.</option>
                        </select>
                      </div>

                      {formData.course_applied === 'Ag. M.Sc.' && (
                        <div className="space-y-2 animate-fadeIn">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SPECIALIZATION (BRANCH)</label>
                          <select 
                            required 
                            className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all appearance-none font-bold text-ink" 
                            onChange={e => setFormData({...formData, branch: e.target.value})} 
                            value={formData.branch || ''}
                          >
                            <option value="">Select Specialization</option>
                            <option value="Msc soil science">Msc soil science</option>
                            <option value="Msc horticulture">Msc horticulture</option>
                            <option value="Msc agronomy">Msc agronomy</option>
                            <option value="Msc plant breeding and genetics">Msc plant breeding and genetics</option>
                            <option value="Msc zoology">Msc zoology</option>
                            <option value="Msc chemistry">Msc chemistry</option>
                          </select>
                        </div>
                      )}

                      {formData.course_applied === 'Ag. B.Sc.' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">BRANCH</label>
                          <input 
                            readOnly 
                            value="NULL" 
                            className="w-full px-5 py-4 bg-gray-100 border border-gray-100 rounded-2xl text-gray-400 outline-none cursor-not-allowed font-bold" 
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ACADEMIC ENROLLED YEAR</label>
                        <input 
                          required 
                          placeholder="e.g. 2024-2025" 
                          className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all font-bold text-ink" 
                          onChange={e => setFormData({...formData, academic_enrolled_year: e.target.value})} 
                          value={formData.academic_enrolled_year || ''} 
                        />
                      </div>

                      {/* Fee Breakdown - Showcase Structure Table */}
                      <div className="col-span-full mt-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                            <RefreshCw size={16} />
                          </div>
                          <div>
                            <h4 className="font-bold text-ink text-sm uppercase tracking-tight">Fee Breakdown</h4>
                            <p className="text-[9px] text-muted uppercase font-black tracking-widest">Specify yearly fee structure for showcasing in student account</p>
                          </div>
                        </div>
                        <div className="overflow-x-auto border border-gray-100 rounded-xl">
                          <table className="w-full border-collapse bg-white text-xs">
                            <thead className="bg-[#15803d] text-white">
                              <tr>
                                <th className="p-3 text-[9px] font-black uppercase tracking-widest text-left">Academic Year</th>
                                <th className="p-3 text-[9px] font-black uppercase tracking-widest text-left">Total Fee</th>
                                <th className="p-3 text-[9px] font-black uppercase tracking-widest text-left">Committed Fee</th>
                                <th className="p-3 text-[9px] font-black uppercase tracking-widest text-left">Admission Fee</th>
                                <th className="p-3 text-[9px] font-black uppercase tracking-widest text-left">Practical Fee</th>
                                <th className="p-3 text-[9px] font-black uppercase tracking-widest text-left">Hostel</th>
                                <th className="p-3 text-[9px] font-black uppercase tracking-widest text-left">Travelling Expenses</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {['1st year', '2nd year', '3rd year', '4th year'].map((year) => {
                                const fee = studentFees.find(f => f.academic_year.toLowerCase() === year.toLowerCase()) || {
                                  academic_year: year, breakdown_total_fee: 0, committed_fee: 0, admission_fee: 0, breakdown_practical_fee: 0, breakdown_hostel_fee: 0, breakdown_travelling_fee: 0
                                };
                                const updateFee = (updates) => {
                                  const newFees = [...studentFees];
                                  const index = newFees.findIndex(f => f.academic_year.toLowerCase() === year.toLowerCase());
                                  if (index >= 0) newFees[index] = { ...newFees[index], ...updates };
                                  else newFees.push({ ...fee, ...updates });
                                  setStudentFees(newFees);
                                };
                                const fields = [
                                  { key: 'breakdown_total_fee', placeholder: '0' },
                                  { key: 'committed_fee', placeholder: '0' },
                                  { key: 'admission_fee', placeholder: '0' },
                                  { key: 'breakdown_practical_fee', placeholder: '0' },
                                  { key: 'breakdown_hostel_fee', placeholder: '0' },
                                  { key: 'breakdown_travelling_fee', placeholder: '0' },
                                ];
                                return (
                                  <tr key={year} className="hover:bg-gray-50/50">
                                    <td className="p-3 font-black text-ink uppercase text-[9px]">{year}</td>
                                    {fields.map(fld => (
                                      <td key={fld.key} className="p-2">
                                        <input 
                                          type="number" 
                                          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:border-blue outline-none transition-all font-bold text-ink text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          value={fee[fld.key] === 0 || fee[fld.key] === '0' || !fee[fld.key] ? '' : fee[fld.key]}
                                          placeholder={fld.placeholder}
                                          onFocus={(e) => e.target.select()}
                                          onChange={(e) => updateFee({ [fld.key]: e.target.value })}
                                        />
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  )}

                  {activeTab !== 'courses' && activeTab !== 'students' && (
                      <div className="relative p-10 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 text-center hover:border-blue/50 hover:bg-blue/5 transition-all overflow-hidden flex flex-col items-center justify-center min-h-[220px]">
                        {file || formData.existing_image ? (
                          <div className="w-full max-h-48 overflow-hidden rounded-xl mb-4 shadow-sm border border-gray-100 flex justify-center bg-black/5">
                            {file ? (
                               file.type.startsWith('video/') ? (
                                 <video src={URL.createObjectURL(file)} className="max-h-48 w-auto" controls />
                               ) : (
                                 <img src={URL.createObjectURL(file)} className="max-h-48 w-auto object-cover" alt="Preview" />
                               )
                            ) : (
                               (formData.type === 'video' || (typeof formData.existing_image === 'string' && formData.existing_image.toLowerCase().endsWith('.mp4'))) ? (
                                 <video 
                                    src={getImageUrl(formData.existing_image)} 
                                    className="max-h-48 w-auto" 
                                    controls 
                                    onError={e => { e.target.parentElement.innerHTML = '<div class="p-8 text-xs text-gray-400">Video not found</div>'; }}
                                 />
                               ) : (
                                 <img 
                                    src={getImageUrl(formData.existing_image)} 
                                    className="max-h-48 w-auto object-cover" 
                                    alt="Current" 
                                    onError={e => { e.target.src = 'https://via.placeholder.com/600x400?text=Image+Not+Found'; }}
                                 />
                               )
                            )}
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto text-blue mb-4">
                             <ImageIcon size={32} />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-ink">{file ? file.name : (formData.existing_image ? 'Replace Current Media' : (activeTab === 'gallery' ? 'Upload Photo or Video Asset' : 'Upload Media Asset'))}</p>
                          <p className="text-xs text-muted mt-1">{activeTab === 'gallery' ? 'Supports JPG, PNG, WEBP, MP4, WEBM (up to 50MB)' : 'Recommended size: 800x600px. Max 5MB.'}</p>
                        </div>
                        <input 
                          type="file" 
                          accept={activeTab === 'gallery' ? "image/*,video/*,.mp4,.mov,.webm,.mkv" : "image/*"}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                          onChange={e => {
                            const selected = e.target.files[0];
                            if (selected) {
                              setFile(selected);
                              if (activeTab === 'gallery') {
                                const isVid = selected.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(selected.name);
                                setFormData(prev => ({ ...prev, type: isVid ? 'video' : 'image' }));
                              }
                            }
                          }} 
                        />
                      </div>
                  )}
                </div>

                <div className="mt-12">
                  <button type="submit" disabled={loading} className="w-full bg-[#15803d] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-green-500/20 hover:bg-[#166534] transition-all active:scale-[0.98] disabled:opacity-50">
                    {loading ? 'Processing...' : (editingId ? 'Update Record' : 'Sync & Create Entry')}
                  </button>
                </div>
              </form>
            </div>
          ) : viewMode === 'student-manage' ? (
            <div className="p-8 max-w-5xl mx-auto animate-fadeIn">
                <div className="flex justify-between items-center mb-8">
                   <button onClick={() => setViewMode('list')} className="flex items-center gap-3 px-8 py-4 bg-white text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/5 hover:bg-red-50 transition-all border border-red-50 shrink-0">
                      <X size={18} /> Exit Management
                   </button>
                   <div className="px-6 py-3 bg-blue/5 rounded-2xl border border-blue/10">
                      <p className="text-[10px] font-black text-blue uppercase tracking-widest">Active Session: {selectedStudent?.student_name}</p>
                   </div>
                </div>

                {feeNoticeBanner && (
                  <div className="mb-8 p-6 bg-[#f0fdf4] border-2 border-[#15803d] rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn shadow-lg shadow-[#15803d]/10">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-[#15803d] text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shrink-0">
                          <Check size={24} strokeWidth={3} className="text-white" />
                       </div>
                       <div>
                          <h4 className="font-black text-[#064e3b] text-base">Payment Screenshot Approved for {feeNoticeBanner.studentName}</h4>
                          <p className="text-xs font-bold text-[#15803d] mt-0.5">
                             Category: <span className="underline">{feeNoticeBanner.feeType}</span> | Academic Year: <span className="underline">{feeNoticeBanner.year}</span> | Amount Paid: <span className="underline">₹{Number(feeNoticeBanner.amount || 0).toLocaleString()}</span>
                          </p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">
                             Payment proof verified. Review fee breakdown below and click "SYNC & CREATE ENTRY" to save student details.
                          </p>
                       </div>
                    </div>
                    {feeNoticeBanner.screenshot && (
                       <a 
                         href={getImageUrl(feeNoticeBanner.screenshot)} 
                         target="_blank" 
                         rel="noreferrer"
                         className="px-6 py-3 bg-[#15803d] text-white hover:bg-[#166534] rounded-xl font-black text-xs uppercase tracking-wider transition-all shrink-0 shadow-md flex items-center gap-2"
                       >
                          <Eye size={16} className="text-white" /> View Screenshot ↗
                       </a>
                    )}
                  </div>
                )}
               
               <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 mb-10">
                  <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-50">
                     <div className="relative h-24 w-24 rounded-[2rem] bg-sky flex items-center justify-center overflow-hidden border-4 border-white shadow-xl group cursor-pointer">
                        {file ? (
                          <img src={URL.createObjectURL(file)} className="h-full w-full object-cover" alt="New Preview" />
                        ) : formData.photo ? (
                          <img src={getImageUrl(formData.photo)} className="h-full w-full object-cover" alt="Current" />
                        ) : (
                          <span className="text-blue font-black text-3xl">{formData.student_name?.[0]}</span>
                        )}
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files[0])} />
                     </div>
                     <div>
                        <h2 className="text-3xl font-black text-ink">{formData.student_name}</h2>
                        <p className="text-muted font-bold text-[10px] uppercase tracking-[0.3em]">MANAGE STUDENT ACCOUNT</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                     {[
                       { label: 'STUDENT NAME', key: 'student_name' },
                       { label: 'ROLL NUMBER', key: 'roll_no' },
                       { label: 'LOGIN EMAIL', key: 'email' },
                       { label: 'FATHER NAME', key: 'father_name' },
                       { label: 'MOTHER NAME', key: 'mother_name' },
                       { label: 'DATE OF BIRTH', key: 'dob', type: 'date' },
                       { label: 'GENDER', key: 'gender', type: 'select', options: ['Male', 'Female', 'Other'] },
                       { label: 'MOBILE 1', key: 'mobile1' },
                       { label: 'MOBILE 2', key: 'mobile2' },
                       { label: 'MEDIUM', key: 'medium' },
                       { label: 'DOOR NO', key: 'door_no' },
                       { label: 'VILLAGE', key: 'village' },
                       { label: 'MANDAL', key: 'mandal' },
                       { label: 'DISTRICT', key: 'district' },
                       { label: 'PINCODE', key: 'pin' },
                       { label: 'NATIONALITY', key: 'nationality' },
                     ].map(field => (
                       <div key={field.key} className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{field.label}</label>
                          {field.type === 'select' ? (
                            <select 
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-blue outline-none transition-all font-bold text-ink appearance-none"
                              onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                              value={formData[field.key] || ''}
                            >
                              <option value="">Select {field.label}</option>
                              {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          ) : (
                            <input 
                              type={field.type || 'text'}
                              placeholder={field.placeholder || ''}
                              value={formData[field.key] || ''} 
                              onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-blue outline-none transition-all font-bold text-ink" 
                            />
                          )}
                       </div>
                     ))}
                     
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">COURSE APPLIED</label>
                        <select 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-blue outline-none transition-all font-bold text-ink appearance-none" 
                          onChange={e => {
                            const val = e.target.value;
                            setFormData({
                              ...formData, 
                              course_applied: val,
                              branch: val === 'Ag. B.Sc.' ? 'NULL' : ''
                            });
                          }} 
                          value={formData.course_applied || ''}
                        >
                          <option value="">Select Course</option>
                          <option value="Ag. B.Sc.">Ag. B.Sc.</option>
                          <option value="Ag. M.Sc.">Ag. M.Sc.</option>
                        </select>
                      </div>

                      {formData.course_applied === 'Ag. M.Sc.' && (
                        <div className="space-y-1 animate-fadeIn">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SPECIALIZATION (BRANCH)</label>
                          <select 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-blue outline-none transition-all font-bold text-ink appearance-none" 
                            onChange={e => setFormData({...formData, branch: e.target.value})} 
                            value={formData.branch || ''}
                          >
                            <option value="">Select Specialization</option>
                            <option value="Msc soil science">Msc soil science</option>
                            <option value="Msc horticulture">Msc horticulture</option>
                            <option value="Msc agronomy">Msc agronomy</option>
                            <option value="Msc plant breeding and genetics">Msc plant breeding and genetics</option>
                            <option value="Msc zoology">Msc zoology</option>
                            <option value="Msc chemistry">Msc chemistry</option>
                          </select>
                        </div>
                      )}

                      {formData.course_applied === 'Ag. B.Sc.' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">BRANCH</label>
                          <input 
                            readOnly 
                            value="NULL" 
                            className="w-full px-4 py-3 bg-gray-100 border border-gray-100 rounded-xl text-gray-400 outline-none cursor-not-allowed font-bold" 
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ACADEMIC ENROLLED YEAR</label>
                        <input 
                          placeholder="e.g. 2024-2025" 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-blue outline-none transition-all font-bold text-ink" 
                          onChange={e => setFormData({...formData, academic_enrolled_year: e.target.value})} 
                          value={formData.academic_enrolled_year || ''} 
                        />
                      </div>

                   </div>

                    <div className="mt-8 flex justify-end">
                       <button 
                         type="button"
                         onClick={async () => {
                           if (window.confirm(`Reset password for ${formData.student_name} to their Roll Number (${formData.roll_no})?`)) {
                             try {
                               setLoading(true);
                               await axios.put(`/api/students/admin/update/${selectedStudent.id}`, { password: formData.roll_no }, { withCredentials: true });
                               alert("Password reset successfully!");
                             } catch (err) {
                               alert("Reset failed: " + (err.response?.data?.message || err.message));
                             } finally {
                               setLoading(false);
                             }
                           }
                         }}
                         className="px-6 py-3 bg-orange/10 text-orange rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-orange hover:text-white transition-all border border-orange/20"
                       >
                          Reset Password to Roll No
                       </button>
                    </div>


                     {/* Fee Breakdown - Showcase Structure Table */}
                     <div className="mt-12 p-8 bg-gray-50/50 rounded-3xl border border-gray-100">
                        <div className="flex items-center gap-4 mb-6">
                           <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                              <RefreshCw size={20} />
                           </div>
                           <div>
                              <h4 className="font-bold text-ink uppercase tracking-tight">FEE BREAKDOWN</h4>
                              <p className="text-[10px] text-muted uppercase font-black tracking-widest">Specify yearly fee structure for showcasing in student account</p>
                           </div>
                        </div>
                        <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm">
                           <table className="w-full border-collapse bg-white">
                              <thead className="bg-[#15803d] text-white">
                                 <tr>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-left">Academic Year</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-left">Total Fee</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-left">Committed Fee</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-left">Admission Fee</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-left">Practical Fee</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-left">Hostel</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-left">Travelling Expenses</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                 {['1st year', '2nd year', '3rd year', '4th year'].map((year) => {
                                    const fee = studentFees.find(f => f.academic_year.toLowerCase() === year.toLowerCase()) || {
                                       academic_year: year, breakdown_total_fee: 0, committed_fee: 0, admission_fee: 0, breakdown_practical_fee: 0, breakdown_hostel_fee: 0, breakdown_travelling_fee: 0
                                    };
                                    const updateFee = (updates) => {
                                       const newFees = [...studentFees];
                                       const index = newFees.findIndex(f => f.academic_year.toLowerCase() === year.toLowerCase());
                                       if (index >= 0) newFees[index] = { ...newFees[index], ...updates };
                                       else newFees.push({ ...fee, ...updates });
                                       setStudentFees(newFees);
                                    };
                                    const fields = [
                                       { key: 'breakdown_total_fee', placeholder: '0' },
                                       { key: 'committed_fee', placeholder: '0' },
                                       { key: 'admission_fee', placeholder: '0' },
                                       { key: 'breakdown_practical_fee', placeholder: '0' },
                                       { key: 'breakdown_hostel_fee', placeholder: '0' },
                                       { key: 'breakdown_travelling_fee', placeholder: '0' },
                                    ];
                                    return (
                                       <tr key={year} className="hover:bg-gray-50/50">
                                          <td className="p-4 font-black text-ink text-xs uppercase tracking-wider">{year}</td>
                                          {fields.map(fld => (
                                             <td key={fld.key} className="p-2">
                                                <input 
                                                   type="number" 
                                                   className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:border-blue outline-none transition-all font-bold text-ink text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                   value={fee[fld.key] === 0 || fee[fld.key] === '0' || !fee[fld.key] ? '' : fee[fld.key]}
                                                   placeholder={fld.placeholder}
                                                   onFocus={(e) => e.target.select()}
                                                   onChange={(e) => updateFee({ [fld.key]: e.target.value })}
                                                />
                                             </td>
                                          ))}
                                       </tr>
                                    );
                                 })}
                              </tbody>
                           </table>
                        </div>
                     </div>

                     {/* Itemized Partial Paid & Due Entry */}
                     <div className="mt-12 p-8 bg-blue/5 rounded-3xl border border-blue/10">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 bg-blue/10 rounded-2xl flex items-center justify-center text-blue">
                             <RefreshCw size={24} />
                          </div>
                          <div>
                             <h3 className="text-xl font-black text-ink">PARTIAL PAYMENTS & DUE MANAGEMENT</h3>
                             <p className="text-[10px] text-muted uppercase font-black tracking-widest">Update paid amounts and view remaining due amounts per fee type</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-8">
                          {['1st year', '2nd year', '3rd year', '4th year'].map((year) => {
                            const fee = studentFees.find(f => f.academic_year.toLowerCase() === year.toLowerCase()) || {
                              academic_year: year, 
                              total_fee: 0, paid_amount: 0, 
                              hostel_fee: 0, hostel_fee_paid: 0,
                              exam_fee: 0, exam_fee_paid: 0,
                              practical_fee: 0, practical_fee_paid: 0,
                              travelling_fee: 0, travelling_fee_paid: 0, 
                              committed_fee: 0, admission_fee: 0, payment_status: 'Pending'
                            };

                            const updateFee = (updates) => {
                              const newFees = [...studentFees];
                              const index = newFees.findIndex(f => f.academic_year.toLowerCase() === year.toLowerCase());
                              if (index >= 0) newFees[index] = { ...newFees[index], ...updates };
                              else newFees.push({ ...fee, ...updates });
                              setStudentFees(newFees);
                            };

                            const categories = [
                              { keyTotal: 'total_fee', keyPaid: 'paid_amount', label: 'College Fee', color: 'blue' },
                              { keyTotal: 'hostel_fee', keyPaid: 'hostel_fee_paid', label: 'Hostel Fee', color: 'orange' },
                              { keyTotal: 'exam_fee', keyPaid: 'exam_fee_paid', label: 'Exam Fee', color: 'purple' },
                              { keyTotal: 'practical_fee', keyPaid: 'practical_fee_paid', label: 'Practical Fee', color: 'teal' },
                              { keyTotal: 'travelling_fee', keyPaid: 'travelling_fee_paid', label: 'Travelling Expenses', color: 'emerald' },
                            ];

                            const totalAllocated = categories.reduce((sum, c) => sum + Number(fee[c.keyTotal] || 0), 0);
                            const totalPaid = categories.reduce((sum, c) => sum + Number(fee[c.keyPaid] || 0), 0);
                            const totalDue = Math.max(0, totalAllocated - totalPaid);

                            return (
                              <div key={year} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
<div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-gray-100">
                                  <div className="flex items-center gap-3">
                                    <span className="font-black text-ink text-sm uppercase tracking-widest bg-ink/5 px-4 py-2 rounded-xl">{year}</span>
                                    <span className="text-xs font-bold text-gray-500">Total Fee: <strong className="text-ink">₹{totalAllocated.toLocaleString()}</strong></span>
                                    <span className="text-xs font-bold text-green-600">Paid: <strong>₹{totalPaid.toLocaleString()}</strong></span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                     {totalPaid > 0 && (
                                       <button
                                         type="button"
                                         onClick={() => downloadFeeInvoice({ amount: totalPaid, academic_year: year, fee_type: 'Total Paid Fees' }, selectedStudent)}
                                         className="px-3 py-1.5 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                                       >
                                         <Download size={14} /> Download Receipt
                                       </button>
                                     )}
                                     {totalAllocated > 0 && totalDue === 0 ? (
                                       <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-black rounded-xl border border-green-200">✓ Fully Paid</span>
                                     ) : totalDue > 0 ? (
                                       <span className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-black rounded-xl border border-red-200">Overall Due: ₹{totalDue.toLocaleString()}</span>
                                     ) : (
                                       <span className="px-3 py-1.5 bg-gray-50 text-gray-400 text-xs font-black rounded-xl">No Fees Allocated</span>
                                     )}
                                  </div>
                                </div>

                                {/* Category Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                  {categories.map(cat => {
                                    const total = Number(fee[cat.keyTotal] || 0);
                                    const paid = Number(fee[cat.keyPaid] || 0);
                                    const due = Math.max(0, total - paid);

                                    return (
                                      <div key={cat.label} className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 flex flex-col justify-between gap-3">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{cat.label}</span>
                                          <button
                                            type="button"
                                            onClick={() => updateFee({ [cat.keyPaid]: paid >= total && total > 0 ? 0 : total })}
                                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md transition-colors ${paid >= total && total > 0 ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600 hover:bg-green-100'}`}
                                          >
                                            {paid >= total && total > 0 ? '✓ Paid' : 'Set Full'}
                                          </button>
                                        </div>

                                        <div className="space-y-2">
                                          <div>
                                            <label className="text-[9px] font-bold text-gray-400 block mb-1">Total Fee (₹)</label>
                                            <input
                                              type="number"
                                              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl focus:border-blue outline-none font-bold text-ink text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                              value={fee[cat.keyTotal] === 0 || fee[cat.keyTotal] === '0' || !fee[cat.keyTotal] ? '' : fee[cat.keyTotal]}
                                              placeholder="0"
                                              onFocus={(e) => e.target.select()}
                                              onChange={(e) => updateFee({ [cat.keyTotal]: e.target.value })}
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[9px] font-bold text-green-600 block mb-1">Paid Amount (₹)</label>
                                            <input
                                              type="number"
                                              className="w-full px-3 py-1.5 bg-white border border-green-200 rounded-xl focus:border-green-500 outline-none font-bold text-green-700 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                              value={fee[cat.keyPaid] === 0 || fee[cat.keyPaid] === '0' || !fee[cat.keyPaid] ? '' : fee[cat.keyPaid]}
                                              placeholder="0"
                                              onFocus={(e) => e.target.select()}
                                              onChange={(e) => updateFee({ [cat.keyPaid]: e.target.value })}
                                            />
                                          </div>
                                        </div>

                                        <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[10px]">
                                          <span className="font-bold text-gray-400">Due:</span>
                                          <span className={`font-black ${due > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                            ₹{due.toLocaleString()}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                     </div>

                     <div className="mt-12 flex flex-col md:flex-row gap-4">
                        <button 
                           onClick={async () => {
                              try {
                                 setLoading(true);
                                 const studentPayload = new FormData();
                                 Object.keys(formData).forEach(key => {
                                    if (!['_id', 'id', 'photo', 'created_at'].includes(key)) {
                                       if (key === 'password' && !formData[key]) return;
                                       studentPayload.append(key, formData[key]);
                                    }
                                 });
                                 if (file) studentPayload.append('photo', file);

                                 await axios.put(`/api/students/admin/update/${selectedStudent.id}`, studentPayload, {
                                    headers: { 'Content-Type': 'multipart/form-data' },
                                    withCredentials: true
                                 });
                                 await axios.put(`/api/student-fees/admin/update/${selectedStudent.id}`, { fees: studentFees }, {
                                    withCredentials: true
                                 });
                                 alert("Student Account & Fee Breakdown Updated Successfully!");
                                 setFile(null);
                                 setViewMode('list');
                                 setRefresh(r => r + 1);
                              } catch (err) {
                                 alert("Update failed: " + (err.response?.data?.message || err.message));
                              } finally {
                                 setLoading(false);
                              }
                           }}
                           disabled={loading}
                           className="w-full bg-[#15803d] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-green-500/20 hover:bg-[#166534] transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                           {loading ? 'Processing...' : 'SYNC & CREATE ENTRY'}
                        </button>
                     </div>
                </div>
             </div>
          ) : activeTab === 'students' ? (
             <div className="p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                   <div>
                     <h3 className="text-xl font-black text-ink uppercase tracking-tight">Student Accounts</h3>
                     <p className="text-[10px] text-muted font-bold tracking-widest mt-1">TOTAL ENROLLED: {students.length}</p>
                   </div>
                   <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                     {/* Send Fee Reminder to All Students */}
                      <button
                        onClick={async () => {
                          if (!window.confirm('Send official fee payment reminder email to all enrolled students with outstanding dues?')) return;
                          try {
                            setSendingReminder(true);
                            const res = await axios.post('/api/students/send-fee-reminder', {}, { 
                              withCredentials: true,
                              timeout: 25000 
                            });
                            alert(`✅ Fee Reminders Broadcast Complete!\n\n📧 Successfully Sent: ${res.data.sent || 0} student(s)\n⚠️ Skipped (No Email in Profile): ${res.data.skipped_no_email || 0} student(s)\n❌ Delivery Errors: ${res.data.failed || 0}\n👥 Total Enrolled: ${res.data.total || 0}`);
                          } catch (err) {
                            if (err.code === 'ECONNABORTED') {
                              alert('✅ Fee reminders broadcast started in background. Emails are being delivered.');
                            } else {
                              alert('Fee reminder note: ' + (err.response?.data?.message || err.message));
                            }
                          } finally {
                            setSendingReminder(false);
                          }
                        }}
                        disabled={sendingReminder}
                        className="flex items-center gap-2 px-5 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
                      >
                        <svg className={`w-4 h-4 shrink-0 ${sendingReminder ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        {sendingReminder ? 'Broadcasting...' : 'Send Fee Reminder'}
                      </button>

                      {/* Download All Students Attendance PDF */}
                      <button
                        onClick={async () => {
                          try {
                            setDownloadingPdf(true);
                            const res = await axios.get('/api/students/attendance-summary', { withCredentials: true });
                            const data = res.data;
                            const doc = new jsPDF('p', 'pt', 'a4');
                            doc.setFillColor(29, 74, 58);
                            doc.rect(0, 0, 595.28, 80, 'F');
                            doc.setTextColor(255, 255, 255);
                            doc.setFont('helvetica', 'bold');
                            doc.setFontSize(14);
                            doc.text('SRI SAI INSTITUTE OF AGRICULTURAL SCIENCES', 40, 36);
                            doc.setFont('helvetica', 'normal');
                            doc.setFontSize(8);
                            doc.text('ADMIN PORTAL | STUDENT ATTENDANCE REPORT', 40, 52);

                            doc.setFillColor(248, 250, 252);
                            doc.rect(40, 100, 515.28, 45, 'F');
                            doc.setTextColor(51, 65, 85);
                            doc.setFontSize(8);
                            doc.setFont('helvetica', 'bold');
                            doc.text('GENERATED BY:', 55, 118);
                            doc.setFont('helvetica', 'normal');
                            doc.text('ADMINISTRATION', 135, 118);
                            doc.setFont('helvetica', 'bold');
                            doc.text('REPORT DATE:', 360, 118);
                            doc.setFont('helvetica', 'normal');
                            doc.text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), 435, 118);
                            doc.setFont('helvetica', 'bold');
                            doc.text('TOTAL ENROLLED:', 55, 132);
                            doc.setFont('helvetica', 'normal');
                            doc.text(`${data.length} Students`, 135, 132);

                            autoTable(doc, {
                              head: [['#', 'Student Name', 'Roll No', 'Course', 'Branch', 'Working Days', 'Present', 'Absent', 'Attendance %']],
                              body: data.map((s, i) => [i+1, s.student_name.toUpperCase(), s.roll_no||'N/A', s.course_applied||'N/A', s.branch||'N/A', s.total_days, s.present_days, s.absent_days, `${s.percentage}%`]),
                              startY: 165,
                              margin: { left: 40, right: 40 },
                              theme: 'striped',
                              headStyles: { fillColor: [29, 74, 58], textColor: [255,255,255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
                              columnStyles: { 0:{halign:'center',cellWidth:25}, 1:{fontStyle:'bold',fontSize:8}, 2:{halign:'center',fontSize:8}, 3:{halign:'center',fontSize:8}, 4:{halign:'center',fontSize:8}, 5:{halign:'center',fontSize:8}, 6:{halign:'center',fontSize:8}, 7:{halign:'center',fontSize:8}, 8:{halign:'center',fontStyle:'bold',fontSize:8} },
                              bodyStyles: { fontSize: 8, textColor: [30,41,59] },
                              alternateRowStyles: { fillColor: [248,250,252] },
                              didParseCell: (d) => {
                                if (d.column.index === 8 && d.section === 'body') {
                                  const pct = parseFloat(d.cell.raw);
                                  d.cell.styles.textColor = pct < 75 ? [239,68,68] : [22,163,74];
                                  d.cell.styles.fontStyle = 'bold';
                                }
                              }
                            });

                            const totalPages = doc.internal.getNumberOfPages();
                            for (let i = 1; i <= totalPages; i++) {
                              doc.setPage(i);
                              doc.setFontSize(8);
                              doc.setTextColor(148,163,184);
                              doc.text(`Page ${i} of ${totalPages}`, 297.64, 820, { align: 'center' });
                            }
                            doc.save(`Student_Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
                          } catch (err) {
                            alert('Failed to generate PDF: ' + (err.response?.data?.message || err.message));
                          } finally {
                            setDownloadingPdf(false);
                          }
                        }}
                        disabled={downloadingPdf}
                        className="flex items-center gap-2 px-5 py-4 bg-blue hover:bg-blue/90 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue/20 transition-all active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
                      >
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        {downloadingPdf ? 'Generating...' : 'Attendance PDF'}
                      </button>

                      {/* Clear All Students */}
                      <button
                        onClick={async () => {
                          const confirmVal = window.prompt(
                            `⚠️ DANGER: This will PERMANENTLY delete ALL ${students.length} student account(s), fee structures, attendance, qualifications, and payment logs.\n\nTo confirm, type "DELETE ALL" in the box below:`
                          );
                          if (confirmVal === "DELETE ALL") {
                            try {
                              setLoading(true);
                              await axios.delete('/api/students/admin/clear-all-students', { withCredentials: true });
                              alert("All student accounts and details have been permanently deleted!");
                              setStudents([]);
                              setRefresh(r => r + 1);
                            } catch (err) {
                              alert("Failed to delete students: " + (err.response?.data?.message || err.message));
                            } finally {
                              setLoading(false);
                            }
                          } else if (confirmVal !== null) {
                            alert("Incorrect confirmation text. Deletion canceled.");
                          }
                        }}
                        disabled={loading || students.length === 0}
                        className="flex items-center gap-2 px-5 py-4 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-red-100 transition-all active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
                      >
                        <Trash2 size={16} />
                        Clear All Students
                      </button>

                     <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue transition-colors" size={18} />
                        <input 
                          type="text" 
                          placeholder="Search by Roll No or Name..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:border-blue outline-none transition-all font-bold text-ink"
                        />
                     </div>
                     <button 
                        onClick={() => setShowStudentFilters(!showStudentFilters)}
                        className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${showStudentFilters ? 'bg-ink text-white shadow-xl' : 'bg-[#15803d] text-white hover:bg-[#166534] shadow-md'}`}
                     >
                        <Filter size={16} />
                        Filter
                     </button>
                   </div>
               </div>

               {showStudentFilters && (
                 <div className="mb-10 bg-white rounded-3xl p-8 shadow-xl border border-gray-100 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                       {/* Academic Enrolled Year Input Removed */}
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Course</label>
                          <select 
                             className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-blue outline-none transition-all font-bold text-ink appearance-none"
                             value={studentFilter}
                             onChange={(e) => {
                                setStudentFilter(e.target.value);
                                setStudentBranchFilter('all');
                             }}
                          >
                             <option value="all">ALL COURSES</option>
                             <option value="Ag. B.Sc.">AG. B.SC.</option>
                             <option value="Ag. M.Sc.">AG. M.SC.</option>
                          </select>
                       </div>
                       {studentFilter === 'Ag. M.Sc.' && (
                         <div className="space-y-3 animate-fadeIn">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Specialization</label>
                            <select 
                               className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-blue outline-none transition-all font-bold text-ink appearance-none"
                               value={studentBranchFilter}
                               onChange={(e) => setStudentBranchFilter(e.target.value)}
                            >
                               <option value="all">ALL SPECIALIZATIONS</option>
                               <option value="Msc soil science">Msc Soil Science</option>
                               <option value="Msc horticulture">Msc Horticulture</option>
                               <option value="Msc agronomy">Msc Agronomy</option>
                               <option value="Msc plant breeding and genetics">Msc Plant Breeding and Genetics</option>
                               <option value="Msc zoology">Msc Zoology</option>
                               <option value="Msc chemistry">Msc Chemistry</option>
                            </select>
                         </div>
                       )}
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Academic Year</label>
                          <select 
                             className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-blue outline-none transition-all font-bold text-ink appearance-none"
                             value={filterYearLevel}
                             onChange={(e) => setFilterYearLevel(e.target.value)}
                          >
                             <option value="all">ALL YEARS</option>
                             <option value="1st Year">1ST YEAR</option>
                             <option value="2nd Year">2ND YEAR</option>
                             <option value="3rd Year">3RD YEAR</option>
                             <option value="4th Year">4TH YEAR</option>
                          </select>
                       </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-50 flex gap-4">
                       <button 
                          onClick={() => setShowStudentFilters(false)}
                          className="flex-1 bg-[#15803d] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#166534] transition-all flex items-center justify-center gap-2"
                       >
                          <div className="w-2 h-2 rounded-full bg-sky animate-pulse" />
                          Apply Filters
                       </button>
                       <button 
                          onClick={() => {
                             setStudentFilter('all');
                             setStudentBranchFilter('all');
                             setFilterAcademicYear('all');
                             setFilterYearLevel('all');
                          }}
                          className="px-8 bg-gray-50 text-muted py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100"
                       >
                          Reset All
                       </button>
                    </div>
                 </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {students
                    .filter(student => 
                      student.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      student.roll_no?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .filter(student => studentFilter === 'all' || student.course_applied === studentFilter)
                    .filter(student => studentBranchFilter === 'all' || student.branch === studentBranchFilter)
                    .filter(student => filterAcademicYear === 'all' || !filterAcademicYear || (student.academic_enrolled_year && student.academic_enrolled_year.includes(filterAcademicYear)))
                    .filter(student => filterYearLevel === 'all' || calculateAcademicYear(student.academic_enrolled_year) === filterYearLevel)
                    .map(student => (
                     <div key={student.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                       <div className="flex items-center gap-4 mb-4">
                          <div className="h-12 w-12 rounded-2xl bg-sky flex items-center justify-center overflow-hidden border border-white">
                             {student.photo ? <img src={getImageUrl(student.photo)} className="h-full w-full object-cover" /> : <span className="text-blue font-black">{student.student_name[0]}</span>}
                          </div>
                          <div className="flex flex-col">
                             <span className="font-bold text-ink">{student.student_name}</span>
                          </div>
                       </div>
                       <div className="flex gap-2">
                           <button 
                             onClick={() => { 
                               setSelectedStudent(student); 
                               setFormData({
                                 ...student,
                                 current_year: student.year || student.current_year,
                                 dob: parseDateForInput(student.dob)
                               });
                               setViewMode('student-manage'); 
                             }}
                             className="flex-1 bg-[#15803d] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#166534] transition-all"
                           >
                              Manage Profile
                           </button>
                           <button 
                             onClick={async () => {
                               if (window.confirm(`Are you sure you want to delete ${student.student_name}? This action cannot be undone.`)) {
                                 try {
                                   await axios.delete(`/api/students/admin/delete/${student.id}`, { withCredentials: true });
                                   setRefresh(r => r + 1);
                                   alert("Student Account Deleted Successfully!");
                                 } catch (err) {
                                   alert("Delete failed: " + (err.response?.data?.message || err.message));
                                 }
                               }
                             }}
                             className="px-4 bg-red-50 text-red-500 py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100"
                             title="Delete Student"
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                    </div>
                  ))}
               </div>
            </div>
          ) : activeTab === 'imports' ? (
            <div className="p-8">
               <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                  <div>
                    <h3 className="text-xl font-black text-ink uppercase tracking-tight">Excel Student Rosters</h3>
                    <p className="text-[10px] text-muted font-bold tracking-widest mt-1">UPLOADED SHEETS: {excelImports.length}</p>
                  </div>
               </div>

               {excelImports.length === 0 ? (
                 <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-lg mx-auto">
                   <div className="h-16 w-16 bg-sky rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue">
                     <FileSpreadsheet size={32} />
                   </div>
                   <h4 className="font-black text-base text-ink mb-2">No Excel Sheets Uploaded</h4>
                   <p className="text-xs text-muted max-w-xs mx-auto">
                     Student accounts uploaded via Excel or CSV sheets will be listed here. You can view sheet details or permanently delete them.
                   </p>
                 </div>
               ) : (
                 <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse bg-white">
                       <thead className="bg-gray-50 border-b border-gray-100">
                         <tr>
                           <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Excel File Name</th>
                           <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Date Uploaded</th>
                           <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Students Imported</th>
                           <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                         {excelImports.map((imp) => {
                           const uploadDate = new Date(imp.uploaded_at).toLocaleDateString('en-IN', {
                             day: '2-digit',
                             month: 'short',
                             year: 'numeric',
                             hour: '2-digit',
                             minute: '2-digit'
                           });

                           return (
                             <tr key={imp.id} className="hover:bg-gray-50/30 transition-colors">
                               <td className="px-8 py-6">
                                 <span className="font-bold text-ink text-sm flex items-center gap-2">
                                   <FileSpreadsheet size={16} className="text-[#16a34a]" />
                                   {imp.filename}
                                 </span>
                               </td>
                               <td className="px-8 py-6 text-center text-xs font-medium text-muted">
                                 {uploadDate}
                               </td>
                               <td className="px-8 py-6 text-center">
                                 <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-black rounded-full border border-green-200">
                                   {imp.student_count} Student(s)
                                 </span>
                               </td>
                               <td className="px-8 py-6 text-center">
                                 <button 
                                   onClick={async () => {
                                     const confirmVal = window.prompt(
                                       `⚠️ WARNING: Deleting this sheet will PERMANENTLY remove all ${imp.student_count} student account(s) imported from "${imp.filename}" along with their fee records, grades, and payment logs.\n\nTo confirm, type "DELETE" in the box below:`
                                     );
                                     if (confirmVal === "DELETE") {
                                       try {
                                         setLoading(true);
                                         await axios.delete(`/api/students/admin/imports/${imp.id}`, { withCredentials: true });
                                         alert("Excel sheet and associated student data deleted successfully!");
                                         fetchExcelImports();
                                       } catch (err) {
                                         alert("Failed to delete sheet: " + (err.response?.data?.message || err.message));
                                       } finally {
                                         setLoading(false);
                                       }
                                     } else if (confirmVal !== null) {
                                       alert("Incorrect confirmation text. Deletion canceled.");
                                     }
                                   }}
                                   disabled={loading}
                                   className="px-4 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100 text-xs font-black uppercase tracking-wider"
                                 >
                                   Delete Sheet
                                 </button>
                               </td>
                             </tr>
                           );
                         })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
             </div>
          ) : activeTab === 'enquiries' ? (
            <AdmissionEnquiriesView />
          ) : activeTab === 'online-registrations' ? (
            <OnlineRegistrationsView onRefreshStudentCount={fetchData} />
          ) : activeTab === 'staff' ? (
            <StaffManagementView
              staffList={staffList}
              onRefresh={fetchStaff}
              onCreate={async (staffData) => {
                try {
                  const dataToSubmit = { ...staffData, email: staffData.name.toLowerCase().replace(/\s+/g, '') };
                  await axios.post(`${API_URL}/staff/admin/create`, dataToSubmit, { withCredentials: true });
                  fetchStaff();
                  alert('Staff account created successfully!');
                } catch (err) { alert(err.response?.data?.message || 'Create failed'); }
              }}
              onDelete={async (id) => {
                if (window.confirm('Delete this staff member? This cannot be undone.')) {
                  try {
                    await axios.delete(`${API_URL}/staff/admin/${id}`, { withCredentials: true });
                    fetchStaff();
                  } catch (err) { alert('Delete failed'); }
                }
              }}
            />
          ) : activeTab === 'settings' ? (
            <SettingsView
              settings={siteSettings}
              fields={regFields}
              onSaveSetting={saveSetting}
              onSaveFields={saveFields}
              onDeleteField={deleteField}
            />
          ) : viewMode === 'list' && activeTab === 'hero' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-ink">Hero Slides</h3>
                  <p className="text-xs text-muted font-medium">Manage slides rotating on the website homepage</p>
                </div>
                <button
                  onClick={() => { setFormData({}); setFile(null); setEditingId(null); setViewMode('form'); }}
                  className="flex items-center gap-2 px-5 py-3 bg-blue text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-ink transition-all shadow-lg shadow-blue/20"
                >
                  <Plus size={16} /> Add New Slide
                </button>
              </div>

              {(!data || data.length === 0) ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                  <div className="w-16 h-16 bg-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue">
                    <LayoutDashboard size={32} />
                  </div>
                  <h4 className="font-bold text-ink text-lg mb-1">No Hero Slides Configured</h4>
                  <p className="text-xs text-muted mb-6">Create slides to highlight admissions, programs, and announcements.</p>
                  <button
                    onClick={() => { setFormData({}); setFile(null); setEditingId(null); setViewMode('form'); }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-ink transition-all shadow-lg shadow-blue/20"
                  >
                    <Plus size={16} /> Create First Slide
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.map((item, idx) => {
                    let parsedH1 = item.h1;
                    try {
                      if (typeof item.h1 === 'string' && (item.h1.startsWith('[') || item.h1.startsWith('{'))) {
                        const parsed = JSON.parse(item.h1);
                        parsedH1 = Array.isArray(parsed) ? parsed.join(' ') : String(parsed);
                      }
                    } catch (e) {
                      parsedH1 = item.h1;
                    }

                    return (
                      <div key={item.id || idx} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all group flex flex-col">
                        {/* Slide Banner Preview */}
                        <div 
                          className="relative h-48 overflow-hidden flex items-end p-5"
                          style={{
                            background: item.bg_gradient || "linear-gradient(115deg,#071428 0%,#065f46 45%,#15803d 100%)"
                          }}
                        >
                          {item.image ? (
                            <img 
                              src={getImageUrl(item.image)} 
                              alt={item.tag || "Hero slide"} 
                              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : null}
                          
                          {/* Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

                          {/* Tag badge & Actions */}
                          <div className="relative z-10 w-full flex items-start justify-between gap-2">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[11px] font-bold rounded-full uppercase tracking-wider shadow-sm line-clamp-1">
                              {item.tag || 'Slide Tag'}
                            </span>
                            <div className="flex gap-2 shrink-0">
                              <button 
                                onClick={() => handleEdit(item)} 
                                className="p-2.5 bg-white text-ink hover:bg-blue hover:text-white rounded-xl shadow-lg transition-all"
                                title="Edit slide"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button 
                                onClick={() => handleDelete(item.id)} 
                                className="p-2.5 bg-white text-red-500 hover:bg-red-500 hover:text-white rounded-xl shadow-lg transition-all"
                                title="Delete slide"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Slide Content Details */}
                        <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <h4 className="font-bold text-ink text-base leading-snug line-clamp-2" dangerouslySetInnerHTML={{ __html: parsedH1 || "Untitled Slide" }} />
                            {item.motto && (
                              <p className="text-xs italic text-blue font-medium line-clamp-2 border-l-2 border-blue/40 pl-2">
                                {item.motto}
                              </p>
                            )}
                            {item.description && (
                              <p className="text-xs text-muted line-clamp-3 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* Buttons preview */}
                          {(item.btn1_label || item.btn2_label) && (
                            <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-2 text-[11px]">
                              {item.btn1_label && (
                                <span className="px-2.5 py-1 bg-gray-100 text-ink rounded-lg font-bold">
                                  {item.btn1_label} → <span className="text-muted font-normal">{item.btn1_href || '#'}</span>
                                </span>
                              )}
                              {item.btn2_label && (
                                <span className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-muted rounded-lg font-medium">
                                  {item.btn2_label} → {item.btn2_href || '#'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === 'feeNotifications' ? (
            <div className="space-y-8 animate-fadeIn">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-black text-ink uppercase tracking-tight">Fee Management Notifications</h3>
                  <p className="text-xs text-muted font-bold tracking-wider mt-1">Review student payment screenshot submissions & approve fees</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {['Pending', 'Approved', 'Rejected', 'All'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setProofFilter(filter)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${proofFilter === filter ? 'bg-blue text-white shadow-lg shadow-blue/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {filter} {filter === 'Pending' && `(${paymentProofs.filter(p => (p.status||'').toLowerCase()==='pending').length})`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Info</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fee Category & Year</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Amount Paid</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Submitted Date</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Screenshot</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(() => {
                        const filtered = paymentProofs.filter(p => {
                          if (proofFilter === 'All') return true;
                          return (p.status || '').toLowerCase() === proofFilter.toLowerCase();
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan="7" className="px-6 py-20 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">
                                No {proofFilter.toLowerCase()} fee payment notifications found.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map(proof => {
                          const isPending = (proof.status || '').toLowerCase() === 'pending';
                          const isApproved = (proof.status || '').toLowerCase() === 'approved';
                          const isRejected = (proof.status || '').toLowerCase() === 'rejected';

                          return (
                            <tr key={proof.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 bg-sky rounded-xl flex items-center justify-center text-blue font-black text-sm shrink-0">
                                    {proof.student_name?.[0] || 'S'}
                                  </div>
                                  <div>
                                    <h4 className="font-black text-ink text-sm">{proof.student_name || `Student #${proof.student_id}`}</h4>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Roll: {proof.roll_no || 'N/A'} | {proof.course_applied || ''}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-3 py-1 bg-blue/10 text-blue font-black text-xs rounded-lg uppercase tracking-wider block w-max mb-1">
                                  {proof.fee_type}
                                </span>
                                <span className="text-[10px] text-muted font-bold uppercase">{proof.academic_year}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="font-black text-green-600 text-base">₹{Number(proof.amount || 0).toLocaleString()}</span>
                              </td>
                              <td className="px-6 py-4 text-center text-[10px] font-bold text-gray-500">
                                {new Date(proof.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {proof.screenshot ? (
                                  <button
                                    onClick={() => setPreviewProof(proof)}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-blue hover:text-white text-gray-700 font-bold text-[10px] rounded-xl uppercase tracking-wider transition-all inline-flex items-center gap-1.5 border border-gray-200"
                                  >
                                    <Eye size={14} /> Preview
                                  </button>
                                ) : (
                                  <span className="text-gray-300 text-xs italic">No file</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${isApproved ? 'bg-green-50 text-green-600 border-green-200' : isRejected ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'}`}>
                                  {isPending ? 'Pending Approval' : proof.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {isPending ? (
                                    <>
                                      <button
                                        onClick={() => handleApproveProof(proof)}
                                        className="px-4 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all flex items-center gap-1.5"
                                      >
                                        Approve & Edit Fee ↗
                                      </button>
                                      <button
                                        onClick={() => handleRejectProof(proof.id)}
                                        className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all border border-red-100"
                                        title="Reject Proof"
                                      >
                                        <X size={16} />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => handleOpenStudentAccount(proof)}
                                      className="px-3 py-1.5 bg-gray-100 hover:bg-blue hover:text-white text-ink rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                                    >
                                      Open Student Account ↗
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="bg-white rounded-3xl shadow-xl shadow-ink/5 border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                 <h4 className="font-bold text-ink">Database Registry</h4>
                 {activeTab === 'gallery' && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl">
                      <Filter size={14} className="text-gray-400" />
                      <select className="bg-transparent text-xs font-bold text-ink focus:outline-none" value={galleryFilter} onChange={(e) => setGalleryFilter(e.target.value)}>
                        <option value="all">All Categories</option>
                        <option value="internship">Internship</option>
                        <option value="field-visit">Field Visit</option>
                        <option value="event">Event</option>
                        <option value="trip">Trip</option>
                      </select>
                    </div>
                 )}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr className="bg-gray-50/30">
                      <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Primary Detail</th>
                      <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Segment</th>
                      <th className="px-10 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Management</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {data
                      .filter(item => {
                        if (activeTab === 'gallery' && galleryFilter !== 'all') {
                          const cat = (item.category || item.sub_label || '').toLowerCase();
                          if (galleryFilter === 'internship') return cat.includes('intern');
                          if (galleryFilter === 'field-visit') return cat.includes('field');
                          if (galleryFilter === 'event') return cat.includes('event');
                          if (galleryFilter === 'trip') return cat.includes('trip');
                          return false;
                        }
                        return true;
                      })
                      .map((item, idx) => (
                      <tr key={item._id || `item-${idx}`} className="group hover:bg-sky/50 transition-colors">
                        <td className="px-10 py-6">
                          <div className="flex items-center">
                                <div className="h-14 w-14 rounded-2xl bg-gray-100 overflow-hidden mr-5 border border-gray-100 shadow-sm group-hover:scale-105 transition-transform duration-500">
                                  {item.image || item.photo ? (
                                    (item.type === 'video' || (typeof (item.image || item.photo) === 'string' && /\.(mp4|webm|mov|mkv|ogg)$/i.test(item.image || item.photo))) ? (
                                      <div className="relative h-full w-full bg-black flex items-center justify-center overflow-hidden">
                                        <video 
                                          src={getImageUrl(item.image || item.photo)} 
                                          className="h-full w-full object-cover opacity-80" 
                                          muted 
                                          playsInline 
                                          preload="metadata"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                                          <div className="p-1.5 bg-black/60 backdrop-blur-sm rounded-full">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <img 
                                        src={getImageUrl(item.image || item.photo)} 
                                        className="h-full w-full object-cover" 
                                        alt="" 
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                                      />
                                    )
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold text-base bg-gray-50 uppercase">
                                      {item.initials || item.name?.[0] || item.label?.[0] || "?"}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-ink">{item.student_name || item.studentName || item.name || item.title || item.label || item.tag}</span>
                                  <span className="text-[10px] font-bold text-gray-400 mt-0.5 tracking-wide">
                                    #{idx + 1} {item.hall_ticket_number || item.hallTicketNumber ? `· ${item.hall_ticket_number || item.hallTicketNumber}` : ''}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-6">
                              <span className="px-4 py-1.5 rounded-xl bg-sky border border-blue/10 text-blue text-[10px] font-black uppercase shadow-sm shadow-blue/5">
                                {item.department || item.stream || item.exam || item.category || item.achievement || item.sub_label || item.hall_ticket_number || item.hallTicketNumber || 'Default'}
                              </span>
                            </td>
                            <td className="px-10 py-6 text-right">
                              <div className="flex justify-end gap-3">
                                <button 
                                  onClick={() => handleEdit(item)} 
                                  className="p-3 bg-blue/5 text-blue rounded-xl hover:bg-blue hover:text-white transition-all shadow-sm shadow-blue/5"
                                  title="Edit"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDelete(item.id || item._id)} 
                                  className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm shadow-red/5"
                                  title="Remove"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                    ))}
                    {data.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-10 py-32 text-center">
                          <div className="flex flex-col items-center gap-4 opacity-30">
                             <LayoutDashboard size={64} />
                             <div>
                                <p className="text-lg font-bold text-ink">No entries found</p>
                                <p className="text-xs font-medium">Start by adding your first record above</p>
                             </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Screenshot Preview Modal */}
      {previewProof && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
           <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100">
              <div className="p-6 bg-blue text-white flex items-center justify-between">
                 <div>
                    <h3 className="font-black text-sm uppercase tracking-wider">{previewProof.fee_type} Screenshot Proof</h3>
                    <p className="text-[10px] opacity-80 uppercase font-bold">{previewProof.student_name} | {previewProof.academic_year}</p>
                 </div>
                 <button onClick={() => setPreviewProof(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                    <X size={20} />
                 </button>
              </div>
              <div className="p-6 bg-gray-50 flex flex-col items-center justify-center min-h-[300px] gap-3">
                 <img 
                   src={getImageUrl(previewProof.screenshot)} 
                   alt="Payment Screenshot" 
                   className="max-h-[450px] w-auto object-contain rounded-2xl border border-gray-200 shadow-md"
                   onError={(e) => { 
                      e.target.onerror = null; 
                      const raw = previewProof.screenshot || '';
                      const filename = raw.split(/[\/\\]/).pop();
                      if (filename && !e.target.src.endsWith(filename)) {
                        e.target.src = '/uploads/' + filename;
                      }
                    }}
                 />
                 {previewProof.screenshot && (
                    <a 
                      href={getImageUrl(previewProof.screenshot)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[11px] font-bold text-blue hover:underline flex items-center gap-1 mt-2"
                    >
                      Open Screenshot Image in New Tab ↗
                    </a>
                  )}
              </div>
              <div className="p-6 bg-white border-t border-gray-100 flex items-center justify-between">
                 <div className="text-left">
                    <p className="text-[10px] text-muted font-bold uppercase">Claimed Amount</p>
                    <p className="text-xl font-black text-green-600">₹{Number(previewProof.amount || 0).toLocaleString()}</p>
                 </div>
                 <div className="flex gap-2">
                    {(previewProof.status || '').toLowerCase() === 'pending' && (
                       <button
                         onClick={() => {
                           const p = previewProof;
                           setPreviewProof(null);
                           handleApproveProof(p);
                         }}
                         className="px-5 py-2.5 bg-[#15803d] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#166534] shadow-lg shadow-green-500/20"
                       >
                          Approve & Edit Fee ↗
                       </button>
                    )}
                    <button
                      onClick={() => setPreviewProof(null)}
                      className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200"
                    >
                       Close
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}


function StaffManagementView({ staffList, onRefresh, onCreate, onDelete }) {
  const [view, setView] = useState('accounts');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attData, setAttData] = useState([]);
  const [attLoading, setAttLoading] = useState(false);
  const [newStaff, setNewStaff] = useState({ employee_id: '', name: '', email: '', password: '', department: '' });

  const STATUS_OPTIONS = ['Present', 'Absent', 'Leave', 'Half Day'];
  const STATUS_COLORS = {
    Present:    'bg-green-100 text-green-700 border-green-200',
    Absent:     'bg-red-100 text-red-700 border-red-200',
    Leave:      'bg-amber-100 text-amber-700 border-amber-200',
    'Half Day': 'bg-sky text-blue border-blue/20',
  };

  useEffect(() => {
    if (view === 'attendance') fetchAttendance();
  }, [view, attDate]);

  const fetchAttendance = async () => {
    setAttLoading(true);
    try {
      const res = await fetch('/api/staff/admin/attendance?date=' + attDate, { credentials: 'include' });
      const json = await res.json();
      setAttData(json.map(s => ({ ...s, status: s.status || 'Present', check_in: s.check_in || '', check_out: s.check_out || '' })));
    } catch (e) { console.error(e); }
    setAttLoading(false);
  };

  const updateAtt = (staffId, field, value) =>
    setAttData(prev => prev.map(s => s.id === staffId ? { ...s, [field]: value } : s));

  const saveAttendance = async () => {
    setSaving(true);
    try {
      await fetch('/api/staff/admin/attendance/bulk', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: attDate, records: attData.map(s => ({ staff_id: s.id, status: s.status, check_in: s.check_in, check_out: s.check_out })) })
      });
      alert('Attendance saved for ' + attDate);
    } catch (e) { alert('Save failed'); }
    setSaving(false);
  };

  const handleCreate = async () => {
    if (!newStaff.name || !newStaff.password) { alert('Name and password are required'); return; }
    await onCreate(newStaff);
    setNewStaff({ name: '', password: '', department: '' });
    setShowAdd(false);
  };

  return (
    <div className="animate-fadeIn">
      {view === 'accounts' && (
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-ink">Staff Accounts</h3>
              <p className="text-[10px] text-muted font-bold tracking-widest mt-1 uppercase">Total: {(staffList || []).length} members</p>
            </div>
            <button onClick={() => setShowAdd(v => !v)} className="px-6 py-3 bg-blue text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue/20 hover:bg-ink transition-all flex items-center gap-2">
              <Plus size={16} /> {showAdd ? 'Cancel' : 'Add Staff'}
            </button>
          </div>

          {showAdd && (
            <div className="bg-white p-8 rounded-3xl border border-blue/20 shadow-xl space-y-6">
              <h4 className="font-black text-ink text-sm uppercase tracking-widest border-b border-gray-100 pb-4">New Staff Account</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'name',        placeholder: 'Employee Name *' },
                  { key: 'password',    placeholder: 'Password *', type: 'password' },
                  { key: 'department',  placeholder: 'Department (e.g. Python Trainer)' },
                ].map(f => (
                  <input key={f.key} type={f.type || 'text'} placeholder={f.placeholder}
                    value={newStaff[f.key] || ''}
                    onChange={e => setNewStaff({ ...newStaff, [f.key]: e.target.value })}
                    className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue font-medium text-ink text-sm"
                  />
                ))}
              </div>
              <button onClick={handleCreate} className="w-full bg-[#15803d] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#166534] transition-all shadow-lg shadow-green-500/20">
                Create Staff Account
              </button>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {['Employee Name', 'Department', 'Action'].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!(staffList || []).length ? (
                  <tr><td colSpan={3} className="px-6 py-20 text-center text-gray-300 font-bold text-xs uppercase tracking-widest">No staff yet. Add one above.</td></tr>
                ) : (staffList || []).map(m => (
                  <tr key={m.id} className="hover:bg-sky/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-ink">{m.name}</td>
                    <td className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">{m.department || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => onDelete(m.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


function SettingsView({ settings, fields, onSaveSetting, onSaveFields, onDeleteField }) {
  const [fee, setFee] = useState(settings.registration_fee || '2000');
  const [editingFields, setEditingFields] = useState(fields);

  useEffect(() => {
    setFee(settings.registration_fee || '2000');
  }, [settings]);

  useEffect(() => {
    setEditingFields(fields);
  }, [fields]);

  const addField = () => {
    const newField = {
      field_name: `custom_${Date.now()}`,
      field_label: 'New Field',
      field_type: 'text',
      is_required: 0,
      is_active: 1,
      sort_order: editingFields.length
    };
    setEditingFields([...editingFields, newField]);
  };

  return (
    <div className="p-8 animate-fadeIn space-y-10">
       <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black text-ink uppercase tracking-tight">Master Site Settings</h3>
            <p className="text-[10px] text-muted font-bold tracking-widest mt-1 uppercase">Configure global portal behavior</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Fee Management */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-sky text-blue rounded-2xl flex items-center justify-center shadow-lg shadow-blue/5">
                   <LayoutDashboard size={24} />
                </div>
                <h4 className="font-black text-ink text-sm uppercase tracking-widest">Registration Fee</h4>
             </div>
             
             <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fee Amount (₹)</label>
                   <input 
                     type="number" 
                     value={fee} 
                     onChange={(e) => setFee(e.target.value)}
                     className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-blue outline-none transition-all font-black text-xl text-ink" 
                   />
                </div>
                <button 
                  onClick={() => onSaveSetting('registration_fee', fee)}
                  className="w-full bg-[#15803d] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-green-500/10 hover:bg-[#166534] transition-all"
                >
                   Update Global Fee
                </button>
             </div>
          </div>

          {/* Form Builder */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 bg-orange/10 text-orange rounded-xl flex items-center justify-center">
                      <Plus size={20} />
                   </div>
                   <h4 className="font-black text-ink text-sm uppercase tracking-widest">Registration Form Builder</h4>
                </div>
                <button 
                  onClick={addField}
                  className="px-6 py-3 bg-blue text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-ink transition-all shadow-lg shadow-blue/20"
                >
                   Add New Field
                </button>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="bg-gray-50">
                         <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Label</th>
                         <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                         <th className="px-6 py-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Required</th>
                         <th className="px-6 py-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Active</th>
                         <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {editingFields.map((field, idx) => (
                        <tr key={field.id || idx}>
                           <td className="px-6 py-4">
                              <input 
                                value={field.field_label}
                                onChange={(e) => {
                                  const newFields = [...editingFields];
                                  newFields[idx].field_label = e.target.value;
                                  setEditingFields(newFields);
                                }}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold text-ink focus:border-blue outline-none"
                              />
                           </td>
                           <td className="px-6 py-4">
                              <select 
                                value={field.field_type}
                                onChange={(e) => {
                                  const newFields = [...editingFields];
                                  newFields[idx].field_type = e.target.value;
                                  setEditingFields(newFields);
                                }}
                                className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black uppercase tracking-wider outline-none"
                              >
                                 <option value="text">TEXT</option>
                                 <option value="number">NUMBER</option>
                                 <option value="date">DATE</option>
                                 <option value="email">EMAIL</option>
                                 <option value="select">SELECT</option>
                                 <option value="textarea">TEXTAREA</option>
                              </select>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <input 
                                type="checkbox" 
                                checked={!!field.is_required} 
                                onChange={(e) => {
                                  const newFields = [...editingFields];
                                  newFields[idx].is_required = e.target.checked ? 1 : 0;
                                  setEditingFields(newFields);
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-blue focus:ring-0 cursor-pointer" 
                              />
                           </td>
                           <td className="px-6 py-4 text-center">
                              <input 
                                type="checkbox" 
                                checked={!!field.is_active} 
                                onChange={(e) => {
                                  const newFields = [...editingFields];
                                  newFields[idx].is_active = e.target.checked ? 1 : 0;
                                  setEditingFields(newFields);
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-green-500 focus:ring-0 cursor-pointer" 
                              />
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => field.id ? onDeleteField(field.id) : setEditingFields(editingFields.filter((_, i) => i !== idx))}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete field"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </td>
                        </tr>
                      ))}
                      {editingFields.length === 0 && (
                        <tr><td colSpan="5" className="px-6 py-20 text-center text-gray-300 font-bold uppercase tracking-widest text-[10px]">No registration fields configured</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
             
             <div className="p-8 bg-gray-50/50 border-t border-gray-100">
                <button 
                  onClick={() => onSaveFields(editingFields)}
                  className="w-full bg-[#15803d] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-green-500/10 hover:bg-[#166534] transition-all"
                >
                   Save Form Changes
                </button>
             </div>
          </div>
       </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  OnlineRegistrationsView
 *  Super Admin management for website online student registrations & payment proof
 * ─────────────────────────────────────────────────────────────────────────── */
function OnlineRegistrationsView({ onRefreshStudentCount }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // 'All', 'Pending', 'Approved', 'Rejected'
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [previewScreenshot, setPreviewScreenshot] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/online-registrations`, { withCredentials: true });
      setRegistrations(res.data || []);
    } catch (err) {
      console.error("Fetch online registrations error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleUpdateStatus = async (studentId, proofId, newStatus) => {
    if (newStatus === 'Confirmed' || newStatus === 'Enrolled') {
      const confirmEnroll = window.confirm(
        "CONFIRM STUDENT ADMISSION?\n\n" +
        "Has management spoken to this student and confirmed their admission?\n\n" +
        "- This will APPROVE their registration payment (Rs. 2,000).\n" +
        "- This will officially ENROLL the student into 'Student Accounts'.\n\n" +
        "Click OK to Confirm and Enroll:"
      );
      if (!confirmEnroll) return;
    }

    setProcessingId(studentId);
    try {
      const res = await axios.put(`${API_URL}/admin/online-registrations/${studentId}/status`, {
        registration_status: newStatus === 'Enrolled' ? 'Confirmed' : newStatus,
        status: (newStatus === 'Confirmed' || newStatus === 'Enrolled') ? 'Approved' : (newStatus === 'Rejected' ? 'Rejected' : 'Pending'),
        is_enrolled: (newStatus === 'Confirmed' || newStatus === 'Enrolled') ? 1 : 0,
        proof_id: proofId
      }, { withCredentials: true });
      
      alert(res.data.message || `Status updated to ${newStatus}`);
      await fetchRegistrations();
      if (selectedApp && selectedApp.id === studentId) {
        setSelectedApp(prev => prev ? ({ 
          ...prev, 
          registration_status: newStatus, 
          is_enrolled: (newStatus === 'Confirmed' || newStatus === 'Enrolled') ? 1 : 0,
          payment_status: (newStatus === 'Confirmed' || newStatus === 'Enrolled') ? 'Approved' : (newStatus === 'Rejected' ? 'Rejected' : 'Pending')
        }) : null);
      }
      if (onRefreshStudentCount) onRefreshStudentCount();
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteApp = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this online registration application? This will permanently remove all student details and payment proofs.")) return;
    try {
      await axios.delete(`${API_URL}/admin/online-registrations/${studentId}`, { withCredentials: true });
      if (selectedApp?.id === studentId) setSelectedApp(null);
      await fetchRegistrations();
      if (onRefreshStudentCount) onRefreshStudentCount();
    } catch (err) {
      alert("Failed to delete application: " + (err.response?.data?.message || err.message));
    }
  };

  const waitingListCount = registrations.filter(r => (r.registration_status || 'Waiting List') === 'Waiting List' && !r.is_enrolled).length;
  const underReviewCount = registrations.filter(r => (r.registration_status || '') === 'Under Review').length;
  const enrolledCount = registrations.filter(r => r.is_enrolled || (r.registration_status || '') === 'Enrolled' || (r.registration_status || '') === 'Confirmed').length;
  const rejectedCount = registrations.filter(r => (r.registration_status || '').toLowerCase() === 'rejected').length;
  const totalFees = enrolledCount * 2000;

  const filtered = registrations.filter(r => {
    const regStatus = (r.registration_status || (r.is_enrolled ? 'Enrolled' : 'Waiting List'));
    if (filter === 'Waiting List' && (regStatus !== 'Waiting List' || r.is_enrolled)) return false;
    if (filter === 'Under Review' && regStatus !== 'Under Review') return false;
    if (filter === 'Enrolled' && (!r.is_enrolled && regStatus !== 'Enrolled' && regStatus !== 'Confirmed')) return false;
    if (filter === 'Rejected' && regStatus.toLowerCase() !== 'rejected') return false;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = (r.student_name || '').toLowerCase().includes(q);
      const matchEmail = (r.email || '').toLowerCase().includes(q);
      const matchMobile = (r.mobile1 || '').includes(q) || (r.mobile2 || '').includes(q);
      const matchCourse = (r.course_applied || '').toLowerCase().includes(q);
      const matchDistrict = (r.district || '').toLowerCase().includes(q);
      const matchFather = (r.father_name || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchMobile || matchCourse || matchDistrict || matchFather;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header & Summary Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black text-ink uppercase tracking-tight">Online Registrations & Admissions</h3>
          <p className="text-xs text-muted font-bold tracking-wider mt-1">
            Applicants stay in the <span className="text-amber-600 font-extrabold">Waiting List</span> until management speaks with them and explicitly confirms their admission.
          </p>
        </div>
        <button 
          onClick={fetchRegistrations}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-ink rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-gray-50 shadow-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-blue" : ""} /> Refresh List
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Waiting List</span>
            <div className="p-2 bg-amber-50 text-amber-500 rounded-xl"><Clock size={18} /></div>
          </div>
          <p className="text-3xl font-black text-amber-600 mt-3">{waitingListCount}</p>
          <span className="text-[10px] text-amber-600/80 font-bold">Registered · In Waiting Pool</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-blue uppercase tracking-widest">In Discussion</span>
            <div className="p-2 bg-blue/10 text-blue rounded-xl"><Phone size={18} /></div>
          </div>
          <p className="text-3xl font-black text-blue mt-3">{underReviewCount}</p>
          <span className="text-[10px] text-blue/80 font-bold">Calling / Under Review</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Confirmed Admissions</span>
            <div className="p-2 bg-green-50 text-green-600 rounded-xl"><CheckCircle2 size={18} /></div>
          </div>
          <p className="text-3xl font-black text-green-600 mt-3">{enrolledCount}</p>
          <span className="text-[10px] text-green-600/80 font-bold">Enrolled in Student Accounts</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirmed Fees</span>
            <div className="p-2 bg-sky text-blue rounded-xl"><CreditCard size={18} /></div>
          </div>
          <p className="text-3xl font-black text-ink mt-3">Rs. {totalFees.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-muted font-bold">Rs. 2,000 / enrolled student</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: 'All', label: 'All Applications', count: registrations.length },
            { key: 'Waiting List', label: 'Waiting List', count: waitingListCount },
            { key: 'Under Review', label: 'Under Review', count: underReviewCount },
            { key: 'Enrolled', label: 'Enrolled in Accounts', count: enrolledCount },
            { key: 'Rejected', label: 'Rejected / Cancelled', count: rejectedCount }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                filter === tab.key 
                  ? 'bg-blue text-white shadow-lg shadow-blue/20' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search name, phone, course, district..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-ink focus:outline-none focus:border-blue transition-all"
          />
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Applicant</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Course Applied</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Payment Proof</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">
                    No {filter !== 'All' ? filter.toLowerCase() : ''} online registration applications found.
                  </td>
                </tr>
              ) : (
                filtered.map((app, idx) => {
                  const regStatus = app.registration_status || (app.is_enrolled ? 'Enrolled' : 'Waiting List');
                  const isEnrolled = app.is_enrolled || regStatus === 'Enrolled' || regStatus === 'Confirmed';
                  const isUnderReview = regStatus === 'Under Review';
                  const isRejected = regStatus === 'Rejected';
                  const isWaitingList = !isEnrolled && !isUnderReview && !isRejected;

                  return (
                    <tr key={app.id || idx} className="hover:bg-sky/20 transition-colors group">
                      {/* Applicant Profile */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-2xl bg-sky flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm shrink-0">
                            {app.photo ? (
                              <img 
                                src={getImageUrl(app.photo)} 
                                alt="" 
                                className="h-full w-full object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150?text=Student"; }}
                              />
                            ) : (
                              <span className="text-blue font-black text-base uppercase">
                                {app.student_name?.[0] || 'S'}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-black text-ink text-sm group-hover:text-blue transition-colors">
                              {app.student_name || 'Anonymous Student'}
                            </h4>
                            <p className="text-[10px] text-gray-400 font-bold tracking-wide mt-0.5">
                              Father: {app.father_name || 'N/A'}
                            </p>
                            <p className="text-[9px] text-muted font-medium">
                              {app.created_at ? new Date(app.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Course */}
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue/10 text-blue font-black text-[11px] rounded-lg uppercase tracking-wider block w-max mb-1">
                          {app.course_applied || 'Ag. B.Sc.'}
                        </span>
                        <p className="text-[10px] text-gray-500 font-bold">
                          {app.branch && app.branch !== 'NULL' ? app.branch : 'General'} · {app.admission_type || 'Residential'}
                        </p>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-ink flex items-center gap-1">
                          <Phone size={12} className="text-gray-400" /> {app.mobile1 || 'N/A'}
                        </p>
                        {app.mobile2 && (
                          <p className="text-[10px] text-gray-500 font-medium ml-4">
                            Alt: {app.mobile2}
                          </p>
                        )}
                        <p className="text-[10px] text-muted truncate max-w-[180px] flex items-center gap-1 mt-0.5">
                          <Mail size={12} className="text-gray-400 shrink-0" /> {app.email || 'N/A'}
                        </p>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-ink">
                          {app.village || app.district || 'N/A'}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {app.district ? `${app.district} · ${app.pin || ''}` : ''}
                        </p>
                      </td>

                      {/* Payment Screenshot */}
                      <td className="px-6 py-4 text-center">
                        {app.payment_screenshot ? (
                          <div className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => setPreviewScreenshot({
                                url: getImageUrl(app.payment_screenshot),
                                name: app.student_name,
                                course: app.course_applied,
                                amount: app.registration_fee_paid || '2000'
                              })}
                              className="relative group/thumb h-12 w-12 rounded-xl overflow-hidden border-2 border-blue/30 shadow-sm hover:scale-110 transition-transform block"
                            >
                              <img 
                                src={getImageUrl(app.payment_screenshot)} 
                                alt="Screenshot" 
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <Eye size={16} />
                              </div>
                            </button>
                            <span className="text-[9px] font-black text-green-600">Rs. {app.registration_fee_paid || '2,000'}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-300 uppercase italic">No Screenshot</span>
                        )}
                      </td>

                      {/* Status Dropdown / Badge */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <select
                            disabled={processingId === app.id}
                            value={isEnrolled ? 'Confirmed' : regStatus}
                            onChange={(e) => handleUpdateStatus(app.id, app.proof_id, e.target.value)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer focus:outline-none transition-all shadow-sm ${
                              isEnrolled ? 'bg-green-50 text-green-700 border-green-300' :
                              isUnderReview ? 'bg-blue/10 text-blue border-blue/30' :
                              isRejected ? 'bg-red-50 text-red-600 border-red-200' :
                              'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            <option value="Waiting List">Waiting List</option>
                            <option value="Under Review">Under Review (Calling)</option>
                            <option value="Confirmed">Confirm Admission (Add to Accounts)</option>
                            <option value="Rejected">Rejected / Cancelled</option>
                          </select>
                          {isEnrolled && (
                            <span className="text-[9px] font-bold text-green-600">In Student Accounts</span>
                          )}
                          {isWaitingList && (
                            <span className="text-[9px] text-amber-700 font-bold">Not in Student Accounts</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="p-2.5 bg-blue text-white rounded-xl hover:bg-ink transition-all shadow-md shadow-blue/20"
                            title="View Full Application Details"
                          >
                            <Eye size={15} />
                          </button>

                          {!isEnrolled && (
                            <button
                              disabled={processingId === app.id}
                              onClick={() => handleUpdateStatus(app.id, app.proof_id, 'Confirmed')}
                              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md shadow-green-600/20 transition-all flex items-center gap-1.5"
                              title="Confirm Admission & Add into Student Accounts"
                            >
                              <Check size={13} /> Enroll
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteApp(app.id)}
                            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete Application Record"
                          >
                            <Trash2 size={15} />
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

      {/* Full Application Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col my-8">
            {/* Modal Header */}
            <div className="p-8 bg-blue text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-2xl bg-white/10 border-2 border-white/30 overflow-hidden flex items-center justify-center shadow-lg">
                  {selectedApp.photo ? (
                    <img src={getImageUrl(selectedApp.photo)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-white">{selectedApp.student_name?.[0] || 'S'}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black">{selectedApp.student_name}</h3>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {selectedApp.course_applied || 'Ag. B.Sc.'}
                    </span>
                  </div>
                  <p className="text-xs text-sky/80 font-bold mt-1">
                    Applied on {selectedApp.created_at ? new Date(selectedApp.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Recent'} · Status: <span className="font-black text-white">{selectedApp.payment_status || 'Pending'}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto space-y-8 flex-1">
              {/* Payment Proof Highlight Section */}
              <div className="bg-[#1a6b3c]/5 border-2 border-dashed border-[#1a6b3c]/20 p-6 rounded-3xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1 text-center md:text-left">
                    <span className="text-[10px] font-black text-[#1a6b3c] uppercase tracking-widest">Registration Fee Payment</span>
                    <p className="text-3xl font-black text-ink">₹ {selectedApp.registration_fee_paid || '2,000.00'}</p>
                    <p className="text-xs text-muted font-bold">Transaction Type: {selectedApp.fee_type || 'Registration Fee'}</p>
                  </div>

                  {selectedApp.payment_screenshot && (
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setPreviewScreenshot({
                          url: getImageUrl(selectedApp.payment_screenshot),
                          name: selectedApp.student_name,
                          course: selectedApp.course_applied,
                          amount: selectedApp.registration_fee_paid || '2000'
                        })}
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                      >
                        <img 
                          src={getImageUrl(selectedApp.payment_screenshot)} 
                          alt="Screenshot Thumbnail" 
                          className="h-14 w-14 rounded-xl object-cover border border-gray-100"
                        />
                        <div className="text-left pr-2">
                          <p className="text-xs font-black text-blue group-hover:underline flex items-center gap-1">
                            <Eye size={14} /> Click to View Full Screenshot
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold">PNG / JPG Proof</p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Admission Decision Card */}
              <div className="bg-amber-50/60 border border-amber-200 p-6 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-2">
                    <Clock size={16} /> Admission Lifecycle Decision
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    selectedApp.is_enrolled ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedApp.is_enrolled ? 'Enrolled in Student Accounts' : 'In Waiting Pool'}
                  </span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Students register online and pay registration fee first. If they confirm their decision to study at Sri Sai Institute, click <strong>"Confirm Admission & Add to Student Accounts"</strong>. Otherwise, keep them in <strong>"Waiting List"</strong> or <strong>"Under Review"</strong>.
                </p>
                <div className="flex items-center gap-3 flex-wrap pt-2">
                  <button
                    disabled={processingId === selectedApp.id}
                    onClick={() => handleUpdateStatus(selectedApp.id, selectedApp.proof_id, 'Waiting List')}
                    className="px-4 py-2 bg-white border border-amber-300 text-amber-800 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all"
                  >
                    Move to Waiting List
                  </button>
                  <button
                    disabled={processingId === selectedApp.id}
                    onClick={() => handleUpdateStatus(selectedApp.id, selectedApp.proof_id, 'Under Review')}
                    className="px-4 py-2 bg-white border border-blue/30 text-blue rounded-xl text-xs font-bold hover:bg-blue/10 transition-all"
                  >
                    Mark Under Review (Calling)
                  </button>
                  <button
                    disabled={processingId === selectedApp.id}
                    onClick={() => handleUpdateStatus(selectedApp.id, selectedApp.proof_id, 'Confirmed')}
                    className="px-5 py-2 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-green-700 shadow-md shadow-green-600/20 transition-all flex items-center gap-1.5"
                  >
                    <Check size={14} /> Confirm Admission & Add to Accounts
                  </button>
                  <button
                    disabled={processingId === selectedApp.id}
                    onClick={() => handleUpdateStatus(selectedApp.id, selectedApp.proof_id, 'Rejected')}
                    className="px-4 py-2 bg-white border border-red-200 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50 transition-all"
                  >
                    Cancel Application
                  </button>
                </div>
              </div>

              {/* Personal Information Grid */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <UserCheck size={16} className="text-blue" /> Personal & Academic Information
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/70 p-6 rounded-3xl border border-gray-100 text-xs">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Father's Name</span>
                    <p className="font-bold text-ink mt-1">{selectedApp.father_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Mother's Name</span>
                    <p className="font-bold text-ink mt-1">{selectedApp.mother_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Date of Birth</span>
                    <p className="font-bold text-ink mt-1">{selectedApp.dob ? new Date(selectedApp.dob).toLocaleDateString('en-IN') : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Gender</span>
                    <p className="font-bold text-ink mt-1">{selectedApp.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Course Applied</span>
                    <p className="font-bold text-blue mt-1">{selectedApp.course_applied || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Branch / Stream</span>
                    <p className="font-bold text-ink mt-1">{selectedApp.branch && selectedApp.branch !== 'NULL' ? selectedApp.branch : 'General'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Admission Type</span>
                    <p className="font-bold text-ink mt-1">{selectedApp.admission_type || 'Residential'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Medium of Instruction</span>
                    <p className="font-bold text-ink mt-1">{selectedApp.medium || 'English Medium'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Nationality</span>
                    <p className="font-bold text-ink mt-1">{selectedApp.nationality || 'Indian'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Religion</span>
                    <p className="font-bold text-ink mt-1">{selectedApp.religion || 'Hindu'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Enrolled Year</span>
                    <p className="font-bold text-ink mt-1">{selectedApp.academic_enrolled_year || '2024-2025'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Reference</span>
                    <p className="font-bold text-ink mt-1">{selectedApp.reference || 'Self'}</p>
                  </div>
                </div>
              </div>

              {/* Contact & Address Grid */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={16} className="text-blue" /> Contact & Permanent Address
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/70 p-6 rounded-3xl border border-gray-100 text-xs">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Primary Mobile</span>
                    <p className="font-bold text-ink mt-1">{selectedApp.mobile1 || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Alternative Mobile</span>
                    <p className="font-bold text-ink mt-1">{selectedApp.mobile2 || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Email Address</span>
                    <p className="font-bold text-ink mt-1">{selectedApp.email || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Door / House No</span>
                    <p className="font-bold text-ink mt-1">{selectedApp.door_no || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Village / Town</span>
                    <p className="font-bold text-ink mt-1">{selectedApp.village || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Mandal</span>
                    <p className="font-bold text-ink mt-1">{selectedApp.mandal || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">District & PIN</span>
                    <p className="font-bold text-ink mt-1">{selectedApp.district || 'N/A'} {selectedApp.pin ? `- ${selectedApp.pin}` : ''}</p>
                  </div>
                </div>
              </div>

              {/* Qualifications Table */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen size={16} className="text-blue" /> Prior Academic Qualifications
                </h4>
                <div className="bg-gray-50/70 rounded-3xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-100/60 border-b border-gray-100">
                        <th className="px-6 py-3 font-black text-gray-400 uppercase tracking-wider text-[10px]">Examination</th>
                        <th className="px-6 py-3 font-black text-gray-400 uppercase tracking-wider text-[10px]">Board / University</th>
                        <th className="px-6 py-3 font-black text-gray-400 uppercase tracking-wider text-[10px] text-center">Year of Passing</th>
                        <th className="px-6 py-3 font-black text-gray-400 uppercase tracking-wider text-[10px] text-right">Percentage / CGPA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(selectedApp.qualifications || []).length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-6 text-center text-gray-400 font-bold text-xs italic">
                            No academic qualifications recorded.
                          </td>
                        </tr>
                      ) : (
                        selectedApp.qualifications.map((q, qIdx) => (
                          <tr key={qIdx}>
                            <td className="px-6 py-3.5 font-bold text-ink">{q.examination || 'S.S.C / Inter'}</td>
                            <td className="px-6 py-3.5 text-gray-600">{q.board_university || 'State Board'}</td>
                            <td className="px-6 py-3.5 text-center font-bold text-ink">{q.year_of_passing || '-'}</td>
                            <td className="px-6 py-3.5 text-right font-black text-blue">{q.percentage_cgpa || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4 shrink-0">
              <button
                onClick={() => handleDeleteApp(selectedApp.id)}
                className="px-6 py-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Delete Application
              </button>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 mr-2">
                  Status: <strong className="uppercase text-ink">{selectedApp.registration_status || (selectedApp.is_enrolled ? 'Enrolled' : 'Waiting List')}</strong>
                </span>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Payment Screenshot Modal */}
      {previewScreenshot && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
            <div className="p-6 bg-blue text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider">Registration Payment Screenshot</h3>
                <p className="text-[10px] opacity-80 uppercase font-bold">{previewScreenshot.name} · Rs. {previewScreenshot.amount}</p>
              </div>
              <button onClick={() => setPreviewScreenshot(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 bg-gray-900 flex flex-col items-center justify-center min-h-[350px] max-h-[70vh] overflow-auto">
              <img 
                src={previewScreenshot.url} 
                alt="Payment Screenshot Full" 
                className="max-h-[60vh] w-auto object-contain rounded-xl border border-gray-700 shadow-2xl"
              />
            </div>
            <div className="p-5 bg-white border-t border-gray-100 flex items-center justify-between">
              <a 
                href={previewScreenshot.url} 
                target="_blank" 
                rel="noreferrer" 
                className="text-xs font-bold text-blue hover:underline flex items-center gap-1.5"
              >
                <ExternalLink size={14} /> Open Original in New Tab
              </a>
              <button
                onClick={() => setPreviewScreenshot(null)}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdmissionEnquiriesView() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [tempNote, setTempNote] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/enquiries');
      setEnquiries(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load enquiries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const handleUpdateStatus = async (id, newStatus, existingNotes) => {
    setUpdatingId(id);
    try {
      await axios.put(`/api/enquiries/${id}/status`, { status: newStatus, notes: existingNotes });
      setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
    } catch (err) {
      alert('Failed to update enquiry status: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async (id, currentStatus) => {
    setUpdatingId(id);
    try {
      await axios.put(`/api/enquiries/${id}/status`, { status: currentStatus, notes: tempNote });
      setEnquiries(prev => prev.map(e => e.id === id ? { ...e, notes: tempNote } : e));
      setEditingNoteId(null);
    } catch (err) {
      alert('Failed to save follow-up notes: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enquiry record?')) return;
    try {
      await axios.delete(`/api/enquiries/${id}`);
      setEnquiries(prev => prev.filter(e => e.id !== id));
      if (selectedEnquiry?.id === id) setSelectedEnquiry(null);
    } catch (err) {
      alert('Failed to delete enquiry: ' + (err.response?.data?.message || err.message));
    }
  };

  // Metrics
  const totalCount = enquiries.length;
  const newCount = enquiries.filter(e => (e.status || 'New') === 'New').length;
  const contactedCount = enquiries.filter(e => e.status === 'Contacted' || e.status === 'Interested').length;
  const admittedCount = enquiries.filter(e => e.status === 'Admitted').length;

  const filtered = enquiries.filter(e => {
    const status = e.status || 'New';
    if (filter === 'New' && status !== 'New') return false;
    if (filter === 'Contacted' && status !== 'Contacted') return false;
    if (filter === 'Interested' && status !== 'Interested') return false;
    if (filter === 'Admitted' && status !== 'Admitted') return false;
    if (filter === 'Closed' && status !== 'Closed') return false;

    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (e.student_name || '').toLowerCase().includes(q) ||
      (e.parent_name || '').toLowerCase().includes(q) ||
      (e.mobile || '').includes(q) ||
      (e.email || '').toLowerCase().includes(q) ||
      (e.stream || '').toLowerCase().includes(q) ||
      (e.batch || '').toLowerCase().includes(q) ||
      (e.message || '').toLowerCase().includes(q) ||
      (e.notes || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Metrics */}
      <div className="bg-gradient-to-r from-blue to-navy p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="px-3.5 py-1 bg-white/10 text-sky text-[10px] font-black uppercase tracking-widest rounded-full">
            Prospective Leads & Inquiries
          </span>
          <h2 className="text-3xl font-black mt-2 tracking-tight">Admission Enquiries</h2>
          <p className="text-sm text-sky/80 font-bold mt-1">
            Review student inquiries, follow up directly via 1-click calls or WhatsApp, and track admission status.
          </p>
        </div>

        <button
          onClick={fetchEnquiries}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-wider backdrop-blur-md transition-all self-stretch md:self-auto justify-center"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Enquiries
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Inquiries</p>
            <h3 className="text-3xl font-black text-ink mt-1">{totalCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue/10 flex items-center justify-center text-blue">
            <MessageSquare size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">New / To Call</p>
            <h3 className="text-3xl font-black text-red-600 mt-1">{newCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
            <PhoneCall size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-blue uppercase tracking-widest">In Discussion</p>
            <h3 className="text-3xl font-black text-blue mt-1">{contactedCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-sky flex items-center justify-center text-blue">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Admitted / Converted</p>
            <h3 className="text-3xl font-black text-green-600 mt-1">{admittedCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Controls: Search & Filter Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { id: 'All', label: 'All Leads' },
            { id: 'New', label: '🔴 New' },
            { id: 'Contacted', label: '📞 Contacted' },
            { id: 'Interested', label: '🟡 Interested' },
            { id: 'Admitted', label: '🟢 Admitted' },
            { id: 'Closed', label: '⚫ Closed' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs tracking-wider transition-all whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-blue text-white shadow-lg shadow-blue/20'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, phone, stream..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-ink placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Enquirer Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Stream & Batch</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Direct Call & Contact</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Question / Message</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">
                    No {filter !== 'All' ? filter.toLowerCase() : ''} admission enquiries found.
                  </td>
                </tr>
              ) : (
                filtered.map((enq, idx) => {
                  const cleanMobile = (enq.mobile || '').replace(/\D/g, '');
                  const currentStatus = enq.status || 'New';
                  const isNew = currentStatus === 'New';

                  return (
                    <tr key={enq.id || idx} className="hover:bg-sky/20 transition-colors group">
                      {/* Enquirer Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-2xl bg-blue/10 flex items-center justify-center text-blue font-black text-base border border-blue/20 shrink-0">
                            {enq.student_name?.[0] || 'S'}
                          </div>
                          <div>
                            <h4 className="font-black text-ink text-sm group-hover:text-blue transition-colors flex items-center gap-2">
                              {enq.student_name || 'Prospective Student'}
                              {isNew && (
                                <span className="px-2 py-0.5 bg-red-500 text-white font-black text-[9px] uppercase tracking-wider rounded-full animate-pulse">
                                  New
                                </span>
                              )}
                            </h4>
                            <p className="text-[11px] text-gray-500 font-bold mt-0.5">
                              Parent: {enq.parent_name || 'N/A'}
                            </p>
                            <p className="text-[9px] text-muted font-medium">
                              {enq.created_at ? new Date(enq.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Stream & Batch */}
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue/10 text-blue font-black text-[11px] rounded-lg uppercase tracking-wider block w-max mb-1">
                          {enq.stream || 'Ag. B.Sc.'}
                        </span>
                        <p className="text-[10px] text-gray-500 font-bold">
                          Batch: {enq.batch || 'Regular'}
                        </p>
                      </td>

                      {/* Direct Call & WhatsApp Contact */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <div className="flex items-center gap-2">
                            {cleanMobile ? (
                              <a
                                href={`tel:${cleanMobile}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black shadow-md shadow-green-600/20 transition-all hover:scale-105 active:scale-95"
                                title={`Direct Call: ${enq.mobile}`}
                              >
                                <PhoneCall size={13} /> {enq.mobile}
                              </a>
                            ) : (
                              <span className="text-xs font-bold text-gray-400">No Mobile</span>
                            )}

                            {cleanMobile && (
                              <a
                                href={`https://wa.me/91${cleanMobile}?text=${encodeURIComponent(`Hello ${enq.student_name || ''}, greetings from Sri Sai Institute of Agriculture Sciences! We received your enquiry for ${enq.stream || 'admissions'}. How can we assist you today?`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-105"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle size={13} /> WA
                              </a>
                            )}
                          </div>

                          {enq.email && (
                            <a
                              href={`mailto:${enq.email}`}
                              className="text-[10px] text-muted hover:text-blue flex items-center gap-1 font-medium truncate max-w-[200px]"
                              title={enq.email}
                            >
                              <Mail size={11} className="shrink-0" /> {enq.email}
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Question / Message */}
                      <td className="px-6 py-4 max-w-xs">
                        {enq.message ? (
                          <div>
                            <p className="text-xs text-ink line-clamp-2 italic bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                              "{enq.message}"
                            </p>
                            {enq.message.length > 60 && (
                              <button
                                onClick={() => setSelectedEnquiry(enq)}
                                className="text-[10px] font-bold text-blue hover:underline mt-1 block"
                              >
                                View full message
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">No specific message</span>
                        )}

                        {/* Management Notes */}
                        {enq.notes && (
                          <p className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 mt-1.5 flex items-center gap-1">
                            <FileText size={11} /> Note: {enq.notes}
                          </p>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-6 py-4 text-center">
                        <select
                          disabled={updatingId === enq.id}
                          value={currentStatus}
                          onChange={(e) => handleUpdateStatus(enq.id, e.target.value, enq.notes)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer focus:outline-none transition-all shadow-sm ${
                            currentStatus === 'New' ? 'bg-red-50 text-red-600 border-red-200' :
                            currentStatus === 'Contacted' ? 'bg-blue/10 text-blue border-blue/30' :
                            currentStatus === 'Interested' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                            currentStatus === 'Admitted' ? 'bg-green-50 text-green-700 border-green-300' :
                            'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          <option value="New">🔴 New Enquiry</option>
                          <option value="Contacted">📞 Contacted (Called)</option>
                          <option value="Interested">🟡 Interested / Follow-up</option>
                          <option value="Admitted">🟢 Admitted / Converted</option>
                          <option value="Closed">⚫ Closed / Not Interested</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedEnquiry(enq);
                              setEditingNoteId(enq.id);
                              setTempNote(enq.notes || '');
                            }}
                            className="p-2.5 bg-blue text-white rounded-xl hover:bg-ink transition-all shadow-md shadow-blue/20"
                            title="View Details & Add Notes"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() => handleDelete(enq.id)}
                            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete Enquiry"
                          >
                            <Trash2 size={15} />
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

      {/* Enquiry Details & Notes Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] max-w-xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
            <div className="p-6 bg-blue text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center font-black text-xl text-white">
                  {selectedEnquiry.student_name?.[0] || 'S'}
                </div>
                <div>
                  <h3 className="font-black text-lg">{selectedEnquiry.student_name}</h3>
                  <p className="text-xs text-sky/80 font-bold">
                    Parent: {selectedEnquiry.parent_name || 'N/A'} · Stream: {selectedEnquiry.stream || 'Ag. B.Sc.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedEnquiry(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Direct Quick Call Box */}
              <div className="bg-green-50 border border-green-200 p-5 rounded-3xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Direct Phone Number</span>
                  <h4 className="text-xl font-black text-ink mt-0.5">{selectedEnquiry.mobile}</h4>
                  {selectedEnquiry.email && <p className="text-xs text-gray-500 mt-0.5">{selectedEnquiry.email}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedEnquiry.mobile}`}
                    className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-green-600/30 transition-all hover:scale-105"
                  >
                    <PhoneCall size={16} /> Call Now
                  </a>
                  <a
                    href={`https://wa.me/91${(selectedEnquiry.mobile || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${selectedEnquiry.student_name || ''}, greetings from Sri Sai Institute of Agriculture Sciences!`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-2xl shadow-md transition-all hover:scale-105"
                    title="WhatsApp"
                  >
                    <MessageCircle size={18} />
                  </a>
                </div>
              </div>

              {/* Enquiry Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-5 rounded-3xl border border-gray-100 text-xs">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Stream of Interest</span>
                  <p className="font-bold text-blue mt-1">{selectedEnquiry.stream || 'Ag. B.Sc.'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Batch Preference</span>
                  <p className="font-bold text-ink mt-1">{selectedEnquiry.batch || 'Regular'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Enquiry Date & Time</span>
                  <p className="font-bold text-ink mt-1">
                    {selectedEnquiry.created_at ? new Date(selectedEnquiry.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Student Message / Questions</span>
                  <p className="font-medium text-ink bg-white p-3.5 rounded-2xl border border-gray-100 mt-1.5 leading-relaxed italic">
                    "{selectedEnquiry.message || 'No additional questions provided by the enquirer.'}"
                  </p>
                </div>
              </div>

              {/* Management Follow-up Notes & Comments */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                  Management Follow-up Notes & Comments
                </label>
                <textarea
                  rows="3"
                  placeholder="E.g. Called parent on 16 Aug, interested in hostel and scholarship. Follow-up on Saturday..."
                  value={editingNoteId === selectedEnquiry.id ? tempNote : (selectedEnquiry.notes || '')}
                  onChange={(e) => {
                    setEditingNoteId(selectedEnquiry.id);
                    setTempNote(e.target.value);
                  }}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium text-ink focus:outline-none focus:bg-white focus:border-blue transition-all"
                />
                <div className="flex justify-end">
                  <button
                    disabled={updatingId === selectedEnquiry.id}
                    onClick={() => handleSaveNotes(selectedEnquiry.id, selectedEnquiry.status || 'New')}
                    className="px-5 py-2.5 bg-blue hover:bg-ink text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-blue/20 transition-all"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => handleDelete(selectedEnquiry.id)}
                className="px-5 py-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Delete Enquiry
              </button>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
