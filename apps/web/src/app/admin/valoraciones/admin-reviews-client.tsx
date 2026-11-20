"use client";

import { useEffect, useState } from "react";

import { Button } from "@telehealth/ui";

type Review = { id: string; rating: number; comment: string | null; moderationStatus: string };

export function AdminReviewsClient() {
  const [reviews, setReviews] = useState<Review[]>([]);

  async function load() {
    const res = await fetch("/api/admin/reviews");
    const data = (await res.json()) as { reviews?: Review[] };
    setReviews(data.reviews ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function moderate(id: string, status: "visible" | "hidden") {
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: id, status }),
    });
    await load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Moderación de valoraciones</h1>
      <ul className="space-y-2">
        {reviews.map((r) => (
          <li key={r.id} className="rounded border p-3 text-sm">
            <p>
              {r.rating}★ — {r.comment ?? "(sin comentario)"}
            </p>
            <div className="mt-2 flex gap-2">
              <Button type="button" onClick={() => void moderate(r.id, "visible")}>
                Visible
              </Button>
              <Button type="button" onClick={() => void moderate(r.id, "hidden")}>
                Ocultar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
