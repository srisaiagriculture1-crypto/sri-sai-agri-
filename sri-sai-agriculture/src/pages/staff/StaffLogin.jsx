import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function StaffLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = "/api";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Send the raw input to backend so it can check against both 'name' and 'email' columns
      const res = await axios.post(`${API_URL}/staff/login`, { username: email.trim(), password }, { withCredentials: true });
      navigate("/staff/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
      <Link to="/" className="mb-10 group">
         <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] shadow-xl shadow-blue/5 border border-gray-100 pr-8">
            <div className="h-12 w-12 bg-white rounded-2xl p-1 flex items-center justify-center border border-gray-100 shadow-md">
               <img src="/logo.png" alt="Sri Sai Agricultural College Logo" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col">
               <span className="font-black text-ink text-sm uppercase tracking-tight leading-tight">Sri Sai Institute</span>
               <span className="text-[10px] font-black text-muted uppercase tracking-widest">Agri Sciences</span>
            </div>
         </div>
      </Link>

      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl shadow-blue/5 border border-gray-100 p-10 space-y-8 animate-fadeIn">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-2xl p-1.5 mx-auto mb-6 flex items-center justify-center shadow-lg border border-gray-100">
             <img src="/logo.png" alt="Sri Sai Agricultural College Logo" className="h-full w-full object-contain" />
          </div>
          <h2 className="text-3xl font-black text-ink uppercase tracking-tight">Staff Portal</h2>
          <p className="text-muted font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Faculty & Administration Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Employee Name</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Akhil Kumar"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue transition-all font-bold text-ink"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
            <input 
              required
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue transition-all font-bold text-ink"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue text-white py-5 rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-blue/20 hover:bg-ink transition-all disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Access Dashboard"}
          </button>
        </form>

        <div className="pt-6 text-center border-t border-gray-100">
           <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Issues logging in? Contact IT Dept.</p>
        </div>
      </div>
    </div>
  );
}
