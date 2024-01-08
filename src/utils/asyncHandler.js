/*
const asyncHandler = (requesthandler) => {
    return (req , res , next ) => {
        Promise.resolve(requesthandler(req , res , next)).catch((err) => {
            next(err)
        })
    }
}
*/



const asyncHandler = (func) => async (req , res , next ) =>  {
    try {
        await   func(req , res , next);
    }
    catch(err) {
        res.status(err.code || 500).json({
            success : false,
            message : err.message || "Internal Server Error in the Async Handling "
        })
        throw err;
    }
}


export {asyncHandler}


// higher order function in side the try catch block 