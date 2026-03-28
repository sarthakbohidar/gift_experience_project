import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-md-surface px-6 py-16 text-center">
      <p className="md-title-medium font-semibold text-md-primary">GiftMind</p>
      <h1 className="mt-4 text-2xl font-semibold leading-8 text-md-on-surface sm:text-[28px] sm:leading-9">
        This page doesn’t exist
      </h1>
      <p className="md-body-medium mx-auto mt-3 max-w-sm text-md-on-surface-variant">
        The link may be wrong or the page was moved. Head back home and start again.
      </p>
      <Link
        href="/"
        className="md-label-large mt-8 rounded-full bg-md-primary px-8 py-3 font-medium text-md-on-primary transition hover:brightness-110"
      >
        Back to home
      </Link>
    </main>
  );
}
