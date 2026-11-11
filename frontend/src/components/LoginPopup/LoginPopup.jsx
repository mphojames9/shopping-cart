import React, { useContext, useEffect, useState } from 'react';
import './LoginPopup.css';
import { StoreContext } from '../../context/StoreContext';
import axios from "axios";

const LoginPopup = ({setShowLogin}) => {

    const  {url,login} = useContext(StoreContext)

    const [currState,setCurrState] = useState("Login")
    const [loading,setLoading] = useState(false)
    const [error,setError] = useState("")
    const [data,setData] = useState({
        name:"",
        email:"",
        password:""
    })

    const isSignUp = currState === "Sign Up";

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data=>({...data,[name]:value}))
    }

    const switchState = (next) => {
        setCurrState(next);
        setError("");
    }

    const onLogin = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        const endpoint = isSignUp ? "/api/user/register" : "/api/user/login";

        try {
            const response = await axios.post(url+endpoint,data)

            if (response.data.success) {
                await login(response.data.token);
                setShowLogin(false)
            }
            else{
                setError(response.data.message)
            }
        } catch (err) {
            setError(err.response?.data?.message || "Could not reach the server. Please try again.")
        } finally {
            setLoading(false);
        }
    }

    // Escape closes the popup
    useEffect(()=>{
        const onKey = (event) => { if (event.key === "Escape") setShowLogin(false); };
        document.addEventListener("keydown",onKey);
        return ()=>document.removeEventListener("keydown",onKey);
    },[setShowLogin])

    return (
    <div className='auth-overlay' onMouseDown={(event)=>{ if (event.target===event.currentTarget) setShowLogin(false) }}>
        <form onSubmit={onLogin} className='auth-card' role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <button type="button" className="auth-close" aria-label="Close" onClick={()=>setShowLogin(false)}>&times;</button>

            <div>
                <h2 id="auth-title">{isSignUp?"Create your account":"Welcome back"}</h2>
                <p className="auth-sub">{isSignUp?"Save your cart and track your orders.":"Sign in to check out and see your orders."}</p>
            </div>

            {isSignUp &&
                <label className="field"><span>Name</span><input name='name' autoComplete='name' onChange={onChangeHandler} value={data.name} type='text' autoFocus required /></label>
            }
            <label className="field"><span>Email</span><input name='email' autoComplete='email' onChange={onChangeHandler} value={data.email} type='email' autoFocus={!isSignUp} required /></label>
            <label className="field"><span>Password</span><input name='password' autoComplete={isSignUp?'new-password':'current-password'} minLength={isSignUp?8:undefined} onChange={onChangeHandler} value={data.password} type='password' required /></label>
            {isSignUp && <p className="auth-hint">Use at least 8 characters.</p>}

            {error && <p className="auth-error" role="alert">{error}</p>}

            {isSignUp &&
                <label className="auth-terms">
                    <input type='checkbox' required />
                    <span>I agree to the terms of use and privacy policy</span>
                </label>
            }

            <button type='submit' className="btn btn-primary btn-block" disabled={loading}>
                {loading?"Please wait…":(isSignUp?"Create account":"Sign in")}
            </button>

            <p className="auth-switch">
                {isSignUp
                    ? <>Already have an account? <button type="button" className="link-btn" onClick={()=>switchState("Login")}>Sign in</button></>
                    : <>New here? <button type="button" className="link-btn" onClick={()=>switchState("Sign Up")}>Create an account</button></>}
            </p>
        </form>
    </div>
  );
}

export default LoginPopup;
