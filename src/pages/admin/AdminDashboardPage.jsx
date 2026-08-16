/**
 * AdminDashboardPage — paginated, filterable admin view of all users,
 * with inline deletion.
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layout/AdminLayout";
import LoadingOverlay from "../../components/LoadingOverlay";
import ErrorMessage from "../../components/ErrorMessage";
import AdminUserTable from "../../components/admin/AdminUserTable";
import AdminPagination from "../../components/admin/AdminPagination";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import { ArrowLeft } from "../../components/icons";
import { listUsers } from "../../utils/admin/listUsers";
import { deleteUser } from "../../utils/admin/deleteUser";

const LIMIT = 20;

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1 });
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    setError(null);
    listUsers(page, LIMIT)
      .then((res) => {
        setUsers(res.users || []);
        setPagination(res.pagination || { page, total_pages: 1 });
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        setLoading(false);
        setIsFirstLoad(false);
      });
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteConfirmed = async () => {
    const user = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteUser(user.id);
      const wasLastUserOnPageBeyondFirst = users.length === 1 && page > 1;
      if (wasLastUserOnPageBeyondFirst) {
        setPage((p) => p - 1);
      } else {
        fetchUsers();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredUsers = filter
    ? users.filter(
        (u) =>
          u.name?.toLowerCase().includes(filter.toLowerCase()) ||
          u.email?.toLowerCase().includes(filter.toLowerCase())
      )
    : users;

  return (
    <AdminLayout>
      {isFirstLoad && loading && <LoadingOverlay />}
      <div className="max-w-5xl mx-auto px-[var(--admin-space-6)] py-[var(--admin-space-8)] flex flex-col gap-[var(--admin-space-6)]">
        <div className="flex items-center justify-between gap-[var(--admin-space-4)]">
          <h1 className="font-semibold text-[var(--admin-font-size-2xl)] text-[var(--admin-text-primary)]">
            Users
          </h1>
          <button
            type="button"
            onClick={() => navigate("/homepage")}
            className="flex items-center gap-[var(--admin-space-2)] px-[var(--admin-space-3)] py-[var(--admin-space-2)] rounded-[var(--admin-radius-sm)] text-[var(--admin-font-size-sm)] font-medium text-[var(--admin-text-secondary)] border border-[var(--admin-border)] hover:bg-[var(--admin-bg-hover)] hover:text-[var(--admin-text-primary)] transition-colors"
          >
            <ArrowLeft size={16} />
            Homepage
          </button>
        </div>

        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter this page…"
          className="rounded-[var(--admin-radius-sm)] px-[var(--admin-space-3)] py-[var(--admin-space-2)] bg-[var(--admin-bg-tertiary)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-[var(--admin-font-size-base)] placeholder:text-[var(--admin-text-tertiary)] focus:outline-none focus:border-[var(--admin-accent)] focus:shadow-[var(--admin-focus-ring)] transition-colors max-w-sm"
        />

        <ErrorMessage error={error} type="api" />

        <AdminUserTable users={filteredUsers} loading={loading} onDelete={setPendingDelete} />

        <AdminPagination pagination={pagination} onPageChange={setPage} />
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete user"
        message={pendingDelete ? `Delete ${pendingDelete.name}? This cannot be undone.` : ""}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}
