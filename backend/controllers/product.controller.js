import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.json({products});
    } catch (error) {
        console.log("Error in product controller");
        res.status(500).json({message: "Server error", error: error.message});
    }
}

export const getFeaturedProducts = async (req, res) => {
    try {
        let featuredProducts = await redis.get("featured_products");

        if(featuredProducts) {
            res.json(JSON.parse(featuredProducts));
        }

        // if not in redis, fetch em from the mongodb
        featuredProducts = await Product.find({isFeatured: true}).lean();

        if(!featuredProducts) {
            res.status(404).json({message: "No featured products found"});
        }

        // if found in mongodb, store in redis for future quick access
        await redis.set("featured_products", JSON.stringify(featuredProducts));

        res.json(featuredProducts);
    } catch (error) {
        console.log("Error in product controller");
        res.status(500).json({message: "Server error", error: error.message});
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, image, category } = req.body;

        let cloudinaryResponse = null;

        if(image) {
            cloudinaryResponse = await cloudinary.uploader.upload(image, {folder: "products"});
        }
         const product = await Product.create({ 
            name, 
            description, 
            price, 
            image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "", 
            category 
        });
         return res.status(201).json(product);
    } catch (error) {
        console.log("Error in the product controller 😂😂😂", error.message);
        res.status(500).json({message: "Error in product controller", error: error.message});
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if(!product) {
            return res.status(404).json({message: "Product not found"});
        }

        if(product.image) {
            const publicId = product.image.split("/").pop().split(".")[0];
            try {
                await cloudinary.uploader.destroy(`products/${publicId}`);
                console.log("Product deleted from the cloudinary.");

            } catch (error) {
                return res.status(500).json({message: "Error in product deletion fx", error: error.message});
            }
        }

        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({message: "Product deleted successfully"});    

    } catch (error) {
        console.log("Error in deleteProduct controller.")
        return res.status(500).json({message: "Server error", error: error.message});
    }
};

export const getRecommendedProducts =  async (req, res) => {
    try {
        const products = await products.aggregate([
            {
                $sample: {
                    size: 3
                }
            }, 
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    image: 1,
                    price: 1
                }
            }
        ]);

        res.json({products});
    } catch (error) {
        console.log("Error in Recommendations controller.");
        return res.status(500).json({message: "Server error", error: error.message});
    }
};

export const getProductsByCategory = async (req, res) => {
    const {category} = req.params;
    
    try {
        const products = await Product.find({category});
        res.json({products});
    } catch (error) {
        console.log("Error in getProductsByCategory controller.");
        return res.status(500).json({message: "Server error", error: error.message});
    }
};

export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if(product) {
            product.isFeatured = !product.isFeatured;
            const updatedProduct = await product.save();
            await updateFeaturedProductCache();
            res.json(updatedProduct);
        } else {
            return res.status(404).json({message: "Product not found"});
        }
        
    } catch (error) {
        console.log("Error in toggleFeaturedProduct controller.", error.message);
        return res.status(500).json({message: "Server error", error: error.message});
    }
};

const updateFeaturedProductCache = async () => {
    try {
        const featuredProducts = await Product.find({isFeatured: true}).lean();
        await redis.set("featured_products", JSON.stringify(featuredProducts));
    } catch (error) {
        console.log("Error in updateFeaturedProductCache function.", error.message);
    }
    
};