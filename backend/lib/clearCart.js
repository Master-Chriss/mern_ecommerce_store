import User from '../models/user.model.js';

export const clearCart = async (userId) => {
	const user = await User.findById(userId);
	user.cartItems = [];
	await user.save();

  const message = "Cart Cleared";

	return message;
};

export default clearCart;