import { ArrowRight, Eye, EyeOff, Leaf, LockKeyhole, Mail } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roles = ['reporter', 'coordinator'];

export default function AuthPage({ mode }) {
  const register = mode === 'register';
  const { login, register: signup, continueAsViewer } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'reporter' });

  const handleGuestViewer = async () => {
    setBusy(true);
    try {
      if (continueAsViewer) await continueAsViewer();
      navigate('/viewer');
    } finally {
      setBusy(false);
    }
  };

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    try {
      const user = await (register
        ? signup({ name: form.name, email: form.email, password: form.password })
        : login({ email: form.email, password: form.password, role: form.role }));
      toast.success(register ? 'Welcome to CivicFix!' : `Signed in as ${user.role}`);
      navigate(user.role === 'coordinator' ? '/coordinator' : user.role === 'reporter' ? '/dashboard' : '/viewer');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not reach CivicFix. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
    <div className="w-full max-w-md">
      <Link to="/" className="mx-auto mb-8 flex w-fit items-center gap-2 text-2xl font-extrabold"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white"><Leaf className="h-5 w-5"/></span><span>Civic<span className="text-brand-600">Fix</span></span></Link>
      <form onSubmit={submit} className="card p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold">{register ? 'Create reporter account' : 'Sign in to CivicFix'}</h1>
        <p className="mt-2 text-sm text-slate-500">{register ? 'Report and track community maintenance issues.' : 'Enter your role and account credentials.'}</p>
        <div className="mt-7 space-y-5">
          {register ? <div><label className="label" htmlFor="full-name">Full name</label><input id="full-name" className="field" required minLength="2" value={form.name} onChange={event=>setForm({...form,name:event.target.value})}/></div> : <div><label className="label" htmlFor="login-role">Sign in as</label><select id="login-role" className="field" value={form.role} onChange={event=>setForm({...form,role:event.target.value})}>{roles.map(role=><option value={role} key={role}>{role[0].toUpperCase()+role.slice(1)}</option>)}</select></div>}
          <div><label className="label" htmlFor="auth-email">Email address</label><div className="relative"><Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400"/><input id="auth-email" className="field pl-11" type="email" autoComplete="email" required value={form.email} onChange={event=>setForm({...form,email:event.target.value})}/></div></div>
          <div><label className="label" htmlFor="auth-password">Password</label><div className="relative"><LockKeyhole className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400"/><input id="auth-password" className="field px-11" type={showPassword?'text':'password'} autoComplete={register?'new-password':'current-password'} required minLength="8" value={form.password} onChange={event=>setForm({...form,password:event.target.value})}/><button type="button" aria-label={showPassword?'Hide password':'Show password'} className="absolute right-3 top-3 rounded-lg p-1 text-slate-400" onClick={()=>setShowPassword(value=>!value)}>{showPassword?<EyeOff className="h-5 w-5"/>:<Eye className="h-5 w-5"/>}</button></div><p className="mt-1.5 text-xs text-slate-400">At least 8 characters, including a letter and number.</p></div>
          <button disabled={busy} className="btn-primary w-full py-3.5">{busy?'Please wait…':register?'Create account':`Sign in as ${form.role}`}<ArrowRight className="h-4 w-4"/></button>
          {!register && <button type="button" disabled={busy} onClick={handleGuestViewer} className="btn-secondary w-full py-3.5">Continue as Viewer</button>}
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">{register?'Already have an account?':'New to CivicFix?'} <Link className="font-bold text-brand-600" to={register?'/login':'/register'}>{register?'Sign in':'Create an account'}</Link></p>
      </form>
    </div>
  </main>;
}
