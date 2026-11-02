import { ArrowRight, Eye, EyeOff, Leaf, LockKeyhole, Mail } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roles = ['reporter', 'coordinator'];

export default function AuthPage({ mode }) {
  const register = mode === 'register';
  const { login, register: signup, loginWithGoogle, continueAsViewer } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'reporter' });
  const googleBtnRef = useRef(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const onAuthSuccess = (user, isGoogle = false) => {
    toast.success(isGoogle ? `Signed in with Google as ${user.name}` : register ? 'Welcome to CivicFix!' : `Signed in as ${user.role}`);
    navigate(user.role === 'coordinator' ? '/coordinator' : user.role === 'reporter' ? '/dashboard' : '/viewer');
  };

  const handleGoogleCredential = useCallback(async (credential, mockUser = null) => {
    setBusy(true);
    try {
      const user = await loginWithGoogle(credential, form.role, mockUser);
      onAuthSuccess(user, true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Google authentication failed.');
    } finally {
      setBusy(false);
    }
  }, [form.role, loginWithGoogle]);

  // Initialize official Google Identity Services
  useEffect(() => {
    if (!googleClientId) return;

    let mounted = true;
    const initGoogle = () => {
      if (!mounted || !window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (res) => {
            if (res.credential) handleGoogleCredential(res.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: register ? 'signup_with' : 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 340
          });
        }
      } catch (err) {
        console.warn('Google Identity Services initialization warning:', err);
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          initGoogle();
        }
      }, 100);
      return () => {
        mounted = false;
        clearInterval(checkInterval);
      };
    }

    return () => {
      mounted = false;
    };
  }, [googleClientId, register, handleGoogleCredential]);

  const handleFallbackGoogleClick = () => {
    if (window.google?.accounts?.id && googleClientId) {
      window.google.accounts.id.prompt();
    } else {
      const email = prompt('Enter your Google email address for quick dev sign-in:', 'kolakishore19@gmail.com');
      if (email) {
        const name = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase());
        handleGoogleCredential('mock-google-token-quick', {
          sub: 'g_' + btoa(email).slice(0, 16),
          email: email.trim().toLowerCase(),
          name,
          picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80'
        });
      }
    }
  };

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
      onAuthSuccess(user, false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not reach CivicFix. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
    <div className="w-full max-w-md">
      <Link to="/" className="mx-auto mb-8 flex w-fit items-center gap-2 text-2xl font-extrabold">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white"><Leaf className="h-5 w-5"/></span>
        <span>Civic<span className="text-brand-600">Fix</span></span>
      </Link>

      <div className="card p-6 sm:p-8 shadow-sm border border-slate-200/80">
        <h1 className="text-2xl font-extrabold text-slate-900">{register ? 'Create reporter account' : 'Sign in to CivicFix'}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {register ? 'Fast signup with Google or your email address.' : 'Sign in quickly with Google or your credentials.'}
        </p>

        {/* Role selector for login */}
        {!register && (
          <div className="mt-5">
            <label className="label" htmlFor="login-role">Signing in as</label>
            <select id="login-role" className="field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              {roles.map(r => <option value={r} key={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
        )}

        {/* Google Authentication Section */}
        <div className="mt-6">
          <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]"></div>

          {!googleClientId && (
            <button
              type="button"
              disabled={busy}
              onClick={handleFallbackGoogleClick}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400 focus:outline-none"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{register ? 'Sign up with Google' : 'Continue with Google'}</span>
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 font-semibold text-slate-400">Or with email</span>
          </div>
        </div>

        {/* Regular Email/Password Form */}
        <form onSubmit={submit} className="space-y-4">
          {register && (
            <div>
              <label className="label" htmlFor="full-name">Full name</label>
              <input id="full-name" className="field" required minLength="2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
            </div>
          )}

          <div>
            <label className="label" htmlFor="auth-email">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400"/>
              <input id="auth-email" className="field pl-11" type="email" autoComplete="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="auth-password">Password</label>
            <div className="relative">
              <LockKeyhole className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400"/>
              <input id="auth-password" className="field px-11" type={showPassword ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} required minLength="8" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/>
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:text-slate-600" onClick={() => setShowPassword(v => !v)}>
                {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">At least 8 characters, including a letter and number.</p>
          </div>

          <button disabled={busy} className="btn-primary w-full py-3.5">
            {busy ? 'Please wait…' : register ? 'Create account' : `Sign in as ${form.role}`}
            <ArrowRight className="h-4 w-4"/>
          </button>

          {!register && (
            <button type="button" disabled={busy} onClick={handleGuestViewer} className="btn-secondary w-full py-3">
              Continue as Viewer
            </button>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {register ? 'Already have an account?' : 'New to CivicFix?'}{' '}
          <Link className="font-bold text-brand-600 hover:underline" to={register ? '/login' : '/register'}>
            {register ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </div>
    </div>
  </main>;
}
