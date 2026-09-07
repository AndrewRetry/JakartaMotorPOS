import React, { useState, useEffect } from 'react';
import { Icons } from '../components/common/Icons';
import ItemEditForm from '../components/inventory/ItemEditForm';
import EditHeader from '../components/inventory/EditHeader';

/**
 * ItemEditScreen
 * Full-page edit view for a single barang item
 * URL: /barang/edit?id=123
 * No version checking (no OCC) - simpler approach
 */
export default function ItemEditScreen({ itemId, onBack }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formState, setFormState] = useState({});

  /**
   * Fetch item details on mount
   */
  useEffect(() => {
    if (!itemId) return;
    fetchItemDetails();
  }, [itemId]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get(`/barang/${itemId}`);
      setItem(data);
      setFormState(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const payload = { ...formState };
      
      await api.post('/barang/create', payload);
      setSuccessMessage('Data berhasil disimpan!');

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-slate-400">Item tidak ditemukan</div>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-all"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f131c]">
      {/* Header */}
      <EditHeader 
        item={item}
        onBack={onBack}
      />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            ✓ {successMessage}
          </div>
        )}

        {/* Form */}
        <ItemEditForm 
          formState={formState}
          onChange={handleFieldChange}
          onSave={handleSave}
          onCancel={onBack}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}