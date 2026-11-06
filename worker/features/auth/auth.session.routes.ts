import { Hono } from "hono";
import { Env } from "../../types";
import { deleteCookie } from "hono/cookie";
import { sessionCookieFlags } from "./utils";

const app = new Hono<Env>();

app.post("/logout", (c) => {
  deleteCookie(c, "session", sessionCookieFlags(c));
  return c.json({ message: "logged out" }, 200);
});

export default app;
