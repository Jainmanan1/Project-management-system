import { Router } from "express";
import {
  RegisteredUser,
  currentUser,
  forgotPassword,
  login,
  logoutUser,
  refreshAccessToken,
  resendVerificationEmail,
  resetPassword,
  verifyEmail,
 changeCurrentPassword,
} from "../controllers/auth.controller.js";
import { validateRequest } from "../middlewares/vaildator.middleware.js";
import {
  userRegisterValidator,
  userLoginValidator,
  userForgotPasswordValidator,
  userResetForgotPasswordValidator,
  userChangePasswordValidator,
} from "../validators/index.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

//unsecure routes

router
  .route("/register")
  .post(userRegisterValidator(), validateRequest, RegisteredUser);

router.route("/login").post(userLoginValidator(), validateRequest, login);

router.route("/verify-email/:verificationToken").get(verifyEmail);

router.route("/refresh-token").post(refreshAccessToken);

router
  .route("/forgot-password")
  .post(userForgotPasswordValidator(), validateRequest, forgotPassword);

router
  .route("/reset-password/:resetToken")
  .post(userResetForgotPasswordValidator(), validateRequest, resetPassword);

//secure routes

router.route("/logout").get(verifyJwt, logoutUser);

router.route("/current-user").get(verifyJwt, currentUser);

router
  .route("/resend-verification-email")
  .post(verifyJwt, resendVerificationEmail);

router.route("/change-password").post(verifyJwt,userChangePasswordValidator(),validateRequest, changeCurrentPassword);

export default router;
