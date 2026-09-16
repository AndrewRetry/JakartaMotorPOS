import React, { useState } from 'react';
import { downloadFile, uploadFile } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';

const BACKUP_TABLES = [
    { id: 'barang', label: 'Barang', description: 'Semua data barang' },
    { id: 'kategori', label: 'Kategori', description: 'Semua kategori barang' },
    { id: 'supplier', label: 'Supplier', description: 'Data supplier' },
    { id: 'customer', label: 'Pelanggan', description: 'Data pelanggan' },
];

// Flask rejects anything larger; checking here gives a clear message, because a
// rejected upload can surface as a network error instead of our JSON.
const MAX_UPLOAD_BYTES = 16 * 1024 * 1024;

export default function BackupScreen() {
    const { user } = useAuth();
    const isOwner = user.role === 'owner';

    const [downloadingTable, setDownloadingTable] = useState(null);
    const [downloadError, setDownloadError] = useState(null);

    const [selectedTable, setSelectedTable] = useState('barang');
    const [replaceExisting, setReplaceExisting] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [importError, setImportError] = useState(null);

    const replaceConfirmed = !replaceExisting || confirmationText === selectedTable;
    const canImport = selectedFile && replaceConfirmed && !isImporting;

    const handleExport = async (tableId) => {
        setDownloadingTable(tableId);
        setDownloadError(null);
        try {
            await downloadFile(`/backup/export/${tableId}`, `${tableId}.csv`);
        } catch (error) {
            setDownloadError(`${tableId}: ${error.message}`);
        } finally {
            setDownloadingTable(null);
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0] ?? null;
        setImportResult(null);
        setImportError(null);

        if (file && file.size > MAX_UPLOAD_BYTES) {
            setSelectedFile(null);
            setImportError({ message: 'File terlalu besar (maksimal 16 MB)', rows: [] });
            return;
        }
        setSelectedFile(file);
    };

    const handleImport = async (event) => {
        event.preventDefault();
        setIsImporting(true);
        setImportResult(null);
        setImportError(null);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('mode', replaceExisting ? 'replace' : 'upsert');

        try {
            const result = await uploadFile(`/backup/import/${selectedTable}`, formData);
            setImportResult(result.message);
            setSelectedFile(null);
            setReplaceExisting(false);
            setConfirmationText('');
            event.target.reset();
        } catch (error) {
            setImportError({
                message: error.message,
                rows: error.rowErrors ?? [],
                total: error.totalErrors ?? 0,
            });
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
                    Backup / Import / Export
                </h1>
                <p className="text-sm text-slate-400 mt-1">Kelola backup dan transfer data</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ---------------------------------------------------- Export */}
                <section className="bg-[#141923] border border-[#1f293d] rounded-2xl overflow-hidden">
                    <header className="px-5 py-4 border-b border-[#1f293d]">
                        <h2 className="font-semibold text-slate-100">Export Data</h2>
                    </header>

                    <div className="p-5 space-y-3">
                        <p className="text-sm text-slate-400">
                            Download data dalam format CSV. File dibuka langsung di Excel.
                        </p>

                        {downloadError && (
                            <p role="alert" className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {downloadError}
                            </p>
                        )}

                        {BACKUP_TABLES.map((table) => (
                            <div
                                key={table.id}
                                className="flex items-center justify-between gap-3 bg-[#0f131c] border border-[#1f293d] rounded-xl px-4 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-100 text-sm">{table.label}</p>
                                    <p className="text-xs text-slate-500 truncate">{table.description}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleExport(table.id)}
                                    disabled={downloadingTable === table.id}
                                    className="shrink-0 min-h-[44px] px-4 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-sm font-semibold"
                                >
                                    {downloadingTable === table.id ? 'Menyiapkan...' : 'Download'}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ---------------------------------------------------- Import */}
                <section className="bg-[#141923] border border-[#1f293d] rounded-2xl overflow-hidden">
                    <header className="px-5 py-4 border-b border-[#1f293d]">
                        <h2 className="font-semibold text-slate-100">Import Data</h2>
                    </header>

                    {!isOwner ? (
                        <p className="p-5 text-sm text-slate-400">
                            Hanya pemilik yang dapat mengimpor data.
                        </p>
                    ) : (
                        <form onSubmit={handleImport} className="p-5 space-y-4">
                            <p className="text-sm text-slate-400">
                                Upload CSV hasil export. Kolom harus sama persis.
                            </p>

                            <div className="space-y-1.5">
                                <label htmlFor="table" className="block text-xs font-semibold text-slate-300">
                                    Tipe Data
                                </label>
                                <select
                                    id="table"
                                    value={selectedTable}
                                    onChange={(event) => {
                                        setSelectedTable(event.target.value);
                                        setConfirmationText('');
                                    }}
                                    className="w-full bg-[#0f131c] border border-[#2b384e] rounded-lg px-4 py-3 text-slate-100"
                                >
                                    {BACKUP_TABLES.map((table) => (
                                        <option key={table.id} value={table.id}>{table.label}</option>
                                    ))}
                                </select>
                            </div>

                            <label className="flex items-start gap-3 bg-[#0f131c] border border-[#1f293d] rounded-xl px-4 py-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={replaceExisting}
                                    onChange={(event) => {
                                        setReplaceExisting(event.target.checked);
                                        setConfirmationText('');
                                    }}
                                    className="mt-1"
                                />
                                <span className="text-sm">
                                    <span className="font-semibold text-red-400">Ganti semua data</span>
                                    <span className="block text-xs text-slate-500 mt-0.5">
                                        Hapus seluruh isi tabel, lalu isi dari file. Tanpa ini, baris
                                        yang sudah ada diperbarui dan sisanya tidak disentuh.
                                    </span>
                                </span>
                            </label>

                            {replaceExisting && (
                                <div className="space-y-1.5 border border-red-500/30 bg-red-500/5 rounded-xl p-4">
                                    <p className="text-xs text-red-300">
                                        {selectedTable === 'kategori'
                                            ? 'Menghapus kategori akan mengosongkan kategori pada barang yang memakainya.'
                                            : 'Semua baris yang tidak ada di file akan hilang permanen.'}
                                    </p>
                                    <label htmlFor="confirm" className="block text-xs font-semibold text-slate-300">
                                        Ketik <span className="font-mono text-red-300">{selectedTable}</span> untuk konfirmasi
                                    </label>
                                    <input
                                        id="confirm"
                                        type="text"
                                        value={confirmationText}
                                        onChange={(event) => setConfirmationText(event.target.value)}
                                        autoComplete="off"
                                        className="w-full bg-[#0f131c] border border-[#2b384e] rounded-lg px-4 py-2.5 text-slate-100"
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label htmlFor="file" className="block text-xs font-semibold text-slate-300">
                                    File CSV
                                </label>
                                <input
                                    id="file"
                                    type="file"
                                    accept=".csv,text/csv"
                                    onChange={handleFileChange}
                                    className="w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-slate-200 file:font-semibold hover:file:bg-slate-600"
                                />
                            </div>

                            {importResult && (
                                <p role="status" className="px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                                    {importResult}
                                </p>
                            )}

                            {importError && (
                                <div role="alert" className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm space-y-2">
                                    <p className="font-semibold">{importError.message}</p>
                                    {importError.rows.length > 0 && (
                                        <ul className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs">
                                            {importError.rows.map((rowError) => (
                                                <li key={rowError}>{rowError}</li>
                                            ))}
                                        </ul>
                                    )}
                                    {importError.total > importError.rows.length && (
                                        <p className="text-xs">
                                            ...dan {importError.total - importError.rows.length} kesalahan lain.
                                        </p>
                                    )}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!canImport}
                                className="w-full min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold"
                            >
                                {isImporting ? 'Mengimpor...' : 'Import'}
                            </button>
                        </form>
                    )}
                </section>
            </div>
        </div>
    );
}