import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DataMasterHubScreen from './screens/DataMasterHub';
import DaftarBarangScreen from './screens/DaftarBarangScreen';
import ItemEditScreen from './screens/ItemEditScreen';
import StubScreen from './screens/StubScreen';

export default function App() {
  const [currentMenu, setCurrentMenu] = useState('Data Master');
  const [viewState, setViewState] = useState('hub'); // 'hub', 'barang', 'edit', or menu name
  const [editingItemId, setEditingItemId] = useState(null); // For /barang/edit?id=N

  /**
   * 🧭 URL Routing Synchronization
   * Syncs browser URL path with application state and vice versa.
   * Enables direct bookmarking (e.g., /barang) and browser back/forward navigation.
   */
  useEffect(() => {
    const handlePopState = () => {
      syncAppStateFromURL();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  /**
   * Parse URL pathname and update app state accordingly
   */
  const syncAppStateFromURL = () => {
    const path = window.location.pathname;
    
    // Extract the route segment (e.g., /barang, /stok, /)
    const segments = path.split('/').filter(Boolean);
    const route = segments[0] || 'home';
    const subroute = segments[1]; // e.g., 'edit' from /barang/edit

    // Check for /barang/edit?id=N
    if (route === 'barang' && subroute === 'edit') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      setCurrentMenu('Data Master');
      setViewState('edit');
      setEditingItemId(id);
    } else if (route === 'barang') {
      setCurrentMenu('Data Master');
      setViewState('barang');
    } else if (route === 'stok') {
      setCurrentMenu('Stok');
      setViewState('stok');
    } else if (route === 'penjualan') {
      setCurrentMenu('Penjualan');
      setViewState('penjualan');
    } else if (route === 'pembelian') {
      setCurrentMenu('Pembelian');
      setViewState('pembelian');
    } else if (route === 'keuangan') {
      setCurrentMenu('Keuangan');
      setViewState('keuangan');
    } else if (route === 'laporan') {
      setCurrentMenu('Laporan');
      setViewState('laporan');
    } else if (route === 'pengaturan') {
      setCurrentMenu('Pengaturan');
      setViewState('pengaturan');
    } else if (route === 'home' || route === '') {
      setCurrentMenu('Beranda');
      setViewState('beranda');
    }
  };

  /**
   * Update URL when internal navigation occurs
   */
  const navigateTo = (menuItem, subView) => {
    let newPath = '/';

    if (subView === 'barang') {
      newPath = '/barang';
    } else if (subView === 'hub') {
      newPath = '/';
    } else if (menuItem === 'Stok') {
      newPath = '/stok';
    } else if (menuItem === 'Penjualan') {
      newPath = '/penjualan';
    } else if (menuItem === 'Pembelian') {
      newPath = '/pembelian';
    } else if (menuItem === 'Keuangan') {
      newPath = '/keuangan';
    } else if (menuItem === 'Laporan') {
      newPath = '/laporan';
    } else if (menuItem === 'Pengaturan') {
      newPath = '/pengaturan';
    } else if (menuItem === 'Beranda') {
      newPath = '/';
    }

    window.history.pushState(null, '', newPath);
    setCurrentMenu(menuItem);
    setViewState(subView);
  };

  /**
   * Navigate to item edit screen
   */
  const navigateToEdit = (itemId) => {
    const newPath = `/barang/edit?id=${itemId}`;
    window.history.pushState(null, '', newPath);
    setCurrentMenu('Data Master');
    setViewState('edit');
    setEditingItemId(itemId);
  };

  /**
   * Sidebar menu click handler
   */
  const handleMenuTransition = (menuItem) => {
    if (menuItem === 'Data Master') {
      navigateTo(menuItem, 'hub');
    } else {
      navigateTo(menuItem, menuItem.toLowerCase().replace(/\s+/g, '-'));
    }
  };

  /**
   * Sub-view navigation handler (e.g., Data Master -> Daftar Barang)
   * Maps friendly names to URL paths
   */
  const handleSelectSubView = (subView) => {
    // Handle DataMasterHub passing 'daftar-barang'
    if (subView === 'daftar-barang') {
      navigateTo('Data Master', 'barang');
    } else {
      navigateTo(currentMenu, subView);
    }
  };

  /**
   * Back button handler (returns to hub)
   */
  const handleBack = () => {
    navigateTo('Data Master', 'hub');
  };

  // Initialize route from current URL on mount
  useEffect(() => {
    syncAppStateFromURL();
  }, []);

  return (
    <div className="flex h-screen bg-[#0f131c] text-slate-100 font-sans overflow-hidden antialiased">
      <Sidebar activeMenu={currentMenu} onMenuChange={handleMenuTransition} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={currentMenu} />
        
        <main className="flex-1 overflow-y-auto p-8 bg-[#0f131c]">
          {currentMenu === 'Data Master' && viewState === 'hub' && (
            <DataMasterHubScreen onSelectSubView={handleSelectSubView} />
          )}
          
          {viewState === 'edit' && editingItemId && (
            <ItemEditScreen 
              itemId={editingItemId} 
              onBack={handleBack}
            />
          )}
          
          {(viewState === 'barang' || viewState === 'daftar-barang') && (
            <DaftarBarangScreen 
              onBack={handleBack}
              onEditItem={navigateToEdit}
            />
          )}

          {viewState !== 'hub' && viewState !== 'barang' && viewState !== 'daftar-barang' && viewState !== 'edit' && viewState !== 'beranda' && (
            <StubScreen targetFeature={currentMenu} />
          )}

          {viewState === 'beranda' && (
            <StubScreen targetFeature="Beranda" />
          )}
        </main>
      </div>
    </div>
  );
}