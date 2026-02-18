import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
      <p className="text-neutral-700 dark:text-neutral-300">Page not found.</p>
      <Link href="/dashboard">
        <Button>Go to dashboard</Button>
      </Link>
    </div>
  );
}
