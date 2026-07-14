import { useState } from "react";
import { useForm } from "react-hook-form";
import { postSignup } from "../utils/postSignup";
import { useNavigate } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import HomeStyle from "../layout/HomeStyle";

const inputClass =
  "rounded-md px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-bg-light)] " +
  "text-[var(--text-color-dark)] font-karrik focus:outline-none focus:ring-2 " +
  "focus:ring-[var(--object-alt)] focus:border-transparent transition-colors ease-linear";

const labelClass =
  "font-offbit text-100 uppercase tracking-widest text-[var(--object-alt)]";

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
    <HomeStyle>
      <div className="min-h-svh flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md flex flex-col gap-8">
          <h1 className="font-dirtyline text-4xl uppercase tracking-widest text-[var(--text-primary)] text-center">
            Sign Up
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
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                type="email"
                className={inputClass}
                {...register("email", {
                  required: "An email address is required",
                })}
              />
              <ErrorMessage error={errors.email?.message} type="validation" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <input
                id="password"
                type="password"
                className={inputClass}
                {...register("password", {
                  required: "A new password is required",
                })}
              />
              <ErrorMessage error={errors.password?.message} type="validation" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="confirmPassword" className={labelClass}>
                Repeat Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={inputClass}
                {...register("confirmPassword", {
                  validate: (val) => {
                    if (watch("password") !== val) {
                      return "Your passwords do not match";
                    }
                  },
                })}
              />
              <ErrorMessage error={errors.confirmPassword?.message} type="user" />
            </div>
            <button
              type="submit"
              className="mt-2 bg-[var(--text-primary)] text-white rounded-md py-2 font-offbit uppercase tracking-widest hover:bg-[var(--text-secondary)] transition-colors ease-linear"
            >
              Sign Up
            </button>
            <ErrorMessage error={serverError} type="api" />
          </form>
          <div className="flex flex-col items-center gap-3">
            <span className="font-karrik text-[var(--text-color-dark)] text-sm">
              Already signed up?
            </span>
            <button
              type="button"
              className="w-full border border-[var(--object-alt)] text-[var(--object-alt)] rounded-md py-2 font-offbit uppercase tracking-widest hover:text-[var(--text-alt)] hover:border-[var(--text-alt)] transition-colors ease-linear"
              onClick={() => navigate("/")}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </HomeStyle>
  );
}
