import {asyncHandler} from '../utils/asyncHandler.js'

// with help of asyncHandler helper, we dont need to use try catch or promises everywhere
const registerUser = asyncHandler( async (req, res) => {
    res.status(200).json({
        message: 'HELLO WORLD!!'
    })
})

export {registerUser}