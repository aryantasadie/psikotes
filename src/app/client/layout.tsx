import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Portal — HR Publik Assessment Engine",
  description: "Portal khusus Klien Perusahaan untuk memantau hasil dan laporan psikotes kandidat.",
};

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {children}
    </div>
  );
}
