import { asyncHandler } from '../utils/asyncHandler.js'
import { apiError } from '../utils/apiError.js'
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { apiResponse } from '../utils/apiResponse.js'
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshToken = async (userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken   // adding refreshToken in user object 
        await user.save({validateBeforeSave : false})   // save (in DB), 
        // validate....? due to prefunction (password hashing before save, avoid that)
        
        return { refreshToken, accessToken }
    }
    catch(error){
        throw new apiError(500, 'Something went wrong while generating refresh and access token')
    }
}

// with help of asyncHandler helper, we dont need to use try catch or promises everywhere
const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // details validation - (not empty)
    // check if user already exist: using username and email or anyone
    // check for images, check for avatar (localPath)
    // upload on cloudinary, check avatar again
    // create user object - create entry in DB
    // remove password and refresh token field from response
    // check for user creation
    // return res if user created else error 

    // STEP 1:
    // extracting details from req.body (destructure)
    const {fullname, email, username, password} = req.body
    // console.log(req.body)
    // console.log('fullname:', fullname)
    // console.log('email:', email)
    // console.log('username:', username)


    // STEP 2:
    // details validation (check each fields individually)
    // if(fullname === ""){
    //     throw new apiError(400, "fullname is required")
    // }

    // check all fields at once
    if(
        [fullname, email, username, password].some((field) => field === undefined || field?.trim() === "") //Determines whether the specified callback function returns true for any element of an array (if it returns true, then there is an empty field)
    ){
        throw new apiError(400, "all fields are required")
    }

    function validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
    }

    if(!validateEmail(email)){   // validate email pattern
        throw new apiError(400, "incorrect email")
    }


    //  STEP 3:
    // const existedUser = User.findOne({ email })  for only one field

    const existedUser = await User.findOne({   // for multiple fields
        $or: [{ email }, { username }]     
    })

    // console.log(existedUser)

    if(existedUser){
        throw new apiError(409, "user with email or username already exists")
        // return res.status(409).json({ success:false, message:'user with email or username already exists' }); respond immediately (no throw)
    }


    // STEP 4:  (multer provide file access)
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    // let coverImageLocalPath    // we can also check like this, without optional chaining
    // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }

    // console.log(req.files)

    if(!avatarLocalPath){
        throw new apiError(400, "avatar file is required")
    }


    // STEP 5:
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // console.log(avatar)

    if(!avatar){
        throw new apiError(400, "avatar file is required") 
    }


    // STEP 6:
    const user = await User.create({
        fullname,
        avatar : avatar.secure_url,
        coverImage : coverImage?.secure_url || '',   // we have not checked coverImage like avatar, if there is coverimage then use url else empty
        password,
        email,
        username : username.toLowerCase() 
    })


    // STEP 7:
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"    // we get user without password and refreshToken
    )


    // STEP 8:
    if(!createdUser){
        throw new apiError(500, "Something went wrong while registering the user")
    }


    // STEP 9:
    return res.status(201).json(
        new apiResponse(200, createdUser, "User registered successfully")
    )

})

const loginUser = asyncHandler( async(req, res) => {
    // get user details from req.body
    // check if username and email is present or not
    // find user
    // if exist, password check
    // generate access and refresh token
    // send cookie

    // STEP 1:
    const {email, username, password} = req.body

    // STEP 2:
    if(!username && !email){    // if we need both or !(username || password) if we need anyone of two
        throw new apiError(400, 'username or email is required')
    }

    // STEP 3:
    const user = await User.findOne({    // return first matched entry
        $or : [{ email } , { username }]     // on basis of email or username $or is mongoDB operator
    })  
    
    if(!user){
        throw new apiError(404, 'User does not exist')
    }

    // STEP 4:
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new apiError(401, 'Invalid user credentials')
    }

    // STEP 5:
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    // STEP 6:
    const options = {
        httpOnly : true,   // not modifiable on frontend, only server can modify
        secure : true
    }

    return res
    .status(200)
    .cookie('accessToken', accessToken, options)     // setting cookies
    .cookie('refreshToken', refreshToken, options)
    .json(
        new apiResponse(
            200, 
            {
                // The syntax user: loggedInUser means the response property will be named "user" with value loggedInUser.
                user : loggedInUser,    // frontend would access it differently
                                        // Current: response.user.fullname          (if user : loggedInUser)
                                        // Changed: response.loggedInUser.fullname  (if only loggedInUser)
                accessToken,       // when user try to save cookies in localStorage, in mobile applications 
                refreshToken
            },
            'User logged In successfully'
        )
    )
})

