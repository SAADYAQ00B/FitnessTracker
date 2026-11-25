import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import { Edit3, Check, Dumbbell, Footprints, Camera, Loader2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { getUser, updateUser, uploadAvatar, UserProfile } from "../services/userService";

export function ProfilePage() {
  const { notify } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState<UserProfile>({
    name: "",
    email: "",
    avatar: "",
    location: "Unknown",
    bio: "Fitness Enthusiast",
    level: 1,
    xp: 0,
    units: "Metric",
  });

  useEffect(() => {
    getUser()
      .then((profile) => {
        if (profile) {
          setUser(profile);
          localStorage.setItem("user", JSON.stringify(profile));
        }
      })
      .catch((err) => console.error("Failed to load user profile", err));
  }, []);

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      notify("Uploading picture to Cloudinary...");
      const res = await uploadAvatar(file);
      const newAvatar = res.avatar || res.user?.avatar;
      setUser((prev) => {
        const updated = { ...prev, avatar: newAvatar };
        localStorage.setItem("user", JSON.stringify(updated));
        return updated;
      });
      window.dispatchEvent(new Event("user-updated"));
      notify("Profile picture updated successfully!");
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      notify(err.response?.data?.msg || err.response?.data?.error || "Failed to upload profile picture");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateUser({
        name: user.name,
        location: user.location,
        bio: user.bio,
      });
      setUser((prev) => ({ ...prev, ...updated }));
      setEditing(false);
      notify("Profile changes saved successfully!");
    } catch (err: any) {
      notify(err.response?.data?.msg || "Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  };

  const displayName = user.name || "Fitness User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "AM";

  const currentLevel = user.level || 1;
  const currentXp = user.xp || 0;
  const xpNeeded = currentLevel * 200;
  const xpProgress = Math.min(Math.round((currentXp / xpNeeded) * 100), 100);

  return (
    <>
      <PageHeader 
        eyebrow="ACCOUNT" 
        title="Your profile" 
        description="Manage your personal details, profile picture, and celebrate your fitness story." 
        action={
          <Button 
            variant={editing ? "primary" : "secondary"} 
            icon={editing ? Check : Edit3} 
            disabled={saving}
            onClick={() => {
              if (editing) {
                document.getElementById("profile-form")?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
              } else {
                setEditing(true);
              }
            }}
          >
            {editing ? (saving ? "Saving..." : "Save changes") : "Edit profile"}
          </Button>
        } 
      />
      
      {/* Hidden file input for avatar upload to Cloudinary */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleAvatarChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Profile Overview Banner */}
      <Card className="flex flex-col sm:flex-row items-center gap-6 mb-6">
        {/* Avatar with Camera upload trigger */}
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={displayName} 
              className="size-24 rounded-2xl object-cover border-2 shadow-lg" 
              style={{ borderColor: "var(--color-lime)" }} 
            />
          ) : (
            <div className="size-24 rounded-2xl bg-[color-mix(in_srgb,var(--color-lime)_25%,transparent)] text-[var(--color-lime)] grid place-items-center text-3xl font-black">
              {initials}
            </div>
          )}

          {/* Upload overlay / badge */}
          <div 
            className="absolute -bottom-1 -right-1 size-8 rounded-full bg-[var(--color-lime)] text-[var(--color-ink)] grid place-items-center border-2 border-[var(--surface)] shadow hover:scale-110 transition"
            title="Upload profile picture"
          >
            {uploadingAvatar ? <Loader2 size={16} className="animate-spin" /> : <Camera size={15} />}
          </div>
        </div>

        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold" style={{ color: "var(--color-white, white)" }}>{displayName}</h2>
          <p className="text-sm text-muted mt-0.5">{user.email} · {user.location || "Location not set"}</p>
          <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
            <span className="px-2.5 py-1 bg-[color-mix(in_srgb,var(--color-lime)_15%,transparent)] text-[var(--color-lime)] rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Dumbbell size={14} /> Strength Training
            </span>
            <span className="px-2.5 py-1 bg-[color-mix(in_srgb,var(--color-lime)_15%,transparent)] text-[var(--color-lime)] rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Footprints size={14} /> Active Lifestyle
            </span>
          </div>
        </div>

        {/* Level & XP Progression */}
        <div className="sm:ml-auto w-full sm:max-w-[220px] p-3 rounded-xl border" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.02)" }}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-[var(--color-lime)] font-black tracking-wider block">
              LEVEL {currentLevel}
            </span>
            <span className="text-[10px] text-muted">{currentXp} / {xpNeeded} XP</span>
          </div>
          <strong className="block text-sm mb-2" style={{ color: "var(--color-white, white)" }}>
            Momentum Builder
          </strong>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div 
              className="h-full bg-[var(--color-lime)] rounded-full transition-all duration-500" 
              style={{ width: `${xpProgress}%` }} 
            />
          </div>
          <small className="text-[10px] text-muted block mt-1.5">
            Earn +50 XP for every completed workout
          </small>
        </div>
      </Card>

      {/* Edit Form */}
      <div className="grid lg:grid-cols-[1.5fr_.8fr] gap-5">
        <Card>
          <div className="card-head">
            <div>
              <span className="eyebrow">PERSONAL INFO</span>
              <h2>About you</h2>
            </div>
            {editing && <span className="text-xs text-[var(--color-lime)] font-bold">Editing mode</span>}
          </div>

          <form id="profile-form" onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            <label className="field">
              <span>Full name</span>
              <input 
                disabled={!editing} 
                value={user.name} 
                onChange={(e) => setUser({ ...user, name: e.target.value })} 
                className="field-input disabled:opacity-70" 
                required 
              />
            </label>
            <label className="field">
              <span>Email address</span>
              <input 
                disabled 
                value={user.email} 
                className="field-input opacity-60 cursor-not-allowed" 
                title="Email is locked to your account" 
              />
            </label>
            <label className="field sm:col-span-2">
              <span>Location / City</span>
              <input 
                disabled={!editing} 
                value={user.location || ""} 
                onChange={(e) => setUser({ ...user, location: e.target.value })} 
                placeholder="e.g. Portland, Oregon" 
                className="field-input disabled:opacity-70" 
              />
            </label>
            <label className="field sm:col-span-2">
              <span>Bio / Fitness Philosophy</span>
              <textarea 
                disabled={!editing} 
                value={user.bio || ""} 
                onChange={(e) => setUser({ ...user, bio: e.target.value })} 
                placeholder="Share your goals and fitness philosophy..." 
                className="field-input disabled:opacity-70" 
                style={{ height: "100px" }} 
              />
            </label>
          </form>
        </Card>

        {/* Picture Upload Helper Card */}
        <Card className="flex flex-col justify-center text-center p-6">
          <Camera size={36} className="mx-auto text-[var(--color-lime)] mb-3 opacity-80" />
          <h3 className="font-bold text-base" style={{ color: "var(--color-white, white)" }}>
            Profile Picture
          </h3>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Click the avatar above or the button below to upload a profile picture. Images are uploaded to Cloudinary and synchronized across your dashboard.
          </p>
          <button 
            type="button" 
            className="btn-secondary mt-5 mx-auto" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? "Uploading to Cloudinary..." : "Choose Image File"}
          </button>
        </Card>
      </div>
    </>
  );
}