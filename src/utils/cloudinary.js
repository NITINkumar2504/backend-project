import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUDNAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try{
      if(!localFilePath) return null

      // upload file on cloudinary
      const response = await cloudinary.uploader.upload(localFilePath, {    // filepath, options
        resource_type : 'auto'
      })

      console.log('file is uploaded on cloudinary', response.url)
      return response

    }
    catch(error){
      fs.unlinkSync(localFilePath) // The 'unlink' function is used to remove locally saved temporary files in case of failed upload operations
      return null
    }
}

export {uploadOnCloudinary}