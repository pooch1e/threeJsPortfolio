import { useForm } from "react-hook-form";
import { postLogin } from "../utils/postLogin";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userLoginStore } from "../store/user";
import ErrorMessage from "../components/ErrorMessage";
import LoadingOverlay from "../components/LoadingOverlay";
import HomeStyle from "../layout/HomeStyle";

const inputClass =
  "rounded-md px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-bg-light)] " +
  "text-[var(--text-color-dark)] font-karrik focus:outline-none focus:ring-2 " +
  "focus:ring-[var(--object-alt)] focus:border-transparent transition-colors ease-linear";

const labelClass =
  "font-offbit text-100 uppercase tracking-widest text-[var(--object-alt)]";

export default function Login() {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const [serverError, setServerError] = useState(null);
  const [pending, setPending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const setUserName = userLoginStore((state) => state.setUsername);

  const handleGuestLogin = async () => {
    setServerError(null);
    setPending(true);
    setShowSuccess(false);
    try {
      const data = await postLogin({ username: "guest", password: "Guest1234!" });
      const username = data.name || data.username;
      setUserName(username || "");
      setShowSuccess(true);
      setPending(false);
      setTimeout(() => {
        navigate("/homepage");
      }, 1200);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setPending(false);
    }
  };

  const onSubmit = async (e) => {
    setServerError(null);
    setPending(true);
    setShowSuccess(false);
    try {
      const data = await postLogin(e);
      // The backend returns user info with 'name' (from your repo code)
      const username = data.name || data.username;

      setUserName(username || ""); // This also sets isAuthenticated: true
      setShowSuccess(true);
      setPending(false);
      setTimeout(() => {
        navigate("/homepage");
      }, 1200);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setPending(false);
    }
  };
  return (
    <HomeStyle>
      <div className="min-h-svh flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md flex flex-col gap-8">
          <h1 className="font-dirtyline text-4xl uppercase tracking-widest text-[var(--text-primary)] text-center">
            Login
          </h1>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="username" className={labelClass}>
                Username
              </label>
              <input
                id="username"
                type="text"
                className={inputClass}
                {...register("username", {
                  required: "A username is required",
                  minLength: { value: 3, message: "Min 3 characters" },
                })}
              />
              <ErrorMessage error={errors.username?.message} type="validation" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register("password", { required: "A password is required" })}
                className={inputClass}
              />
              <ErrorMessage error={errors.password?.message} type="validation" />
            </div>
            <button
              type="submit"
              className="mt-2 bg-[var(--text-primary)] text-white rounded-md py-2 font-offbit uppercase tracking-widest hover:bg-[var(--text-secondary)] transition-colors ease-linear"
            >
              Login
            </button>
            {pending && <LoadingOverlay message="Signing in..." />}
            {showSuccess && (
              <span className="flex justify-center mt-2 animate-bounce">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--object-alt)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="feather feather-check-circle"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="var(--object-alt)"
                    strokeWidth="2.5"
                    fill="var(--color-bg-light)"
                  />
                  <path d="M9 12l2 2l4-4" />
                </svg>
              </span>
            )}
            <ErrorMessage error={serverError} type="api" />
          </form>
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              className="w-full border border-[var(--object-alt)] text-[var(--object-alt)] rounded-md py-2 font-offbit uppercase tracking-widest hover:text-[var(--text-alt)] hover:border-[var(--text-alt)] transition-colors ease-linear"
              onClick={() => navigate("/signup")}
            >
              Signup
            </button>
            <div className="w-full flex items-center gap-2 font-karrik text-[var(--color-bg-light)] text-xs">
              <span className="flex-1 border-t border-[var(--color-bg-light)]" />
              <span>or</span>
              <span className="flex-1 border-t border-[var(--color-bg-light)]" />
            </div>
            <button
              type="button"
              className="w-full border border-[var(--color-bg-light)] text-[var(--text-color-dark)] rounded-md py-2 font-offbit uppercase tracking-widest hover:border-[var(--object-alt)] hover:text-[var(--object-alt)] transition-colors ease-linear"
              onClick={handleGuestLogin}
              disabled={pending}
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </HomeStyle>
  );
}
