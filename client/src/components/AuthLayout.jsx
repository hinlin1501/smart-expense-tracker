import { WalletCards } from "lucide-react";

function AuthLayout({ children }) {
  return (
    <main className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Cột trái: Brand Showcase */}
      <section className="flex flex-col justify-between bg-[#23382c] p-8 text-[#f4efe6] md:p-14 lg:p-20">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#f4efe6]/20 bg-[#f4efe6]/10 backdrop-blur-sm">
            <WalletCards className="h-5 w-5 text-[#f4efe6]" />
          </span>
          <b className="font-serif text-2xl font-bold tracking-tight">Sổ Mây</b>
        </div>

        {/* Hero Slogan */}
        <div className="my-auto py-12">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-[#f4efe6]/60">
            Personal Finance
          </p>
          <h1 className="font-serif text-5xl font-normal leading-[1.15] tracking-tight md:text-6xl lg:text-7xl">
            Own your <br />
            <i className="italic text-[#dfd6c6]">cash flow.</i>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-[#f4efe6]/75">
            Transparent, lightweight finance management.
          </p>
        </div>

        {/* Footer */}
        <small className="text-xs text-[#f4efe6]/50">
          © 2026 Sổ Mây. All rights reserved.
        </small>
      </section>

      {/* Cột phải: Form Content */}
      <section className="flex items-center justify-center bg-[#f8f6f0] p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </section>
    </main>
  );
}

export { AuthLayout };