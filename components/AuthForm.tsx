'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { authDestination } from '@/lib/auth-destination';
import { money } from '@/lib/competition';

export default function AuthForm({ mode, next, variant, prize, callbackError }: { mode: 'login' | 'signup'; next?: string; variant?: string; prize: number; callbackError?: string }) {
  const signup = mode === 'signup';
  const destination = authDestination(next ?? null);
  const direction = variant === 'b' ? 'b' : 'a';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<'email' | 'google' | null>(null);
  const [error, setError] = useState(callbackError ? 'That sign-in link could not be verified. Please try signing in again.' : '');
  const [confirmed, setConfirmed] = useState(false);
  const router = useRouter();
  const alternate = `/${signup ? 'login' : 'signup'}?next=${encodeURIComponent(destination)}&variant=${direction}`;
  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`;
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy('email'); setError('');
    try {
      const supabase = createClient();
      if (signup) {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: callback() } });
        if (error) throw error;
        if (!data.session) { setConfirmed(true); return; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { error: profileError } = await supabase.from('profiles').upsert({ id: user.id, email: user.email }, { onConflict: 'id', ignoreDuplicates: true });
        if (profileError) throw new Error('Signed in, but your creator profile could not be prepared. Please try again.');
      }
      router.push(destination); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to continue. Please try again.'); }
    finally { setBusy(null); }
  }
  async function google() {
    setBusy('google'); setError('');
    try {
      const { error } = await createClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callback() } });
      if (error) throw error;
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to connect to Google.'); setBusy(null); }
  }
  return <div className={`auth-shell auth-${direction}`}>
    {direction === 'b' && <aside className="auth-story"><p className="eyebrow">A place for your point of view</p><h1>You make it.<br /><em>We watch.</em></h1><p>Join a community making something new with AI. Your next short film could be someone’s next favorite.</p><div className="auth-prize"><strong>{money(prize)}</strong><span>today’s cash prize<br />paid in USDC</span></div><ol><li>Create your account</li><li>Upload a video and pick a day</li><li>Share your work with the community</li></ol></aside>}
    <section className="auth-card"><Link href={`/?variant=${direction}`} className="auth-back">← Back to the films</Link>
      {confirmed ? <div className="confirmation" role="status"><span className="confirmation-icon">↗</span><h1>Check your inbox.</h1><p>We’ve sent a confirmation link to <strong>{email}</strong>. Open it to continue to your submission.</p><p>Can’t find it? Check spam, or make sure you entered the right address.</p><button className="action-secondary" onClick={() => { setConfirmed(false); setPassword(''); }}>Use a different email</button><Link className="action-primary" href={alternate}>Go to sign in</Link></div> : <>
        <p className="eyebrow">{signup ? 'Your film is next' : 'Welcome back'}</p><h1>{signup ? 'Join the next screening.' : 'Back to creating.'}</h1><p className="auth-intro">{signup ? 'Create an account to submit your video.' : 'Sign in to upload and manage your films.'} {direction === 'a' && `Today’s cash prize: ${money(prize)} in USDC.`}</p>
        <button className="google-button" onClick={google} disabled={!!busy}><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"/></svg>{busy === 'google' ? 'Connecting…' : 'Continue with Google'}</button>
        <div className="auth-divider">or use email</div><form onSubmit={submit}>
          <label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" disabled={!!busy} />
          <label htmlFor="password">Password</label><div className="password-field"><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} minLength={signup ? 6 : undefined} required value={password} onChange={event => setPassword(event.target.value)} disabled={!!busy} aria-describedby={signup ? 'password-hint' : undefined} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div>
          {signup && <p id="password-hint" className="password-hint">Use at least 6 characters.</p>}
          <button type="submit" className="action-primary" disabled={!!busy}>{busy === 'email' ? 'Please wait…' : signup ? 'Create account & continue' : 'Sign in & continue'} <span>↗</span></button>
        </form>{error && <p className="auth-error" role="alert">{error}</p>}<p className="auth-alternate">{signup ? 'Already have an account?' : 'New to Uvacha?'} <Link href={alternate}>{signup ? 'Sign in' : 'Create an account'}</Link></p><p className="auth-footnote">You can add your profile details and wallet later.</p>
      </>}
    </section>
  </div>;
}
