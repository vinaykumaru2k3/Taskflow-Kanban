import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Layers, Clock, Shield, Users, ArrowRight, 
  Mail, Lock, Eye, EyeOff, User, Zap, MessageSquare, 
  LayoutDashboard, Star, Play, Globe
} from 'lucide-react';

// Reusable animated container for scroll reveals
const FadeIn = ({ children, delay = 0, className = "", direction = "up" }) => {
  const yOffset = direction === "up" ? 30 : direction === "down" ? -30 : 0;
  const xOffset = direction === "left" ? 30 : direction === "right" ? -30 : 0;
  
  const [forceHideLoading, setForceHideLoading] = useState(false);
  const [stalled, setStalled] = useState(false);

  // If `isLoading` stays true for a while, show actionable controls so it
  // doesn't feel stuck. This doesn't affect the auth flow; it only gives
  // the user a way to retry or continue without blocking the UI.
  React.useEffect(() => {
    let t;
    if (isLoading) {
      setStalled(false);
      t = setTimeout(() => setStalled(true), 8000);
    } else {
      setStalled(false);
    }
    return () => clearTimeout(t);
  }, [isLoading]);

  const handleRetry = () => {
    // Soft-retry by reloading the page to restart auth flows.
    window.location.reload();
  };

  const handleContinue = () => {
    // Hide the overlay locally; auth will continue in background.
    setForceHideLoading(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, x: xOffset }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, type: "spring", bounce: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Staggered Animations for Lists/Cards
const StaggerContainer = ({ children, className = "" }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
    variants={{
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.15
        }
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

const StaggerItem = ({ children, className = "" }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.2, duration: 0.6 } }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

const Landing = ({ onGoogleSignIn, onEmailSignIn, isLoading }) => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Logo Component
  const Logo = ({ size = "text-2xl" }) => (
    <div className="flex items-center select-none group focus-visible:outline-none">
      <div className="relative flex items-center justify-center mr-2">
        <Layers size={size === "text-2xl" ? 22 : 18} className="text-blue-600 dark:text-blue-500 relative z-10 transition-transform group-hover:scale-110 duration-300" strokeWidth={2.5} />
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md group-hover:bg-blue-500/30 transition-colors" />
      </div>
      <div className="flex items-baseline">
        <span className={`${size} font-black tracking-tighter text-slate-900 dark:text-white`}>
          Task
        </span>
        <span className={`${size} font-light tracking-tighter text-slate-500 dark:text-slate-400`}>
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

  const handleGoogleClick = async () => {
    setError('');
    setLoading(true);
    try {
      await onGoogleSignIn();
    } catch (err) {
      console.error('Google sign-in error (UI):', err);
      if (err && err.code === 'auth/internal-error' && typeof navigator !== 'undefined' && !navigator.onLine) {
        setError('No internet connection. Please go online and try again.');
      } else if (err && err.message) {
        setError(err.message);
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: LayoutDashboard,
      title: 'Intuitive Kanban Boards',
      description: 'Drag, drop, and conquer. Visualize your workflow with customizable columns that adapt to your team\'s unique process.',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      icon: Users,
      title: 'Seamless Collaboration',
      description: 'Invite team members, assign tasks, and watch changes sync instantly across all devices in real-time.',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      icon: MessageSquare,
      title: 'Contextual Comments',
      description: 'Keep the conversation where the work happens. Mention teammates and resolve discussions right inside tasks.',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      icon: Clock,
      title: 'Calendar & Deadlines',
      description: 'Never miss a beat. Switch instantly between Kanban and Calendar views to manage deadlines proactively.',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    {
      icon: Zap,
      title: 'Lightning Fast UI',
      description: 'Built for speed. Enjoy immediate interactions without page reloads, keeping you in the flow state.',
      color: 'text-rose-500',
      bg: 'bg-rose-500/10'
    },
    {
      icon: Shield,
      title: 'Enterprise-grade Security',
      description: 'Your data is encrypted and protected with industry-leading Firestore security rules and authentication.',
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10'
    }
  ];

  const testimonials = [
    {
      quote: "TaskFlow completely transformed how our product team ships features. The real-time sync feels like magic.",
      author: "Sarah Jenkins",
      role: "Product Manager at TechNova",
      img: "https://i.pravatar.cc/150?u=sarah"
    },
    {
      quote: "Finally, a project management tool that doesn't feel like a chore to use. It's clean, fast, and unopinionated.",
      author: "David Chen",
      role: "Lead Developer",
      img: "https://i.pravatar.cc/150?u=david"
    },
    {
      quote: "The combination of the Kanban board and Calendar view gives me the exact high-level overview I needed.",
      author: "Elena Rodriguez",
      role: "Design Director",
      img: "https://i.pravatar.cc/150?u=elena"
    }
  ];

  return (
    // [safari/mobile] Use min-h-svh (small viewport height) which excludes browser chrome.
    // Falls back to min-h-screen for non-supporting browsers.
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] selection:bg-blue-500/30 font-sans overflow-x-hidden transition-colors duration-300"
      style={{ minHeight: '100svh' }}
    >
      {/* Full-screen loading overlay for better perceived loading state */}
      {isLoading && !forceHideLoading && (
        <div role="status" aria-live="polite" className="fixed inset-0 z-[70] flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 max-w-xs text-center">
            <div className="w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Syncing your data…</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Checking authentication and loading your workspace.</div>
            {stalled && (
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                This is taking longer than expected.
                <div className="flex items-center justify-center gap-2 mt-2">
                  <button onClick={handleRetry} className="px-3 py-1 bg-slate-900 text-white rounded-md text-xs">Retry</button>
                  <button onClick={handleContinue} className="px-3 py-1 bg-white border border-slate-200 rounded-md text-xs">Continue anyway</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Dynamic Background Elements - Only in Dark Mode or Subtle in Light */}
      {/* [perf/safari] pointer-events-none blurs can be expensive; use contain:strict to isolate paint */}
      <div className="absolute top-0 inset-x-0 h-screen overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 dark:bg-blue-500/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-purple-500/20 dark:bg-purple-500/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
      </div>

      {/* Floating Glassmorphic Header */}
      <header className="fixed top-4 sm:top-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-5xl flex items-center justify-between px-5 sm:px-6 py-3 rounded-2xl bg-white/70 dark:bg-[#18181b]/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/50 shadow-2xl shadow-slate-200/20 dark:shadow-none transition-all duration-300">
          <Logo />
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              id="btn-login-nav"
              onClick={() => setShowEmailForm(true)}
              className="hidden sm:block text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Log in
            </button>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
            <button
              id="btn-start-free-nav"
              onClick={() => setShowEmailForm(true)}
              className="group relative flex items-center justify-center gap-2 px-6 py-2 sm:py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-none"
            >
              <span className="relative z-10 flex items-center gap-1.5 group-hover:text-white dark:group-hover:text-slate-900 transition-colors">
                Start Free 
                <ArrowRight size={16} className="hidden sm:block group-hover:translate-x-1 transition-transform" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-slate-200 dark:to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Auth Modal with Framer Motion AnimatePresence */}
      <AnimatePresence>
        {showEmailForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-[#09090b]/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                      {isSignUp ? 'Create your account' : 'Welcome back'}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {isSignUp ? 'Start organizing your tasks today.' : 'Enter your details to sign in.'}
                    </p>
                  </div>
                  <button 
                    id="btn-close-auth-modal"
                    onClick={() => { setShowEmailForm(false); setError(''); }}
                    className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 transition-colors absolute top-6 right-6"
                  >
                    <CheckCircle2 className="rotate-45" size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  {isSignUp && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          id="input-auth-name"
                          type="text"
                          required={isSignUp}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        id="input-auth-email"
                        type="email"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        id="input-auth-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="w-full pl-10 pr-12 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        id="btn-toggle-password-visibility"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg mt-2">
                          <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    id="btn-submit-auth"
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold py-2.5 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      isSignUp ? 'Create Account' : 'Sign In'
                    )}
                  </button>
                </form>

                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                  <span className="text-xs font-medium text-slate-400">OR</span>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <button
                  id="btn-google-signin"
                  onClick={handleGoogleClick}
                  disabled={isLoading || loading}
                  className={
                    `mt-6 w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-sm transition-all shadow-sm active:scale-[0.98] ` +
                    (isLoading || loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-800')
                  }
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    <path fill="none" d="M1 1h22v22H1z" />
                  </svg>
                  {isLoading || loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    'Continue with Google'
                  )}
                </button>

                <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    id="btn-toggle-auth-mode"
                    onClick={() => { setIsSignUp(!isSignUp); setError(''); setName(''); }}
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    {isSignUp ? 'Sign in' : 'Sign up'}
                  </button>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <main className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pb-32 bg-slate-50 dark:bg-[#09090b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn delay={0.1}>
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-6 max-w-5xl mx-auto mt-6">
              Manage projects with <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-500">
                clarity and speed.
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              The modern Kanban board that helps high-performance teams plan, track, and execute work seamlessly without the clutter of legacy tools.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                id="btn-hero-start-free"
                onClick={() => setShowEmailForm(true)}
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-lg font-semibold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200 dark:shadow-none flex items-center justify-center gap-2"
              >
                Start for free
                <ArrowRight size={20} />
              </button>
              <button
                id="btn-hero-watch-demo"
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-lg font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
              >
                <Play size={20} className="text-slate-400" fill="currentColor" />
                Watch demo
              </button>
            </div>
            <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">
              No credit card required. Free forever for individuals.
            </p>
          </FadeIn>

          {/* Product Dashboard Preview (Mockup) */}
          <FadeIn delay={0.3} className="mt-20 sm:mt-24 relative max-w-6xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent dark:from-[#09090b] z-10 sm:h-auto sm:bottom-0 h-2/3 bottom-0" />
            
            <div className="relative rounded-2xl sm:rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xl overflow-hidden will-change-transform">
              {/* Fake Browser Title Bar */}
              <div className="h-12 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#09090b] flex items-center px-4 gap-2">
                <div className="flex gap-1.5 pl-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="mx-auto bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/50 rounded-md py-1 px-20 sm:px-32 text-xs text-slate-400 dark:text-slate-500">
                  taskflow.app/board
                </div>
              </div>
              
              {/* Mock App Body */}
              <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-[#09090b] grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 min-h-[400px]">
                {/* Mock Column 1 */}
                <div className="hidden sm:flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">To Do</span>
                    <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full">3</span>
                  </div>
                  <StaggerItem>
                    <div className="bg-white dark:bg-[#18181b] p-4 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-800/80">
                      <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700/60 rounded mb-3"></div>
                      <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded mb-4"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-6 w-16 bg-blue-100 dark:bg-blue-900/30 rounded"></div>
                        <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700/60"></div>
                      </div>
                    </div>
                  </StaggerItem>
                  <StaggerItem>
                    <div className="bg-white dark:bg-[#18181b] p-4 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-800/80">
                      <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
                      <div className="flex justify-between items-center mt-4">
                        <div className="h-6 w-20 bg-rose-100 dark:bg-rose-900/30 rounded"></div>
                      </div>
                    </div>
                  </StaggerItem>
                </div>

                {/* Mock Column 2 */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">In Progress</span>
                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full">2</span>
                  </div>
                  <StaggerItem>
                    <div className="bg-white dark:bg-[#18181b] p-4 rounded-xl shadow-md border-2 border-blue-500/20 dark:border-blue-500/30 transform sm:-rotate-2 sm:scale-105 transition-transform z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Design Team</span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Redesign Landing Page UI</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">Update the main website to match the new dark mode aesthetic and improve conversion rates.</p>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-4 shadow-inner">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex -space-x-2">
                          <div className="h-7 w-7 rounded-full bg-blue-100 border-2 border-white dark:border-[#18181b] z-20 flex items-center justify-center text-[10px] font-bold text-blue-700">SK</div>
                          <div className="h-7 w-7 rounded-full bg-amber-100 border-2 border-white dark:border-[#18181b] z-10 flex items-center justify-center text-[10px] font-bold text-amber-700">JD</div>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <MessageSquare size={14} />
                          <span className="text-xs font-semibold">4</span>
                        </div>
                      </div>
                    </div>
                  </StaggerItem>
                </div>
                
                {/* Obfuscated Columns for desktop */}
                <div className="hidden sm:flex flex-col gap-3 opacity-60">
                   <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Review</span>
                   </div>
                   <div className="bg-white dark:bg-[#18181b] p-4 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-800/80 h-32"></div>
                </div>
                <div className="hidden sm:flex flex-col gap-3 opacity-30">
                   <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Done</span>
                   </div>
                   <div className="bg-white dark:bg-[#18181b] p-4 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-800/80 h-24"></div>
                   <div className="bg-white dark:bg-[#18181b] p-4 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-800/80 h-28"></div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </main>

      {/* Logos Section */}
      <section className="py-10 border-y border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#09090b]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mb-6 uppercase tracking-wider">Powering next-gen teams</p>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 dark:opacity-40">
             {/* Mock SVGs for companies */}
             <div className="text-xl font-bold flex items-center gap-1 text-slate-900 dark:text-white"><Layers /> Acme Corp</div>
             <div className="text-xl font-bold flex items-center gap-1 text-slate-900 dark:text-white"><Globe /> Globex</div>
             <div className="text-xl font-black flex items-center gap-1 tracking-tighter text-slate-900 dark:text-white">Initech</div>
             <div className="text-xl font-serif flex items-center gap-1 italic text-slate-900 dark:text-white">Soylent</div>
          </div>
        </div>
      </section>

      {/* Features Section - Colored Base */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-blue-50/50 dark:bg-[#18181b]/50 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
            <FadeIn>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-6">
                Everything you need to <br className="hidden sm:block" /> ship faster.
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                TaskFlow combines the simplicity of sticky notes with the power of an enterprise database. Purpose-built for modern agile teams.
              </p>
            </FadeIn>
          </div>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <StaggerItem key={index}>
                <div className="h-full p-8 rounded-[2rem] bg-white dark:bg-[#111827] border border-slate-200/60 dark:border-slate-800 hover:border-blue-500/30 dark:hover:border-slate-600 transition-colors shadow-sm hover:shadow-xl dark:shadow-none group relative overflow-hidden">
                  <div className="relative z-10">
                    {/* [perf] Only animate transform+opacity — avoid layout-triggering properties */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.bg} ${feature.color} transition duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                      <feature.icon size={26} strokeWidth={2} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  {/* Hover gradient effect backing */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white dark:from-[#18181b] dark:to-[#09090b] opacity-0 group-hover:opacity-100 transition-opacity z-0 pointer-events-none" />
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Value Proposition / UI Detail */}
      <section className="py-24 border-t border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#09090b] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn direction="right">
              <div className="max-w-lg">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center mb-6 text-white text-xl font-bold border-4 border-indigo-50 dark:border-[#09090b] shadow-lg">
                  1
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                  No more "Who is working on what?"
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                  Assign tasks easily and clearly see team bandwidth. Everyone stays on the same page, and progress becomes transparent across the entire organization.
                </p>
                <StaggerContainer className="space-y-4 text-slate-700 dark:text-slate-300">
                  <StaggerItem className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={14} />
                    </div>
                    Direct mentions & notifications
                  </StaggerItem>
                  <StaggerItem className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={14} />
                    </div>
                    Role-based access permissions
                  </StaggerItem>
                  <StaggerItem className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={14} />
                    </div>
                    Real-time presence indicators
                  </StaggerItem>
                </StaggerContainer>
              </div>
            </FadeIn>

            <FadeIn direction="left" className="relative">
              {/* Decorative background circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-3xl z-0" />
              
              <div className="relative z-10 grid gap-6">
                <div 
                  className="bg-white dark:bg-[#18181b] p-6 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 transform md:-rotate-3 md:translate-x-12 translate-x-4 hover:scale-[1.02] hover:border-blue-500/30 transition-all duration-300 z-10 hover:z-20"
                >
                  <div className="flex items-start gap-4">
                    <img src="https://i.pravatar.cc/150?u=sarah" alt="User" className="w-10 h-10 rounded-full bg-slate-200" />
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Sarah commented on Data Migration</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">@David the staging DB has been updated. Can you check?</p>
                      <span className="text-xs text-slate-400 mt-2 block">Just now</span>
                    </div>
                  </div>
                </div>
                
                <div 
                  className="bg-white dark:bg-[#18181b] p-6 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 transform md:rotate-2 md:-translate-x-8 hover:scale-[1.02] hover:border-blue-500/30 transition-all duration-300 z-10 hover:z-20"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Task Assigned</h4>
                    <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs px-2 py-0.5 rounded font-medium">Urgent</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#162032] rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">JD</div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">David Chen</span>
                    </div>
                    <ArrowRight size={16} className="text-slate-400" />
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#18181b]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <FadeIn>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4">Loved by builders</h2>
              <p className="text-slate-600 dark:text-slate-400">Join thousands of teams scaling their operations.</p>
            </FadeIn>
          </div>
          
          <StaggerContainer className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((test, index) => (
              <StaggerItem key={index}>
                <div className="bg-white dark:bg-[#09090b] p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm h-full flex flex-col justify-between hover:-translate-y-1 transition-transform group hover:border-slate-300 dark:hover:border-slate-600">
                  <div>
                    <div className="flex gap-1 text-amber-400 mb-6">
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed mb-8">
                      "{test.quote}"
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <img
                    src={test.img}
                    alt={test.author}
                    // [perf] lazy-load testimonial avatars — they are below the fold
                    loading="lazy"
                    decoding="async"
                    className="w-12 h-12 rounded-full ring-2 ring-slate-100 dark:ring-[#162032] group-hover:ring-blue-500/30 transition-all"
                  />
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{test.author}</h4>
                      <span className="text-sm text-slate-500 dark:text-slate-500">{test.role}</span>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Blue CTA Section (Original Intended Colors) */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Abstract Backgrounds */}
        <div className="absolute inset-0 bg-blue-600 dark:bg-blue-600">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        </div>
        
        <FadeIn className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 tracking-tight">
            Stop plotting.<br />Start doing.
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto font-medium">
            Join the agile evolution. Free for individuals, affordable for growing teams. Start managing your projects the right way today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="btn-cta-start-free"
              onClick={() => setShowEmailForm(true)}
              className="w-full sm:w-auto px-10 py-5 bg-white text-blue-600 hover:bg-slate-50 hover:scale-105 active:scale-95 rounded-xl text-lg font-bold transition-all shadow-xl flex items-center justify-center gap-2"
            >
              Get started for free
              <ArrowRight size={20} />
            </button>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#09090b]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Logo size="text-lg" />
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-sm text-slate-500 font-medium">© {new Date().getFullYear()} TaskFlow Inc.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Twitter</a>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
