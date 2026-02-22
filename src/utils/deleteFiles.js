import { v2 as cloudinary } from "cloudinary";

const extractPublicId = (url) => {
    try {
        const uploadIndex = url.indexOf('/upload/');
        const publicIdWithVersion = url.substring(uploadIndex + 8);
        const publicId = publicIdWithVersion
            .replace(/^v\d+\//, '')      // remove version
            .replace(/\.[^/.]+$/, '');   // remove file extension

        return publicId;
    } catch (error) {
        return null;
    }
}

const deleteFile = async (fileurl) => {
    try {
        if (!fileurl) return null;

        const publicId = extractPublicId(fileurl);

        if (!publicId) {
            console.log("Invalid publicId extracted");
            return null;
        }

        const result = await cloudinary.uploader.destroy(publicId, {
            invalidate: true
        });

        return result;
    } catch (error) {
        console.log("Cloudinary deletion error:", error);
        return null;
    }
};

export {deleteFile}