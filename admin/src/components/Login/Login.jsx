import React, { useState } from 'react';
import './Login.css';
import { assets } from '../../assets/assets';
import api, { errorMessage } from '../../api';
import { toast } from 'react-toastify';

const emptyForm = { name:"", email:"", password:"", confirmPassword:"", inviteCode:"" };

const Login = ({setToken}) => {

  const [mode,setMode] = useState("login"); // "login" | "register"
  const [data,setData] = useState(emptyForm);
  const [showPassword,setShowPassword] = useState(false);
  const [loading,setLoading] = useState(false);

  const isRegister = mode === "register";

  const switchMode = (next) => {
    setMode(next);
    setData(emptyForm);
    setShowPassword(false);
  }

  const onChangeHandler = (event) => {
    const {name,value} = event.target;
    setData(prev=>({...prev,[name]:value}));
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (isRegister && data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = isRegister
        ? await api.post("/api/user/admin-register",{
            name:data.name,
            email:data.email,
            password:data.password,
            inviteCode:data.inviteCode
          })
        : await api.post("/api/user/admin-login",{
            email:data.email,
            password:data.password
          });

      if (response.data.success) {
        localStorage.setItem("adminToken",response.data.token);
        setToken(response.data.token);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(errorMessage(error,"Could not reach the server"));
    } finally {
      setLoading(false);
    }
  }

  const passwordType = showPassword ? "text" : "password";

  return (
    <div className='login'>
      <form className='login-box' onSubmit={onSubmitHandler}>
        <img src={assets.logo} alt="" className='login-logo' />
        <h2>{isRegister ? "Create admin account" : "Admin sign in"}</h2>

        {isRegister &&
          <input name='name' type='text' placeholder='Your name' autoComplete='name' value={data.name} onChange={onChangeHandler} required />
        }
        <input name='email' type='email' placeholder='Email' autoComplete='email' value={data.email} onChange={onChangeHandler} required />
        <input name='password' type={passwordType} placeholder='Password' autoComplete={isRegister ? "new-password" : "current-password"} minLength={isRegister ? 8 : undefined} value={data.password} onChange={onChangeHandler} required />
        {isRegister &&
          <>
            <input name='confirmPassword' type={passwordType} placeholder='Confirm password' autoComplete='new-password' value={data.confirmPassword} onChange={onChangeHandler} required />
            <input name='inviteCode' type='password' placeholder='Admin invite code' autoComplete='off' value={data.inviteCode} onChange={onChangeHandler} required />
            <p className='login-hint'>Use at least 8 characters. Ask the site owner for the invite code.</p>
          </>
        }

        <label className='login-show'>
          <input type='checkbox' checked={showPassword} onChange={(e)=>setShowPassword(e.target.checked)} />
          Show password
        </label>

        <button type='submit' disabled={loading}>
          {loading
            ? (isRegister ? "Creating account..." : "Signing in...")
            : (isRegister ? "Create account" : "Sign in")}
        </button>

        <p className='login-switch'>
          {isRegister
            ? <>Already have an account? <button type='button' onClick={()=>switchMode("login")}>Sign in</button></>
            : <>Need an admin account? <button type='button' onClick={()=>switchMode("register")}>Create one</button></>}
        </p>
      </form>
    </div>
  );
}

export default Login;
