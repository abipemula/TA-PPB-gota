import { Plus, ShieldCheck, Lock, LogOut } from 'lucide-react'

/**
 * Header — Top bar ringkas (Navigasi 5 halaman utama dipusatkan di BottomNav bawah).
 * Saat Mode Admin Aktif, arahkan kursor ke badge "Admin Aktif" untuk menampilkan
 * popup "Keluar Mode Admin" langsung di bawahnya tanpa konfirmasi.
 */
function Header({
  isAdmin,
  onGoHome,
  onGoProfile,
  onLogoutAdmin,
  onNavigateCreate,
}) {
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
        {isAdmin ? (
          <div className="admin-menu-wrap">
            <button
              type="button"
              className="admin-pill admin-pill--active"
              onClick={onGoProfile}
              title="Arahkan kursor untuk keluar Mode Admin"
            >
              <ShieldCheck size={14} /> Admin Aktif
            </button>

            {/* Popup langsung muncul di bawah saat kursor mengarah ke Admin Aktif */}
            <div className="admin-dropdown-bridge">
              <div className="admin-dropdown-popup">
                <button
                  type="button"
                  className="admin-dropdown-logout-btn"
                  onClick={onLogoutAdmin}
                >
                  <LogOut size={14} /> Keluar Mode Admin
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="admin-pill"
            onClick={onGoProfile}
            title="Mode Pengunjung — Klik untuk login Admin"
          >
            <Lock size={14} /> Login Admin
          </button>
        )}

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
