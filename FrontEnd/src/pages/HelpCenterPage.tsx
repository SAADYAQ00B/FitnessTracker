import { useState, FormEvent } from "react";
import { useNavigate } from "react-router";
import { Search, Dumbbell, Apple, User, BarChart3, ArrowRight, CheckCircle2, Mail, BookOpen, ExternalLink } from "lucide-react";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { createTicket } from "../services/supportService";

interface GuideTopic {
  id: string;
  icon: any;
  title: string;
  shortDesc: string;
  actionLink: string;
  actionText: string;
  steps: { title: string; detail: string }[];
}

const GUIDES: GuideTopic[] = [
  {
    id: "workouts",
    icon: Dumbbell,
    title: "Workouts & Tracking",
    shortDesc: "Create routines, edit logs, track sets, reps and weights.",
    actionLink: "/dashboard/workouts",
    actionText: "Open Workouts Library",
    steps: [
      {
        title: "1. Create Custom Routines",
        detail: "Navigate to the Workouts page and click '+ Create workout'. Specify a title, workout category (Strength, Cardio, HIIT, Other), estimated duration, and a status tag like 'Morning' or 'Leg Day'."
      },
      {
        title: "2. Add Exercises, Sets & Weights",
        detail: "Under the exercise builder in the modal, add individual exercises with target sets, reps, and weights (in kilograms). You can dynamically add as many exercise rows as needed."
      },
      {
        title: "3. Complete Training & Earn XP",
        detail: "When you finish training, click 'Complete' on any routine card. This instantly awards +50 XP to your profile level and logs a session entry in your history."
      },
      {
        title: "4. Review Workout History",
        detail: "Check the 'Recent sessions' card at the bottom of the Workouts page to inspect duration, completed dates, and total volume lifted over time."
      }
    ]
  },
  {
    id: "nutrition",
    icon: Apple,
    title: "Nutrition & Fuel",
    shortDesc: "Log meals, calculate macros, and monitor daily calorie targets.",
    actionLink: "/dashboard/nutrition",
    actionText: "Open Nutrition Tracker",
    steps: [
      {
        title: "1. Choose Meal Category",
        detail: "Navigate to the Nutrition page. You will find dedicated tabs for Breakfast, Lunch, Dinner, and Snacks to organize your daily intake."
      },
      {
        title: "2. Log Foods & Macronutrients",
        detail: "Click '+ Log Meal' to record what you ate, the total calories, and individual macronutrients: protein (g), carbohydrates (g), and fats (g)."
      },
      {
        title: "3. Monitor Your Calorie Ring",
        detail: "The large dynamic Calorie Ring updates immediately to show your remaining vs consumed calories relative to your 2,400 kcal daily goal."
      },
      {
        title: "4. Balance Protein, Carbs & Fats",
        detail: "Check the macro summary bars below the ring to ensure your protein supports recovery and carbs provide sustained energy for your workouts."
      }
    ]
  },
  {
    id: "profile",
    icon: User,
    title: "Account & Profile",
    shortDesc: "Manage cloud preferences, update profile pictures, and GDPR rights.",
    actionLink: "/dashboard/profile",
    actionText: "Go to Profile Settings",
    steps: [
      {
        title: "1. Upload Cloudinary Profile Picture",
        detail: "On the Profile page, click your avatar or 'Choose Image File'. Your image is uploaded directly to Cloudinary and synchronized across the Topbar and Profile."
      },
      {
        title: "2. Change Themes & Appearance",
        detail: "Head to Settings to toggle between Theme 1 (Emerald Mint - dark/emerald) and Theme 2 (Purple Steel - purple/clean), or flip between Dark and Light modes. Changes are saved instantly to MongoDB."
      },
      {
        title: "3. Configure Units & Notifications",
        detail: "Select Metric (kg, cm, km) or Imperial (lb, in, mi) units, and toggle reminders for scheduled workouts and milestone breakthroughs."
      },
      {
        title: "4. GDPR Compliance & Data Rights",
        detail: "Export a complete archive of your workout logs and profile in JSON format, or request irreversible account and record deletion under Privacy & GDPR."
      }
    ]
  },
  {
    id: "reports",
    icon: BarChart3,
    title: "Reports & Exports",
    shortDesc: "Download CSV spreadsheets and printable vector PDF fitness reports.",
    actionLink: "/dashboard/analytics",
    actionText: "Open Analytics & Reports",
    steps: [
      {
        title: "1. Inspect Training Analytics",
        detail: "View interactive breakdown charts of workout frequency, active minutes, and calorie burn trends on the Analytics page."
      },
      {
        title: "2. Track Weight & Milestones",
        detail: "Log regular body weight and body measurement entries on the Progress page to plot clean trend lines toward your target weight."
      },
      {
        title: "3. Export CSV Data Spreadsheets",
        detail: "Download raw CSV spreadsheets of your workouts and meal logs for deeper analysis in Microsoft Excel, Google Sheets, or Apple Numbers."
      },
      {
        title: "4. Generate Printable PDF Summaries",
        detail: "Click 'Export report (PDF)' on the Progress page to generate a print-ready vector summary document of your fitness journey."
      }
    ]
  }
];

