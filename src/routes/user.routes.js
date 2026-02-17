import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route('/register').post(
    upload.fields([{
        name :'avatar',
        maxCount: 1
    },
    {
        name : 'coverImage',
        maxCount : 1
    }
    ]),
    registerUser
)

router.route('/login').post(loginUser)

// secured routes: user must be logged in for these routes
router.route('/logout').post(verifyJWT, logoutUser)   // verifyJWT is middleware
router.route('/refreshToken').post(refreshAccessToken)



export default router