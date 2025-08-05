import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Note: Authentication is handled client-side through the AuthContext and ProtectedRoute component
  // This middleware only handles server-side routing
  
  // For server-side protection, we would check for authentication tokens here
  // But since we're using client-side auth, we just pass through all requests
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
