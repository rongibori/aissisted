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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#e8e8f0]">Aissisted</h1>
          <p className="text-[#7a7a98] text-sm mt-1">
            Create your health profile
          </p>
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-[#e8e8f0] mb-5">
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
              <p className="text-sm text-red-400 bg-red-950 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-1">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-[#7a7a98] mt-4">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-indigo-400 hover:text-indigo-300"
            >
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPageWrapper() {
  return (
    <AuthProvider>
      <RegisterPage />
    </AuthProvider>
  );
}
