/**
 * Reusable error message component.
 *
 * @param {Object} props
 * @param {string|null|undefined} props.error - The error message to display. Renders nothing if falsy.
 * @param {"validation"|"user"|"api"} [props.type="user"] - Controls visual weight.
 *   - "validation" — field-level, small and subtle; sits below an input
 *   - "user"       — form-level notice for user-driven mistakes (e.g. passwords don't match)
 *   - "api"        — server-returned error; most prominent, centered
 * @param {string} [props.className] - Optional extra Tailwind classes.
 */
export default function ErrorMessage({ error, type = "user", className = "" }) {
  if (!error) return null;

  const styles = {
    validation: "text-red-400 text-xs mt-1",
    user: "text-red-500 text-sm mt-1",
    api: "text-red-500 text-sm mt-2 text-center",
  };

  return (
    <span role="alert" className={`${styles[type] ?? styles.user} ${className}`.trim()}>
      {error}
    </span>
  );
}
