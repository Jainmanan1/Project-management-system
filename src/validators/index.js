import { body } from "express-validator";


const userRegisterValidator = () => {
    return [
        body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format"),

        body("userName")
        .trim()
        .notEmpty()
        .withMessage("Username is required")
        .isLowercase()
        .withMessage("Username must be in lowercase")
        .isLength({min: 3})
        .withMessage("username must be at least 3 characters long"),

        body("password")
        .trim()
        .notEmpty()
        .withMessage("password is required")
        .isLength({min:6})
        .withMessage("password must be at least 6 characters long"),

        body("fullName")
        .optional()
        .trim()

    ]
}

const userLoginValidator = () => {
    return [
        body("email")
        .optional()
        .isEmail()
        .withMessage("Invalid email format"),
        body("password")
        .trim()
        .notEmpty()
        .withMessage("password is required")
        .isLength({min:6})
        .withMessage(" password must be at least 6 characters long")
    ]
}

const userChangePasswordValidator = () => {
    return [
        body("oldPassword")
        .trim()
        .notEmpty()
        .withMessage("Old password is required"),
        body("newPassword")
        .trim()
        .notEmpty()
        .withMessage("New password is required")
        .isLength({min:6})
        .withMessage(" password must be at least 6 characters long")
    ]

}

const userForgotPasswordValidator = () => {
    return [
        body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format"),
    ]
}

const userResetForgotPasswordValidator = () =>{
    return [
        body("newPassword")
        .notEmpty()
        .withMessage("New password is required")
        .isLength({min:6})
        .withMessage(" password must be at least 6 characters long")
    ]
}

export {
    userRegisterValidator,
    userLoginValidator,
    userChangePasswordValidator,
    userForgotPasswordValidator,
    userResetForgotPasswordValidator
}

