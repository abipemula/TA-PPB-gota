import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import BottomNav from './components/BottomNav.jsx'
import Footer from './components/Footer.jsx'
import CatalogPage from './pages/CatalogPage.jsx'
import StockLogsPage from './pages/StockLogsPage.jsx'
import FavoritesPage from './pages/FavoritesPage.jsx'
import WarehousePage from './pages/WarehousePage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import CreateHardwarePage from './pages/CreateHardwarePage.jsx'
import EditHardwarePage from './pages/EditHardwarePage.jsx'
import HardwareDetail from './components/hardware/HardwareDetail.jsx'
import PWABadge from './components/PWABadge.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import hardwareService from './services/hardwareService.js'
import authService from './services/authService.js'
import './App.css'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState('Catalog')
  const [categoryPreset, setCategoryPreset] = useState('All')
  const [mode, setMode] = useState('list') // 'list' | 'create' | 'edit' | 'detail'
  const [selectedHardware, setSelectedHardware] = useState(null)
  const [editingHardware, setEditingHardware] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [dataVersion, setDataVersion] = useState(0)
  const [isAdmin, setIsAdmin] = useState(() => authService.isLoggedIn())

  useEffect(() => {
    const syncAuth = () => setIsAdmin(authService.isLoggedIn())
    window.addEventListener('riglog-auth-changed', syncAuth)
    authService.verify().then((valid) => setIsAdmin(valid))
    return () => window.removeEventListener('riglog-auth-changed', syncAuth)
  }, [])

  const bumpDataVersion = () => setDataVersion((v) => v + 1)

  const handleNavigate = (target, payload) => {
    if (target === 'Create') {
      if (!isAdmin) {
        setTab('Profile')
        setMode('list')
        return
      }
      setMode('create')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Edit') {
      if (!isAdmin) {
        setTab('Profile')
        setMode('list')
        return
      }
      setEditingHardware(payload)
      setMode('edit')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Detail') {
      setSelectedHardware(payload)
      setMode('detail')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setTab(target)
      setMode('list')
      setSelectedHardware(null)
      setEditingHardware(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBackToList = () => {
    setMode('list')
    setSelectedHardware(null)
    setEditingHardware(null)
    bumpDataVersion()
  }

  return (
    <div className="shell">
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <Header
        isAdmin={isAdmin}
        onGoHome={() => {
          setCategoryPreset('All')
          handleNavigate('Catalog')
        }}
        onGoProfile={() => handleNavigate('Profile')}
        onNavigateCreate={() => handleNavigate('Create')}
      />

      <main className="main">
        {mode === 'create' && isAdmin && (
          <CreateHardwarePage
            onBack={handleBackToList}
            onSuccess={() => {
              bumpDataVersion()
              handleBackToList()
              setTab('Catalog')
            }}
          />
        )}

        {mode === 'edit' && isAdmin && (
          <EditHardwarePage
            item={editingHardware}
            itemId={editingHardware?.id}
            onBack={handleBackToList}
            onSuccess={() => {
              bumpDataVersion()
              handleBackToList()
              setTab('Catalog')
            }}
          />
        )}

        {mode === 'detail' && selectedHardware && (
          <HardwareDetail
            item={selectedHardware}
            isAdmin={isAdmin}
            onBack={handleBackToList}
            onEdit={isAdmin ? (hw) => handleNavigate('Edit', hw) : undefined}
            onDelete={isAdmin ? (hw) => setDeleteTarget(hw) : undefined}
            onStockUpdated={bumpDataVersion}
          />
        )}

        {mode === 'list' && (
          <>
            {tab === 'Catalog' && (
              <CatalogPage
                key={`${categoryPreset}-${dataVersion}`}
                initialCategory={categoryPreset}
                isAdmin={isAdmin}
                onNavigate={(dest, payload) => handleNavigate(dest, payload)}
              />
            )}

            {tab === 'StockLogs' && (
              <StockLogsPage
                key={`logs-${dataVersion}`}
                isAdmin={isAdmin}
                onInspectProduct={(hw) => handleNavigate('Detail', hw)}
              />
            )}

            {tab === 'Favorites' && (
              <FavoritesPage
                onSelectHardware={(hw) => handleNavigate('Detail', hw)}
                onNavigateCatalog={() => setTab('Catalog')}
              />
            )}

            {tab === 'Warehouse' && (
              <WarehousePage
                isAdmin={isAdmin}
                onSelectCategory={(catName) => {
                  setCategoryPreset(catName)
                  setTab('Catalog')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            )}

            {tab === 'Profile' && (
              <ProfilePage
                isAdmin={isAdmin}
                onAuthChange={(loggedIn) => setIsAdmin(loggedIn)}
                onReplaySplash={() => setShowSplash(true)}
              />
            )}
          </>
        )}
      </main>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Komponen dari Gudang?"
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        danger
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            setDeleting(true)
            await hardwareService.deleteProduct(deleteTarget.id)
            setDeleteTarget(null)
            bumpDataVersion()
            handleBackToList()
            setTab('Catalog')
          } catch (err) {
            alert(err.message || 'Gagal menghapus komponen.')
          } finally {
            setDeleting(false)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <PWABadge />
      <Footer />

      {/* Navigasi utama dipusatkan di Bottom Navigation Bar */}
      <BottomNav
        activeTab={mode === 'list' ? tab : ''}
        onSelectTab={(newTab) => {
          setCategoryPreset('All')
          handleNavigate(newTab)
        }}
      />
    </div>
  )
}

export default App
