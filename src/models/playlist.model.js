import mongoose,{Schema} from "mongoose";
const playlistSchema=new Schema({
    name:{
        type: String,
        required:true
    },
    createdBy:{
        type:Schema.Types.ObjectId(),
        ref:"User"

    },
    videos:[{
        type:Schema.Types.ObjectId,
        ref:"Video"
    }
    ],
    description:{
        type:String,
        
    },


},{
    timestamps:true
})