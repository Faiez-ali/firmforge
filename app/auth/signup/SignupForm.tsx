"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogoMark } from "@/components/ui/LogoMark";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleGitHubLogin() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleGoogleLogin() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 20 }}
          className="text-5xl mb-5"
        >
          📬
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="text-xl font-semibold mb-2"
        >
          Check your email
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.4 }}
          className="text-gray-400 text-sm leading-relaxed"
        >
          We sent a confirmation link to{" "}
          <span className="text-white font-medium">{email}</span>.
          Click it to activate your account.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
          <Link href="/auth/login" className="block mt-6 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            Back to sign in →
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full max-w-sm"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={item} className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight lg:hidden">
          <LogoMark size={22} />
          Firm<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Forge</span>
        </Link>
        <p className="text-gray-400 text-sm mt-2">Create your free account</p>
      </motion.div>

      {/* Card */}
      <motion.div
        variants={item}
        className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
      >
        {/* OAuth buttons */}
        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-2">
          <motion.button
            variants={item}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            <GoogleIcon />
            Continue with Google
          </motion.button>
          <motion.button
            variants={item}
            onClick={handleGitHubLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            <GitHubIcon />
            Continue with GitHub
          </motion.button>
        </motion.div>

        <motion.div variants={item} className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-xs text-gray-600">or</span>
          <div className="flex-1 h-px bg-white/5" />
        </motion.div>

        {/* Form fields */}
        <form onSubmit={handleSignup} className="space-y-3">
          <motion.div variants={item}>
            <label className="text-xs text-gray-400 mb-1.5 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </motion.div>
          <motion.div variants={item}>
            <label className="text-xs text-gray-400 mb-1.5 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </motion.div>
          <motion.div variants={item}>
            <label className="text-xs text-gray-400 mb-1.5 block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            variants={item}
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium transition-all disabled:opacity-50 mt-1 shadow-lg shadow-blue-500/20"
          >
            {loading ? "Creating account..." : "Create free account"}
          </motion.button>
        </form>

        <motion.p variants={item} className="text-xs text-gray-600 text-center mt-4">
          By signing up you agree to our{" "}
          <Link href="/terms" className="text-gray-500 hover:text-gray-400 transition-colors">Terms</Link> and{" "}
          <Link href="/privacy" className="text-gray-500 hover:text-gray-400 transition-colors">Privacy Policy</Link>.
        </motion.p>
      </motion.div>

      <motion.p variants={item} className="text-center text-sm text-gray-500 mt-5">
        Have an account?{" "}
        <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 transition-colors">
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
