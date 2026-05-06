import { Spinner } from "../components/ui";

export default function RouteLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-label="Loading">
      <Spinner size="lg" />
    </div>
  );
}
