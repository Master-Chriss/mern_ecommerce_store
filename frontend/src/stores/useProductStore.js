import toast from 'react-hot-toast';
import axios from '../lib/axios';
import { create } from 'zustand';
import { Navigate } from 'react-router-dom';

export const useProductStore = create((set) => ({
	products: [],
	loading: false,

	setProducts: (products) => set({ products }),

	createProduct: async (productsData) => {
		set({ loading: true });
		try {
			const res = await axios.post('/products', productsData);

			set((prevState) => ({
				products: [...prevState.products, res.data],
				loading: false,
			}));

			toast.success('Product Successfully Created!');
      
		} catch (error) {
			toast.error(error.response.data.error);
			set({ loading: false });
		}
	},

	fetchAllProducts: async () => {
		set({ loading: true });
		try {
			const res = await axios.get('/products');

			set({ products: res.data.products, loading: false });
		} catch (error) {
			set({ error: 'Failed to fetch products', loading: false });
			toast.error(error.response.data.error || 'Failed to fetch products');
		}
	},

	deleteProduct: async (productId) => {
		set({ loading: true });
		try {
			await axios.delete(`/products/${productId}`);
			set((prevProducts) => ({
				products: prevProducts.products.filter(
					(product) => product._id !== productId,
				),
				loading: false,
			}));
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.error);
		}
	},

	fetchProductsByCategory: async (category) => {
		set({ loading: true });
		try {
			const res = await axios.get(`/products/category/${category}`);
			set({ products: res.data.products, loading: false });
		} catch (error) {
			set({ loading: false });
			toast.error(
				error.response.data.error || 'Failed to fetch products by category',
			);
		}
	},

	toggleFeaturedProduct: async (productId) => {
		set({ loading: true });
		try {
			const res = await axios.patch(`/products/${productId}`);
			// This will update the isFeatured field of the product in the store
			set((prevProducts) => ({
				products: prevProducts.products.map((product) =>
					product._id === productId
						? { ...product, isFeatured: res.data.isFeatured }
						: product,
				),
				loading: false,
			}));
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.error);
		}
	},
}));
