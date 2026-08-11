import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import ClientProctorWrapper from "@/components/ClientProctorWrapper";

export const metadata: Metadata = {
  title: "HR Publik - Portal Psikotes & Assessment Center Engine",
  description: "Platform Pengelolaan Assessment Psikologi, Test Online, dan Quality Control Psikogram HR Publik",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 font-sans antialiased">
        <AuthProvider>
          <ClientProctorWrapper>{children}</ClientProctorWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
