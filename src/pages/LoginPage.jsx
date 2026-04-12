import { useForm } from "react-hook-form";

export default function Login() {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    console.log(data);
  };
  return (
    <div className="grid grid-rows-1 gap-8 h-dvh items-center justify-center bg-[var(--color-bg)] font-karrik">
      <div className="w-96 ">
        <h1>Login</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full">
        <label htmlFor="username">Username</label>
        <input
          type="text"
          {...register("username", {
            required: "A username is required",
            minLength: { value: 3, message: "Min 3 characters" },
          })}
        />
        {errors.username && (
          <span className="text-red-500 text-sm">
            {errors.username.message}
          </span>
        )}
        <label htmlFor="password">Password</label>
        <input
          type="password"
          {...register("password", { required: "A new password is required" })}
          className="rounded-sm p-1 text-black"
        />
        <button>Login</button>
      </form>
      <button>Signup</button>
      </div>
    </div>
  );
}
