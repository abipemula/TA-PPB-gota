import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import './SplashScreen.css'

export default function SplashScreen({ onFinish, duration = 2200 }) {
  const [isFading, setIsFading] = useState(false)
  const dismissedRef = useRef(false)

  const handleDismiss = useCallback(() => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    setIsFading(true)
    setTimeout(() => {
      if (onFinish) onFinish()
    }, 450)
  }, [onFinish])

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, handleDismiss])

  return (
    <main
      className={`splash-overlay ${isFading ? 'splash-overlay--fading' : ''}`}
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-label="RigLog Intro"
    >
      <div className="splash-chip">
        <img src="/logo.jpg" alt="RigLog Logo" className="splash-logo-img" />
      </div>
      <div className="splash-brand-name">RIGLOG</div>
      <div className="splash-brand-sub">
        SISTEM INVENTARIS GUDANG &amp; KATALOG KOMPONEN PC
      </div>
      <button
        type="button"
        className="splash-skip-btn"
        onClick={(e) => {
          e.stopPropagation()
          handleDismiss()
        }}
      >
        <span>Masuk ke Sistem Gudang</span>
        <ArrowRight size={15} />
      </button>
    </main>
  )
}
