"use client";

import { useEffect, useState } from "react";

const links = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/credenciales", label: "Credenciales" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/finanzas", label: "Finanzas" },
  { href: "/admin/valoraciones", label: "Valoraciones" },
  { href: "/admin/paises", label: "Países" },
  { href: "/admin/auditoria", label: "Auditoría" },
  { href: "/admin/accesos", label: "Accesos sensibles" },
  { href: "/admin/crisis-resources", label: "Crisis" },
];

export function AdminNav() {
  const [perms, setPerms] = useState<string[]>([]);

  useEffect(() => {
    void fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d: { permissions?: string[] }) => setPerms(d.permissions ?? []));
  }, []);

  return (
    <nav className="space-y-1 text-sm">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="block rounded-md px-3 py-2 text-calm-800 hover:bg-white"
        >
          {link.label}
        </a>
      ))}
      {perms.length === 0 ? (
        <p className="px-3 text-xs text-calm-600">Sin permisos cargados</p>
      ) : null}
    </nav>
  );
}
