"use client";

import { useState } from "react";

import { Alert, Button, Input } from "@telehealth/ui";

export function PayoutForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = {
      countryCode: "AR",
      payload: {
        taxId: String(data.get("taxId") ?? ""),
        accountHolder: String(data.get("accountHolder") ?? ""),
        cbu: String(data.get("cbu") ?? ""),
        bankName: String(data.get("bankName") ?? ""),
      },
    };
    const res = await fetch("/api/professional/payout-credentials", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { message?: string };
    if (res.ok) {
      setMessage("Datos guardados (cifrados).");
      setError(null);
    } else {
      setError(json.message ?? "No pudimos guardar.");
    }
  }

  return (
    <form className="mx-auto max-w-lg space-y-4" onSubmit={(e) => void submit(e)}>
      <p className="text-sm text-calm-800">Argentina — CBU y titular (almacenamiento cifrado).</p>
      {message ? <Alert variant="info">{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}
      <label className="block text-sm">
        CUIT/CUIL
        <Input name="taxId" className="mt-1" required />
      </label>
      <label className="block text-sm">
        Titular de la cuenta
        <Input name="accountHolder" className="mt-1" required />
      </label>
      <label className="block text-sm">
        CBU (22 dígitos)
        <Input name="cbu" inputMode="numeric" pattern="\d{22}" className="mt-1" required />
      </label>
      <label className="block text-sm">
        Banco
        <Input name="bankName" className="mt-1" required />
      </label>
      <Button type="submit">Guardar datos de cobro</Button>
    </form>
  );
}
