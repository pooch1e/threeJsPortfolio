import { useForm } from "react-hook-form";
export default function SignUpPage() {
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  return (
    // page
    <div className="grid grid-rows-1 gap-8 h-dvh items-center justify-center bg-[var(--color-bg)] font-karrik">
      {/* form */}
      <div className="flex flex-col w-96 px-8 py-10 justify-center items-center gap-8 border border-gray-600 border-t-slate-200 rounded-md text-cyan-300">
        <h1 className="justify-center">Sign Up Here</h1>
        <form action="" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col justify-center p-2">
            <label htmlFor="username">Username</label>
            <input type="text" className="rounded-sm" {...register("username")} />
            <label htmlFor="email">Email</label>
            <input type="email" {...register("email")} className="rounded-sm" />
            <div className="flex flex-col mt-4">
              <label htmlFor="password">Password</label>
              <input type="password" {...register("password")} className="rounded-sm" />
              <label htmlFor="password">Repeat Password</label>
              <input type="password" {...register("password")}className="rounded-sm" />
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
