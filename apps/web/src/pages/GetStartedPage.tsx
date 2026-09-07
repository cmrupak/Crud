import { Link } from 'react-router-dom';

export function GetStartedPage() {
  return (
    <div className="onboard-screen">
      <div className="onboard-panel">
        <p className="onboard-kicker brand-color">Get started</p>
        <h1>How would you like to continue?</h1>
        <p className="muted">Choose the option that fits you best.</p>
        <div className="onboard-choices">
          <Link className="onboard-choice primary" to="/register">
            <strong>New User</strong>
            <span>Create New Account</span>
          </Link>
          <Link className="onboard-choice" to="/continue">
            <strong>Existing User</strong>
            <span>Continue</span>
          </Link>
        </div>
        <p className="muted" style={{ marginTop: 18 }}>
          <Link to="/welcome">Back</Link>
        </p>
      </div>
    </div>
  );
}
