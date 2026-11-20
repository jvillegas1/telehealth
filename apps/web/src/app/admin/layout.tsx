import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { auth } from "@/auth/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/ingreso");
  }

  return (
    <div className="min-h-screen bg-calm-50">
      <header className="border-b border-calm-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-calm-900">Administración</p>
          <p className="text-xs text-calm-700">Sesión corta · MFA requerido</p>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <AdminNav />
        <main>{children}</main>
      </div>
    </div>
  );
}
