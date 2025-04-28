const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provider your name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: [true, 'Opps! email already exists'],
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
      minlength: 6,
      select: false,
    },
    profilePic: {
      type: String,
      default: 'user-photo.jpg',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
  }
);

// when the password change it reflect to passwordChangedAt
userSchema.pre('save', function (next) {
  if (this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// INSTANCE METHOD: checking if user change password after token issued
userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    // change passwordChangedAt date to seconds (10-digit )
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimeStamp < changedTimeStamp; // eg: 100 < 200 => true otherwise false
  }
  return false;
};

// HASH PASSWORD BEFORE SAVING.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// COMPARE PASSWORD
userSchema.methods.correctPassword = async function (
  inputPassword,
  userPassword
) {
  // eslint-disable-next-line no-return-await
  return await bcrypt.compare(inputPassword, userPassword);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
