import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">
        Sign in to your account
      </h2>
      <div className="mt-8">
        <button
          type="button"
          className="flex w-full justify-center rounded-md bg-white px-3 py-1.5 text-sm font-semibold leading-6 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Sign in with Google
        </button>
      </div>
      <p className="mt-10 text-center text-sm text-gray-500">
        Return to{' '}
        <Link href="/" className="font-semibold leading-6 text-blue-600 hover:text-blue-500">
          Home
        </Link>
      </p>
    </div>
  );
}
