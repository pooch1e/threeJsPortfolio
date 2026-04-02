import { useForm } from "react-hook-form";
export default function SignUpPage() {
  const {
    control,
    formState: { errors },
  } = useForm();

  return (
    // page
    <div className="grid grid-rows-1 gap-8 h-dvh items-center justify-center bg-[var(--color-bg)] font-karrik">
      {/* form */}
      <div className="flex flex-col w-96 px-8 py-10 justify-center items-center gap-8 border rounded-md">
        <h1>Sign Up Here</h1>
        <form action="">
          <div className="flex flex-col justify-center p-2 gap-2">
            <label htmlFor="">Username</label>
            <input type="text" className="rounded-sm" />
            <label htmlFor="">Email</label>
            <input type="text" className="rounded-sm" />
            <div className="flex flex-col mt-4">
            <label htmlFor="">Password</label>
            <input type="text" className="rounded-sm" />
            <label htmlFor="">Repeat Password</label>
            <input type="text" className="rounded-sm" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
