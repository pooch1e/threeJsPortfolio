import { useForm } from "react-hook-form";
import { postLogin } from "../utils/postLogin";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userLoginStore } from "../store/user";

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
  const setSessionToken = userLoginStore((state) => state.setSessionToken);

  const onSubmit = async (e) => {
    setServerError(null);
    setPending(true);
    setUserName("");
    setSessionToken("");
    setShowSuccess(false);
    try {
      const res = await postLogin(e);
      let data = await res.json();
      const { token, username } = data;
      if (res.ok) {
        setUserName(username || "");
        setSessionToken(token || "");
        setShowSuccess(true);
        setPending(false);
        setTimeout(() => {
          navigate("/homepage");
        }, 1200);
        return;
      } else {
        throw new Error(data?.error || "Error logging in");
      }
    } catch (err) {
      setServerError(err.message);
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] font-karrik">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-card p-8 flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-center mb-2">Login</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="font-medium">
              Username
            </label>
            <input
              type="text"
              className="rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              {...register("username", {
                required: "A username is required",
                minLength: { value: 3, message: "Min 3 characters" },
              })}
            />
            {errors.username && (
              <span className="text-red-400 text-xs mt-1">
                {errors.username.message}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="font-medium">
              Password
            </label>
            <input
              type="password"
              {...register("password", { required: "A password is required" })}
              className="rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 text-black"
            />
            {errors.password && (
              <span className="text-red-400 text-xs mt-1">
                {errors.password.message}
              </span>
            )}
          </div>
          <button
            type="submit"
            className="mt-2 bg-cyan-600 text-white rounded-md py-2 font-semibold hover:bg-cyan-700 transition-colors"
          >
            Login
          </button>
          {pending && <span>Loading...</span>}
          {showSuccess && (
            <span className="flex justify-center mt-2 animate-bounce">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="feather feather-check-circle"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#22c55e"
                  strokeWidth="2.5"
                  fill="#bbf7d0"
                />
                <path d="M9 12l2 2l4-4" />
              </svg>
            </span>
          )}
          {serverError && (
            <span className="text-red-500 text-sm mt-2 text-center">
              {serverError}
            </span>
          )}
        </form>
        <div className="flex flex-col items-center mt-2">
          <button
            type="button"
            className="w-full border border-cyan-600 text-cyan-700 rounded-md py-2 font-semibold hover:bg-cyan-50 transition-colors"
            onClick={() => navigate("/signup")}
          >
            Signup
          </button>
        </div>
      </div>
    </div>
  );
}
