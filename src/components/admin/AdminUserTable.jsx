/**
 * AdminUserTable — lists users for the admin dashboard, linking each row
 * to its detail page and exposing a delete action.
 */
import { useNavigate } from "react-router-dom";

export default function AdminUserTable({ users, loading, onDelete }) {
  const navigate = useNavigate();

  if (!loading && users.length === 0) {
    return (
      <p className="text-[var(--admin-text-tertiary)] text-[var(--admin-font-size-sm)] py-[var(--admin-space-6)] text-center">
        No users found.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[var(--admin-radius-md)] border border-[var(--admin-border)]">
      <table
        aria-busy={loading}
        className={`w-full text-left text-[var(--admin-font-size-base)] transition-opacity ${loading ? "opacity-60" : ""}`}
      >
        <thead>
          <tr className="border-b border-[var(--admin-border)] text-[var(--admin-text-tertiary)] text-[var(--admin-font-size-xs)] font-medium">
            <th className="py-[var(--admin-space-2)] px-[var(--admin-space-4)]">ID</th>
            <th className="py-[var(--admin-space-2)] px-[var(--admin-space-4)]">Name</th>
            <th className="py-[var(--admin-space-2)] px-[var(--admin-space-4)]">Email</th>
            <th className="py-[var(--admin-space-2)] px-[var(--admin-space-4)]">Admin</th>
            <th className="py-[var(--admin-space-2)] px-[var(--admin-space-4)]">Created</th>
            <th className="py-[var(--admin-space-2)] px-[var(--admin-space-4)]"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-[var(--admin-border-subtle)] last:border-b-0 text-[var(--admin-text-primary)] hover:bg-[var(--admin-bg-hover)] cursor-pointer transition-colors"
              onClick={() => navigate(`/admin/users/${user.id}`)}
            >
              <td className="py-[var(--admin-space-2)] px-[var(--admin-space-4)] truncate max-w-[8rem] text-[var(--admin-text-tertiary)]">
                {user.id}
              </td>
              <td className="py-[var(--admin-space-2)] px-[var(--admin-space-4)] max-w-[12rem] truncate" title={user.name}>{user.name}</td>
              <td className="py-[var(--admin-space-2)] px-[var(--admin-space-4)] max-w-[16rem] truncate text-[var(--admin-text-secondary)]" title={user.email}>
                {user.email}
              </td>
              <td className="py-[var(--admin-space-2)] px-[var(--admin-space-4)]">
                {user.is_admin ? (
                  <span className="text-[var(--admin-success)]">Yes</span>
                ) : (
                  <span className="text-[var(--admin-text-tertiary)]">No</span>
                )}
              </td>
              <td className="py-[var(--admin-space-2)] px-[var(--admin-space-4)] text-[var(--admin-text-secondary)]">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : ""}
              </td>
              <td className="py-[var(--admin-space-2)] px-[var(--admin-space-4)] text-right">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(user);
                  }}
                  className="text-[var(--admin-danger)] hover:text-[var(--admin-danger-hover)] text-[var(--admin-font-size-xs)] font-medium"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
