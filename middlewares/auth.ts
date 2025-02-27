import { RouterMiddleware } from "../deps.ts";
import { verifyToken } from "../utils/jwt.ts";

/**
 * Middleware that checks if the request has a valid JWT token
 * Adds the userId to the state if authentication is successful
 */
type MyRouteParams = string;
type MyPathParams = { id: string };
type MyState = { userId: string };

export const authMiddleware: RouterMiddleware<
  MyRouteParams,
  MyPathParams,
  MyState
> = async (ctx, next) => {
  // Check for Authorization header or cookies
  const authHeader = ctx.request.headers.get("Authorization");
  const cookies = await ctx.cookies.get("token");

  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else if (cookies) {
    token = cookies;
  }

  if (!token) {
    ctx.response.status = 401;
    ctx.response.body = { message: "Authentication required" };
    return;
  }

  const payload = await verifyToken(token);

  if (!payload || !payload.sub) {
    ctx.response.status = 401;
    ctx.response.body = { message: "Invalid or expired token" };
    return;
  }

  // Set userId in state for controllers to use
  ctx.state.userId = payload.sub;

  await next();
};
