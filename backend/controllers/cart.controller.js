import clearCart from '../lib/clearCart.js';
import Product from '../models/product.model.js';

export const addToCart = async (req, res) => {
	try {
		const { productId } = req.body;
		const user = req.user;

		const existingItem = user.cartItems.find(
			(item) => item.productId?.toString() === productId
		);

		if (existingItem) {
			existingItem.quantity += 1;
		} else {
			user.cartItems.push({ productId, quantity: 1 });
		}

		await user.save();
		clearCart(user._id);
		res.json(user.cartItems);
        
	} catch (error) {
		console.log('Error in the addToCart controller.', error.message);
		return res
			.status(500)
			.json({ message: 'Server error', error: error.message });
	}
};

export const removeAllFromCart = async (req, res) => {
	try {
		const { productId } = req.body;
		const user = req.user;

		if (!productId) {
			user.cartItems = [];
		} else {
			user.cartItems = user.cartItems.filter(
				(item) => item.productId?.toString() !== productId,
			);
		}

		await user.save();
		res.json(user.cartItems);
	} catch (error) {
		console.log('Error in removeAllFromCart controller.');
		return res
			.status(500)
			.json({ message: 'Server error', error: error.message });
	}
};

export const updateCartQuantity = async (req, res) => {
	try {
		const { id: productId } = req.params;
		const { quantity } = req.body;
		const user = req.user;

		const existingItem = user.cartItems.find(
			(item) => item.productId?.toString() === productId,
		);

		if (existingItem) {
			if (quantity === 0) {
				user.cartItems = user.cartItems.filter(
					(item) => item.productId?.toString() !== productId,
				);
				await user.save();
				return res.json(user.cartItems);
			}

			existingItem.quantity = quantity;
			await user.save();
			res.json(user.cartItems);
		} else {
			return res.status(404).json({ message: 'Product not found' });
		}
	} catch (error) {
		console.log('Error in updateCartQuantity controller.');
		return res
			.status(500)
			.json({ message: 'Server error', error: error.message });
	}
};

export const getCartProducts = async (req, res) => {
  try {
    // 1. Extract IDs safely, filtering out any null/undefined productId entries
    const productIds = req.user.cartItems
      .map((item) => item.productId)
      .filter((id) => id != null);

    // 2. Fetch all products matching those IDs
    const products = await Product.find({ _id: { $in: productIds } });

    // 3. Map quantities back to products
    const cartItems = products.map((product) => {
      const item = req.user.cartItems.find(
        (cartItem) => cartItem.productId?.toString() === product._id.toString()
      );
      
      // toJSON() is good, but we ensure we use product._id for the frontend
      return { ...product.toJSON(), quantity: item?.quantity || 0 };
    });

    res.json(cartItems);
  } catch (error) {
    console.log("Error in getCartProducts controller", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
