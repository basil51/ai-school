"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to AI School
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-powered tutoring system with RAG (Retrieval-Augmented Generation)
          </p>
          
          {status === "loading" ? (
            <div className="text-lg text-gray-600">Loading...</div>
          ) : session ? (
            <div className="space-y-4">
              <p className="text-lg text-gray-700">
                Welcome back, {session.user?.name || session.user?.email}!
              </p>
              <div className="flex justify-center space-x-4">
                <Link
                  href="/dashboard"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md text-lg font-medium transition-colors"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="/tutor"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md text-lg font-medium transition-colors"
                >
                  AI Tutor
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg text-gray-700">
                Get started with AI-powered learning
              </p>
              <div className="flex justify-center space-x-4">
                <Link
                  href="/signin"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md text-lg font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/tutor"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md text-lg font-medium transition-colors"
                >
                  Try AI Tutor
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Learning</h3>
            <p className="text-gray-600">
              AI-powered tutoring that adapts to your learning style and pace.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">RAG Technology</h3>
            <p className="text-gray-600">
              Retrieval-Augmented Generation for accurate, context-aware answers.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Role-Based Access</h3>
            <p className="text-gray-600">
              Different experiences for students, teachers, guardians, and admins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
