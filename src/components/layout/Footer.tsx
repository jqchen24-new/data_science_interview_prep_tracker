import Link from "next/link";

export function Footer() {
  const contactEmail = process.env.CONTACT_EMAIL?.trim();

  return (
    <footer className="mt-auto border-t border-neutral-200 py-6 dark:border-neutral-800">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-sm text-neutral-500 dark:text-neutral-400">
        <Link
          href="/privacy"
          className="font-medium text-neutral-700 underline hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 rounded"
        >
          Privacy
        </Link>
        {contactEmail && (
          <>
            <span aria-hidden>·</span>
            <a
              href={`mailto:${contactEmail}`}
              className="font-medium text-neutral-700 underline hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 rounded"
            >
              Contact
            </a>
          </>
        )}
      </div>
      {!contactEmail && (
        <p className="mt-1 text-center text-sm text-neutral-500 dark:text-neutral-400">
          The Offer Lab
        </p>
      )}
    </footer>
  );
}
