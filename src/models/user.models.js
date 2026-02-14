import mongoose, {Schema} from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new Schema({
    username : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true   // enable optimized searching (username based search)
    },
    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
    },
    fullname : {
        type : String,
        required : true,
        trim : true,
        index : true   // fullname based search
    },
    avatar : {
        type : String,    // cloudinary url
        required : true,
    },
    coverImage : {
        type : String    // cloudinary url
    },
    watchHistory : [{     // array of videos
        type : Schema.Types.ObjectId,
        ref : 'Video'
    }],
    password : {
        type : String,
        required : [true, 'Password is required']   // custrom error message (can be used with all true fields)
    },
    refreshToken : {
        type : String,
    }
    },
    {
    timestamps : true
    }
)

// event and callback
userSchema.pre('save' , async function(next){
    if(!this.isModified('password')) return

    // encrypt only when password is modified or set for first time
    this.password = await bcrypt.hash(this.password, 10)
})
// userSchema.pre('save', function(next) {
//    ...
//    next()
// })
// userSchema.pre('save', async function() {
//    ...
// })   should not use next() with async function - If function is async → it automatically returns a Promise

// middleware flag (next) and pass flag (next) forward in end  
// not using arrow function, 
// In JavaScript, the behavior of the this keyword differs between arrow functions and regular functions.
// The this keyword in Arrow Functions is lexically bound, meaning it takes the value of this from the surrounding context where the function was defined, not where it's called.
// In Regular Functions, this is dynamically bound based on how the function is called (e.g., in an object method, this refers to the object).

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname, 
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
        _id: this._id, 
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User', userSchema)