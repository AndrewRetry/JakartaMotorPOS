import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DataMasterHubScreen from './screens/DataMasterHub';
import DaftarBarangScreen from './screens/DaftarBarangScreen';
import StubScreen from './screens/StubScreen';

export default function App() {
  const [currentMenu, setCurrentMenu] = useState('Data Master');
  const [viewState, setViewState] = useState('hub'); // 'hub' or 'daftar-barang'

  const handleMenuTransition = (menuItem) => {
    setCurrentMenu(menuItem);
    setViewState(menuItem === 'Data Master' ? 'hub' : 'stub');
  };

  return (
    <div className="flex h-screen bg-[#0f131c] text-slate-100 font-sans overflow-hidden antialiased">
      <Sidebar activeMenu={currentMenu} onMenuChange={handleMenuTransition} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={currentMenu} />
        
        <main className="flex-1 overflow-y-auto p-8 bg-[#0f131c]">
          {currentMenu === 'Data Master' && viewState === 'hub' && (
            <DataMasterHubScreen onSelectSubView={setViewState} />
          )}
          
          {currentMenu === 'Data Master' && viewState === 'daftar-barang' && (
            <DaftarBarangScreen onBack={() => setViewState('hub')} />
          )}

          {viewState === 'stub' && (
            <StubScreen targetFeature={currentMenu} />
          )}
        </main>
      </div>
    </div>
  );
}