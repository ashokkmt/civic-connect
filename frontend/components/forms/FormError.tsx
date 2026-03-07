type FormErrorProps = {
  message?: string | null;
};

export function FormError({ message }: FormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
      {message}
    </div>
  );
}
