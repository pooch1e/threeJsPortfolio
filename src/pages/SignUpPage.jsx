import { useState } from "react";
import { useForm } from "react-hook-form";
import { postSignup } from "../utils/postSignup";
import { useNavigate } from "react-router-dom";
export default function SignUpPage() {
  const {
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = useForm();

  const [serverError, setServerError] = useState(null);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await postSignup(data);
      navigate("/");
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] font-karrik">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-card p-8 flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-center mb-2 text-cyan-700">
          Sign Up Here
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="font-medium">
              Username
            </label>
            <input
              type="text"
              className="rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 text-black"
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
            <label htmlFor="email" className="font-medium">
              Email
            </label>
            <input
              type="email"
              className="rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 text-black"
              {...register("email", {
                required: "An email address is required",
              })}
            />
            {errors.email && (
              <span className="text-red-400 text-xs mt-1">
                {errors.email.message}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="font-medium">
              Password
            </label>
            <input
              type="password"
              className="rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 text-black"
              {...register("password", {
                required: "A new password is required",
              })}
            />
            {errors.password && (
              <span className="text-red-400 text-xs mt-1">
                {errors.password.message}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="confirmPassword" className="font-medium">
              Repeat Password
            </label>
            <input
              type="password"
              className="rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 text-black"
              {...register("confirmPassword", {
                validate: (val) => {
                  if (watch("password") !== val) {
                    return "Your passwords do not match";
                  }
                },
              })}
            />
            {errors.confirmPassword && (
              <span className="text-red-400 text-xs mt-1">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>
          <button
            type="submit"
            className="mt-2 bg-cyan-600 text-white rounded-md py-2 font-semibold hover:bg-cyan-700 transition-colors"
          >
            Sign Up
          </button>
          <div className="flex flex-col gap-2 mt-2">
          <span className="flex justify-center">
            <h2>Already signed up? Login here...</h2>
          </span>
          <button
            type="button"
            className="w-full border border-cyan-600 text-cyan-700 rounded-md py-2 font-semibold hover:bg-cyan-50 transition-colors"
            onClick={() => navigate("/")}
          >
            Login
          </button>
          </div>
          {serverError && (
            <span className="text-red-500 text-sm mt-2 text-center">
              {serverError}
            </span>
          )}
        </form>
      </div>
    </div>
  );
}
