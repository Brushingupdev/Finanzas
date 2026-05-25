import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicRoutes = ["/", "/login", "/register"]
const publicApiRoutes = ["/api/auth", "/api/health"]
const publicAssetRoutes = ["/manifest.json", "/sw.js", "/favicon.ico", "/icon.svg"]
const publicFilePattern = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml|js|css|map)$/i

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicPage = publicRoutes.includes(pathname)
  const isPublicApi = publicApiRoutes.some((route) => pathname === route || pathname.startsWith("/api/auth"))
  const isPublicAsset = publicAssetRoutes.includes(pathname) || publicFilePattern.test(pathname)
  const isApiRoute = pathname.startsWith("/api/")

  if (pathname.startsWith("/_next/") || isPublicPage || isPublicApi || isPublicAsset) {
    return NextResponse.next()
  }

  // Simple token check - the session cookie is set by next-auth
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value

  if (!sessionToken) {
    if (isApiRoute) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (sessionToken && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
}
