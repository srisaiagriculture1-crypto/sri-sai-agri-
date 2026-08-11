import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  EyeOff
} from 'lucide-react';

const API_URL = '/api';

export default function AdminDashboard() {
  const excelInputRef = useRef(null);
  const [isAdmin, setIsAdmin] = useState(false);
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

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/\\/g, '/').replace(/^\//, '');
    return `/${cleanPath}`;
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
    { id: 'students', label: 'Student Accounts', icon: Users },
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

  const checkAuth = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/auth`, { withCredentials: true });
      if (res.data.authenticated) {
        setIsAdmin(true);
      }
    } catch (err) {
      setIsAdmin(false);
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

  useEffect(() => {
    if (isAdmin) {
      const fetchStudents = async () => {
        try {
          const res = await axios.get(`${API_URL}/students/admin/list`);
          setStudents(res.data);
        } catch (err) {
          console.error("Fetch students failed");
        }
      };

      if (activeTab === "students") {
        fetchStudents();
      } else if (activeTab === "imports") {
        fetchExcelImports();
      } else if (activeTab === "staff") {
        fetchStaff();
      } else {
        fetchData();
      }
    }
  }, [isAdmin, activeTab, fetchData, refresh, fetchExcelImports]);

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

  useEffect(() => {
    setViewMode('list');
    setEditingId(null);
    setFormData({});
    setFile(null);
  }, [activeTab]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/admin/login`, { username, password }, { withCredentials: true });
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
    const payload = new FormData();
    Object.keys(formData).forEach(key => {
      if (!['_id', 'id', 'image', 'created_at', 'existing_image'].includes(key)) {
        payload.append(key, formData[key]);
      }
    });

    if (activeTab === 'ranks' || activeTab === 'testimonials') {
      if (formData.studentName) payload.append('student_name', formData.studentName);
    }
    if (activeTab === 'ranks' && formData.hallTicketNumber) {
      payload.append('hall_ticket_number', formData.hallTicketNumber);
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
       mapped.studentName = item.student_name || item.studentName;
    }
    
    if (activeTab === 'ranks') {
       mapped.hallTicketNumber = item.hall_ticket_number || item.hallTicketNumber;
    }
    
    if (activeTab === 'courses' && item.details) {
      try {
        const arr = typeof item.details === 'string' ? JSON.parse(item.details) : item.details;
        mapped.details = Array.isArray(arr) ? arr.join('\n') : item.details;
      } catch { mapped.details = item.details; }
    }
    if (activeTab === 'hero' && item.h1) mapped.h1 = JSON.stringify(item.h1);

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
    await axios.post(`${API_URL}/admin/logout`, {}, {withCredentials: true});
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
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to import Excel sheet.");
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
             <div className="w-16 h-16 bg-blue rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue/20">S</div>
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
          <div className="w-10 h-10 bg-white text-ink rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">S</div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Super Admin Panel</h1>
            <p className="text-[10px] text-white/50 uppercase font-black tracking-widest">Control Center</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto scrollbar-hide">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 ml-2">Navigation</p>
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 group ${activeTab === tab.id ? 'bg-blue text-white shadow-lg shadow-blue/20' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <tab.icon size={18} className={`${activeTab === tab.id ? 'text-white' : 'text-white/40 group-hover:text-white'} transition-colors`} />
              <span className="flex-1 text-left">{tab.label}</span>
              {activeTab === tab.id && <ChevronRight size={14} className="opacity-50" />}
            </button>
          ))}
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
              {activeTab !== 'enquiries' && activeTab !== 'staff' && (
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
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Department</label>
                        <input required placeholder="Agronomy" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, department: e.target.value})} value={formData.department || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Experience</label>
                        <input required placeholder="12 Years" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, experience: e.target.value})} value={formData.experience || ''} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                        <select required className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all appearance-none" onChange={e => setFormData({...formData, category: e.target.value})} value={formData.category || ''}>
                            <option value="">Select Category</option>
                            <option value="math">Mathematics</option>
                            <option value="phys">Physics</option>
                            <option value="chem">Chemistry</option>
                            <option value="bio">Biology</option>
                            <option value="comm">Commerce</option>
                            <option value="lang">Languages</option>
                        </select>
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
                        <input required placeholder="Name" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, name: e.target.value})} value={formData.name || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Hall Ticket No</label>
                        <input required placeholder="123456" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, hallTicketNumber: e.target.value})} value={formData.hallTicketNumber || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Rank</label>
                        <input required placeholder="State 1st" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, rank: e.target.value})} value={formData.rank || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Exam Name</label>
                        <input required placeholder="EAPCET" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue/5 focus:border-blue focus:outline-none transition-all" onChange={e => setFormData({...formData, exam: e.target.value})} value={formData.exam || ''} />
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



                      <div className="col-span-full mt-10">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                             <RefreshCw size={20} />
                          </div>
                          <div>
                             <h4 className="font-bold text-ink uppercase tracking-tight">Fee Breakdown</h4>
                             <p className="text-[10px] text-muted uppercase font-black tracking-widest">Specify yearly fee structure</p>
                          </div>
                        </div>
                        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                          <table className="w-full border-collapse bg-white">
                            <thead className="bg-ink text-white">
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
                                  academic_year: year, total_fee: 0, committed_fee: 0, admission_fee: 0, practical_fee: 0, hostel_fee: 0, travelling_fee: 0
                                };
                                const updateFee = (updates) => {
                                  const newFees = [...studentFees];
                                  const index = newFees.findIndex(f => f.academic_year.toLowerCase() === year.toLowerCase());
                                  if (index >= 0) newFees[index] = { ...newFees[index], ...updates };
                                  else newFees.push({ ...fee, ...updates });
                                  setStudentFees(newFees);
                                };
                                return (
                                  <tr key={year}>
                                    <td className="p-4 font-black text-ink text-xs uppercase">{year}</td>
                                    {['total_fee', 'committed_fee', 'admission_fee', 'practical_fee', 'hostel_fee', 'travelling_fee'].map(key => (
                                      <td key={key} className="p-2">
                                        <input 
                                          type="number" 
                                          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:border-blue outline-none transition-all font-bold text-ink text-xs"
                                          value={fee[key] || 0}
                                          onChange={(e) => updateFee({ [key]: e.target.value })}
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
                          <p className="text-sm font-bold text-ink">{file ? file.name : (formData.existing_image ? 'Replace Current Media' : 'Upload Media Asset')}</p>
                          <p className="text-xs text-muted mt-1">Recommended size: 800x600px. Max 1MB.</p>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                          onChange={e => setFile(e.target.files[0])} 
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

                     {/* Fee Breakdown Table - Specify Yearly Fee Structure */}
                     <div className="mt-12 p-8 bg-gray-50/50 rounded-3xl border border-gray-100">
                        <div className="flex items-center gap-4 mb-6">
                           <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                              <RefreshCw size={20} />
                           </div>
                           <div>
                              <h4 className="font-bold text-ink uppercase tracking-tight">FEE BREAKDOWN</h4>
                              <p className="text-[10px] text-muted uppercase font-black tracking-widest">SPECIFY YEARLY FEE STRUCTURE</p>
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
                                       academic_year: year, total_fee: 0, committed_fee: 0, admission_fee: 0, practical_fee: 0, hostel_fee: 0, travelling_fee: 0, paid_amount: 0
                                    };
                                    const updateFee = (updates) => {
                                       const newFees = [...studentFees];
                                       const index = newFees.findIndex(f => f.academic_year.toLowerCase() === year.toLowerCase());
                                       if (index >= 0) newFees[index] = { ...newFees[index], ...updates };
                                       else newFees.push({ ...fee, ...updates });
                                       setStudentFees(newFees);
                                    };
                                    return (
                                       <tr key={year} className="hover:bg-gray-50/50">
                                          <td className="p-4 font-black text-ink text-xs uppercase tracking-wider">{year}</td>
                                          {['total_fee', 'committed_fee', 'admission_fee', 'practical_fee', 'hostel_fee', 'travelling_fee'].map(key => (
                                             <td key={key} className="p-2">
                                                <input 
                                                   type="number" 
                                                   className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:border-blue outline-none transition-all font-bold text-ink text-xs"
                                                   value={fee[key] || 0}
                                                   onChange={(e) => updateFee({ [key]: e.target.value })}
                                                />
                                             </td>
                                          ))}
                                       </tr>
                                    );
                                 })}
               <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                  <div>
                    <h3 className="text-xl font-black text-ink uppercase tracking-tight">Student Accounts</h3>
                    <p className="text-[10px] text-muted font-bold tracking-widest mt-1">TOTAL ENROLLED: {students.length}</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                     {/* Send Fee Reminder to All Students */}
                     <button
                       onClick={async () => {
                         if (!window.confirm('This will send a fee payment reminder email to ALL enrolled students. Continue?')) return;
                         try {
                           setSendingReminder(true);
                           const res = await axios.post('/api/students/send-fee-reminder', {}, { withCredentials: true });
                           alert(`✅ Fee reminders sent!\n\n📧 Delivered: ${res.data.sent} students\n❌ Failed: ${res.data.failed} students\n👥 Total: ${res.data.total} students`);
                         } catch (err) {
                           alert('Failed to send reminders: ' + (err.response?.data?.message || err.message));
                         } finally {
                           setSendingReminder(false);
                         }
                       }}
                       disabled={sendingReminder}
                       className="flex items-center gap-2 px-5 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
                     >
                       <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                       </svg>
                       {sendingReminder ? 'Sending...' : 'Send Fee Reminder'}
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.map((item, idx) => (
                  <div key={item.id || idx} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all group">
                    <div className="relative h-44 bg-gray-100 overflow-hidden">
                      {item.image ? (
                        <img src={getImageUrl(item.image)} alt={item.tag} className="w-full h-full object-cover" />
                      ) : null}
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button onClick={() => { setFormData({...item}); setEditingId(item.id); setViewMode('form'); }} className="p-2 bg-white rounded-xl shadow-lg"><Edit3 size={14} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 bg-white rounded-xl shadow-lg text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
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
                                    (item.type === 'video' || (typeof (item.image || item.photo) === 'string' && (item.image || item.photo).toLowerCase().endsWith('.mp4'))) ? (
                                      <div className="h-full w-full flex items-center justify-center bg-sky/30 text-blue">
                                        <div className="p-2 bg-white rounded-full shadow-sm">
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
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
                                  <span className="text-[9px] uppercase font-black text-gray-300 mt-1 tracking-widest">{item.id || item._id}</span>
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
                              </select>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <input 
                                type="checkbox" 
                                checked={field.is_required} 
                                onChange={(e) => {
                                  const newFields = [...editingFields];
                                  newFields[idx].is_required = e.target.checked ? 1 : 0;
                                  setEditingFields(newFields);
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-blue focus:ring-0" 
                              />
                           </td>
                           <td className="px-6 py-4 text-center">
                              <input 
                                type="checkbox" 
                                checked={field.is_active} 
                                onChange={(e) => {
                                  const newFields = [...editingFields];
                                  newFields[idx].is_active = e.target.checked ? 1 : 0;
                                  setEditingFields(newFields);
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-green-500 focus:ring-0" 
                              />
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => field.id ? onDeleteField(field.id) : setEditingFields(editingFields.filter((_, i) => i !== idx))}
                                className="p-2 text-red-400 hover:text-red-600 transition-colors"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </td>
                        </tr>
                      ))}
                      {editingFields.length === 0 && (
                        <tr><td colSpan="5" className="px-6 py-20 text-center text-gray-300 font-bold uppercase tracking-widest text-[10px]">No custom fields added yet</td></tr>
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
