//catches error in our async function
module.exports = catchAsync = (fn) => {
  // The catchAsync function takes another function (fn) as its argument
  return (req, res, next) => {
    // This returned function serves as middleware in Express.js
    // It takes the standard Express.js middleware arguments: req (request), res (response), and next (next middleware function in the stack)

    // Execute the asynchronous middleware function (fn) with the provided req, res, and next arguments
    fn(req, res, next)
      // If an error occurs during the execution of fn, catch it
      .catch(next); // Forward the caught error to the next middleware function
    // Note: next(next) seems unusual and might be a typo. Typically, you'd want to pass the caught error to the next function directly like this: catch((err) => next(err))
  };
};
