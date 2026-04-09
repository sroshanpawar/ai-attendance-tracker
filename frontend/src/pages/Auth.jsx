import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, Loader2, PlaySquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { Navigate } from 'react-router-dom';

export default function Auth({ session }) {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
            },
          },
        });
        if (error) throw error;
        setMessage('Account created! Check your email for a verification link.');
        setIsError(false);
      }
    } catch (error) {
      setMessage(error.error_description || error.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-secondary">
      {/* Left: Form Side */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-24 bg-white relative z-10 shadow-[20px_0_40px_rgba(0,0,0,0.06)]">
        <div className="w-full max-w-sm space-y-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-accent/30">
                A
              </div>
              <span className="text-primary font-extrabold text-2xl tracking-tight">AI Attendance</span>
            </div>
            
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">
              {mode === 'login' ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              {mode === 'login'
                ? 'Enter your details to sign in to your dashboard.'
                : 'Enter your information to get started with our platform.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {message && (
              <div
                className={cn(
                  'p-4 rounded-xl text-sm font-medium ring-1',
                  isError 
                    ? 'bg-rose-50 text-rose-600 ring-rose-200' 
                    : 'bg-emerald-50 text-emerald-600 ring-emerald-200'
                )}
              >
                {message}
              </div>
            )}

            <div className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-semibold tracking-wide text-primary mb-1.5" htmlFor="fullName">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      disabled={loading}
                      placeholder="John Doe"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border-border bg-background focus:bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-sm font-medium disabled:opacity-50"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold tracking-wide text-primary mb-1.5" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    disabled={loading}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-border bg-background focus:bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-sm font-medium disabled:opacity-50"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold tracking-wide text-primary" htmlFor="password">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button type="button" className="text-sm font-semibold text-accent hover:text-accent/80 transition-colors">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    disabled={loading}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-border bg-background focus:bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-sm font-medium disabled:opacity-50"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-accent hover:bg-blue-600 focus:ring-4 focus:ring-accent/20 transition-all shadow-md shadow-accent/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === 'login' ? (
                'Sign in'
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-slate-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setMessage('');
              }}
              className="font-bold text-primary hover:text-accent transition-colors"
            >
              {mode === 'login' ? 'Sign up now' : 'Sign in instead'}
            </button>
          </p>
        </div>
      </div>

      {/* Right: Illustration Side */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 z-0 opacity-40">
           {/* Abstract geometric background representation */}
           <div className="absolute -top-1/4 -right-1/4 w-[150%] h-[150%] rounded-full bg-gradient-radial from-slate-800/80 to-transparent blur-3xl"></div>
           <div className="absolute top-1/4 left-1/4 w-[100%] h-[100%] rounded-full bg-gradient-radial from-accent/20 to-transparent blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-lg w-full">
           <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/10 p-10 shadow-2xl space-y-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-accent rounded-2xl flex items-center justify-center ring-4 ring-white/10 mb-8">
                 <PlaySquare className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold text-white leading-tight">
                 Advanced Facial Recognition for the Modern Classroom
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed">
                 Seamlessly track attendance, analyze classroom engagement, and generate comprehensive reports without lifting a finger.
              </p>

              <div className="flex items-center gap-4 pt-6 border-t border-white/10 mt-8">
                 <div className="flex -space-x-3">
                   {['bg-rose-500', 'bg-emerald-500', 'bg-amber-500'].map((color, i) => (
                      <div key={i} className={cn("w-10 h-10 rounded-full border-2 border-slate-900", color)}></div>
                   ))}
                 </div>
                 <div className="text-sm font-medium text-slate-300">
                    Join <span className="text-white font-bold">2,000+</span> educators
                 </div>
              </div>
           </div>
        </div>
      </div>

    </div>
  );
}
