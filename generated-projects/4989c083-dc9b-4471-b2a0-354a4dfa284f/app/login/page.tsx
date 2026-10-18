import Link from "next/link";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { mode?: string };
}) {
  const isForgotPassword = searchParams.mode === "forgot-password";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-6 py-24">
      <div className="w-full">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900">
          {isForgotPassword ? "Reset your password" : "Sign in to Orbit Health"}
        </h1>
        <p className="mt-2 text-sm text-navy-500">
          {isForgotPassword
            ? "Enter your email and we'll send you a reset link."
            : "Access your dashboard and health data."}
        </p>
        <form className="mt-8 space-y-6">
          {!isForgotPassword && (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-navy-700">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  required
                  className="mt-1 block w-full rounded-md border border-navy-300 px-4 py-2 text-sm shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-navy-700">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  className="mt-1 block w-full rounded-md border border-navy-300 px-4 py-2 text-sm shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-navy-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <label htmlFor="remember-me" className="ml-2 text-sm text-navy-600">
                    Remember me
                  </label>
                </div>
                <Link
                  href="/login?mode=forgot-password"
                  className="text-sm font-medium text-cyan-600 hover:text-cyan-500"
                >
                  Forgot password?
                </Link>
              </div>
            </>
          )}
          {isForgotPassword && (
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-navy-700">
                Email address
              </label>
              <input
                type="email"
                id="reset-email"
                name="email"
                autoComplete="email"
                required
                className="mt-1 block w-full rounded-md border border-navy-300 px-4 py-2 text-sm shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
              />
            </div>
          )}
          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-cyan-700"
            >
              {isForgotPassword ? "Send Reset Link" : "Sign In"}
            </button>
          </div>
        </form>
        {!isForgotPassword && (
          <p className="mt-6 text-center text-sm text-navy-500">
            Don&apos;t have an account?{" "}
            <span className="font-medium text-navy-700">Contact your administrator</span>
          </p>
        )}
        {isForgotPassword && (
          <p className="mt-6 text-center text-sm text-navy-500">
            <Link href="/login" className="font-medium text-cyan-600 hover:text-cyan-500">
              Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