const logoutUser = asyncHandler ( async (req, res) => {
    // clear cookies
    // remove refreshToken 

    // to logout we need user access and to get user access we need middleware (auth middleware)
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined    // removing refreshToken from DB
            }
        },
        {
            new: true   // for updated values in res
        }
    )

    const options = {
        httpOnly : true,   // not modifiable on frontend, only server can modify
        secure : true
    }

    return res
    .status(200)
    .clearCookie('accessToken', options)  // removing cookies
    .clearCookie('refreshToken', options)
    .json(
        new apiResponse(200, {}, 'User logged out successfully')      // returning empty object
    )    
})

const refreshAccessToken = asyncHandler( async (req, res) => {
    // accessing refreshToken from cookies or body (in case of mobile app)
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new apiError(401, 'Unauthorized request')
    }

    try {
        const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedRefreshToken?._id)
    
        if(!user){
            throw new apiError(401, 'Invalid refresh token')
        }
    
        if(user?.refreshToken !== incomingRefreshToken){
            throw new apiError(401, 'refresh token is expired or used')
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {newRefreshToken, accessToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', newRefreshToken, options)
        .json(
            new apiResponse(
                200,
                {
                    refreshToken : newRefreshToken,   // updating refresh token value
                    accessToken
                },
                'access token refreshed'
            )
        )
    } catch (error) {
        throw new apiError(401, error?.message || 'Invalid refresh token')
    }
})

const changeCurrentPassword =  asyncHandler( async(req, res) => {
    
    const {oldPassword, newPassword} = req.body     // for confirmPassword add confirmPassword and if new and confirm are not same throw error
    
    // req.user access using middleware
    const user = await User.findById(req.user._id)

    const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isOldPasswordCorrect){
        throw new apiError(400, 'Invalid password')
    }

    // if correct
    user.password = newPassword
    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(
        new apiResponse(200, {}, 'Password changed successfully')
    )
})

const getCurrentUser = asyncHandler( async (req, res) => {
    return res
    .status(200)
    .json(
        new apiResponse(200, req.user, 'current user fetched successfully')
    )
})

const updateAccountDetails = asyncHandler( async(req, res) => {
    const {fullname, email, } = req.body    // fields allowed to change

    if(!fullname || !email){
        throw new apiError(400, 'All fields are required')
    }

    const user = User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                fullname : fullname,
                email  // both are correct
            }
        },
        {
            new : true
        }
    ).select(
        "-password -refreshToken"
    )

    return res
    .status(200)
    .json(
        new apiResponse(200, user, 'account details updated successfully')
    )

})

const updateUserAvatar = asyncHandler( async(req, res) => {
    const avatarLocalPath = req.file?.path   // taking single file

    if(!avatarLocalPath){
        throw new apiError(400, 'avatar file is missing')
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar){
        throw new apiError(400, 'error while uploading avatar')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : avatar.secure_url
            }
        },
        {
            new : true
        }
    ).select(
        "-password -refreshToken"
    )

    return res
    .status(200)
    .json(
        new apiResponse(
            200, user, 'avatar changed successfully'
        )
    )
})

const updateUserCoverImage = asyncHandler( async(req, res) => {
    const coverImageLocalPath = req.file?.path   // taking single file

    if(!coverImageLocalPath){
        throw new apiError(400, 'coverImage file is missing')
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage){
        throw new apiError(400, 'error while uploading coverImage')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {    
                coverImage : coverImage.secure_url
            }
        },
        {
            new : true
        }
    ).select(
        "-password -refreshToken"
    )

    return res
    .status(200)
    .json(
        new apiResponse(
            200, user, 'coverImage changed successfully'
        )
    )
})

export {registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage
}