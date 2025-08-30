const mongoose=  require('mongoose');

const CartItemSchema = new mongoose.Schema({
product:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"Product",
  required:true,
},
quantity:{
  type:Number,
  required:true,
  min:1,
  default:1,
},
selected:{
  type:Boolean,
  default:true,
}
});

const CartSchema = new mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true,
    unique:true,
  },
  items:[CartItemSchema],
},{
  timestamps:true
})

module.exports = mongoose.model("Cart",CartSchema);