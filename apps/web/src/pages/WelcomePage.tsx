import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function WelcomePage() {
  const navigate = useNavigate();
  const [showHi, setShowHi] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setShowHi(true), 200),
      window.setTimeout(() => setShowWelcome(true), 1100),
      window.setTimeout(() => setShowCta(true), 2000),
    ];
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, []);

  return (
    <div className="onboard-screen onboard-welcome">
      <div className="onboard-inner">
        <h1 className={`greet-hi ${showHi ? 'is-in' : ''}`}>Hi</h1>
        <h2 className={`greet-welcome ${showWelcome ? 'is-in' : ''}`}>Welcome</h2>
        <div className={`greet-cta ${showCta ? 'is-in' : ''}`}>
          <button type="button" className="btn btn-primary onboard-cta" onClick={() => navigate('/login')}>
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
