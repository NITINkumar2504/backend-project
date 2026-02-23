import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getUserWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
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
router.route('/changePassword').post(verifyJWT, changeCurrentPassword)
router.route('/currentUser').get(verifyJWT, getCurrentUser)
router.route('/updateDetails').patch(verifyJWT, updateAccountDetails)   // not post create new resource, patch update a portion of a resource
router.route('/updateAvatar').patch(verifyJWT, upload.single('avatar'), updateUserAvatar)
router.route('/updateCoverImage').patch(verifyJWT, upload.single('coverImage'), updateUserCoverImage)
router.route('/c/:username').get(verifyJWT, getUserChannelProfile)
router.route('/watchHistory').get(verifyJWT, getUserWatchHistory)



export default router