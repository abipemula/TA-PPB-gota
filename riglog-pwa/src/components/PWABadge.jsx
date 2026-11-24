import { useState, useEffect } from 'react'
import { Download, WifiOff, X, Smartphone } from 'lucide-react'

/**
 * PWABadge — Tombol Install PWA permanen di pojok kanan bawah + indikator offline.
 * Jika browser mendukung beforeinstallprompt, langsung memicu dialog install native.
 * Jika belum tersedia (misal Safari iOS / HTTP), menampilkan panduan install 1-klik.
 */
export default function PWABadge() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    )
  })
  const [showGuideModal, setShowGuideModal] = useState(false)

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    const handleAppInstalled = () => {
      setIsStandalone(true)
      setInstallPrompt(null)
      setShowGuideModal(false)
    }
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') {
        setIsStandalone(true)
      }
      setInstallPrompt(null)
      return
    }
    setShowGuideModal(true)
  }

  return (
    <>
      {isOffline && (
        <aside
          className="pwa-offline-bar"
          role="status"
          aria-live="polite"
        >
          <WifiOff size={15} />
          <span>Mode Offline — Menampilkan data cache terakhir.</span>
        </aside>
      )}

      {/* Opsi Install App permanen di pojok kanan bawah (di atas BottomNav) */}
      {!isStandalone && (
        <button
          type="button"
          className="pwa-fab-install"
          onClick={handleInstallClick}
          title="Install Aplikasi RigLog ke perangkat"
          aria-label="Install Aplikasi RigLog"
        >
          <Download size={17} />
          <span>Install App</span>
        </button>
      )}

      {showGuideModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="modal-box"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={22} color="#ec1c24" />
                <h3 className="modal-title display" style={{ margin: 0 }}>
                  Cara Install RigLog PWA
                </h3>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowGuideModal(false)}
                aria-label="Tutup"
              >
                <X size={16} />
              </button>
            </div>
            <p className="modal-msg" style={{ marginBottom: '6px' }}>
              Jika dialog install otomatis belum muncul pada browser Anda, pasang secara manual dengan langkah berikut:
            </p>
            <ol className="detail-steps" style={{ fontSize: '0.86rem', marginBottom: '12px' }}>
              <li>
                <strong>Chrome / Edge Desktop:</strong> Klik ikon <em>Install</em> (layar dengan panah bawah) di ujung kanan address bar, atau klik menu <strong>⋮ → Cast, save, and share → Install RigLog</strong>.
              </li>
              <li>
                <strong>Android (Chrome):</strong> Ketuk menu <strong>⋮</strong> di pojok kanan atas → pilih <strong>Add to Home Screen / Install App</strong>.
              </li>
              <li>
                <strong>iPhone (Safari):</strong> Ketuk tombol <strong>Share</strong> → pilih <strong>Add to Home Screen</strong>.
              </li>
            </ol>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn modal-btn--confirm"
                onClick={() => setShowGuideModal(false)}
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
