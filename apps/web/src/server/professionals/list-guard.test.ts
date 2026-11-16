import { describe, expect, it } from "vitest";

import { isProfessionallyListed } from "@telehealth/domain";

import type { ProfessionalListItem } from "@telehealth/domain";

function mockPro(partial: Partial<ProfessionalListItem>): ProfessionalListItem {
  return {
    id: "x",
    displayName: "Demo",
    specialties: [],
    therapeuticApproach: null,
    languages: [],
    feeCents: null,
    currency: null,
    countryId: null,
    photoUrl: null,
    photoAlt: null,
    status: "draft",
    hasVerifiedCredential: false,
    nextAvailabilityAt: null,
    ...partial,
  };
}

/** Simula el filtro post-consulta del listado público. */
function filterPublicListing(rows: ProfessionalListItem[]): ProfessionalListItem[] {
  return rows.filter((row) => isProfessionallyListed(row));
}

describe("filterPublicListing", () => {
  it("nunca lista perfiles sin credencial verificada o no aprobados", () => {
    const rows = [
      mockPro({ id: "1", status: "approved", hasVerifiedCredential: true }),
      mockPro({ id: "2", status: "approved", hasVerifiedCredential: false }),
      mockPro({ id: "3", status: "pending_review", hasVerifiedCredential: true }),
      mockPro({ id: "4", status: "rejected", hasVerifiedCredential: true }),
    ];
    const visible = filterPublicListing(rows);
    expect(visible.map((p) => p.id)).toEqual(["1"]);
  });
});