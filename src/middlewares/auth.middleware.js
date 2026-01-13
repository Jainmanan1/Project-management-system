import  {User}  from "../models/user.model.js";
import APIError from "../utils/api-error.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
export const verifyJwt = asyncHandler(async (req, res, next) => {
      const token = req.cookies?.accessToken || req.headers.authorization?.replace("Bearer ","");
      if(!token){
        throw new APIError(401,"Unauthorized access , please login to continue");
      }

      try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded?._id).select("-password -refreshTokens -emailVerificationToken -emailVerificationExpiry")

        if(!user){
            throw new APIError(401,"Unauthorized access , user not found");
        }
        req.user = user;
        next()
      } catch (error) {
        throw new APIError(401,"Unauthorized access , invalid token");
        
      }
})