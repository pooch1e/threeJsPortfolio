import { useForm } from "react-hook-form";
import { postSignup } from "../utils/postSignup";
export default function SignUpPage() {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => postSignup(data)

  return (
    // page
    <div className="grid grid-rows-1 gap-8 h-dvh items-center justify-center bg-[var(--color-bg)] font-karrik">
      {/* form */}
      <div className="flex flex-col w-96 px-8 py-10 justify-center items-center gap-8 border border-gray-600 shadow-card rounded-md text-cyan-300 ">
        <h1 className="justify-center">Sign Up Here</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col justify-center p-2">
            <label htmlFor="username">Username</label>
            <input type="text" className="rounded-sm p-1 text-black" {...register("username", {required: "A username is required", minLength: {value: 3, message: "Min 3 characters"}})} />
            {errors.username && (
  <span className="text-red-500 text-sm">{errors.username.message}</span>
)}
            <label htmlFor="email">Email</label>
            <input type="email" {...register("email")} className="rounded-sm text-black p-1" />
            <div className="flex flex-col mt-4">
              <label htmlFor="password">Password</label>
              <input type="password" {...register("password")} className="rounded-sm p-1 text-black" />
              <label htmlFor="password">Repeat Password</label>
              <input type="password" {...register("confirmPassword")}className="rounded-sm text-black p-1" />
              <div className="flex flex-col mt-2">
                <button className="border rounded-sm hover:bg-gray-100 hover:translate-5">
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
