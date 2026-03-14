import { FormEvent, useState } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { useAuth } from '../auth';

type LocationState = {
  from?: Location;
};

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const state = location.state as LocationState | null;
  const destination = state?.from?.pathname ?? '/';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    try {
      await login(username.trim(), password);
      navigate(destination, { replace: true });
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Login failed. Please try again.');
      }
    }
  }

  return (
    <div className="app-bg">
      <div className="phone-shell">
        <section className="content">
        <h1 className="page-title">Welcome Back</h1>
        <p className="subtitle">Sign in to manage your sites.</p>

        <article className="card auth-card">
          <div className="card-head">
            <h2>LOGIN</h2>
          </div>

          <form className="form-grid auth-form" onSubmit={handleSubmit}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              placeholder="Enter username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

            <button className="primary-btn" type="submit" disabled={isLoading}>
              {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>
        </article>

        <p className="hint-text">Demo: admin / admin123</p>
        </section>
      </div>
    </div>
  );
}