export function HelpCenterPage() {
  const { notify } = useApp();
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuide, setSelectedGuide] = useState<GuideTopic | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const topic = formData.get("topic") as string;
    const message = formData.get("message") as string;

    setSubmitting(true);
    try {
      await createTicket({ topic, message });
      setSent(true); 
      notify("Support ticket submitted to our team!");
    } catch (err: any) {
      notify(err.response?.data?.msg || "Failed to submit message");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGuides = GUIDES.filter((g) => 
    searchQuery === "" || 
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.shortDesc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageHeader 
        eyebrow="WE’RE HERE TO HELP" 
        title="Help Center & User Support" 
        description="Find answers to common questions or reach out directly to our fitness support specialists." 
      />
      
      <div className="flex items-center gap-3 p-2 pl-4 border rounded-xl mb-6" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
        <Search size={20} className="text-muted" />
        <input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search help articles and tutorials..." 
          className="flex-1 bg-transparent border-none outline-none text-sm px-2" 
          style={{ color: "var(--color-foreground)" }} 
        />
        {searchQuery && (
          <button className="text-xs text-muted mr-2 cursor-pointer" onClick={() => setSearchQuery("")}>
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {filteredGuides.map((guide) => {
          const Icon = guide.icon;
          return (
            <Card 
              key={guide.id} 
              className="flex flex-col items-start cursor-pointer hover:border-[var(--color-lime)] transition"
              onClick={() => setSelectedGuide(guide)}
            >
              <span className="size-10 rounded-xl bg-[color-mix(in_srgb,var(--color-lime)_15%,transparent)] text-[var(--color-lime)] grid place-items-center mb-4">
                <Icon size={22} />
              </span>
              <h3 className="font-bold text-sm mb-2" style={{ color: "var(--color-white, white)" }}>{guide.title}</h3>
              <p className="text-xs text-muted leading-5 mb-4">{guide.shortDesc}</p>
              <button 
                type="button"
                className="text-xs font-bold text-[var(--color-lime)] mt-auto flex items-center gap-1 cursor-pointer" 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedGuide(guide);
                }}
              >
                Browse guide <ArrowRight size={14} />
              </button>
            </Card>
          );
        })}
      </div>

      <Card className="grid md:grid-cols-[1fr_1.5fr] gap-8 items-center">
        <div>
          <span className="eyebrow">CONTACT SUPPORT</span>
          <h2 className="text-xl font-bold mt-2 mb-2" style={{ color: "var(--color-white, white)" }}>
            Still need a hand?
          </h2>
          <p className="text-xs text-muted leading-5">
            Submit your inquiry or feedback directly to our team. We review tickets promptly and aim to respond within 24 hours.
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center text-green-500 py-6 text-center">
            <CheckCircle2 size={36} className="text-[var(--color-lime)] mb-2" />
            <strong className="text-base" style={{ color: "var(--color-white, white)" }}>Message sent successfully!</strong>
            <span className="text-xs text-muted mt-1">Our support specialists have logged your ticket and will reply shortly.</span>
            <button 
              className="btn-secondary text-xs mt-4" 
              onClick={() => setSent(false)}
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="field">
              <span>Topic</span>
              <select name="topic" className="field-input">
                <option>Technical issue</option>
                <option>Workout tracking question</option>
                <option>Nutrition & meal logging</option>
                <option>Account & privacy request</option>
                <option>General feedback</option>
              </select>
            </label>
            <label className="field">
              <span>Message</span>
              <textarea 
                name="message" 
                required 
                placeholder="Describe what you need assistance with..." 
                className="field-input" 
                style={{ height: "100px" }} 
              />
            </label>
            <Button type="submit" icon={Mail} disabled={submitting}>
              {submitting ? "Submitting..." : "Send support ticket"}
            </Button>
          </form>
        )}
      </Card>

      {/* INTERACTIVE GUIDE MODAL */}
      {selectedGuide && (
        <Modal title={selectedGuide.title} onClose={() => setSelectedGuide(null)}>
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="p-3.5 rounded-xl border border-[var(--color-lime)]/30 bg-[color-mix(in_srgb,var(--color-lime)_10%,transparent)] flex items-start gap-3">
              <span className="p-2 rounded-lg bg-[var(--color-lime)] text-[var(--color-ink)] shrink-0 mt-0.5">
                <selectedGuide.icon size={20} />
              </span>
              <div>
                <strong className="block text-sm" style={{ color: "var(--color-white, white)" }}>{selectedGuide.title} Guide</strong>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">{selectedGuide.shortDesc}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {selectedGuide.steps.map((st, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 rounded-xl border"
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.02)" }}
                >
                  <h4 className="text-xs font-bold text-[var(--color-lime)] uppercase tracking-wider mb-1">
                    {st.title}
                  </h4>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--color-foreground)" }}>
                    {st.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 justify-between pt-3 border-t" style={{ borderColor: "var(--line)" }}>
              <Button variant="secondary" onClick={() => setSelectedGuide(null)}>
                Close Guide
              </Button>
              <Button 
                onClick={() => {
                  setSelectedGuide(null);
                  navigate(selectedGuide.actionLink);
                }}
              >
                {selectedGuide.actionText} <ArrowRight size={15} />
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}