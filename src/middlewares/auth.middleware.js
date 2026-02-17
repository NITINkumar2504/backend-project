// verify if user exist or not
import jwt from "jsonwebtoken";
import { apiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.models";

export const verifyJWT = asyncHandler(async (req, _, next) => {   // if a param is unused we can use _, here we are not using response
    try {
        // accessing token from cookie or header
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ','')  // Bearer <token> (access token)
    
        if(!token){
            throw new apiError(401, 'Unauthorized access')
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )
    
        if(!user){ 
            throw new apiError(401, 'Invalid access token')
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new apiError(401, error?.message || 'Invalid access token')
    }
})