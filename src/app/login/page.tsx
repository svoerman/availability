import { Suspense } from 'react';
import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  
  // Redirect to projects if already logged in
  if (session) {
    redirect("/projects");
  }

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>
        <Suspense 
          fallback={
            <div className="mt-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
                  <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
                </div>
                <div className="space-y-2">
                  <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
                  <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
                </div>
                <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
