import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const secret = process.env.NEXTAUTH_SECRET

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: secret 
  })
  
  const isLoggedIn = !!token
  const isOnDashboard = request.nextUrl.pathname.startsWith('/projects')

  if (isOnDashboard) {
    if (isLoggedIn) return NextResponse.next()
    return NextResponse.redirect(new URL('/login', request.url))
  } else if (isLoggedIn && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/projects', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/projects/:path*', '/login']
}
