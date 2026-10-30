import { ArrowRight, Eye, EyeOff, Heart, Leaf, LockKeyhole, Mail, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import authCommunityImage from '../assets/civicfix-auth-community.png';
import { useAuth } from '../context/AuthContext';

const roles = ['reporter', 'coordinator', 'viewer'];

export default function AuthPage({ mode }) {
  const register = mode === 'register';
  const { login, register: signup } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'reporter' });

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

  return <main className="min-h-screen bg-[#eaf6ff] lg:grid lg:grid-cols-[1.08fr_.92fr]">
    <section className="relative hidden min-h-screen overflow-hidden lg:block">
      <img src={authCommunityImage} alt="Resident reporting a repaired streetlight in a clean community" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/50 to-transparent" />
      <div className="relative z-10 flex min-h-screen flex-col px-10 py-8 xl:px-16 xl:py-10">
        <Link to="/" className="flex w-fit items-center gap-3 text-3xl font-extrabold tracking-tight text-ink"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-brand-600 text-white shadow-lg"><Leaf /></span><span>Civic<span className="text-brand-600">Fix</span><small className="block text-xs font-medium tracking-normal text-slate-500">Cleaner Communities, Happier Lives</small></span></Link>

        <div className="mt-12 max-w-2xl xl:mt-16">
          <h1 className="text-5xl font-extrabold leading-[1.02] tracking-tight text-ink xl:text-6xl">Smaller Issues<br/><span className="bg-gradient-to-r from-teal-600 to-brand-600 bg-clip-text text-transparent">Brighter Communities</span></h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">Report local maintenance problems, follow their progress, and keep every resolution accountable.</p>
          <div className="mt-7 flex flex-wrap gap-5">
            {[[Leaf, 'Cleaner', 'Surroundings', 'bg-emerald-50 text-emerald-600'], [UsersRound, 'Safer', 'Communities', 'bg-blue-50 text-blue-600'], [Heart, 'Happier', 'Neighborhoods', 'bg-rose-50 text-rose-500']].map(([Icon, first, second, color]) => <div className="flex items-center gap-2.5" key={first}><span className={`grid h-11 w-11 place-items-center rounded-2xl ${color}`}><Icon className="h-5 w-5" /></span><p className="text-sm font-bold leading-4 text-ink">{first}<br/>{second}</p></div>)}
          </div>
        </div>

        <div className="mt-auto ml-auto w-72 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between"><div><p className="text-sm font-bold text-ink">Streetlight Not Working</p><p className="mt-1 text-xs text-slate-500">Block A · High priority</p></div><Sparkles className="h-5 w-5 text-amber-500" /></div>
          <div className="mt-4 space-y-2 text-xs">{['Submitted', 'Under Review', 'In Progress'].map((label, index) => <div className="flex items-center gap-2" key={label}><span className={`grid h-5 w-5 place-items-center rounded-full text-white ${index === 2 ? 'bg-brand-600' : 'bg-emerald-500'}`}>✓</span><span className={index === 2 ? 'font-bold text-brand-700' : 'text-slate-500'}>{label}</span></div>)}</div>
        </div>
      </div>
    </section>

    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-20 sm:px-10">
      <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-brand-100/70" /><div className="absolute -bottom-36 -left-20 h-80 w-80 rounded-full bg-teal-100/70" />
      <form onSubmit={submit} className="card relative z-10 w-full max-w-xl rounded-[2rem] border-white/80 bg-white/95 p-7 shadow-2xl backdrop-blur sm:p-10">
        <Link to="/" className="mb-8 flex items-center gap-2 text-xl font-extrabold lg:hidden"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-brand-600 text-white"><Leaf className="h-5 w-5" /></span>CivicFix</Link>
        <p className="text-sm font-bold uppercase tracking-wide text-brand-600">{register ? 'Join the community' : 'Welcome back'}</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{register ? 'Create your reporter account' : <>Sign in to <span className="text-brand-600">CivicFix</span></>}</h2>
        <p className="mt-3 text-slate-500">{register ? 'Create an account to report and track community issues.' : 'Choose your account role and enter its credentials.'}</p>

        <div className="mt-8 space-y-5">
          {register ? <>
            <div><label className="label" htmlFor="register-role">Create account as</label><select id="register-role" className="field" value="reporter" disabled><option>Reporter</option></select><p className="mt-1.5 text-xs text-slate-400">Coordinator and Viewer accounts are securely administrator-created.</p></div>
            <div><label className="label" htmlFor="full-name">Full name</label><input id="full-name" className="field" required minLength="2" placeholder="Your full name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></div>
          </> : <div><label className="label" htmlFor="login-role">Sign in as</label><select id="login-role" className="field" value={form.role} onChange={event => setForm({ ...form, role: event.target.value })}>{roles.map(role => <option value={role} key={role}>{role[0].toUpperCase() + role.slice(1)}</option>)}</select><p className="mt-1.5 text-xs text-slate-400">The selected role must match the account stored in CivicFix.</p></div>}

          <div><label className="label" htmlFor="auth-email">Email address</label><div className="relative"><Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" /><input id="auth-email" className="field pl-11" type="email" autoComplete="email" required placeholder="you@example.com" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></div></div>
          <div><label className="label" htmlFor="auth-password">Password</label><div className="relative"><LockKeyhole className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" /><input id="auth-password" className="field px-11" type={showPassword ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} required minLength="8" placeholder="Enter your password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:text-brand-600" onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div><p className="mt-1.5 text-xs text-slate-400">At least 8 characters, including a letter and number.</p></div>

          <button disabled={busy} className="btn-primary w-full py-3.5 text-base">{busy ? 'Please wait…' : register ? 'Create reporter account' : `Sign in as ${form.role}`}<ArrowRight className="h-5 w-5" /></button>
        </div>

        <div className="my-7 flex items-center gap-4 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" /><ShieldCheck className="h-4 w-4" /><span className="h-px flex-1 bg-slate-200" /></div>
        <p className="text-center text-sm text-slate-500">{register ? 'Already have an account?' : 'New to CivicFix?'} <Link className="font-bold text-brand-600" to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create an account'}</Link></p>
      </form>
    </section>
  </main>;
}
