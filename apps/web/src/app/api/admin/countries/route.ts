import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAdminAudit } from "@telehealth/db";
import { commissionRules, countries, crisisResources } from "@telehealth/db/schema";
import { AdminPermission } from "@telehealth/domain";

import { requireAdmin } from "@/server/admin/guard";

export async function GET(): Promise<Response> {
  const gate = await requireAdmin(AdminPermission.CountriesRead);
  if (!gate.ok) return gate.response;

  const list = await gate.db.select().from(countries);
  const rules = await gate.db
    .select()
    .from(commissionRules)
    .where(eq(commissionRules.active, true));
  const crisis = await gate.db.select().from(crisisResources).limit(200);

  return NextResponse.json({ countries: list, commissionRules: rules, crisisResources: crisis });
}

const putCountrySchema = z.object({
  countryId: z.string().uuid(),
  paymentGateway: z.string().min(2).max(80).optional(),
  active: z.boolean().optional(),
});

const postCommissionSchema = z.object({
  countryId: z.string().uuid(),
  rateBps: z.number().int().min(0).max(10_000),
  summary: z.string().min(5).max(300),
});

export async function PUT(request: Request): Promise<Response> {
  const gate = await requireAdmin(AdminPermission.CountriesConfigure);
  if (!gate.ok) return gate.response;

  const parsed = putCountrySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  await gate.db
    .update(countries)
    .set({
      ...(parsed.data.paymentGateway !== undefined
        ? { paymentGateway: parsed.data.paymentGateway }
        : {}),
      ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
    })
    .where(eq(countries.id, parsed.data.countryId));

  await recordAdminAudit(gate.db, {
    actorUserId: gate.userId,
    action: "country_updated",
    resourceType: "countries",
    resourceId: parsed.data.countryId,
    metadata: {
      ...(parsed.data.paymentGateway ? { paymentGateway: parsed.data.paymentGateway } : {}),
      ...(parsed.data.active !== undefined ? { active: String(parsed.data.active) } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request): Promise<Response> {
  const gate = await requireAdmin(AdminPermission.CountriesConfigure);
  if (!gate.ok) return gate.response;

  const parsed = postCommissionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const existing = await gate.db
    .select()
    .from(commissionRules)
    .where(eq(commissionRules.countryId, parsed.data.countryId));

  const nextVersion = existing.reduce((max, r) => Math.max(max, r.version), 0) + 1;

  await gate.db
    .update(commissionRules)
    .set({ active: false })
    .where(eq(commissionRules.countryId, parsed.data.countryId));

  const [created] = await gate.db
    .insert(commissionRules)
    .values({
      countryId: parsed.data.countryId,
      version: nextVersion,
      rateBps: parsed.data.rateBps,
      summary: parsed.data.summary,
      active: true,
    })
    .returning();

  await recordAdminAudit(gate.db, {
    actorUserId: gate.userId,
    action: "commission_rule_created",
    resourceType: "commission_rules",
    resourceId: created!.id,
    metadata: { version: String(nextVersion), rateBps: String(parsed.data.rateBps) },
  });

  return NextResponse.json({ ruleId: created!.id, version: nextVersion });
}
