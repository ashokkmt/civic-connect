"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormActions } from "@/components/forms/FormActions";
import { FormError } from "@/components/forms/FormError";
import { TextField } from "@/components/forms/TextField";
import { useAuthSession } from "@/lib/auth/session-context";

type AccountSettingsProps = {
  roleLabel: string;
};

type MeResponse = {
  success: boolean;
  data?: { user?: { email?: string; name?: string } };
  error?: { message?: string };
};

export function AccountSettings({ roleLabel }: AccountSettingsProps) {
  const router = useRouter();
  const { user, isLoading: sessionLoading, setCachedUser } = useAuthSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }

    setIsLoading(false);

    if (!user) {
      setError("Unable to load profile");
      return;
    }

    setError(null);
    setName(user.name ?? "");
    setEmail(user.email ?? "");
  }, [sessionLoading, user?.name, user?.email, user]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (newPassword && !oldPassword) {
      setError("Enter your current password to set a new one.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          oldPassword: oldPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as MeResponse | null;
      if (!response.ok || !payload?.success) {
        setError(payload?.error?.message ?? "Profile updates require backend support.");
        return;
      }

      setSuccess("Profile updated successfully.");
      if (user) {
        setCachedUser({
          ...user,
          name: name.trim() || user.name,
          email: email.trim() || user.email,
        });
      }
      setIsEditing(false);
      setOldPassword("");
      setNewPassword("");
    } catch {
      setError("Profile updates require backend support.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePassword) {
      setError("Enter your password to delete the account.");
      return;
    }

    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      const payload = (await response.json().catch(() => null)) as MeResponse | null;
      if (!response.ok || !payload?.success) {
        setError(payload?.error?.message ?? "Account deletion requires backend support.");
        return;
      }

      router.push("/");
    } catch {
      setError("Account deletion requires backend support.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setError(null);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/");
      router.refresh();
    } catch {
      setError("Unable to logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">{roleLabel} settings</p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Account settings</h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
          Update your profile details, manage password access, and control your account.
        </p>
      </header>

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
      >
        {isLoading ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
            Loading profile...
          </div>
        ) : null}
        <TextField
          id="settings-name"
          label="Full name"
          value={name}
          onChange={setName}
          placeholder="Jane Doe"
          disabled={!isEditing}
        />
        <TextField
          id="settings-email"
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="name@example.com"
          type="email"
          disabled={!isEditing}
        />
        <TextField
          id="settings-old-password"
          label="Current password"
          value={oldPassword}
          onChange={setOldPassword}
          placeholder="Enter current password"
          type="password"
          disabled={!isEditing}
        />
        <TextField
          id="settings-new-password"
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          placeholder="Enter a new password"
          type="password"
          disabled={!isEditing}
        />

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-200">
            {success}
          </div>
        ) : null}

        <FormError message={error} />

        <FormActions
          submitLabel={isEditing ? "Save changes" : "Edit profile"}
          isSubmitting={isSaving}
          secondaryAction={
            isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setOldPassword("");
                  setNewPassword("");
                  setError(null);
                  setSuccess(null);
                }}
                className="text-xs font-semibold text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Cancel
              </button>
            ) : null
          }
        />
      </form>

      <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Danger zone</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">Delete account</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Enter your password to permanently delete this account.
          </p>
        </div>
        <TextField
          id="delete-password"
          label="Confirm password"
          value={deletePassword}
          onChange={setDeletePassword}
          placeholder="Enter current password"
          type="password"
        />
        <button
          type="button"
          onClick={handleDelete}
          disabled={!deletePassword}
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200"
        >
          {isDeleting ? "Deleting..." : "Delete account"}
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Logout</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              End this session and return to the public homepage.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </section>
  );
}
