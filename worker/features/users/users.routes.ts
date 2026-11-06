/**
 * User routes — GET /me for the session user, plus admin CRUD under
 * /admin/users (list, get, update, delete, passwordReset).
 *
 * meRoutes is mounted behind requireAuth; adminRoutes is mounted behind requireAuth
 * and applies requireAdmin to everything registered on it.
 */
import { Hono } from "hono";
import { requireAdmin } from "../../middleware/admin";
import type { Env } from "../../types";

export const meRoutes = new Hono<Env>();

export const adminRoutes = new Hono<Env>();
adminRoutes.use("*", requireAdmin);
