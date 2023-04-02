import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
	children: ReactNode;
}

interface UpdateProductAmount {
	productId: number;
	amount: number;
}

interface CartContextData {
	cart: Product[];
	addProduct: (productId: number) => Promise<void>;
	removeProduct: (productId: number) => void;
	updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
	const [cart, setCart] = useState<Product[]>(() => {
		const storagedCart = localStorage.getItem('@RocketShoes:cart');

		if (storagedCart) {
			return JSON.parse(storagedCart);
		}

		return [];
	});

	const addProduct = async (productId: number) => {
		const alreadyOnCart = cart.find((product) => product.id === productId);

		try {
			const { data: stock } = await api.get(`stock/${productId}`);
			const { data: product } = await api.get(`/products/${productId}`);

			if (!alreadyOnCart) {
				if (stock.amount > 0) {
					setCart([...cart, { ...product, amount: 1 }]);
					localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, { ...product, amount: 1 }]));
					toast.success('Adicionado ao carrinho');
				} else {
					toast.error('Quantidade solicitada fora de estoque');
				}
			}

			if (alreadyOnCart) {
				if (stock.amount > alreadyOnCart.amount) {
					const newCart = cart.map((item) => {
						return item.id === productId ? { ...item, amount: Number(item.amount + 1) } : item;
					});

					setCart(newCart);
					localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
					toast.success('Adicionado ao carrinho');
				} else {
					toast.error('Quantidade solicitada fora de estoque');
				}
			}
		} catch (err) {
			console.error(err);
			toast.error('Erro na adição do produto');
		}
	};

	const removeProduct = (productId: number) => {
		try {
			const productExists = cart.find((product) => product.id === productId);

			if (productExists) {
				const newCart = cart.filter((product) => product.id !== productId);
				setCart(newCart);
				localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
			} else {
				toast.error('Erro na remoção do produto');
			}
		} catch (err) {
			console.error(err);
			toast.error('Erro na remoção do produto');
		}
	};

	const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
		try {
			if (amount <= 0) {
				return;
			}

			const { data: stock } = await api.get(`stock/${productId}`);

			if (stock.amount >= amount) {
				const newCart = cart.map((product) => {
					return product.id === productId ? { ...product, amount } : product;
				});

				setCart(newCart);
				localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
			} else {
				toast.error('Quantidade solicitada fora de estoque');
			}
		} catch (err) {
			console.error(err);
			toast.error('Erro na alteração de quantidade do produto');
		}
	};

	return (
		<CartContext.Provider value={{ cart, addProduct, removeProduct, updateProductAmount }}>
			{children}
		</CartContext.Provider>
	);
}

export function useCart(): CartContextData {
	const context = useContext(CartContext);

	return context;
}
