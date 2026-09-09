import { Link } from "react-router-dom";

import { Button } from "@/components/ui";

export function NotFoundPage() {
  return (
    <div className="grid place-items-center py-24 text-center">
      <div>
        <p className="text-5xl font-semibold text-fg">404</p>
        <p className="mt-2 text-sm text-muted">This page does not exist.</p>
        <Link to="/" className="mt-4 inline-block">
          <Button variant="secondary">Back to overview</Button>
        </Link>
      </div>
    </div>
  );
}
