import { Env } from "../../types";
import { Context } from "hono";
export function sessionCookieFlags(c: Context<Env>) {
  const isProduction = c.env.APP_ENV === "production";
  return {
    path: "/",
    secure: isProduction,
    sameSite: isProduction ? ("None" as const) : ("Lax" as const),
  };
}
