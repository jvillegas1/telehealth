"use client";

import { useRef, useState } from "react";

import { PROFESSIONAL_SPECIALTIES, SPECIALTY_LABELS } from "@telehealth/domain";
import { Alert, Button, Input, Label } from "@telehealth/ui";

export function ProfessionalOnboardingForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save(submitForReview: boolean) {
    const form = formRef.current;
    if (!form) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    const data = new FormData(form);
    const specialties = data.getAll("specialties").map(String);
    const languages = data.getAll("languages").map(String);

    const body = {
      displayName: String(data.get("displayName") ?? ""),
      bio: String(data.get("bio") ?? ""),
      therapeuticApproach: String(data.get("therapeuticApproach") ?? ""),
      specialties,
      languages,
      feeCents: Number(data.get("feeCents") || 0) || undefined,
      currency: String(data.get("currency") ?? "") || undefined,
      photoAlt: String(data.get("photoAlt") ?? ""),
      submitForReview,
    };

    const res = await fetch("/api/professional/onboarding", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { message?: string };
    setLoading(false);
    if (!res.ok) {
      setError(json.message ?? "No pudimos guardar.");
      return;
    }
    setMessage(json.message ?? "Guardado.");
  }

  return (
    <div className="space-y-4">
      {message ? <Alert variant="info">{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <form ref={formRef} className="space-y-4">
        <Label>
          Nombre público
          <Input name="displayName" required className="mt-1" />
        </Label>
        <Label>
          Presentación
          <textarea name="bio" className="mt-1 w-full rounded border border-calm-100 p-2 text-sm" rows={4} />
        </Label>
        <Label>
          Enfoque terapéutico
          <Input name="therapeuticApproach" className="mt-1" />
        </Label>

        <fieldset>
          <legend className="text-sm font-medium text-calm-900">Especialidades</legend>
          <div className="mt-2 space-y-1">
            {PROFESSIONAL_SPECIALTIES.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="specialties" value={s} />
                {SPECIALTY_LABELS[s]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-calm-900">Idiomas</legend>
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            {["es", "en", "pt"].map((lang) => (
              <label key={lang} className="flex items-center gap-1">
                <input type="checkbox" name="languages" value={lang} defaultChecked={lang === "es"} />
                {lang.toUpperCase()}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <Label>
            Honorarios (centavos)
            <Input name="feeCents" inputMode="numeric" className="mt-1" />
          </Label>
          <Label>
            Moneda
            <Input name="currency" defaultValue="ARS" maxLength={3} className="mt-1" />
          </Label>
        </div>

        <Label>
          Texto alternativo de la foto
          <Input name="photoAlt" required placeholder="Ej.: Retrato profesional sonriente" className="mt-1" />
        </Label>
      </form>

      <section className="space-y-2 rounded-lg border border-calm-100 p-4">
        <h2 className="text-sm font-medium text-calm-900">Credencial y documentos</h2>
        <p className="text-xs text-calm-800">
          Cualquier cambio en la matrícula o documentos devuelve el perfil a revisión y lo oculta del directorio.
        </p>
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const res = await fetch("/api/professional/credentials", { method: "POST", body: fd });
            const json = (await res.json()) as { message?: string };
            setMessage(json.message ?? (res.ok ? "Enviado." : "Error"));
          }}
        >
          <Input name="licenseNumber" placeholder="Nº matrícula" required />
          <Input name="issuingBody" placeholder="Colegio / organismo" required />
          <input name="document" type="file" accept="application/pdf,image/*" required className="text-sm" />
          <Button type="submit">Subir credencial</Button>
        </form>
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const res = await fetch("/api/professional/photo", { method: "POST", body: fd });
            setMessage(res.ok ? "Foto actualizada." : "No se pudo subir la foto.");
          }}
        >
          <Input name="photoAlt" placeholder="Texto alternativo foto" required />
          <input name="photo" type="file" accept="image/*" required className="text-sm" />
          <Button type="submit">Subir foto</Button>
        </form>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={loading} onClick={() => save(false)}>
          Guardar borrador
        </Button>
        <Button type="button" disabled={loading} onClick={() => save(true)}>
          Enviar a revisión
        </Button>
      </div>
    </div>
  );
}