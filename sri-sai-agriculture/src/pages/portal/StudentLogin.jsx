import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API_URL = "/api";

export default function StudentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/students/login`, { email, password }, { withCredentials: true });
      navigate("/portal/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const userEmail = prompt("Please enter your registered email address:");
    if (!userEmail) return;

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/students/forgot-password`, { email: userEmail });
      alert(res.data.message || "A reset link has been sent to your email.");
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F9] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-blue p-10 text-center relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="w-20 h-20 bg-white rounded-2xl p-1.5 mx-auto mb-4 flex items-center justify-center shadow-lg">
             <img src="/logo.png" alt="Sri Sai Agricultural College Logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-white font-lora text-2xl font-bold">Student Portal</h1>
          <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Sri Sai Agricultural College</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-10 pt-12 space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
            <div className="relative">
               <input 
                 required 
                 type="email" 
                 value={email} 
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-blue focus:ring-4 focus:ring-blue/5 outline-none transition-all font-medium text-ink"
                 placeholder="your@email.com"
               />
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={20} />
               </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Password</label>
            <div className="relative">
               <input 
                 required 
                 type="password" 
                 value={password} 
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-blue focus:ring-4 focus:ring-blue/5 outline-none transition-all font-medium text-ink"
                 placeholder="••••••••"
               />
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={20} />
               </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
             <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded-lg border-gray-300 text-blue focus:ring-blue" />
                <span className="text-[12px] font-bold text-muted group-hover:text-ink transition-colors">Remember me</span>
             </label>
             <button type="button" onClick={handleForgotPassword} className="text-[12px] font-bold text-blue hover:underline">Forgot Password?</button>
          </div>

          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-blue text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Login"}
          </button>

          <div className="text-center pt-4">
             <p className="text-[12px] font-bold text-muted">
                New student? <Link to="/portal/register" className="text-blue hover:underline">Create an Account</Link>
             </p>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Authorized Access Only</p>
        </div>
      </div>
    </div>
  );
}

function User(props) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>; }
function Lock(props) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>; }
