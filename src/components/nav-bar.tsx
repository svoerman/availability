"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "./ui/button";

export function NavBar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b">
      <div className="container mx-auto h-16">
        <div className="flex h-full justify-between">
          <div className="flex">
            <Link href="/" className="flex items-center font-medium">
              Availability
            </Link>
            {session && (
              <div className="ml-10 flex items-center space-x-4">
                <Link
                  href="/projects"
                  className="text-gray-700 hover:text-gray-900"
                >
                  Projects
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center">
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {session.user?.name || session.user?.email}
                </span>
                <Button
                  variant="outline"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="space-x-4">
                <Link href="/login">
                  <Button variant="outline">Sign in</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
