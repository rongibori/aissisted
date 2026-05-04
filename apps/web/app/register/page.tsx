"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "../../lib/auth-context";
import { Button, Input, Card } from "../../components/ui";

function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register(email, password);
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-graphite">Aissisted</h1>
          <p className="text-graphite-soft text-sm mt-1">
            Create your health profile
          </p>
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-graphite mb-5">
            Get started
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ characters"
              required
            />

            {error && (
              <p className="text-sm text-signal-red bg-signal-red/10 border border-signal-red/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-1">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-graphite-soft mt-4">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-midnight font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}

export default function RegisterPageWrapper() {
  return (
    <AuthProvider>
      <RegisterPage />
    </AuthProvider>
  );
}
