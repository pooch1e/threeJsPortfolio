/**
 * AdminUserDetailPage — view/edit a single user's profile and admin flag,
 * with password reset and account deletion.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import AdminLayout from "../../layout/AdminLayout";
import LoadingOverlay from "../../components/LoadingOverlay";
import ErrorMessage from "../../components/ErrorMessage";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import { getUser } from "../../utils/admin/getUser";
import { updateUser } from "../../utils/admin/updateUser";
import { deleteUser } from "../../utils/admin/deleteUser";
import { resetPassword } from "../../utils/admin/resetPassword";
import { userLoginStore } from "../../store/user";

const inputClass =
  "rounded-[var(--admin-radius-sm)] px-[var(--admin-space-3)] py-[var(--admin-space-2)] " +
  "bg-[var(--admin-bg-tertiary)] border border-[var(--admin-border)] " +
  "text-[var(--admin-text-primary)] text-[var(--admin-font-size-base)] " +
  "focus:outline-none focus:border-[var(--admin-accent)] focus:shadow-[var(--admin-focus-ring)] " +
  "transition-colors disabled:opacity-50";

const labelClass = "text-[var(--admin-font-size-sm)] font-medium text-[var(--admin-text-secondary)]";

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUserId = userLoginStore((s) => s.userId);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const editForm = useForm();
  const passwordForm = useForm();

  useEffect(() => {
    setLoading(true);
    getUser(id)
      .then((res) => {
        setUser(res);
        editForm.reset({ name: res.name, email: res.email, is_admin: res.is_admin });
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isSelf = user && currentUserId && user.id === currentUserId;

  const onSaveUser = async (data) => {
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const updated = await updateUser(id, {
        name: data.name,
        email: data.email,
        is_admin: isSelf ? user.is_admin : data.is_admin,
      });
      setUser(updated);
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err.message);
    }
  };

  const onResetPassword = async (data) => {
    setPasswordError(null);
    setPasswordSuccess(false);
    try {
      await resetPassword(id, data.password);
      setPasswordSuccess(true);
      passwordForm.reset();
    } catch (err) {
      setPasswordError(err.message);
    }
  };

  const handleDeleteConfirmed = async () => {
    setConfirmDelete(false);
    try {
      await deleteUser(id);
      navigate("/admin");
    } catch (err) {
      setSaveError(err.message);
    }
  };

  if (loading) return <LoadingOverlay />;

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto px-[var(--admin-space-6)] py-[var(--admin-space-8)] flex flex-col gap-[var(--admin-space-8)]">
        <Link
          to="/admin"
          className="text-[var(--admin-font-size-sm)] text-[var(--admin-accent)] hover:text-[var(--admin-accent-hover)] hover:underline w-fit"
        >
          ← Back to list
        </Link>

        <ErrorMessage error={loadError} type="api" />

        {user && (
          <>
            <h1 className="font-semibold text-[var(--admin-font-size-2xl)] text-[var(--admin-text-primary)]">
              Edit User
            </h1>

            <form onSubmit={editForm.handleSubmit(onSaveUser)} className="flex flex-col gap-[var(--admin-space-4)]">
              <div className="flex flex-col gap-[var(--admin-space-1)]">
                <label htmlFor="name" className={labelClass}>Name</label>
                <input
                  id="name"
                  type="text"
                  className={inputClass}
                  {...editForm.register("name", { required: "A name is required" })}
                />
                <ErrorMessage error={editForm.formState.errors.name?.message} type="validation" />
              </div>

              <div className="flex flex-col gap-[var(--admin-space-1)]">
                <label htmlFor="email" className={labelClass}>Email</label>
                <input
                  id="email"
                  type="email"
                  className={inputClass}
                  {...editForm.register("email", { required: "An email is required" })}
                />
                <ErrorMessage error={editForm.formState.errors.email?.message} type="validation" />
              </div>

              <label className="flex items-center gap-[var(--admin-space-2)] text-[var(--admin-font-size-base)] text-[var(--admin-text-primary)]">
                <input
                  type="checkbox"
                  disabled={isSelf}
                  {...editForm.register("is_admin")}
                />
                Admin
                {isSelf && (
                  <span className="text-[var(--admin-font-size-xs)] text-[var(--admin-text-tertiary)]">
                    (cannot change your own admin status)
                  </span>
                )}
              </label>

              <button
                type="submit"
                className="mt-[var(--admin-space-2)] bg-[var(--admin-accent)] text-white rounded-[var(--admin-radius-sm)] py-[var(--admin-space-2)] font-medium hover:bg-[var(--admin-accent-hover)] transition-colors"
              >
                Save
              </button>
              <ErrorMessage error={saveError} type="api" />
              {saveSuccess && (
                <p className="text-[var(--admin-success)] text-[var(--admin-font-size-sm)] text-center">Saved.</p>
              )}
            </form>

            <div className="border-t border-[var(--admin-border)] pt-[var(--admin-space-6)] flex flex-col gap-[var(--admin-space-4)]">
              <h2 className="font-semibold text-[var(--admin-font-size-lg)] text-[var(--admin-text-primary)]">
                Reset Password
              </h2>
              <form
                onSubmit={passwordForm.handleSubmit(onResetPassword)}
                className="flex flex-col gap-[var(--admin-space-4)]"
              >
                <div className="flex flex-col gap-[var(--admin-space-1)]">
                  <label htmlFor="password" className={labelClass}>New password</label>
                  <input
                    id="password"
                    type="password"
                    className={inputClass}
                    {...passwordForm.register("password", {
                      required: "A new password is required",
                      validate: {
                        length: (v) => v.length >= 8 || "Min 8 characters",
                        lower: (v) => /[a-z]/.test(v) || "Needs a lowercase letter",
                        upper: (v) => /[A-Z]/.test(v) || "Needs an uppercase letter",
                        digit: (v) => /\d/.test(v) || "Needs a digit",
                        special: (v) => /[@$!%*?&]/.test(v) || "Needs a special character (@$!%*?&)",
                      },
                    })}
                  />
                  <ErrorMessage error={passwordForm.formState.errors.password?.message} type="validation" />
                </div>

                <div className="flex flex-col gap-[var(--admin-space-1)]">
                  <label htmlFor="confirmPassword" className={labelClass}>Repeat password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className={inputClass}
                    {...passwordForm.register("confirmPassword", {
                      validate: (val) =>
                        passwordForm.watch("password") === val || "Your passwords do not match",
                    })}
                  />
                  <ErrorMessage error={passwordForm.formState.errors.confirmPassword?.message} type="user" />
                </div>

                <button
                  type="submit"
                  className="border border-[var(--admin-accent)] text-[var(--admin-accent)] rounded-[var(--admin-radius-sm)] py-[var(--admin-space-2)] font-medium hover:bg-[var(--admin-accent)] hover:text-white transition-colors"
                >
                  Reset password
                </button>
                <ErrorMessage error={passwordError} type="api" />
                {passwordSuccess && (
                  <p className="text-[var(--admin-success)] text-[var(--admin-font-size-sm)] text-center">Password updated.</p>
                )}
              </form>
            </div>

            <div className="border-t border-[var(--admin-border)] pt-[var(--admin-space-6)]">
              <button
                type="button"
                disabled={isSelf}
                onClick={() => setConfirmDelete(true)}
                className="w-full border border-[var(--admin-danger)] text-[var(--admin-danger)] rounded-[var(--admin-radius-sm)] py-[var(--admin-space-2)] font-medium hover:bg-[var(--admin-danger)] hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--admin-danger)]"
              >
                Delete user
              </button>
              {isSelf && (
                <p className="text-[var(--admin-font-size-xs)] text-[var(--admin-text-tertiary)] text-center mt-[var(--admin-space-2)]">
                  You cannot delete your own account.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete user"
        message={user ? `Delete ${user.name}? This cannot be undone.` : ""}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDelete(false)}
      />
    </AdminLayout>
  );
}
