"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function Home() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Brassmark</h1>
      <p className="mt-2 text-zinc-400">Procurement tender tracking</p>

      {user ? (
        <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Signed in as</p>
          <p className="mt-1 font-medium">{user.email}</p>
          {user.name && <p className="text-zinc-400">{user.name}</p>}
          <button
            onClick={logout}
            className="mt-4 rounded bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="mt-8 flex gap-4">
          <Link
            href="/login"
            className="rounded bg-zinc-100 px-6 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Register
          </Link>
        </div>
      )}
    </main>
  );
}
