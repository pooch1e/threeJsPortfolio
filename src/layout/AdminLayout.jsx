/**
 * AdminLayout — wraps admin pages in the .admin-theme token scope
 * (src/styles/admin-theme.css), a dark, compact, utilitarian surface
 * deliberately distinct from the site's HomeStyle brand theme.
 */
import "../styles/admin-theme.css";

export default function AdminLayout({ children }) {
  return (
    <div className="admin-theme font-[family-name:var(--admin-font-family)] bg-[var(--admin-bg)] text-[var(--admin-text-primary)] min-h-screen w-full text-[length:var(--admin-font-size-base)]">
      {children}
    </div>
  );
}
