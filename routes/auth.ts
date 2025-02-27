import { Router } from "../deps.ts";
import {
  googleAuth,
  googleAuthCallback,
  googleAuthExchangeCode,
} from "../controllers/auth/google.ts";

const router = new Router();

// router.post("/auth/login", login).post("/auth/logout", logout);
router
  .get("/auth/login/google", googleAuth)
  .get("/auth/login/google/callback", googleAuthCallback)
  .get("/auth/login/google/exchange-code", googleAuthExchangeCode);

export default router;
