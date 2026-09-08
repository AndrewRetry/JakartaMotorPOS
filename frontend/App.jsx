import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DataMasterHubScreen from './screens/DataMasterHub';
import DaftarBarangScreen from './screens/DaftarBarangScreen';
import ItemEditScreen from './screens/ItemEditScreen';
import ItemCreateScreen from './screens/ItemCreateScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import SupplierScreen from './screens/SupplierScreen';
import CustomersScreen from './screens/CustomersScreen';
import StubScreen from './screens/StubScreen';
import { useAuth } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';

export default function App() {
  const [currentMenu, setCurrentMenu] = useState('Data Master');
  const [viewState, setViewState] = useState('hub'); // 'hub', 'barang', 'kategori', 'supplier', 'pelanggan', 'create', 'edit', or menu name
  const [editingItemId, setEditingItemId] = useState(null); // For /barang/edit?id=N
  const { user, isCheckingSession } = useAuth();
  const [isNavOpen, setIsNavOpen] = useState(false);

  /**
   * 🧭 URL Routing Synchronization
   */
  useEffect(() => {
    const handlePopState = () => {
      syncAppStateFromURL();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    syncAppStateFromURL();
  }, []);

  const syncAppStateFromURL = () => {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    const route = segments[0] || 'home';
    const subroute = segments[1];

    if (route === 'barang' && subroute === 'create') {
      setCurrentMenu('Data Master');
      setViewState('create');
    }
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
    else if (route === 'categories') {
      setCurrentMenu('Data Master');
      setViewState('kategori');
    } 
    else if (route === 'suppliers') {
      setCurrentMenu('Data Master');
      setViewState('supplier');
    } 
    else if (route === 'customers') {
      setCurrentMenu('Data Master');
      setViewState('pelanggan');
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

  const navigateTo = (menuItem, subView) => {
    let newPath = '/';

    if (subView === 'barang') {
      newPath = '/barang';
    } 
    else if (subView === 'kategori') {
      newPath = '/categories';
    } 
    else if (subView === 'supplier') {
      newPath = '/suppliers';
    } 
    else if (subView === 'pelanggan') {
      newPath = '/customers';
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

  const navigateToCreate = () => {
    const newPath = '/barang/create';
    window.history.pushState(null, '', newPath);
    setCurrentMenu('Data Master');
    setViewState('create');
  };

  const handleBackFromCreate = () => navigateTo('Data Master', 'barang');

  const navigateToEdit = (itemId) => {
    const newPath = `/barang/edit?id=${itemId}`;
    window.history.pushState(null, '', newPath);
    setCurrentMenu('Data Master');
    setViewState('edit');
    setEditingItemId(itemId);
  };

  const handleBackFromEdit = () => navigateTo('Data Master', 'barang');

  const handleMenuTransition = (menuItem) => {
    if (menuItem === 'Data Master') {
      navigateTo(menuItem, 'hub');
    } else {
      navigateTo(menuItem, menuItem.toLowerCase().replace(/\s+/g, '-'));
    }
  };

  const handleSelectSubView = (subView) => {
    if (subView === 'daftar-barang') {
      navigateTo('Data Master', 'barang');
    } 
    else if (subView === 'kategori') {
      navigateTo('Data Master', 'kategori');
    } 
    else if (subView === 'supplier') {
      navigateTo('Data Master', 'supplier');
    } 
    else if (subView === 'pelanggan') {
      navigateTo('Data Master', 'pelanggan');
    } 
    else {
      navigateTo(currentMenu, subView);
    }
  };

  const handleBack = () => navigateTo('Data Master', 'hub');

  // Sub-screens that override the top header's title to match their breadcrumb
  const headerTitle = 
    viewState === 'kategori' ? 'Categories' :
    viewState === 'pelanggan' ? 'Customers' :
    currentMenu;

  if (isCheckingSession) return null;
  if (!user) return <LoginScreen />;

  return (
    <div className="flex h-screen bg-[#0f131c] text-slate-100 font-sans overflow-hidden antialiased">
      {isNavOpen && (
        <button
          aria-label="Tutup menu"
          onClick={() => setIsNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}
      <Sidebar     
        isOpen={isNavOpen}
        onNavigate={() => setIsNavOpen(false)}
        activeMenu={currentMenu} 
        onMenuChange={handleMenuTransition} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={headerTitle} onOpenNav={() => setIsNavOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0f131c]">
          {/* Data Master Hub */}
          {currentMenu === 'Data Master' && viewState === 'hub' && (
            <DataMasterHubScreen onSelectSubView={handleSelectSubView} />
          )}
          
          {/* Create Item Screen */}
          {viewState === 'create' && (
            <ItemCreateScreen onBack={handleBackFromCreate} />
          )}
          
          {/* Edit Item Screen */}
          {viewState === 'edit' && editingItemId && (
            <ItemEditScreen itemId={editingItemId} onBack={handleBackFromEdit} />
          )}
          
          {/* Daftar Barang (Inventory List) */}
          {(viewState === 'barang' || viewState === 'daftar-barang') && (
            <DaftarBarangScreen 
              onBack={handleBack}
              onEditItem={navigateToEdit}
              onCreateItem={navigateToCreate}
            />
          )}

          {/* Kategori (Category List) */}
          {viewState === 'kategori' && (
            <CategoriesScreen />
          )}

          {/* Supplier */}
          {viewState === 'supplier' && (
            <SupplierScreen />
          )}

          {/* Pelanggan (Customer List) - NEW */}
          {viewState === 'pelanggan' && (
            <CustomersScreen />
          )}

          {/* Stub screens for other modules (Stok, Penjualan, etc.) */}
          {viewState !== 'hub' && viewState !== 'barang' && viewState !== 'daftar-barang' && 
           viewState !== 'edit' && viewState !== 'create' && viewState !== 'beranda' && 
           viewState !== 'kategori' && viewState !== 'supplier' && viewState !== 'pelanggan' && (
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