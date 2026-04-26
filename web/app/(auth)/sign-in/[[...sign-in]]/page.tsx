import { AuthFormFrame } from "@/components/auth/AuthFormFrame";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#0a0a0a_0%,#000000_72%)] px-4 py-10 text-[#fafafa] sm:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[440px] flex-col items-center justify-center gap-8">
        <div className="w-full text-center">
          <p className="mb-5 inline-flex items-center gap-3 text-[11px] font-normal uppercase leading-none tracking-[0.18em] text-[#6b6b6b]">
            <span className="font-serif text-[14px] italic normal-case tracking-normal text-[#fafafa]">
              i
            </span>
            <span className="h-px w-4 bg-white/[0.16]" aria-hidden="true" />
            <span>Welcome back</span>
          </p>
          <h1 className="font-serif text-5xl italic leading-none text-[#fafafa] sm:text-6xl">
            tuto.
          </h1>
        </div>

        <AuthFormFrame mode="sign-in" />
      </section>
    </main>
  );
}
