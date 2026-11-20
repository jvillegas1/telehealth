import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env["AUTH_SECRET"] ?? "development-only-auth-secret-32chars!",
  });
  if (!token) {
    return NextResponse.redirect(new URL("/ingreso", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/consentimiento",
    "/privacidad",
    "/mfa",
    "/autoevaluacion",
    "/profesionales/:path*",
    "/profesional/:path*",
    "/admin/:path*",
    "/citas",
  ],
};
