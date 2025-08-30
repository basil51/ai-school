import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EduVibe AI Academy",
  description: "AI-powered tutoring system with RAG technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
