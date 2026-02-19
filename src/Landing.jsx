import React, { useState } from 'react';
import { CheckCircle2, Layers, Clock, Shield, Users, ArrowRight, BarChart3, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';

const Landing = ({ onGoogleSignIn, onEmailSignIn, isLoading }) => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Logo Component for reuse
  const Logo = ({ size = "text-2xl" }) => (
    <div className="flex items-center select-none">
      <Layers size={size === "text-2xl" ? 22 : 18} className="text-slate-900 mr-2" strokeWidth={2.5} />
      <div className="flex items-baseline">
        <span className={`${size} font-black tracking-tighter text-slate-900`}>
          Task
        </span>
        <span className={`${size} font-light tracking-tighter text-slate-500`}>
          Flow
        </span>
      </div>
    </div>
  );

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onEmailSignIn(email, password, name, isSignUp);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already registered. Try signing in.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Layers,
      title: 'Kanban Board',
      description: 'Organize tasks with drag-and-drop between To Do, In Progress, Review, and Done columns.'
    },
    {
      icon: CheckCircle2,
      title: 'Subtasks',
      description: 'Break down complex tasks into manageable subtasks with progress tracking.'
    },
    {
      icon: Clock,
      title: 'Due Dates',
      description: 'Never miss a deadline with built-in date picker and overdue notifications.'
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Track your productivity with real-time statistics and insights.'
    },
    {
      icon: Shield,
      title: 'Secure Auth',
      description: 'Sign in securely with Google or email. Your data is protected with Firebase security.'
    },
    {
      icon: Users,
      title: 'Real-time Sync',
      description: 'Access your tasks from any device with automatic cloud synchronization.'
    }
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <button
              onClick={() => setShowEmailForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
            >
              <Mail size={16} />
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Email Sign In Modal */}
      {showEmailForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <Logo size="text-xl" />
                  <h2 className="text-xl font-bold text-slate-800 mt-2">
                    {isSignUp ? 'Create Account' : 'Welcome Back'}
                  </h2>
                </div>
                <button 
                  onClick={() => { setShowEmailForm(false); setError(''); }}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <ArrowRight className="rotate-180" size={20} />
                </button>
              </div>
              
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        required={isSignUp}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-slate-900/10 outline-none transition-all"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="email"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-slate-900/10 outline-none transition-all"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full pl-10 pr-12 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-slate-900/10 outline-none transition-all"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                    <p className="text-xs font-bold text-rose-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {isSignUp ? 'Create Account' : 'Sign In'}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                    <span className="px-4 bg-white text-slate-400 font-bold">or</span>
                  </div>
                </div>

                <button
                  onClick={onGoogleSignIn}
                  className="mt-6 w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm transition-all"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                  Continue with Google
                </button>
              </div>

              <p className="mt-8 text-center text-xs text-slate-500">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); setName(''); }}
                  className="text-slate-900 font-bold hover:underline"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tight">
              Organize tasks with{' '}
              <span className="text-slate-400 font-light">
                effortless clarity
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-12 leading-relaxed">
              A clean Kanban board that helps you manage projects, track progress,
              and achieve your goals. Built for high-performance teams.
            </p>
            <button
              onClick={() => setShowEmailForm(true)}
              className="inline-flex items-center gap-3 px-10 py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-lg font-bold transition-all hover:-translate-y-1 shadow-xl shadow-slate-200"
            >
              Get Started Free
              <ArrowRight size={20} />
            </button>
            <p className="mt-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
              No credit card required • Free forever
            </p>
          </div>

          {/* App Preview */}
          <div className="mt-20 relative px-4">
            <div className="rounded-2xl overflow-hidden shadow-2xl border-[12px] border-slate-100">
              <div className="aspect-video bg-slate-50 flex items-center justify-center">
                <div className="text-center p-8 w-full">
                  <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto">
                    {[
                      { name: 'To Do', color: 'bg-blue-500/20' },
                      { name: 'In Progress', color: 'bg-amber-500/20' },
                      { name: 'Review', color: 'bg-purple-500/20' },
                      { name: 'Done', color: 'bg-emerald-500/20' }
                    ].map((col, i) => (
                      <div key={col.name} className="p-5 rounded-xl bg-white shadow-sm border border-slate-100">
                        <div className="text-[10px] font-black uppercase tracking-widest mb-4 text-slate-400 text-left">
                          {col.name}
                        </div>
                        <div className="space-y-3">
                          {/* Colored Task Cards */}
                          <div className={`h-20 rounded-lg ${col.color}`}></div>
                          {i < 2 && <div className="h-14 rounded-lg bg-slate-50"></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">
              Productivity, simplified.
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to manage tasks efficiently without the clutter.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-slate-900/10 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-slate-100 text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <feature.icon size={22} strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-8 tracking-tight">
            Ready to flow?
          </h2>
          <button
            onClick={() => setShowEmailForm(true)}
            className="inline-flex items-center gap-3 px-10 py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-lg font-bold transition-all hover:-translate-y-1 shadow-2xl shadow-slate-200"
          >
            Start for Free
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size="text-lg" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Built with React & Firebase
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;