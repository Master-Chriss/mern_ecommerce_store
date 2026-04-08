import { useEffect } from "react";
import CategoryItem from "../components/CategoryItem";
import FeaturedProducts from "../components/FeaturedProducts";
import { useProductStore } from "../stores/useProductStore";

const categories = [
	{ href: "/jeans", name: "Jeans", imageUrl: "/jeans.jpg" },
	{ href: "/t-shirts", name: "T-shirts", imageUrl: "/tshirts.jpg" },
	{ href: "/shoes", name: "Shoes", imageUrl: "/shoes.jpg" },
	{ href: "/glasses", name: "Glasses", imageUrl: "/glasses.png" },
	{ href: "/jackets", name: "Jackets", imageUrl: "/jackets.jpg" },
	{ href: "/suits", name: "Suits", imageUrl: "/suits.jpg" },
	{ href: "/bags", name: "Bags", imageUrl: "/bags.jpg" },
];
  
const HomePage = () => {
	const { fetchFeaturedProducts, products, loading } = useProductStore();

	useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts])

  return (
    <div className='relative min-h-screen text-gray-900 overflow-hidden'>
			<div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
				<h1 className='text-center text-2xl sm:text-4xl font-bold text-black mb-4'>
					Explore Our Product Categories
				</h1>
				<p className='text-center text-lg sm:text-lg text-gray-700 mb-12'>
					Discover the latest trends in eco-friendly fashion
				</p>

				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
					{categories.map((category) => (
						<CategoryItem category={category} key={category.name} />
					))}
				</div>

				{!loading && products.length > 0 && <FeaturedProducts featuredProducts={products} />}

			</div>
		</div>
  )
}

export default HomePage
