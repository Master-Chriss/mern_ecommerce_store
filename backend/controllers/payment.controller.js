import Coupon from '../models/coupon.model.js';
import { stripe } from '../lib/stripe.js';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';

export const createCheckoutSession = async (req, res) => {
    try {
        const { products, couponCode } = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: "Invalid or empty products array" });
        }

        let totalAmount = 0;

        const lineItems = await Promise.all(products.map(async (product) => {
            // FIX 1: Fetch from DB to prevent price tampering
            const dbProduct = await Product.findById(product._id); 
            const amount = Math.round(dbProduct.price * 100); 
            
            totalAmount += amount * (product.quantity || 1);

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: dbProduct.name,
                        images: [dbProduct.image]
                    },
                    unit_amount: amount
                },
                quantity: product.quantity || 1
            };
        }));

        let coupon = null;
        if (couponCode) {
            coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });

            if (coupon) {
                // FIX 2: Subtract the discount, don't add it (Changed += to -=)
                totalAmount -= Math.round(totalAmount * (coupon.discountPercentage / 100));
            }
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
            // FIX 3: Stripe expects an ID string here, ensure createStripeCoupon returns one
            discounts: coupon ? [{
                coupon: await createStripeCoupon(coupon.discountPercentage)
            }] : [],
            metadata: {
                userId: req.user._id.toString(),
                couponCode: couponCode || '',
                cartItems: JSON.stringify(
                    products.map((product) => ({
                        productId: product._id,
                        quantity: product.quantity || 1,
                    }))
                ),
            }
        });

        // FIX 5: Use the calculated totalAmount (in cents) for the threshold
        if (totalAmount >= 20000) { 
            await createNewCoupon(req.user._id);
        }

        res.status(200).json({ id: session.id, url: session.url, totalAmount: totalAmount / 100 });
            
    } catch (error) {
        console.error("Error in createCheckoutSession:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const checkoutSuccess = async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ message: "Session ID is required" });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== "paid") {
            return res.status(400).json({ message: "Payment not completed" });
        }

        const existingOrder = await Order.findOne({ stripeSessionId: sessionId });
        if (existingOrder) {
            return res.status(200).json({
                success: true,
                message: "Order already processed.",
                orderId: existingOrder._id,
            });
        }

        if (session.metadata.couponCode) {
            await Coupon.findOneAndUpdate(
                {
                    code: session.metadata.couponCode,
                    userId: session.metadata.userId,
                },
                {
                    isActive: false,
                }
            );
        }

        const cartItems = JSON.parse(session.metadata.cartItems || "[]");
        const productIds = cartItems.map((item) => item.productId);
        const products = await Product.find({ _id: { $in: productIds } });
        const productMap = new Map(products.map((product) => [product._id.toString(), product]));

        const orderProducts = cartItems
            .map((item) => {
                const product = productMap.get(item.productId);

                if (!product) {
                    return null;
                }

                return {
                    product: product._id,
                    quantity: item.quantity || 1,
                    price: product.price,
                };
            })
            .filter(Boolean);

        if (orderProducts.length === 0) {
            return res.status(400).json({ message: "No valid products found for this order" });
        }

        const newOrder = new Order({
            user: session.metadata.userId,
            products: orderProducts,
            totalAmount: session.amount_total / 100,
            stripeSessionId: sessionId,
        });

        await newOrder.save();
        res.status(200).json({
            success: true,
            message: "Payment successful, order created, and coupon deactivated if used.",
            orderId: newOrder._id,
        });
    } catch (error) {
        console.log("Error in processing checkout.", error.message);
        return res.status(500).json({ message: "Error in processing checkout.", error: error.message });
    }
};


const createStripeCoupon = async (discountPercentage) => {
    const coupon =  await stripe.coupons.create({
        percent_off: discountPercentage,
        duration: "once"
    });

    return coupon.id;
};

const createNewCoupon = async (userId) => {
    const couponData = {
        code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        discountPercentage: 10,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
    };

    const coupon = await Coupon.findOneAndUpdate(
        { userId },
        couponData,
        {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
        }
    );

    return coupon;
}
