import { useState } from 'react'
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

  const handleNavigate = (target, payload) => {
    if (target === 'Create') {
      setMode('create')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Edit') {
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
  }

  return (
    <div className="shell">
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <Header
        tab={mode === 'list' ? tab : ''}
        onTab={(newTab) => {
          setCategoryPreset('All')
          handleNavigate(newTab)
        }}
        onNavigateCreate={() => handleNavigate('Create')}
      />

      <main className="main">
        {mode === 'create' && (
          <CreateHardwarePage
            onBack={handleBackToList}
            onSuccess={() => {
              handleBackToList()
              setTab('Catalog')
            }}
          />
        )}

        {mode === 'edit' && (
          <EditHardwarePage
            item={editingHardware}
            itemId={editingHardware?.id}
            onBack={handleBackToList}
            onSuccess={() => {
              handleBackToList()
              setTab('Catalog')
            }}
          />
        )}

        {mode === 'detail' && selectedHardware && (
          <HardwareDetail
            item={selectedHardware}
            onBack={handleBackToList}
            onEdit={(hw) => handleNavigate('Edit', hw)}
            onDelete={(hw) => setDeleteTarget(hw)}
          />
        )}

        {mode === 'list' && (
          <>
            {tab === 'Catalog' && (
              <CatalogPage
                key={categoryPreset}
                initialCategory={categoryPreset}
                onNavigate={(dest, payload) => handleNavigate(dest, payload)}
              />
            )}

            {tab === 'StockLogs' && (
              <StockLogsPage
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
                onSelectCategory={(catName) => {
                  setCategoryPreset(catName)
                  setTab('Catalog')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            )}

            {tab === 'Profile' && (
              <ProfilePage onReplaySplash={() => setShowSplash(true)} />
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

      {/* Bottom Navigation Bar wajib sesuai ketentuan Tugas Akhir */}
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
