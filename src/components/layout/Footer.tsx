export function Footer() {
  const contactEmail = process.env.CONTACT_EMAIL?.trim();

  return (
    <footer className="mt-auto border-t border-neutral-200 py-6 dark:border-neutral-800">
      <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        {contactEmail ? (
          <>
            Feedback or questions?{" "}
            <a
              href={`mailto:${contactEmail}`}
              className="font-medium text-neutral-700 underline hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 rounded"
            >
              Email us
            </a>
          </>
        ) : (
          "The Offer Lab"
        )}
      </p>
    </footer>
  );
}
