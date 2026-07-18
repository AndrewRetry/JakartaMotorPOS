import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DataMasterHubScreen from './screens/DataMasterHub';
import DaftarBarangScreen from './screens/DaftarBarangScreen';
import ItemEditScreen from './screens/ItemEditScreen';
import ItemCreateScreen from './screens/ItemCreateScreen';
import StubScreen from './screens/StubScreen';

export default function App() {
  const [currentMenu, setCurrentMenu] = useState('Data Master');
  const [viewState, setViewState] = useState('hub'); // 'hub', 'barang', 'create', 'edit', or menu name
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
    const subroute = segments[1]; // e.g., 'edit' or 'create' from /barang/edit or /barang/create

    // Check for /barang/create
    if (route === 'barang' && subroute === 'create') {
      setCurrentMenu('Data Master');
      setViewState('create');
    }
    // Check for /barang/edit?id=N
    else if (route === 'barang' && subroute === 'edit') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      setCurrentMenu('Data Master');
      setViewState('edit');
      setEditingItemId(id);
    } 
    else if (route === 'barang') {
      setCurrentMenu('Data Master');
      setViewState('barang');
    } 
    else if (route === 'stok') {
      setCurrentMenu('Stok');
      setViewState('stok');
    } 
    else if (route === 'penjualan') {
      setCurrentMenu('Penjualan');
      setViewState('penjualan');
    } 
    else if (route === 'pembelian') {
      setCurrentMenu('Pembelian');
      setViewState('pembelian');
    } 
    else if (route === 'keuangan') {
      setCurrentMenu('Keuangan');
      setViewState('keuangan');
    } 
    else if (route === 'laporan') {
      setCurrentMenu('Laporan');
      setViewState('laporan');
    } 
    else if (route === 'pengaturan') {
      setCurrentMenu('Pengaturan');
      setViewState('pengaturan');
    } 
    else if (route === 'home' || route === '') {
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
    } 
    else if (subView === 'hub') {
      newPath = '/';
    } 
    else if (menuItem === 'Stok') {
      newPath = '/stok';
    } 
    else if (menuItem === 'Penjualan') {
      newPath = '/penjualan';
    } 
    else if (menuItem === 'Pembelian') {
      newPath = '/pembelian';
    } 
    else if (menuItem === 'Keuangan') {
      newPath = '/keuangan';
    } 
    else if (menuItem === 'Laporan') {
      newPath = '/laporan';
    } 
    else if (menuItem === 'Pengaturan') {
      newPath = '/pengaturan';
    } 
    else if (menuItem === 'Beranda') {
      newPath = '/';
    }

    window.history.pushState(null, '', newPath);
    setCurrentMenu(menuItem);
    setViewState(subView);
  };

  /**
   * Navigate to item create screen
   */
  const navigateToCreate = () => {
    const newPath = '/barang/create';
    window.history.pushState(null, '', newPath);
    setCurrentMenu('Data Master');
    setViewState('create');
  };

  /**
   * Navigate back from create screen
   */
  const handleBackFromCreate = () => {
    navigateTo('Data Master', 'barang');
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
   * Navigate back from edit screen
   */
  const handleBackFromEdit = () => {
    navigateTo('Data Master', 'barang');
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
   * Sub-view navigation handler (e.g., Data Master Hub -> Daftar Barang)
   */
  const handleSelectSubView = (subView) => {
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
          {/* Data Master Hub */}
          {currentMenu === 'Data Master' && viewState === 'hub' && (
            <DataMasterHubScreen onSelectSubView={handleSelectSubView} />
          )}
          
          {/* Create Item Screen - NEW */}
          {viewState === 'create' && (
            <ItemCreateScreen 
              onBack={handleBackFromCreate}
            />
          )}
          
          {/* Edit Item Screen */}
          {viewState === 'edit' && editingItemId && (
            <ItemEditScreen 
              itemId={editingItemId} 
              onBack={handleBackFromEdit}
            />
          )}
          
          {/* Daftar Barang (Inventory List) */}
          {(viewState === 'barang' || viewState === 'daftar-barang') && (
            <DaftarBarangScreen 
              onBack={handleBack}
              onEditItem={navigateToEdit}
              onCreateItem={navigateToCreate}
            />
          )}

          {/* Stub screens for other modules (Stok, Penjualan, etc.) */}
          {viewState !== 'hub' && viewState !== 'barang' && viewState !== 'daftar-barang' && 
           viewState !== 'edit' && viewState !== 'create' && viewState !== 'beranda' && (
            <StubScreen targetFeature={currentMenu} />
          )}

          {/* Beranda/Home Stub */}
          {(viewState === 'beranda' || (currentMenu === 'Beranda' && viewState !== 'hub')) && (
            <StubScreen targetFeature="Beranda" />
          )}
        </main>
      </div>
    </div>
  );
}