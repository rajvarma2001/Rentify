import { useEffect } from 'react'
import './SplashScreen.css'

function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1800); // 1.8 seconds loading screen
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="splash-container">
      <div className="splash-glow"></div>
      <div className="splash-content">
        <div className="splash-logo">🔑</div>
        <h1 className="splash-title">Rentify</h1>
        <p className="splash-tagline">Rent Management Made Simple</p>
        <div className="splash-loader">
          <div className="splash-loader-bar"></div>
        </div>
      </div>
    </div>
  )
}

export default SplashScreen;
