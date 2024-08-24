// Custom validation rule to limit length of characters
const createMaxLengthRule = (maxLength) => ({
  validator: (_, value) => {
    if (value && value.length > maxLength) {
      return Promise.reject(
        new Error(`Input must be less than ${maxLength} characters`)
      );
    }
    return Promise.resolve();
  },
});

export default createMaxLengthRule;
