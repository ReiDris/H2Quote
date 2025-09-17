const Joi = require('joi');

const signupSchema = Joi.object({
    companyName: Joi.string().min(2).max(255).required(),
    customerName: Joi.string().min(2).max(200).required(),
    email: Joi.string().email().required(),
    contactNo: Joi.string().pattern(/^[0-9+\-\s()]+$/).min(10).max(20).required(),
    password: Joi.string()
        .min(12)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
});

const validateSignup = (req, res, next) => {
    const { error, value } = signupSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: error.details.map(detail => detail.message)
        });
    }
    req.validatedData = value;
    next();
};

module.exports = { validateSignup };