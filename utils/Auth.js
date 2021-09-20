const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const { SECRET } = require('../config');
/**
 * @DESC To register the user (ADMIN, SUPER_ADMIN, USER)
 */

const userRegister = async (userDets, role, res) => {
  try {
        // Validate the username
    let usernameNotTaken = await validateUsername(userDets.username);
    if (!usernameNotTaken) {
        return res.status(400).json({
            message: `Username is already taken.`,
            success: false
        });
      }
      
    // Validate the email
    let emailNotRegistered = await validateEmail(userDets.email);
    if (!emailNotRegistered) {
        return res.status(400).json({
            message: `Email is already registered`,
            success: false
        });
    }

    // Get the hashed password
    const hashedPassword = await bcrypt.hash(userDets.password, 12);

    //Create a new User
    const newUser = new User({
        ...userDets,
        password: hashedPassword,
        role: role
    });
    await newUser.save();
    return res.status(201).json({
        message: "User created successfully",
        success: true
    })
  } catch (error) {
      // Implement logger function (winston)
      console.log(error);
      return res.status(500).json({
          message: "Unable to create your account",
          success: false
      })
  }
}


/**
 * @DESC To Login the user (ADMIN, SUPER_ADMIN, USER)
 */

const userLogin = async (userCreds, role, res) => {
    let { username, password } = userCreds;

    // First Check if the username is in the Database
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(404).json({
            message: " Username is not found. Invalid login credentials",
            success: false
        });
    }

    // We will check the role
    if (user.role != role) {
        return res.status(403).json({
            message: "Error. Your user privileges doesn't allow you to enter",
            success: false
        });
    }
    // That means the user exists and are trying to signin from the right portal
    // Check for the password
    let isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
        // Sign in the token and issue it to the user
        let token = jwt.sign({
            user_id: user._id,
            role: user.role,
            username: user.username,
            email: user.email
        }, SECRET, {expiresIn: "7 days"});

        let result = {
            username: user.username,
            role: user.role,
            email: user.email,
            token: `Bearer ${token}`,
            expiresIn: 168
        };

        return res.status(200).json({
            ...result,
            message: "Loggin successfully",
            success: true
        })
    } else {
        return res.status(403).json({
            message: "Incorrect password",
            success: false
        });
    }
};

/** 
 * @DESC Passport middleware 
 */

const validateUsername = async username => {
    let user = await User.findOne({ username });
    return user ? false : true;
};

const validateEmail = async email => {
    let user = await User.findOne({ email });
    return user ? false : true;
};

const userAuth = passport.authenticate("jwt", { session: false });

module.exports = {
    userAuth,
    userRegister,
    userLogin
}