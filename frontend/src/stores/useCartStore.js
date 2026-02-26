import { create } from 'zustand';
import axios from '../lib/axios.js';
import { toast } from 'react-hot-toast';

export const useCartStore = create((set, get) => ({
	cart: [],
	coupon: null,
	total: 0,
	subtotal: 0,

	getCartItems: async () => {
		try {
			const res = await axios.get('/cart');
			set({ cart: res.data });
			get().calculateTotals();
		} catch (error) {
			set({ cart: [] });
			toast.error(error.response?.data?.error || 'Failed to fetch cart items');
		}
	},

	addToCart: async (product) => {
		try {
			await axios.post('/cart', { productId: product._id });
			toast.success('Added to cart');

			set({})

			await get().getCartItems();
			get().calculateTotals();
		} catch (error) {
			toast.error(error.response?.data?.error || 'Failed to add to cart');
		}
	},

	calculateTotals: () => {
		const { cart, coupon } = get();
		const subtotal = cart.reduce(
			(sum, item) => sum + item.price * item.quantity,
			0,
		);
		let total = subtotal;

		if (coupon) {
			const discount = subtotal * (coupon.discountPercentage / 100);
			total = subtotal - discount;
		}

		set({ total, subtotal });
	},
}));
