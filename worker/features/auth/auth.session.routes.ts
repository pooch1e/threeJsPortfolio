import { Hono } from "hono";
import { Env } from "../../types";
import { deleteCookie } from "hono/cookie";
import { sessionCookieFlags } from "./utils";

export const sessionRoutes = new Hono<Env>().post("/logout", (c) => {
  deleteCookie(c, "session", sessionCookieFlags(c));
  return c.json({ message: "logged out" }, 200);
});

