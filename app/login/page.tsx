"use client";

import { login } from "@/app/auth/actions";
import { useState } from "react";
import { Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const res = await login(formData);

        if (res?.error) {
            setError(res.error);
            setLoading(false);
        }
        // If successful, the server action redirects.
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                            Welcome Back
                        </h1>
                        <p className="text-slate-400 mt-2">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-900/30 border border-red-800 text-red-200 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/20"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
                <div className="bg-slate-900/50 border-t border-slate-800 p-6 text-center">
                    <p className="text-slate-400 text-sm">
                        Don't have an account?{" "}
                        <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
