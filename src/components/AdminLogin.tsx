// src/components/AdminLogin.tsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // ✅ No need for onLogin — AuthContext + Router will handle redirect
    } catch (err: any) {
      console.error(err);
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <form
        onSubmit={login}
        className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg w-full max-w-sm space-y-6 transition-transform transform hover:scale-[1.02]"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">
          Admin Login
        </h2>

        <div className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-500 text-white py-3 rounded-lg font-medium transition transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
