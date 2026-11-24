import { createContext, useEffect, useState } from "react";
import axios from "axios"
import { shuffle } from "../utils/shuffle";
import { discountFor } from "../utils/promo";

export const StoreContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
export const DELIVERY_FEE = 40; // keep in sync with backend/controllers/orderController.js

// The applied promo code survives a page reload (but not closing the tab). Only signed-in customers can use codes.
const PROMO_KEY = "promo";
const readPromo = () => {
    try {
        const saved = JSON.parse(sessionStorage.getItem(PROMO_KEY) || "null");
        const valid = saved && typeof saved.code === "string" && (saved.type === "percent" || saved.type === "fixed");
        return valid ? saved : null;
    } catch {
        return null;
    }
}
const writePromo = (promo) => {
    try {
        if (promo) sessionStorage.setItem(PROMO_KEY, JSON.stringify(promo));
        else sessionStorage.removeItem(PROMO_KEY);
    } catch {
        // storage blocked: the code just will not survive a reload
    }
}

// A guest's wishlist lives in this browser until they sign in (then it is merged into their account)
const GUEST_WISHLIST_KEY = "guestWishlist";
const readGuestWishlist = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || "[]");
        return Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : [];
    } catch {
        return [];
    }
}
const writeGuestWishlist = (list) => {
    try {
        if (list.length) localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(list));
        else localStorage.removeItem(GUEST_WISHLIST_KEY);
    } catch {
        // storage blocked (private mode): the list just will not survive a reload
    }
}

const StoreContextProvider = (props) => {

    const [cartItems,setCartItems] = useState({});
    const url = API_URL;
    const [token,setToken] = useState(()=>localStorage.getItem("token") || "");
    const [food_list,setFoodList] = useState([]);
    // product ids, oldest first. Logged in: loaded from the account. Guest: kept in localStorage.
    const [wishlist,setWishlist] = useState(()=>localStorage.getItem("token") ? [] : readGuestWishlist());
    // promo code applied to the cart: {code,type,value,minSubtotal}
    const [coupon,setCoupon] = useState(()=>localStorage.getItem("token") ? readPromo() : null);
    const [ready,setReady] = useState(false); // products + saved cart finished loading

    const authConfig = (t = token) => ({headers:{Authorization:`Bearer ${t}`}});

    const logout = () => {
        localStorage.removeItem("token");
        setToken("");
        setCartItems({});
        setWishlist([]);
        setCoupon(null);
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

    // heart button: save or un-save a product (instant on screen, then synced to the account)
    const toggleWishlist = async (itemId) => {
        const saved = wishlist.includes(itemId);
        const apply = (on) => setWishlist((prev)=>{
            const without = prev.filter((id)=>id!==itemId);
            return on ? [...without,itemId] : without;
        });
        apply(!saved);
        if (!token) return;
        try {
            const response = await axios.post(url+(saved ? "/api/wishlist/remove" : "/api/wishlist/add"),{itemId},authConfig());
            if (!response.data.success) apply(saved); // the server said no: put the heart back
        } catch (error) {
            apply(saved);
            handleAuthError(error);
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

    // cart subtotal in cents, priced the same way the server prices it
    const getTotalCartCents = () => {
        let cents = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                const itemInfo = food_list.find((product) => product._id === item);
                if (itemInfo) cents += Math.round(itemInfo.price * 100) * cartItems[item];
            }
        }
        return cents;
    }

    // rand off the products from the applied promo code (0 when none, or the cart is below its minimum spend)
    const getDiscount = () => discountFor(coupon, getTotalCartCents());

    // asks the server whether the code works on this cart; the server checks it again at checkout
    const applyCoupon = async (code) => {
        const items = food_list
            .filter((item)=>cartItems[item._id] > 0)
            .map((item)=>({id:item._id,quantity:cartItems[item._id]}));
        try {
            const response = await axios.post(url+"/api/coupon/validate",{code,items},authConfig());
            if (response.data.success) {
                setCoupon(response.data.coupon);
                return {ok:true};
            }
            return {ok:false,message:response.data.message};
        } catch (error) {
            handleAuthError(error);
            return {
                ok:false,
                message:error.response?.status === 401 ? "Please sign in again to use a promo code" : "Could not check that code, please try again"
            };
        }
    }

    const removeCoupon = () => setCoupon(null);

    const fetchFoodList = async () => {
        try {
            const response = await axios.get(url+"/api/food/list");
            // a fresh random order on every page load (stays stable while browsing)
            setFoodList(shuffle(response.data.data))
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

    const loadWishlistData = async (t) => {
        try {
            const response = await axios.post(url+"/api/wishlist/get",{},authConfig(t));
            if (response.data.success) setWishlist(response.data.wishlist || []);
        } catch (error) {
            handleAuthError(error);
        }
    }

    // fresh login / sign up: keep the token and merge any guest cart and wishlist into the saved ones
    const login = async (newToken) => {
        localStorage.setItem("token",newToken);
        setToken(newToken);
        const mergeCart = async () => {
            try {
                const response = await axios.post(url+"/api/cart/merge",{items:cartItems},authConfig(newToken));
                if (response.data.success) setCartItems(response.data.cartData || {});
            } catch (error) {
                console.log(error);
            }
        }
        const mergeWishlist = async () => {
            try {
                const response = await axios.post(url+"/api/wishlist/merge",{items:wishlist},authConfig(newToken));
                if (response.data.success) {
                    setWishlist(response.data.wishlist || []);
                    writeGuestWishlist([]); // now safely in the account
                }
            } catch (error) {
                console.log(error);
            }
        }
        await Promise.all([mergeCart(),mergeWishlist()]);
    }

    useEffect(()=>{
        async function loadData() {
            await fetchFoodList();
            const stored = localStorage.getItem("token");
            if (stored) await Promise.all([loadCartData(stored),loadWishlistData(stored)]);
            setReady(true);
        }
        loadData();
    },[])

    useEffect(()=>{
        writePromo(coupon);
    },[coupon])

    // guests: remember the heart list across reloads
    useEffect(()=>{
        if (!token) writeGuestWishlist(wishlist);
    },[wishlist,token])

    // forget saved products that no longer exist in the shop (removed in the admin panel)
    useEffect(()=>{
        if (!ready || food_list.length === 0) return;
        const live = new Set(food_list.map((item)=>item._id));
        setWishlist((prev)=>prev.every((id)=>live.has(id)) ? prev : prev.filter((id)=>live.has(id)));
    },[ready,food_list])

    const contextValue = {
        food_list,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        wishlist,
        toggleWishlist,
        getTotalCartAmount,
        getDiscount,
        coupon,
        applyCoupon,
        removeCoupon,
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
