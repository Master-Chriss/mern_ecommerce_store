import {
	FaShoppingCart,
	FaUserPlus,
	FaSignInAlt,
	FaSignOutAlt,
	FaLock,
	FaHome
} from 'react-icons/fa';

import { Link } from 'react-router-dom';
import { useUserStore } from '../stores/useUserStore';
import { useCartStore } from '../stores/useCartStore';
import logo from '/my-ecommerce-favicon.png';

const Navbar = () => {
	const { user, logout } = useUserStore();
	const isAdmin = user?.role === 'admin';
	const { cart } = useCartStore();

	return (
		<header className="fixed top-0 left-0 w-full bg-black/95 backdrop-blur-md shadow-lg z-40 border-b border-gray-800">
			{/* Fixed height container */}
			<div className="container mx-auto px-4 h-16 flex items-center justify-between">
				{/* Logo Section */}
				<Link to="/" className="flex items-center">
					<img
						src={logo}
						alt="SmartShop Logo"
						className="h-14 w-auto sm:mr-[-25px] object-contain transition duration-300 hover:scale-105"
					/>
					<span className="hidden sm:inline text-white font-bold text-lg tracking-wide">
						Smart<span className="text-yellow-400">Shop</span>
					</span>
				</Link>

				{/* Navigation */}
				<nav className="flex items-center gap-5">
					<Link
						to="/"
						className="text-white hover:text-gray-300 transition duration-300">
						<FaHome size={20} />
					</Link>

					{/* Cart */}
					{user && (
						<Link
							to="/cart"
							className="relative flex items-center text-white hover:text-gray-300 transition duration-300">
							<FaShoppingCart size={20} />

							<span className="hidden sm:inline ml-1">Cart</span>

							{/* Cart Badge */}
							{cart.length > 0 && (
								<span
									className="absolute -top-2 -right-3 bg-[#C9A227] text-black rounded-full 
                                 min-w-[20px] h-5 flex items-center justify-center 
                                 text-xs font-semibold">
									{cart.reduce((s, i) => s + i.quantity, 0)}
								</span>
							)}
						</Link>
					)}

					{/* Admin Dashboard */}
					{isAdmin && (
						<Link
							to="/secret-dashboard"
							className="bg-[#C9A227] hover:bg-[#B7921F] text-black px-3 py-1.5 
                         rounded-md font-medium transition duration-300 
                         flex items-center gap-1">
							<FaLock size={14} />
							<span className="hidden sm:inline">Dashboard</span>
						</Link>
					)}

					{/* Auth Buttons */}
					{user ? (
						<button
							onClick={logout}
							className="bg-white hover:bg-gray-200 text-black py-1.5 px-4 
                         rounded-md flex items-center gap-2 transition duration-300">
							<FaSignOutAlt size={14} className="text-red-500" />
							<span className="hidden sm:inline">Log Out</span>
						</button>
					) : (
						<>
							<Link
								to="/signup"
								className="bg-[#C9A227] hover:bg-[#B7921F] text-black py-1.5 px-4 
                           rounded-md flex items-center gap-2 transition duration-300">
								<FaUserPlus size={14} />
								<span className="hidden sm:inline">Sign Up</span>
							</Link>

							<Link
								to="/login"
								className="bg-white hover:bg-gray-200 text-black py-1.5 px-4 
                           rounded-md flex items-center gap-2 transition duration-300">
								<FaSignInAlt size={14} />
								<span className="hidden sm:inline">Login</span>
							</Link>
						</>
					)}
				</nav>
			</div>
		</header>
	);
};

export default Navbar;
