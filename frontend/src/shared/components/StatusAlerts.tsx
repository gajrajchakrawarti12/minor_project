import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

type StatusAlertsProps = {
  error: string | null;
  successMessage: string | null;
};

export function StatusAlerts({ error, successMessage }: StatusAlertsProps) {
  return (
    <>
      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {successMessage ? (
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-900">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}

export default StatusAlerts;
