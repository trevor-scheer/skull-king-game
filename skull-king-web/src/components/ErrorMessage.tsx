import { ApolloError } from "@apollo/client";
import "./ErrorMessage.scss";

interface ErrorMessageProps {
  error: ApolloError | Error;
  onRetry?: () => void;
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  const message = error instanceof ApolloError
    ? error.message
    : error.message || "An unexpected error occurred";

  return (
    <div className="ErrorMessage">
      <p className="ErrorMessage-text">{message}</p>
      {onRetry && (
        <button className="ErrorMessage-button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
