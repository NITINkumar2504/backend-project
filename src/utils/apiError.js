class apiError extends Error{
    constructor(
        statusCode,          // params
        message = 'something went wrong',
        errors = [],
        stackTrace = ''
    ){      // overwriting values
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        if(stackTrace){
            this.stack = stackTrace
        }
        else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {apiError}