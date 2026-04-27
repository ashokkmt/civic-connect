 "use client";

 import { useRouter } from "next/navigation";
 import { useEffect, useState } from "react";
 import { Bell, Mail, ShieldCheck, Smartphone } from "lucide-react";
 import { FormError } from "@/components/forms/FormError";
 import { useAuthSession } from "@/lib/auth/session-context";

 type MeResponse = {
   success?: boolean;
   error?: {
     message?: string;
   };
 };

 type ToggleProps = {
   enabled: boolean;
   onToggle: () => void;
 };

 function Toggle({ enabled, onToggle }: ToggleProps) {
   return (
     <button
       type="button"
       role="switch"
       aria-checked={enabled}
       onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full align-middle transition-colors ${enabled ? "bg-sky-600" : "bg-slate-300 dark:bg-slate-700"}`}
     >
       <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
           enabled ? "translate-x-5" : "translate-x-0.5"
         }`}
       />
     </button>
   );
 }

 export function ProfileSettings() {
   const router = useRouter();
   const { user, isLoading: sessionLoading, setCachedUser } = useAuthSession();
   const [name, setName] = useState("");
   const [email, setEmail] = useState("");
   const [currentPassword, setCurrentPassword] = useState("");
   const [newPassword, setNewPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");
   const [deletePassword, setDeletePassword] = useState("");
   const [emailNotif, setEmailNotif] = useState(true);
   const [pushNotif, setPushNotif] = useState(true);
   const [smsNotif, setSmsNotif] = useState(false);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [deleting, setDeleting] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [success, setSuccess] = useState<string | null>(null);

   useEffect(() => {
     if (sessionLoading) {
       return;
     }

     setLoading(false);

     if (!user) {
       setError("Unable to load profile");
       return;
     }

     setError(null);
     setName(user.name ?? "");
     setEmail(user.email ?? "");
   }, [sessionLoading, user?.name, user?.email, user]);

   const save = async () => {
     setError(null);
     setSuccess(null);

     if (newPassword && newPassword !== confirmPassword) {
       setError("New password and confirmation do not match.");
       return;
     }

     setSaving(true);
     try {
       const response = await fetch("/api/auth/me", {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           name: name.trim() || undefined,
           email: email.trim() || undefined,
           oldPassword: currentPassword || undefined,
           newPassword: newPassword || undefined,
         }),
       });

       const payload = (await response.json().catch(() => null)) as MeResponse | null;
       if (!response.ok || !payload?.success) {
         setError(payload?.error?.message ?? "Unable to save profile settings.");
         return;
       }

       setSuccess("Profile settings saved.");
       if (user) {
         setCachedUser({
           ...user,
           name: name.trim() || user.name,
           email: email.trim() || user.email,
         });
       }
       setCurrentPassword("");
       setNewPassword("");
       setConfirmPassword("");
     } catch {
       setError("Unable to save profile settings.");
     } finally {
       setSaving(false);
     }
   };

   const deleteAccount = async () => {
     setError(null);
     setSuccess(null);

     if (!deletePassword) {
       setError("Enter your password to delete the account.");
       return;
     }

     setDeleting(true);
     try {
       const response = await fetch("/api/auth/me", {
         method: "DELETE",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ password: deletePassword }),
       });

       const payload = (await response.json().catch(() => null)) as MeResponse | null;
       if (!response.ok || !payload?.success) {
         setError(payload?.error?.message ?? "Unable to delete account.");
         return;
       }

       await fetch("/api/auth/logout", { method: "POST" });
       router.replace("/");
       router.refresh();
     } catch {
       setError("Unable to delete account.");
     } finally {
       setDeleting(false);
     }
   };

   return (
     <div className="mx-auto w-full max-w-5xl space-y-8">
       <p className="text-slate-500 dark:text-slate-400">
         Update your profile, notification preferences, and security settings.
       </p>

       {loading ? (
         <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
           Loading profile...
         </div>
       ) : null}

       <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
         <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
           <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Personal Information</h3>
           <p className="text-sm text-slate-500 dark:text-slate-400">How you appear to the community.</p>
         </div>
         <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
           <label className="space-y-2">
             <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</span>
             <input
               type="text"
               value={name}
               onChange={(event) => setName(event.target.value)}
               className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-sky-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
             />
           </label>
           <label className="space-y-2">
             <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</span>
             <input
               type="email"
               value={email}
               onChange={(event) => setEmail(event.target.value)}
               className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-sky-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
             />
           </label>
         </div>
       </section>

       <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
         <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
           <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Notification Preferences</h3>
           <p className="text-sm text-slate-500 dark:text-slate-400">Choose how you receive updates.</p>
         </div>
         <div className="divide-y divide-slate-100 p-6 dark:divide-slate-800">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
             <div className="flex items-start gap-3">
               <Mail className="h-4 w-4 text-sky-600" />
               <div>
                 <p className="font-medium text-slate-900 dark:text-slate-100">Email Notifications</p>
                 <p className="text-xs text-slate-500 dark:text-slate-400">Daily summaries and status updates.</p>
               </div>
             </div>
            <Toggle enabled={emailNotif} onToggle={() => setEmailNotif((value) => !value)} />
           </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
             <div className="flex items-start gap-3">
               <Bell className="h-4 w-4 text-sky-600" />
               <div>
                 <p className="font-medium text-slate-900 dark:text-slate-100">Push Notifications</p>
                 <p className="text-xs text-slate-500 dark:text-slate-400">Real-time updates for urgent reports.</p>
               </div>
             </div>
            <Toggle enabled={pushNotif} onToggle={() => setPushNotif((value) => !value)} />
           </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
             <div className="flex items-start gap-3">
               <Smartphone className="h-4 w-4 text-sky-600" />
               <div>
                 <p className="font-medium text-slate-900 dark:text-slate-100">SMS Messages</p>
                 <p className="text-xs text-slate-500 dark:text-slate-400">Critical notifications only.</p>
               </div>
             </div>
            <Toggle enabled={smsNotif} onToggle={() => setSmsNotif((value) => !value)} />
           </div>
         </div>
       </section>

       <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
         <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
           <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Account Security</h3>
           <p className="text-sm text-slate-500 dark:text-slate-400">Update your password.</p>
         </div>
         <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
           <label className="space-y-2">
             <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Current Password</span>
             <input
               type="password"
               value={currentPassword}
               onChange={(event) => setCurrentPassword(event.target.value)}
               placeholder="........"
               className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-sky-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
             />
           </label>
           <label className="space-y-2">
             <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">New Password</span>
             <input
               type="password"
               value={newPassword}
               onChange={(event) => setNewPassword(event.target.value)}
               placeholder="........"
               className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-sky-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
             />
           </label>
           <label className="space-y-2">
             <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm Password</span>
             <input
               type="password"
               value={confirmPassword}
               onChange={(event) => setConfirmPassword(event.target.value)}
               placeholder="........"
               className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-sky-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
             />
           </label>
         </div>
         <div className="px-6 pb-6">
           <p className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
             <ShieldCheck className="h-3.5 w-3.5" />
             Use a strong password with at least 12 characters.
           </p>
         </div>
       </section>

       {success ? (
         <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-200">
           {success}
         </div>
       ) : null}

       <FormError message={error} />

       <section className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/40 dark:bg-red-900/15">
         <h3 className="text-lg font-bold text-red-700 dark:text-red-300">Delete Account</h3>
         <p className="mt-1 text-sm text-red-600/80 dark:text-red-300/80">
           Permanently delete your citizen account and all associated access.
         </p>
         <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
           <input
             type="password"
             value={deletePassword}
             onChange={(event) => setDeletePassword(event.target.value)}
             placeholder="Enter password to confirm"
             className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-red-300 focus:ring-2 dark:border-red-900/50 dark:bg-slate-900 dark:text-slate-200"
           />
           <button
             type="button"
             onClick={deleteAccount}
             disabled={deleting}
             className="whitespace-nowrap rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
           >
             {deleting ? "Deleting..." : "Delete Account"}
           </button>
         </div>
       </section>

       <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
         <button
           type="button"
           onClick={() => {
             setCurrentPassword("");
             setNewPassword("");
             setConfirmPassword("");
             setError(null);
             setSuccess(null);
           }}
           className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
         >
           Cancel
         </button>
         <button
           type="button"
           onClick={save}
           disabled={saving}
           className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
         >
           {saving ? "Saving..." : "Save Changes"}
         </button>
       </div>
     </div>
   );
 }

