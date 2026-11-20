import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { recordAdminAudit } from "@telehealth/db";
import { credentialDocuments, credentials } from "@telehealth/db/schema";
import { AdminPermission } from "@telehealth/domain";

import { requireAdmin } from "@/server/admin/guard";
import { readCredentialDocument } from "@/server/uploads/credential-storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ credentialId: string }> },
): Promise<Response> {
  const gate = await requireAdmin(AdminPermission.CredentialsRead);
  if (!gate.ok) return gate.response;

  const { credentialId } = await params;
  const [row] = await gate.db
    .select({
      document: credentialDocuments,
      professionalProfileId: credentials.professionalProfileId,
    })
    .from(credentialDocuments)
    .innerJoin(credentials, eq(credentials.id, credentialDocuments.credentialId))
    .where(eq(credentials.id, credentialId));

  if (!row?.document) {
    return NextResponse.json({ message: "Documento no encontrado." }, { status: 404 });
  }

  await recordAdminAudit(gate.db, {
    actorUserId: gate.userId,
    action: "credential_document_viewed",
    resourceType: "credential_documents",
    resourceId: row.document.id,
    metadata: { credentialId },
  });

  try {
    const file = await readCredentialDocument({
      professionalId: row.professionalProfileId,
      storageKey: row.document.storageKey,
    });
    return new NextResponse(new Uint8Array(file.buffer), {
      headers: {
        "content-type": row.document.mimeType,
        "content-disposition": `inline; filename="${row.document.fileName}"`,
      },
    });
  } catch {
    return NextResponse.json({ message: "Archivo no disponible." }, { status: 404 });
  }
}
