import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { ArrowRight, Dumbbell, Apple, LineChart, PieChart, CheckCircle2, UserPlus, ListChecks, Trophy, Menu, X, Mail, Globe, Sun, Moon, Sparkles } from "lucide-react";
import { Logo } from "../components/common/Logo";

export function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Landing Page defaults to Emerald/Mint Dark Theme (#101827 with #16d9a0)
  const [landingMode, setLandingMode] = useState<"dark" | "light">(() => {
    try {
      return (localStorage.getItem("landing-theme") as "dark" | "light") || "dark";
    } catch {
      return "dark";
    }
  });

  // Apply fitness1 preset and landingMode on Landing Page, restore user dashboard theme on leave
  useEffect(() => {
    const savedMode = localStorage.getItem("kinetic-theme") || "dark";
    const savedPreset = localStorage.getItem("forma-preset") || "fitness1";
    
    document.documentElement.dataset.preset = "fitness1";
    document.documentElement.dataset.theme = landingMode;
    document.documentElement.classList.remove("dark");

    return () => {
      document.documentElement.dataset.theme = savedMode;
      document.documentElement.dataset.preset = savedPreset;
      document.documentElement.classList.toggle("dark", savedPreset === "fitness2" && savedMode === "dark");
    };
  }, [landingMode]);

  const toggleLandingMode = () => {
    setLandingMode((m) => {
      const next = m === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("landing-theme", next);
      } catch {}
      return next;
    });
  };

  // Scroll Reveal Animation Logic
  const observerRef = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll(".reveal").forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen font-sans transition-colors duration-200" style={{ background: "var(--bg)", color: "var(--color-foreground)" }}>
      
      {/* GLASSMORPHIC STICKY HEADER */}
      <header 
        className="sticky top-0 z-50 flex min-h-[80px] items-center justify-between border-b px-[7%] py-4 backdrop-blur-md transition-colors" 
        style={{ 
          background: landingMode === "dark" ? "rgba(16, 24, 39, 0.90)" : "rgba(255, 255, 255, 0.92)", 
          borderColor: "var(--line)" 
        }}
      >
        <Logo />

        <nav className="hidden md:flex gap-7 text-sm font-semibold" style={{ color: "var(--color-muted)" }}>
          <a href="#home" className="hover:text-[var(--color-lime)] transition-colors">Home</a>
          <a href="#features" className="hover:text-[var(--color-lime)] transition-colors">Features</a>
          <a href="#about" className="hover:text-[var(--color-lime)] transition-colors">About</a>
          <a href="#goals" className="hover:text-[var(--color-lime)] transition-colors">Fitness Goals</a>
          <a href="#contact" className="hover:text-[var(--color-lime)] transition-colors">Contact</a>
        </nav>

        <div className="hidden md:flex items-center gap-4 text-sm">
          {/* Top Navbar Sun/Moon Mode Toggle */}
          <button 
            type="button" 
            onClick={toggleLandingMode}
            className="icon-button"
            title={`Switch to ${landingMode === "dark" ? "Light" : "Dark"} mode`}
            aria-label="Toggle light or dark theme"
          >
            {landingMode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <Link to="/login" className="font-bold hover:text-[var(--color-lime)] transition-colors px-2 py-1">
            Login
          </Link>
          <Link to="/register" className="btn-primary">
            Sign Up
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button 
            type="button" 
            onClick={toggleLandingMode}
            className="icon-button"
            title={`Switch to ${landingMode === "dark" ? "Light" : "Dark"} mode`}
            aria-label="Toggle mode"
          >
            {landingMode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="p-2 icon-button" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Open mobile menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed top-[80px] left-0 w-full flex flex-col gap-4 border-b p-6 z-40 backdrop-blur-xl shadow-2xl transition-all" 
          style={{ background: landingMode === "dark" ? "#151f30" : "#ffffff", borderColor: "var(--line)" }}
        >
          <a href="#home" className="text-sm font-semibold" onClick={() => setMobileOpen(false)}>Home</a>
          <a href="#features" className="text-sm font-semibold" onClick={() => setMobileOpen(false)}>Features</a>
          <a href="#about" className="text-sm font-semibold" onClick={() => setMobileOpen(false)}>About</a>
          <a href="#goals" className="text-sm font-semibold" onClick={() => setMobileOpen(false)}>Fitness Goals</a>
          <a href="#contact" className="text-sm font-semibold" onClick={() => setMobileOpen(false)}>Contact</a>
          <div className="flex flex-col gap-3 mt-4 pt-4 border-t" style={{ borderColor: "var(--line)" }}>
            <Link to="/login" className="font-bold text-center py-2" onClick={() => setMobileOpen(false)}>Login</Link>
            <Link to="/register" className="btn-primary text-center" onClick={() => setMobileOpen(false)}>Sign Up</Link>
          </div>
        </div>
      )}

      {/* HERO SECTION WITH FLOATING BADGE */}
      <section className="grid md:grid-cols-2 gap-12 px-[7%] py-20 items-center relative overflow-hidden" id="home" style={{ background: "var(--surface)" }}>
        <div className="max-w-xl reveal">
          {/* Floating Hero Badge */}
          <span 
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider mb-5 border"
            style={{ 
              background: "color-mix(in srgb, var(--color-lime) 12%, transparent)", 
              color: "var(--color-lime)",
              borderColor: "color-mix(in srgb, var(--color-lime) 30%, transparent)"
            }}
          >
            <Sparkles size={14} /> YOUR HEALTH. YOUR MOMENTUM.
          </span>

          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mt-2 mb-6" style={{ color: "var(--color-white, white)" }}>
            Transform Your Body.<br />
            <span style={{ color: "var(--color-lime)" }}>Master Your Habits.</span>
          </h1>
          <p className="text-sm mb-8 leading-relaxed max-w-lg" style={{ color: "var(--color-muted)" }}>
            Take control of your training and nutrition with real-time analytics, structured workout logging, and intelligent progress tracking. Your peak fitness journey begins now.
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <Link to="/register" className="btn-primary flex items-center gap-2">
              Start Free Today <ArrowRight size={16} />
            </Link>
            <a href="#features" className="btn-secondary">
              Explore Platform
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex gap-10 mt-12 pt-8 border-t" style={{ borderColor: "var(--line)" }}>
            <div>
              <h3 className="text-2xl font-black" style={{ color: "var(--color-lime)" }}>100%</h3>
              <p className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>Personalized Data</p>
            </div>
            <div>
              <h3 className="text-2xl font-black" style={{ color: "var(--color-lime)" }}>24/7</h3>
              <p className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>Real-Time Insights</p>
            </div>
            <div>
              <h3 className="text-2xl font-black" style={{ color: "var(--color-lime)" }}>1 Hub</h3>
              <p className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>All Fitness Goals</p>
            </div>
          </div>
        </div>

        {/* Hero Visual Card */}
        <div className="reveal relative">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border" style={{ borderColor: "var(--line)" }}>
            <img 
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1000&auto=format&fit=crop&q=80" 
              alt="Athlete Training" 
              className="w-full h-[440px] object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl backdrop-blur-md border flex items-center justify-between" style={{ background: "rgba(16, 24, 39, 0.75)", borderColor: "rgba(255, 255, 255, 0.15)" }}>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#16d9a0] block uppercase">LIVE WORKOUT METRICS</span>
                <p className="text-sm font-bold text-white mt-0.5">Bench Press · 95 kg Personal Record</p>
              </div>
              <span className="size-9 rounded-lg bg-[#16d9a0]/20 text-[#16d9a0] grid place-items-center font-bold text-xs">
                +50 XP
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4-COLUMN FEATURE CARDS */}
      <section className="px-[7%] py-24" id="features">
        <div className="text-center mb-16 reveal">
          <span className="text-xs font-bold tracking-[2px] uppercase" style={{ color: "var(--color-lime)" }}>WHAT WE OFFER</span>
          <h2 className="text-4xl font-extrabold mt-3 mb-4" style={{ color: "var(--color-white, white)" }}>
            Engineered for Real Physical Progress
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--color-muted)" }}>
            Every tool you need to plan, track, and elevate your fitness routine in one unified interface.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              icon: Dumbbell, 
              title: "Workout Tracking", 
              desc: "Build routines, log exercises with sets, reps, and weights, and review completed session history." 
            },
            { 
              icon: Apple, 
              title: "Nutrition & Fuel", 
              desc: "Log daily meals by category and balance calories, protein, carbs, and fats with a live dynamic ring." 
            },
            { 
              icon: LineChart, 
              title: "Body Progress", 
              desc: "Record body weight, body fat percentage, measurements, and track trend lines toward your target." 
            },
            { 
              icon: PieChart, 
              title: "Smart Analytics", 
              desc: "Evaluate workout frequency, volume progression, and export comprehensive CSV spreadsheets or PDF reports." 
            }
          ].map((f, i) => (
            <div 
              key={i} 
              className="reveal card p-7 hover:-translate-y-2 transition-all duration-300 flex flex-col"
              style={{ background: "var(--card, var(--surface))", borderColor: "var(--line)" }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 shrink-0" 
                style={{ 
                  background: "color-mix(in srgb, var(--color-lime) 15%, transparent)", 
                  color: "var(--color-lime)" 
                }}
              >
                <f.icon size={26} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--color-white, white)" }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="grid md:grid-cols-2 gap-16 px-[7%] py-24 items-center" id="about" style={{ background: "var(--surface)" }}>
        <div className="reveal">
          <img 
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1000&auto=format&fit=crop&q=80" 
            alt="Functional Training" 
            className="w-full h-[430px] object-cover rounded-2xl shadow-xl border" 
            style={{ borderColor: "var(--line)" }}
          />
        </div>
        <div className="reveal max-w-lg">
          <span className="text-xs font-bold tracking-[2px] uppercase" style={{ color: "var(--color-lime)" }}>
            ABOUT FITNESSTRACKER
          </span>
          <h2 className="text-4xl font-extrabold mt-3 mb-5" style={{ color: "var(--color-white, white)" }}>
            Your Fitness Journey,<br />
            <span style={{ color: "var(--color-lime)" }}>Disciplined & Measurable.</span>
          </h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--color-muted)" }}>
            FITNESSTRACKER was built to eliminate guesswork from your health. Whether you are lifting in the gym, prepping weekly meals, or cutting weight, our platform keeps your targets organized and your progress visible every single day.
          </p>
          <ul className="space-y-3 mb-8">
            {[
              "100% User-scoped, private database storage",
              "Dynamic calorie ring and real-time macronutrient breakdown",
              "Automated volume calculation and personal record tracking",
              "High-contrast Emerald/Mint theme tailored for light & dark environments"
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                <CheckCircle2 size={18} style={{ color: "var(--color-lime)" }} /> {item}
              </li>
            ))}
          </ul>
          <Link to="/register" className="btn-primary">
            Start Your Journey
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS (3 NUMBERED STEPS) */}
      <section className="px-[7%] py-24">
        <div className="text-center mb-16 reveal">
          <span className="text-xs font-bold tracking-[2px] uppercase" style={{ color: "var(--color-lime)" }}>GET STARTED</span>
          <h2 className="text-4xl font-extrabold mt-3 mb-4" style={{ color: "var(--color-white, white)" }}>
            How FITNESSTRACKER Works
          </h2>
          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--color-muted)" }}>
            Three straightforward steps to build momentum and achieve measurable results.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { 
              step: "01", 
              icon: UserPlus, 
              title: "Create Account", 
              desc: "Sign up in seconds, verify your email via 6-digit OTP, or connect with Google authentication." 
            },
            { 
              step: "02", 
              icon: ListChecks, 
              title: "Log Your Activities", 
              desc: "Add your workouts, track weights and reps, and record daily meals to keep your nutrition on target." 
            },
            { 
              step: "03", 
              icon: Trophy, 
              title: "Review Analytics & Win", 
              desc: "Watch your strength graphs rise, celebrate new personal records, and export printable progress reports." 
            },
          ].map((s, i) => (
            <div 
              key={i} 
              className="reveal card p-9 text-center relative overflow-hidden" 
              style={{ background: "var(--card, var(--surface))", borderColor: "var(--line)" }}
            >
              <div 
                className="text-xs font-black tracking-widest px-3 py-1 rounded-full inline-block mb-4" 
                style={{ 
                  background: "color-mix(in srgb, var(--color-lime) 15%, transparent)", 
                  color: "var(--color-lime)" 
                }}
              >
                STEP {s.step}
              </div>
              <s.icon size={36} className="mx-auto mb-4" style={{ color: "var(--color-lime)" }} />
              <h3 className="text-xl font-bold mb-2.5" style={{ color: "var(--color-white, white)" }}>{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FITNESS GOALS IMAGE CARDS */}
      <section className="px-[7%] py-24" id="goals" style={{ background: "var(--surface)" }}>
        <div className="text-center mb-16 reveal">
          <span className="text-xs font-bold tracking-[2px] uppercase" style={{ color: "var(--color-lime)" }}>
            YOUR FITNESS. YOUR TARGET.
          </span>
          <h2 className="text-4xl font-extrabold mt-3 mb-4" style={{ color: "var(--color-white, white)" }}>
            Choose Your Primary Goal
          </h2>
          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--color-muted)" }}>
            Tailor your workouts and calorie targets to match your exact physical aspirations.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { 
              img: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&auto=format&fit=crop&q=80", 
              title: "Weight Loss & Deficit", 
              desc: "Burn fat steadily with monitored calorie limits and cardio logging." 
            },
            { 
              img: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=700&auto=format&fit=crop&q=80", 
              title: "Hypertrophy & Strength", 
              desc: "Maximize muscle hypertrophy through progressive overload and high protein intake." 
            },
            { 
              img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=700&auto=format&fit=crop&q=80", 
              title: "General Health & Longevity", 
              desc: "Form lifelong habits with regular hydration, routine alerts, and active movement." 
            },
          ].map((g, i) => (
            <div 
              key={i} 
              className="reveal relative h-[360px] rounded-2xl overflow-hidden group shadow-lg border"
              style={{ borderColor: "var(--line)" }}
            >
              <img 
                src={g.img} 
                alt={g.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
              <div 
                className="absolute inset-0 flex flex-col justify-end p-6" 
                style={{ background: "linear-gradient(to top, rgba(16,24,39,0.95) 0%, rgba(16,24,39,0.4) 60%, transparent 100%)" }}
              >
                <h3 className="text-2xl font-bold text-white mb-1.5">{g.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION WITH EMERALD GRADIENT */}
      <section 
        className="text-center px-[7%] py-24 relative overflow-hidden" 
        style={{ 
          background: landingMode === "dark" 
            ? "linear-gradient(135deg, #0d2620 0%, #133c32 100%)" 
            : "linear-gradient(135deg, #077956 0%, #08a978 100%)" 
        }}
      >
        <div className="max-w-3xl mx-auto reveal">
          <span className="text-xs font-bold tracking-[2px] uppercase text-[#a5f3d4] block mb-3">
            YOUR NEW BEGINNING
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-5 leading-tight">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-sm text-emerald-100 max-w-xl mx-auto mb-8 leading-relaxed">
            Join FITNESSTRACKER today. Track every set, monitor your macros, and build the physical momentum you have always wanted.
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-extrabold text-sm transition-all shadow-xl hover:scale-105"
            style={{ 
              background: "#ffffff", 
              color: "#08a978" 
            }}
          >
            Create Your Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer 
        className="px-[7%] pt-16 pb-8 border-t" 
        id="contact" 
        style={{ 
          background: landingMode === "dark" ? "#0b111c" : "#e9f0f6", 
          color: "var(--color-muted)",
          borderColor: "var(--line)"
        }}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="mb-4">
              <Logo />
            </div>
            <p className="text-sm max-w-[280px] leading-relaxed">
              Your personalized fitness companion. Track workouts, log nutrition, analyze trends, and stay consistent.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-4" style={{ color: "var(--color-white, white)" }}>Quick Links</h3>
            <ul className="space-y-2 text-sm font-medium">
              <li><a href="#home" className="hover:text-[var(--color-lime)] transition-colors">Home</a></li>
              <li><a href="#features" className="hover:text-[var(--color-lime)] transition-colors">Features</a></li>
              <li><a href="#about" className="hover:text-[var(--color-lime)] transition-colors">About Us</a></li>
              <li><a href="#goals" className="hover:text-[var(--color-lime)] transition-colors">Fitness Goals</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4" style={{ color: "var(--color-white, white)" }}>Account</h3>
            <ul className="space-y-2 text-sm font-medium">
              <li><Link to="/login" className="hover:text-[var(--color-lime)] transition-colors">Login</Link></li>
              <li><Link to="/register" className="hover:text-[var(--color-lime)] transition-colors">Register</Link></li>
              <li><Link to="/dashboard" className="hover:text-[var(--color-lime)] transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4" style={{ color: "var(--color-white, white)" }}>Contact Us</h3>
            <ul className="space-y-2 text-sm font-medium">
              <li className="flex items-center gap-2">
                <Mail size={16} style={{ color: "var(--color-lime)" }} /> support@fitnesstracker.com
              </li>
              <li className="flex items-center gap-2">
                <Globe size={16} style={{ color: "var(--color-lime)" }} /> www.fitnesstracker.com
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t pt-6 text-center text-xs" style={{ borderColor: "var(--line)" }}>
          <p>© 2026 FITNESSTRACKER. All Rights Reserved.</p>
        </div>
      </footer>

    </div>
  );
}
