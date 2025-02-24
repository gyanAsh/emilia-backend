import { Application, Context, Router, route } from "@oak/oak";

const router = new Router();

router
  .get("/", (ctx) => {
    ctx.response.body = "Hello world";
  })
  .get("/users", (ctx: Context) => {
    ctx.response.body = "this is users";
  });
router.get(
  "/users/:id",
  route((req, ctx) => {
    console.log(ctx.params.id);
    return Response.json({ title: "this is user's id", id: ctx.params.id });
  })
);

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });

export function add(a: number, b: number): number {
  return a + b;
}
