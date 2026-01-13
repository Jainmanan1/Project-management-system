import APIResponse from "../utils/api-response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const healthCheck = asyncHandler(async(req,res)=>{
    res.status(200).json(new APIResponse(200,{message:"system is healthy"}))
})

export {healthCheck};