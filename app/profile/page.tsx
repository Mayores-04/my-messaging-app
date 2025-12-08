"use client";

import React, { useEffect, useState } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showPresence, setShowPresence] = useState<boolean>(true);
  const [enableNotifications, setEnableNotifications] = useState<boolean>(true);

  useEffect(() => {
    if (!isLoaded || !user) return;
    setFirstName((user as any).firstName ?? "");
    setLastName((user as any).lastName ?? "");
    setFullName((user as any).fullName ?? "");
    // try a couple of common email fields
    const emailVal = (user as any).primaryEmailAddress?.emailAddress ?? (user as any).email ?? (user as any).emailAddresses?.[0]?.emailAddress;
    setEmail(emailVal ?? "");
    const prefs = (user as any).publicMetadata?.preferences ?? (user as any)?.preferences ?? {};
    setShowPresence(prefs.showPresence ?? true);
    setEnableNotifications(prefs.enableNotifications ?? true);
  }, [isLoaded, user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setFeedback(null);
    try {
      // Clerk user update method: use `user.update()` if available
      if (typeof (user as any).update === "function") {
        await (user as any).update({ firstName: firstName || null, lastName: lastName || null });
      } else {
        // fallback: try to set publicMetadata with name
        await (user as any).setPublicMetadata?.({ displayName: `${firstName} ${lastName}` });
      }
      setFeedback("Saved successfully");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to save user", err);
      setFeedback("Failed to save changes");
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/messages" className="text-sm text-[#b8aa9d] hover:text-white">
          ← Back to messages
        </Link>
        <h1 className="text-white text-2xl font-semibold">Account Settings</h1>
      </div>

      <div className="bg-[#181411] border border-[#53473c] rounded-lg p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm text-[#b8aa9d] mb-1">First name</label>
            <input
              id="firstName"
              title="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-2 rounded bg-transparent border border-[#3a322e] text-white"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm text-[#b8aa9d] mb-1">Last name</label>
            <input
              id="lastName"
              title="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-2 rounded bg-transparent border border-[#3a322e] text-white"
            />
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm text-[#b8aa9d] mb-1">Full name (read-only)</label>
            <input id="fullName" title="Full name" value={fullName} readOnly className="w-full p-2 rounded bg-[#0f0d0c] border border-[#3a322e] text-white" />
          </div>

          <div>
            <label htmlFor="primaryEmail" className="block text-sm text-[#b8aa9d] mb-1">Primary email</label>
            <input id="primaryEmail" title="Primary email" value={email} readOnly className="w-full p-2 rounded bg-[#0f0d0c] border border-[#3a322e] text-white" />
            <p className="text-xs text-[#b8aa9d] mt-1">To change your email or connected accounts, use your identity provider or Clerk dashboard.</p>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#e67919] text-black rounded font-medium disabled:opacity-60">
              {saving ? "Saving…" : "Save changes"}
            </button>

            <SignOutButton>
              <button className="px-4 py-2 bg-transparent border border-[#3a322e] text-white rounded">Sign out</button>
            </SignOutButton>

            {feedback && <span className="text-sm text-[#b8aa9d]">{feedback}</span>}
          </div>
        </form>

        {/* Preferences */}
        <div className="mt-6 border-t border-[#3a322e] pt-4">
          <h3 className="text-white font-medium mb-2">Preferences</h3>
          <div className="flex flex-col gap-3 text-sm text-[#b8aa9d]">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={showPresence}
                onChange={(e) => setShowPresence(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Show my presence (online status)</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={enableNotifications}
                onChange={(e) => setEnableNotifications(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Enable push notifications</span>
            </label>

            <div className="text-xs text-[#b8aa9d]">Preferences are stored in your account metadata and will be synced across devices.</div>

            <div>
              <button
                onClick={async () => {
                  if (!user) return;
                  setSaving(true);
                  try {
                    const prefs = { preferences: { showPresence, enableNotifications } };
                    if (typeof (user as any).update === "function") {
                      await (user as any).update({ publicMetadata: { ...((user as any).publicMetadata ?? {}), ...prefs } });
                    } else if (typeof (user as any).setPublicMetadata === "function") {
                      await (user as any).setPublicMetadata({ ...((user as any).publicMetadata ?? {}), ...prefs });
                    }
                    setFeedback("Preferences saved");
                    setTimeout(() => setFeedback(null), 3000);
                  } catch (err) {
                    // eslint-disable-next-line no-console
                    console.error(err);
                    setFeedback("Failed to save preferences");
                    setTimeout(() => setFeedback(null), 3000);
                  } finally {
                    setSaving(false);
                  }
                }}
                className="px-3 py-2 bg-[#2b2a28] text-white rounded"
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
        {/* Connected accounts / providers info */}
        <div className="mt-6">
          <h3 className="text-white font-medium mb-2">Connected accounts</h3>
          <div className="text-sm text-[#b8aa9d]">
            {(user as any)?.externalAccounts?.length ? (
              <ul className="space-y-1">
                {((user as any).externalAccounts as any[]).map((acc: any, idx: number) => (
                  <li key={idx} className="flex items-center justify-between">
                    <span>{acc.provider ?? acc.providerType ?? acc.providerId}</span>
                    <span className="text-xs text-[#b8aa9d]">{acc.email || acc.providerAccountId || "connected"}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No external accounts detected.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
