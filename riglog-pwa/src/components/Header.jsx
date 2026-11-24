import { Plus, ShieldCheck, Lock } from 'lucide-react'

/**
 * Header — Top bar ringkas (Navigasi 5 halaman utama dipusatkan di BottomNav bawah).
 */
function Header({ isAdmin, onGoHome, onGoProfile, onNavigateCreate }) {
  return (
    <header className="header">
      <div
        className="header-brand-wrap"
        onClick={onGoHome}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
      >
        <div className="header-logo-badge">
          <img src="/logo.jpg" alt="RigLog Logo" className="brand-logo-img" />
        </div>
        <div>
          <span className="brand display">RIGLOG</span>
          <span className="brand-tag">INVENTORY &amp; HARDWARE CATALOG</span>
        </div>
      </div>

      <div className="header-right-actions">
        <button
          type="button"
          className={`admin-pill ${isAdmin ? 'admin-pill--active' : ''}`}
          onClick={onGoProfile}
          title={
            isAdmin
              ? 'Mode Admin Aktif — Klik untuk kelola profil/logout'
              : 'Mode Pengunjung — Klik untuk login Admin'
          }
        >
          {isAdmin ? (
            <>
              <ShieldCheck size={14} /> Admin Aktif
            </>
          ) : (
            <>
              <Lock size={14} /> Login Admin
            </>
          )}
        </button>

        {isAdmin && onNavigateCreate && (
          <button
            type="button"
            className="btn btn--primary btn--sm header-cta"
            onClick={onNavigateCreate}
            title="Tambah Komponen Baru ke Katalog"
          >
            <Plus size={15} /> Komponen Baru
          </button>
        )}
      </div>
    </header>
  )
}

export default Header
