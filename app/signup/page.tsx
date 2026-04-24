import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <a href="/" className="font-[family-name:var(--font-display)] text-2xl text-neutral-900">Remi</a>
        </div>
      </nav>
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-neutral-900 mb-2">
            Get started
          </h1>
          <p className="text-neutral-500 mb-8">
            Create your restaurant's website in under 2 minutes.
          </p>
          <SignupForm />
        </div>
      </main>
    </div>
  );
}
