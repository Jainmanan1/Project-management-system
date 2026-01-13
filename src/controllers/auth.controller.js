import APIResponse from "../utils/api-response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import APIError from "../utils/api-error.js";
import { User } from "../models/user.model.js";
import { emailVerificationMailgenContent, sendEmail,forgotPasswordMailgenContent } from "../utils/mail.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
const cookieOptions = {
  httpOnly: true,
  secure: false,
};

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshTokens.push(refreshToken);

    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new APIError(
      500,
      "something went wrong while generating access Token",
    );
  }
};

const RegisteredUser = asyncHandler(async (req, res) => {
  const { userName, email, password, role } = req.body;
  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (existedUser) {
    throw new APIError(
      409,
      "User with email or username is already exists !",
      [],
    );
  }

  const user = await User.create({
    email,
    password,
    userName,
    isEmailVerified: false,
  });

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "please verify your email",
    mailgenContent: emailVerificationMailgenContent(
      user.userName,
      `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}`,
    ),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshTokens -emailVerificationToken -emailVerificationExpiry",
  );
  if (!createdUser) {
    throw new APIError(500, "something went  wrong while registering  a user ");
  }
  return res
    .status(201)
    .json(
      new APIResponse(
        200,
        { user: createdUser },
        "User registered successfully and verification has been send to your email",
      )
    );
});

const login = asyncHandler(async (req, res) => {
  const { password, email, userName } = req.body;
  if (!email) {
    throw new APIError(400, "please provide   email");
  }
  const user = await User.findOne({
    email,
  });
  if (!user) {
    throw new APIError(404, "user not found with this email");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new APIError(401, "incorrect password");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshTokens -emailVerificationToken -emailVerificationExpiry",
  );

  return res
    .cookie("refreshToken", refreshToken, cookieOptions)
    .cookie("accessToken", accessToken, cookieOptions)
    .status(200)
    .json(
      new APIResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshTokens: [],
      },
    },
    {
      new: true,
    },
  );
  return res
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .status(200)
    .json(new APIResponse(200, {}, "user has been successfully logout"));
});

const currentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new APIResponse(200, req.user, "user fetched successfully"));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;
  if (!verificationToken) {
    throw new APIError(400, "verification token is missing");
  }
  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  const user = await User.findOneAndUpdate(
    {
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: Date.now() },
    },
    {
      $set: {
        emailVerificationToken: undefined,
        emailVerificationExpiry: undefined,
        isEmailVerified: true,
      },
    },
    {
      new: true,
    },
  );
  if (!user) {
    throw new APIError(400, "invalid or expired verification token");
  }

  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        { isEmailVerified: true },
        "email verified successfully",
      ),
    );
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new APIError(404, "user not found");
  }
  if (user.isEmailVerified) {
    throw new APIError(409, "email is already verified");
  }
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "please verify your email",
    mailgenContent: emailVerificationMailgenContent(
      user.userName,
      `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(new APIResponse(200, {}, "verification email resent successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
     req.cookies.refreshToken  || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new APIError(401, "unauthorized access");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new APIError(404, "user not found");
    }
    if (!user.refreshTokens.includes(incomingRefreshToken)) {
      user.refreshTokens = [];
      await user.save({ validateBeforeSave: false });

      throw new APIError(401, "refresh token reuse detected");
    }

    user.refreshTokens = user.refreshTokens.filter(
      (token) => token !== incomingRefreshToken,
    );

    const accessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshTokens.push(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new APIResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "access token refreshed successfully",
        ),
      );
  } catch (error) {
    throw new APIError(401, "invalid refresh token");
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(200)
      .json(
        new APIResponse(
          200,
          {},
          "If an account exists with this email, a reset link has been sent",
        ),
      );
  }
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.forgetPasswordToken = hashedToken;
  user.forgetPasswordExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });
  await sendEmail({
    email: user?.email,
    subject: "password reset request",
    mailgenContent: forgotPasswordMailgenContent(
      user.userName,
      `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`,
    ),
  });
  return res
    .status(200)
    .json(new APIResponse(200, {}, "password reset email sent successfully"));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  if (!resetToken) {
    throw new APIError(400, "Reset token is missing");
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    forgetPasswordToken: hashedToken,
    forgetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new APIError(400, "Invalid or expired password reset token");
  }

  user.password = newPassword;
  user.forgetPasswordToken = undefined;
  user.forgetPasswordExpiry = undefined;

  await user.save();

  return res
    .status(200)
    .json(new APIResponse(200, {}, "Password has been reset successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new APIError(404, "user not found");
  }
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new APIError(401, "incorrect old password");
  }
  user.password = newPassword;
  user.refreshTokens = [];
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new APIResponse(200, {}, "password changed successfully"));
});

export {
  RegisteredUser,
  login,
  logoutUser,
  currentUser,
  verifyEmail,
  resendVerificationEmail,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  changeCurrentPassword,
};
