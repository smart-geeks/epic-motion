/** @type {import('next').NextConfig} */

// Content Security Policy
// Cada directiva controla qué tipo de recurso puede cargarse y desde dónde.
const CSP = [
  // Por defecto bloquear todo lo que no esté explícitamente permitido
  "default-src 'self'",

  // Scripts: solo del propio dominio.
  // 'unsafe-inline' es necesario para el runtime de Next.js (hydration).
  // 'unsafe-eval' es necesario para GSAP y ciertos polyfills en desarrollo.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",

  // Estilos: propio dominio + Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

  // Fuentes tipográficas: propio dominio + Google Fonts CDN
  "font-src 'self' https://fonts.gstatic.com",

  // Imágenes: propio dominio, data URIs (avatares base64), cualquier HTTPS
  // (necesario para Next/Image con fuentes externas como Unsplash)
  "img-src 'self' data: blob: https:",

  // Conexiones fetch/XHR/WebSocket: propio dominio + Supabase
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",

  // Iframes: solo el propio dominio + TikTok (sección GaleriaTikTok)
  "frame-src 'self' https://www.tiktok.com https://tiktok.com",

  // Media: solo propio dominio
  "media-src 'self'",

  // Formularios: solo envío al propio dominio
  "form-action 'self'",

  // Ningún dominio puede embeber esta app en un iframe (anti-clickjacking)
  "frame-ancestors 'self'",

  // Bloquear acceso a plugins (Flash, etc.) — ya obsoleto pero explícito
  "object-src 'none'",

  // Solo cargar la página por HTTPS (refuerza HSTS a nivel CSP)
  "upgrade-insecure-requests",
]
  .join("; ")
  .trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  async headers() {
    return [
      {
        // Aplica a todas las rutas de la aplicación
        source: "/(.*)",
        headers: [
          // ── HTTPS / Transporte ──────────────────────────────────────
          {
            // Fuerza HTTPS durante 2 años en dominio + subdominios.
            // "preload" permite incluir el dominio en la lista HSTS del navegador.
            // IMPORTANTE: solo activar en producción con HTTPS real.
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },

          // ── Framing / Clickjacking ──────────────────────────────────
          {
            // Impide que esta app sea embebida en un <iframe> de otro dominio.
            // Protege contra ataques de clickjacking (el atacante pone tu app
            // invisible sobre un botón para robar clicks).
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },

          // ── MIME Sniffing ───────────────────────────────────────────
          {
            // El navegador NO debe adivinar el tipo de archivo (MIME sniffing).
            // Sin esto, un archivo .jpg que contiene JS podría ejecutarse como script.
            key: "X-Content-Type-Options",
            value: "nosniff",
          },

          // ── Referrer ────────────────────────────────────────────────
          {
            // Al navegar entre páginas: envía origen + path.
            // Al salir del dominio (ej. link a TikTok): envía solo el origen.
            // Protege rutas internas (/admin/...) de aparecer en logs externos.
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },

          // ── Permisos de hardware / APIs del navegador ───────────────
          {
            // Deshabilita APIs del dispositivo que la app no necesita.
            // Impide que scripts de terceros accedan a cámara, micrófono, etc.
            key: "Permissions-Policy",
            value: [
              "camera=()",         // sin acceso a cámara
              "microphone=()",     // sin acceso a micrófono
              "geolocation=()",    // sin acceso a GPS
              "payment=()",        // sin Payment Request API
              "usb=()",            // sin acceso a USB
              "interest-cohort=()" // deshabilita FLoC de Google
            ].join(", "),
          },

          // ── DNS Prefetch ────────────────────────────────────────────
          {
            // Permite que el navegador resuelva dominios de recursos (Google Fonts,
            // Supabase) antes de que se necesiten → mejora el tiempo de carga.
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },

          // ── Content Security Policy ─────────────────────────────────
          {
            // La política más importante: define exactamente qué recursos
            // pueden cargarse y desde dónde. Ver comentario en la constante CSP.
            key: "Content-Security-Policy",
            value: CSP,
          },

          // ── Cross-Origin Políticas adicionales ─────────────────────
          {
            // Recursos de la app solo son accesibles desde el mismo origen.
            // Bloquea ataques Spectre que leen memoria entre tabs.
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
          {
            // El navegador no debe abrir documentos cross-origin en el mismo
            // proceso de renderizado (protección contra Spectre).
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
