import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <p className="text-destructive font-medium">{message}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
