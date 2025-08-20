"use client";

export function Header() {
  return (
    <header className="sticky top-0 z-20 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        {/* Logo */}
        <div className="text-base font-semibold">CollabBoard</div>
      </div>
    </header>
  );
}
