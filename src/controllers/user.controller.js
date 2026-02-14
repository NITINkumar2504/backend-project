import { asyncHandler } from '../utils/asyncHandler.js'
import { apiError } from '../utils/apiError.js'
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { apiResponse } from '../utils/apiResponse.js'

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
        throw new apiError(400, "avatar file is requireda") 
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

export {registerUser}