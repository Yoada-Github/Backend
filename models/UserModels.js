import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isEmailVerified:{type:Boolean, default:false},
  verificationToken:{type:String, required: true},

});
export default mongoose.model('User', userSchema);
