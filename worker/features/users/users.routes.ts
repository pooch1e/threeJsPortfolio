/**
 * User routes — GET /me for the session user, plus admin CRUD under
 * /admin/users (list, get, update, delete, passwordReset).
 *
 * meRoutes is mounted behind requireAuth; adminRoutes is mounted behind requireAuth
 * and applies requireAdmin to everything registered on it. Response bodies use the
 * camelCase field names the frontend reads (isAdmin, createdAt, totalPages).
 */
import { Hono } from "hono";
import { requireAdmin } from "../../middleware/admin";
import { hashPassword } from "../../lib/password";
import { validate } from "../../lib/validate";
import type { Env } from "../../types";
import {
  countUsers,
  deleteUser,
  findUserById,
  listUsers,
  setPasswordHash,
  updateUser,
  type UserRecord,
} from "./users.queries";
import {
  listUsersQuerySchema,
  passwordResetSchema,
  updateUserSchema,
  userIdParamSchema,
} from "./users.schemas";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function serializeUser(user: UserRecord) {
  return {
    id: user.userId,
    name: user.name,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback;
}

export const meRoutes = new Hono<Env>();

meRoutes.get("/me", async (c) => {
  const user = await findUserById(c.get("db"), c.get("userId"));
  return c.json({ id: user.userId, username: user.username, isAdmin: user.isAdmin });
});

export const adminRoutes = new Hono<Env>();
adminRoutes.use("*", requireAdmin);

adminRoutes.get("/users", validate("query", listUsersQuerySchema), async (c) => {
  const query = c.req.valid("query");
  const page = positiveInt(query.page, 1);
  const limit = Math.min(positiveInt(query.limit, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const db = c.get("db");

  const [users, total] = await Promise.all([
    listUsers(db, limit, (page - 1) * limit),
    countUsers(db),
  ]);

  return c.json({
    users: users.map(serializeUser),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

adminRoutes.get("/users/:id", validate("param", userIdParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  return c.json(serializeUser(await findUserById(c.get("db"), id)));
});

adminRoutes.put(
  "/users/:id",
  validate("param", userIdParamSchema),
  validate("json", updateUserSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { name, email, isAdmin } = c.req.valid("json");
    const user = await updateUser(c.get("db"), id, { name, email, isAdmin });
    return c.json(serializeUser(user));
  },
);

adminRoutes.delete("/users/:id", validate("param", userIdParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  await deleteUser(c.get("db"), id);
  return c.json({ message: "Successfully deleted user" });
});

adminRoutes.post(
  "/users/:id/passwordReset",
  validate("param", userIdParamSchema),
  validate("json", passwordResetSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { password } = c.req.valid("json");
    await setPasswordHash(c.get("db"), id, await hashPassword(password));
    return c.json({ message: "Successfully updated password" });
  },
);
