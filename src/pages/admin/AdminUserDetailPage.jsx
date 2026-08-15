/**
 * AdminUserDetailPage — view/edit a single user's profile and admin flag,
 * with password reset and account deletion.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import HomeStyle from "../../layout/HomeStyle";
import LoadingOverlay from "../../components/LoadingOverlay";
import ErrorMessage from "../../components/ErrorMessage";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import { getUser } from "../../utils/admin/getUser";
import { updateUser } from "../../utils/admin/updateUser";
import { deleteUser } from "../../utils/admin/deleteUser";
import { resetPassword } from "../../utils/admin/resetPassword";
import { userLoginStore } from "../../store/user";

const inputClass =
  "rounded-md px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-bg-light)] " +
  "text-[var(--text-color-dark)] font-karrik focus:outline-none focus:ring-2 " +
  "focus:ring-[var(--object-alt)] focus:border-transparent transition-colors ease-linear disabled:opacity-50";

const labelClass =
  "font-offbit text-100 uppercase tracking-widest text-[var(--object-alt)]";

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUsername = userLoginStore((s) => s.username);

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

  const isSelf = user && currentUsername && user.name === currentUsername;

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
    <HomeStyle>
      <div className="max-w-xl mx-auto px-4 py-10 flex flex-col gap-8">
        <Link
          to="/admin"
          className="font-karrik text-sm text-[var(--object-alt)] hover:underline w-fit"
        >
          ← Back to list
        </Link>

        <ErrorMessage error={loadError} type="api" />

        {user && (
          <>
            <h1 className="font-dirtyline text-3xl uppercase tracking-widest text-[var(--text-primary)]">
              Edit User
            </h1>

            <form onSubmit={editForm.handleSubmit(onSaveUser)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="name" className={labelClass}>Name</label>
                <input
                  id="name"
                  type="text"
                  className={inputClass}
                  {...editForm.register("name", { required: "A name is required" })}
                />
                <ErrorMessage error={editForm.formState.errors.name?.message} type="validation" />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="email" className={labelClass}>Email</label>
                <input
                  id="email"
                  type="email"
                  className={inputClass}
                  {...editForm.register("email", { required: "An email is required" })}
                />
                <ErrorMessage error={editForm.formState.errors.email?.message} type="validation" />
              </div>

              <label className="flex items-center gap-2 font-karrik text-[var(--text-color-dark)]">
                <input
                  type="checkbox"
                  disabled={isSelf}
                  {...editForm.register("is_admin")}
                />
                Admin
                {isSelf && (
                  <span className="text-xs text-gray-500">(cannot change your own admin status)</span>
                )}
              </label>

              <button
                type="submit"
                className="mt-2 bg-[var(--text-primary)] text-white rounded-md py-2 font-offbit uppercase tracking-widest hover:bg-[var(--text-secondary)] transition-colors ease-linear"
              >
                Save
              </button>
              <ErrorMessage error={saveError} type="api" />
              {saveSuccess && (
                <p className="text-green-400 text-sm text-center">Saved.</p>
              )}
            </form>

            <div className="border-t border-[var(--color-bg-light)] pt-6 flex flex-col gap-4">
              <h2 className="font-dirtyline text-xl uppercase tracking-widest text-[var(--text-primary)]">
                Reset Password
              </h2>
              <form
                onSubmit={passwordForm.handleSubmit(onResetPassword)}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1">
                  <label htmlFor="password" className={labelClass}>New Password</label>
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

                <div className="flex flex-col gap-1">
                  <label htmlFor="confirmPassword" className={labelClass}>Repeat Password</label>
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
                  className="border border-[var(--object-alt)] text-[var(--object-alt)] rounded-md py-2 font-offbit uppercase tracking-widest hover:text-[var(--text-alt)] hover:border-[var(--text-alt)] transition-colors ease-linear"
                >
                  Reset Password
                </button>
                <ErrorMessage error={passwordError} type="api" />
                {passwordSuccess && (
                  <p className="text-green-400 text-sm text-center">Password updated.</p>
                )}
              </form>
            </div>

            <div className="border-t border-[var(--color-bg-light)] pt-6">
              <button
                type="button"
                disabled={isSelf}
                onClick={() => setConfirmDelete(true)}
                className="w-full border border-red-600 text-red-500 rounded-md py-2 font-offbit uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors ease-linear disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-red-500"
              >
                Delete User
              </button>
              {isSelf && (
                <p className="text-xs text-gray-500 text-center mt-2">
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
    </HomeStyle>
  );
}
