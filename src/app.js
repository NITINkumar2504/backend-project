import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))   // whitelist particular url


// configuration for data from form
app.use(express.json({   // parses incoming requests with JSON payloads
    limit:'16kb',      // Controls the maximum request body size
}))

// configuration for data from url
app.use(express.urlencoded({
    extended: true,
    limit : '16kb'
}))

// configuration for public asset
app.use(express.static('public'))

app.use(cookieParser())

// routes import
import userRouter from './routes/user.routes.js' 

// routes declaration
// generally we use app.get(route, controller) but since we have separated routes we have to use middleware to get routes
// app.use('/users', userRouter)
app.use('/api/v1/users', userRouter)

export { app }   // named export