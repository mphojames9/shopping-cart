import { createContext, useEffect, useState } from "react";
import axios from "axios"

export const StoreContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
export const DELIVERY_FEE = 40; // keep in sync with backend/controllers/orderController.js

const StoreContextProvider = (props) => {

    const [cartItems,setCartItems] = useState({});
    const url = API_URL;
    const [token,setToken] = useState(()=>localStorage.getItem("token") || "");
    const [food_list,setFoodList] = useState([]);
    const [ready,setReady] = useState(false); // products + saved cart finished loading

    const authConfig = (t = token) => ({headers:{Authorization:`Bearer ${t}`}});

    const logout = () => {
        localStorage.removeItem("token");
        setToken("");
        setCartItems({});
    }

    // expired token -> log the user out
    const handleAuthError = (error) => {
        if (error.response?.status === 401) logout();
    }

    const addToCart = async (itemId) => {
        setCartItems((prev)=>({...prev,[itemId]:(prev[itemId]||0)+1}))
        if (token) {
            try {
                await axios.post(url+"/api/cart/add",{itemId},authConfig());
            } catch (error) {
                handleAuthError(error);
            }
        }
    }

    const removeFromCart = async (itemId) => {
        setCartItems((prev)=>{
            const next = {...prev};
            if (next[itemId] > 1) next[itemId] -= 1;
            else delete next[itemId];
            return next;
        })
        if (token) {
            try {
                await axios.post(url+"/api/cart/remove",{itemId},authConfig());
            } catch (error) {
                handleAuthError(error);
            }
        }
    }

    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                const itemInfo = food_list.find((product) => product._id === item);
                if (itemInfo) totalAmount += itemInfo.price * cartItems[item];
            }
        }
        return totalAmount;
    }

    const fetchFoodList = async () => {
        try {
            const response = await axios.get(url+"/api/food/list");
            setFoodList(response.data.data)
        } catch (error) {
            console.log(error);
        }
    }

    // page reload with a saved login: load the saved cart
    const loadCartData = async (t) => {
        try {
            const response = await axios.post(url+"/api/cart/get",{},authConfig(t));
            if (response.data.success) setCartItems(response.data.cartData || {});
        } catch (error) {
            handleAuthError(error);
        }
    }

    // fresh login / sign up: keep the token and merge any guest cart into the saved one
    const login = async (newToken) => {
        localStorage.setItem("token",newToken);
        setToken(newToken);
        try {
            const response = await axios.post(url+"/api/cart/merge",{items:cartItems},authConfig(newToken));
            if (response.data.success) setCartItems(response.data.cartData || {});
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(()=>{
        async function loadData() {
            await fetchFoodList();
            const stored = localStorage.getItem("token");
            if (stored) await loadCartData(stored);
            setReady(true);
        }
        loadData();
    },[])

    const contextValue = {
        food_list,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        url,
        token,
        setToken,
        login,
        logout,
        ready,
        authConfig
    }

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}

export default StoreContextProvider;
