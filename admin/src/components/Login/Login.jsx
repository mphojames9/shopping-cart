import React, { useState } from 'react';
import './Login.css';
import { assets } from '../../assets/assets';
import api, { errorMessage } from '../../api';
import { toast } from 'react-toastify';
import {
  EyeIcon, EyeOffIcon, MailIcon, LockIcon, UserIcon, KeyIcon,
  SmartphoneIcon, LaptopIcon, MonitorIcon, HeadphonesIcon
} from '../Icons';

const emptyForm = { name:"", email:"", password:"", confirmPassword:"", inviteCode:"" };

// Floating-label input with a leading icon
const Field = ({ icon:Icon, label, action, ...input }) => (
  <div className='field'>
    <Icon size={18} className='field-icon' />
    <input id={input.name} placeholder=' ' {...input} />
    <label htmlFor={input.name}>{label}</label>
    {action}
  </div>
);

// Height-animated wrapper for fields that only exist while registering
const Reveal = ({ children }) => (
  <div className='reveal'>
    <div className='reveal-inner'>{children}</div>
  </div>
);

const Login = ({setToken}) => {

  const [mode,setMode] = useState("login"); // "login" | "register"
  const [data,setData] = useState(emptyForm);
  const [showPassword,setShowPassword] = useState(false);
  const [loading,setLoading] = useState(false);

  const isRegister = mode === "register";

  const switchMode = (next) => {
    if (next === mode) return;
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

  const passwordToggle = (
    <button
      type='button'
      className='field-action'
      onClick={()=>setShowPassword(v=>!v)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      aria-pressed={showPassword}
    >
      {showPassword ? <EyeOffIcon size={20}/> : <EyeIcon size={20}/>}
    </button>
  );

  return (
    <div className='auth'>

      <aside className='auth-brand'>
        <div className='auth-glow' aria-hidden='true'>
          <span className='orb o1'/><span className='orb o2'/><span className='orb o3'/>
        </div>

        <img src={assets.logo} alt='One stop' className='auth-logo' />

        <div className='auth-copy'>
          <h1>Run your store from anywhere.</h1>
          <p>Add products, track orders and keep deliveries moving, from your phone or your desk.</p>
        </div>

        <div className='auth-tiles' aria-hidden='true'>
          <span className='tile t1'><SmartphoneIcon size={30}/></span>
          <span className='tile t2'><LaptopIcon size={38}/></span>
          <span className='tile t3'><HeadphonesIcon size={28}/></span>
          <span className='tile t4'><MonitorIcon size={32}/></span>
        </div>
      </aside>

      <main className='auth-panel'>
        <form className='auth-card' onSubmit={onSubmitHandler}>

          <div className='auth-head' key={mode}>
            <h2>{isRegister ? "Create admin account" : "Admin sign in"}</h2>
            <p>{isRegister ? "You will need the invite code from the site owner." : "Sign in to manage products and orders."}</p>
          </div>

          <div className='seg' role='tablist' aria-label='Sign in or create account' style={{'--i': isRegister ? 1 : 0}}>
            <span className='seg-thumb' aria-hidden='true'/>
            <button type='button' role='tab' aria-selected={!isRegister} onClick={()=>switchMode("login")}>Sign in</button>
            <button type='button' role='tab' aria-selected={isRegister} onClick={()=>switchMode("register")}>Create account</button>
          </div>

          <div className='auth-fields'>
            {isRegister &&
              <Reveal>
                <Field icon={UserIcon} label='Your name' name='name' type='text' autoComplete='name' value={data.name} onChange={onChangeHandler} required />
              </Reveal>
            }

            <Field icon={MailIcon} label='Email' name='email' type='email' autoComplete='email' value={data.email} onChange={onChangeHandler} required />

            <Field
              icon={LockIcon}
              label='Password'
              name='password'
              type={passwordType}
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={isRegister ? 8 : undefined}
              value={data.password}
              onChange={onChangeHandler}
              action={passwordToggle}
              required
            />

            {isRegister &&
              <Reveal>
                <Field icon={LockIcon} label='Confirm password' name='confirmPassword' type={passwordType} autoComplete='new-password' value={data.confirmPassword} onChange={onChangeHandler} required />
                <Field icon={KeyIcon} label='Admin invite code' name='inviteCode' type='password' autoComplete='off' value={data.inviteCode} onChange={onChangeHandler} required />
                <p className='auth-hint'>Use at least 8 characters for your password.</p>
              </Reveal>
            }
          </div>

          <button type='submit' className='btn btn-primary auth-submit' disabled={loading}>
            {loading && <span className='spinner' aria-hidden='true'/>}
            {loading
              ? (isRegister ? "Creating account..." : "Signing in...")
              : (isRegister ? "Create account" : "Sign in")}
          </button>

        </form>
      </main>

    </div>
  );
}

export default Login;
