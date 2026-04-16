import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// CORS — orígenes autorizados para llamar a la API
// ─────────────────────────────────────────────
const ALLOWED_ORIGINS = new Set([
  "https://epicmotion.com",
  "https://www.epicmotion.com",
  "https://epicmotion.mx",
  "https://www.epicmotion.mx",
  // Desarrollo local
  "http://localhost:3000",
]);

// Headers que se inyectan en TODAS las respuestas de API (incluidas las CORS)
const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  // Cookies de sesión (NextAuth) deben viajar en requests cross-origin
  "Access-Control-Allow-Credentials": "true",
};

// ─────────────────────────────────────────────
// RBAC — rutas y roles autorizados
// ─────────────────────────────────────────────
const DASHBOARD_POR_ROL: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  MAESTRO: "/maestro/agenda",
  PADRE: "/padre/home",
  RECEPCIONISTA: "/admin/dashboard",
};

const RUTAS_PROTEGIDAS: { prefijo: string; roles: string[] }[] = [
  { prefijo: "/admin",   roles: ["ADMIN"] },
  { prefijo: "/maestro", roles: ["MAESTRO"] },
  { prefijo: "/padre",   roles: ["PADRE"] },
];

// ─────────────────────────────────────────────
// Middleware principal
// ─────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get("origin") ?? "";
  const esRutaApi = pathname.startsWith("/api/");

  // ── CORS: solo aplica a rutas /api/* ─────────────────────────────────────
  if (esRutaApi) {
    const origenPermitido = ALLOWED_ORIGINS.has(origin);

    // Preflight OPTIONS: el navegador pregunta si puede hacer la petición real.
    // Hay que responder inmediatamente con los headers correctos y status 204.
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          // Si el origen no está permitido, devolver vacío en Allow-Origin
          // para que el navegador bloquee la petición real.
          "Access-Control-Allow-Origin": origenPermitido ? origin : "",
          ...CORS_HEADERS,
          // El navegador cachea la respuesta preflight 1 hora
          "Access-Control-Max-Age": "3600",
        },
      });
    }

    // Para rutas /api/auth/* (NextAuth) siempre dejar pasar sin bloquear —
    // NextAuth maneja sus propios redirects y no hace fetch cross-origin real.
    if (!pathname.startsWith("/api/auth") && origin && !origenPermitido) {
      return new NextResponse(
        JSON.stringify({ error: "Origen no autorizado" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // ── Rutas públicas ────────────────────────────────────────────────────────
  if (pathname === "/" || pathname.startsWith("/login")) {
    const res = NextResponse.next();
    if (esRutaApi && ALLOWED_ORIGINS.has(origin)) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
    }
    return res;
  }

  // Rutas de NextAuth — no interferir
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // ── Autenticación ─────────────────────────────────────────────────────────
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    // Llamada a API sin sesión → 401 (no redirigir, el cliente maneja el error)
    if (esRutaApi) {
      return new NextResponse(
        JSON.stringify({ error: "No autenticado" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    // Página sin sesión → redirigir a login
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // ── RBAC ──────────────────────────────────────────────────────────────────
  const rol = token.rol as string;
  const rutaProtegida = RUTAS_PROTEGIDAS.find((r) =>
    pathname.startsWith(r.prefijo)
  );

  if (rutaProtegida && !rutaProtegida.roles.includes(rol)) {
    if (esRutaApi) {
      return new NextResponse(
        JSON.stringify({ error: "Sin permiso para este recurso" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = DASHBOARD_POR_ROL[rol] ?? "/login";
    return NextResponse.redirect(url);
  }

  // ── Respuesta normal: inyectar header CORS si aplica ─────────────────────
  const res = NextResponse.next();
  if (esRutaApi && ALLOWED_ORIGINS.has(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
  }
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon|images|fonts|logo|og-image).*)",
  ],
};
