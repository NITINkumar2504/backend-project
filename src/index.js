// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";   // named import
// import express from 'express'
// const app = express()

/*  1st approach IIFE or Function definition and call separately (same work)

// const connectDB = async () => {   
// }
// connectDB()

// or use IIFE

;(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error", (error) => {    // error event - (on is event listener in express)
            console.log("ERR: ", error)
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`Server running at port ${process.env.PORT}`)
        })
    }
    catch(error){
        console.error('ERROR: ', error)
        throw error
    }
})()  // immediately execute function (Immediately Invoked Function Expressions (IIFE))

*/


// 2nd approach, connection in different file and import
import connectDB from './db/index.js';
import { app } from './app.js';

connectDB()    // asynchronous method returns promise after completion so we can use .then and .catch
.then(() => {
    app.on('error', (error) => {     // for listening error before app.listen() 
        console.log('ERR: ', error)
        throw error
    })

    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port: ${process.env.PORT || 8000}`)
    })
})
.catch(error => {
    console.log('MongoDB connection failed !!!', error)
})


































