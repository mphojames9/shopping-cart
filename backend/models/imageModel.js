import mongoose from "mongoose"

// Product images are stored in MongoDB because Render's disk is wiped on every deploy/restart.
const imageSchema = new mongoose.Schema({
    filename:{type:String,required:true,unique:true},
    contentType:{type:String,required:true},
    data:{type:Buffer,required:true}
})

const imageModel = mongoose.models.image || mongoose.model("image",imageSchema);

export default imageModel;
