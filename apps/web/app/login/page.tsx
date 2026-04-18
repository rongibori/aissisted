"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "../../lib/auth-context";
import { Button, Input, Card, RallyCry } from "../../components/ui";

function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface">
      <div className="w-full max-w-sm">
        {/* Hero — wordmark + rally cry */}
        <div className="text-center mb-10">
          <Image
            src="/brand/Aissisted-logo-H.svg"
            alt="Aissisted"
            width={180}
            height={34}
            priority
            className="mx-auto mb-6"
          />
          <RallyCry size="sm" />
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-ink mb-5">
            Sign in
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
              placeholder="••••••••"
              required
            />

            {error && (
              <p className="text-sm text-danger bg-danger-soft border border-danger/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-1">
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-muted mt-4">
            New here?{" "}
            <Link
              href="/register"
              className="text-ink underline underline-offset-2 hover:text-brand transition-colors"
            >
              Create your account
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPageWrapper() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}
