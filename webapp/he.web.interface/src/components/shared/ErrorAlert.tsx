interface ErrorAlertProps {
  error: Error | unknown;
}

export function ErrorAlert({ error }: ErrorAlertProps) {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';

  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
