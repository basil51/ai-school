"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Locale } from "@/lib/i18n";
import { useTranslations } from "@/lib/useTranslations";

export default function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { data: session, status } = useSession();
  const { dict, loading: dictLoading, locale } = useTranslations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {dict?.home?.title || "Welcome to EduVibe AI Academy"}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {dict?.home?.subtitle || "AI-powered tutoring system with RAG (Retrieval-Augmented Generation)"}
            </p>
          
          {status === "loading" || dictLoading ? (
            <div className="text-lg text-gray-600">{dict?.common?.loading || "Loading..."}</div>
          ) : session ? (
            <div className="space-y-4">
                        <p className="text-lg text-gray-700">
            {dict?.auth?.welcomeBack || "Welcome back"}, {session.user?.name || session.user?.email}!
          </p>
              <div className="flex justify-center space-x-4">
                <Link
                  href={`/${locale}/dashboard`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md text-lg font-medium transition-colors"
                >
                  {dict?.navigation?.dashboard || "Go to Dashboard"}
                </Link>
                <Link
                  href={`/${locale}/tutor`}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md text-lg font-medium transition-colors"
                >
                  AI Tutor
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg text-gray-700">
                {dict?.auth?.getStarted || "Get started with AI-powered learning"}
              </p>
              <div className="flex justify-center space-x-4">
                <Link
                  href={`/${locale}/signin`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md text-lg font-medium transition-colors"
                >
                  {dict?.auth?.signin || "Sign In"}
                </Link>
                <Link
                  href={`/${locale}/tutor`}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md text-lg font-medium transition-colors"
                >
                  {dict?.auth?.tryAITutor || "Try AI Tutor"}
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {dict?.features?.smartLearning || "Smart Learning"}
            </h3>
            <p className="text-gray-600">
              {dict?.features?.smartLearningDescription || "AI-powered tutoring that adapts to your learning style and pace."}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {dict?.features?.ragTechnology || "RAG Technology"}
            </h3>
            <p className="text-gray-600">
              {dict?.features?.ragTechnologyDescription || "Retrieval-Augmented Generation for accurate, context-aware answers."}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {dict?.features?.roleBasedAccess || "Role-Based Access"}
            </h3>
            <p className="text-gray-600">
              {dict?.features?.roleBasedAccessDescription || "Different experiences for students, teachers, guardians, and admins."}
            </p>
          </div>
        </div>

        {/* Introduction Section */}
        <div className="mt-16 bg-white p-12 rounded-xl shadow-lg">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              {locale === 'ar' ? '🌙 تعريف' : '🌍 Introduction'}
            </h2>
            
            <div className="text-lg text-gray-700 leading-8 space-y-6">
              {locale === 'ar' ? (
                <div className="space-y-6">
                  <p className="text-justify">
                    أكاديمية إديوفايف الذكية ليست مجرد تطبيق تعليمي آخر، بل هي ثورة في عالم التعليم. تخيّل أن يكون لكل طالب معلّم شخصي مدعوم بالذكاء الاصطناعي يرافقه خطوة بخطوة.
                  </p>
                  
                  <p className="text-justify">
                    سواء في الرياضيات أو العلوم أو اللغة الإنجليزية أو التاريخ أو أي مادة أخرى، يقوم الذكاء الاصطناعي بإنشاء منهاج تفاعلي وديناميكي مصمم خصيصًا لسرعة الطالب وأسلوب تعلمه. الدروس تتكيف لحظيًا، مع اختبارات وواجبات تقيس الفهم وتقدم تغذية راجعة فورية.
                  </p>
                  
                  <p className="text-justify">
                    وإذا لم يستوعب الطالب فكرة ما، يعيد الذكاء الاصطناعي شرحها بأسلوب مختلف حتى يفهمها تمامًا. بالاعتماد على كتب دراسية موثوقة ومعززة بمصادر مباشرة من الإنترنت، تقدم أكاديمية إديوفايف تجربة تعليمية أعمق وأكثر ثراءً ودقة من أي وقت مضى.
                  </p>
                  
                  <p className="text-justify font-semibold text-gray-800">
                    هذه ليست دروس خصوصية فحسب، بل هي مدرسة كاملة ومرنة وشخصية في نظام واحد.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-justify">
                    EduVibe AI Academy isn't just another learning app—it's a revolution in education. Imagine every student having their own personal AI teacher, ready to guide them step by step.
                  </p>
                  
                  <p className="text-justify">
                    Whether it's math, science, English, history, or any subject, the AI crafts a dynamic, interactive curriculum tailored to each learner's pace and style. Lessons adapt in real time, with quizzes, tests, and homework that measure understanding and provide instant feedback.
                  </p>
                  
                  <p className="text-justify">
                    If a concept is unclear, the AI explains it again—this time in a new way—until it clicks. Backed by trusted textbooks and enhanced by real-time knowledge from the web, EduVibe AI Academy offers deeper, richer, and more accurate learning than ever before.
                  </p>
                  
                  <p className="text-justify font-semibold text-gray-800">
                    This isn't just tutoring—it's a complete, adaptable, and personalized school in a single system.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
