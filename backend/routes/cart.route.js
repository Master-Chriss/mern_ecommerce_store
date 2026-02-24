import express from 'express';
import { protectRoute } from '../middlewares/auth.middleware.js';
import { addToCart, getCartProducts, removeAllFromCart, updateCartQuantity } from '../controllers/cart.controller.js';

const router = express.Router();

router.get('/', protectRoute, getCartProducts);
router.post('/', protectRoute, addToCart) ;
router.delete('/', protectRoute, removeAllFromCart);
router.put('/', protectRoute, updateCartQuantity);


export default router;