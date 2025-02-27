import authRoutes from "./routes/auth.ts";
import { Application, oakCors } from "./deps.ts";
import { APP_PORT, FRONTEND_URL } from "./configs/constants.ts";

const app = new Application();

// CORS middleware
app.use(
  oakCors({
    origin: [FRONTEND_URL, /^.+localhost:(3000|8000)$/],
    credentials: true,
  })
);

// Error handling
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error("Unhandled error:", err);
    ctx.response.status = 500;
    ctx.response.body = { message: "Internal server error" };
  }
});

// Logger middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(
    `${ctx.request.method} ${ctx.request.url} - ${ctx.response.status} (${ms}ms)`
  );
});

// Routes
app.use(authRoutes.routes());
app.use(authRoutes.allowedMethods());

// Start server
console.log(`Server running on http://localhost:${APP_PORT}`);
await app.listen({ port: APP_PORT });
