import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const secret = process.env.NEXTAUTH_SECRET

// Add paths that require authentication
const protectedPaths = [
  '/projects',
  '/organizations',
  '/api/projects',
  '/api/organizations',
  '/api/availability',
]

// Add paths that should redirect to dashboard if already logged in
const authPaths = ['/login', '/register']

export async function middleware(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: secret 
    })
    
    const isLoggedIn = !!token
    const path = request.nextUrl.pathname
    
    // Check if the current path requires authentication
    const isProtectedPath = protectedPaths.some(protectedPath => 
      path.startsWith(protectedPath)
    )
    
    // Check if the current path is an auth path (login/register)
    const isAuthPath = authPaths.some(authPath => 
      path === authPath
    )

    if (isProtectedPath) {
      if (!isLoggedIn) {
        // Redirect to login if not authenticated
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('callbackUrl', path)
        return NextResponse.redirect(redirectUrl)
      }
      
      // Verify the token has required fields
      if (!token?.sub || !token?.email) {
        // Invalid session, clear it and redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('next-auth.session-token')
        response.cookies.delete('next-auth.callback-url')
        response.cookies.delete('next-auth.csrf-token')
        return response
      }
      
      return NextResponse.next()
    } 
    
    if (isAuthPath && isLoggedIn) {
      // Redirect to projects if already logged in
      return NextResponse.redirect(new URL('/projects', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    // If there's any error processing the token, clear the session and redirect to login
    console.error('Middleware error:', error)
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('next-auth.session-token')
    response.cookies.delete('next-auth.callback-url')
    response.cookies.delete('next-auth.csrf-token')
    return response
  }
}

export const config = {
  matcher: [
    '/projects/:path*',
    '/organizations/:path*',
    '/api/projects/:path*',
    '/api/organizations/:path*',
    '/api/availability/:path*',
    '/login',
    '/register'
  ]
}
