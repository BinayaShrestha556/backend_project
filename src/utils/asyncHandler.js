const asyncHandler=(fn)=>{return(req,res,next)=>{
    Promise.resolve(fn(req,res,next)).catch((err)=>next(err))
}}
const asyncHandler2=(fn)=>{return async(req,res,next)=>{
    try {
        await fn(req,res,next);
    } catch (error) {
        
    }
}}
export {asyncHandler}