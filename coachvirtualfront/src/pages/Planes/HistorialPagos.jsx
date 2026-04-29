import { useState, useEffect } from 'react';
import { History, Eye, X, RefreshCw } from 'lucide-react';
import PlanService from '../../services/PlanService';

export default function HistorialPagos() {
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPago, setSelectedPago] = useState(null);

    useEffect(() => {
        cargarHistorial();
    }, []);

    const cargarHistorial = async () => {
        try {
            setLoading(true);
            const data = await PlanService.getHistorial();
            setHistorial(data.historial || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getEstadoPagoBadge = (estado) => {
        const badges = {
            confirmado: 'bg-green-100 text-green-800',
            pendiente: 'bg-yellow-100 text-yellow-800',
            rechazado: 'bg-red-100 text-red-800',
            reembolsado: 'bg-purple-100 text-purple-800',
        };
        return badges[estado] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <History className="w-8 h-8 text-blue-600" />
                            Historial de Pagos
                        </h1>
                        <p className="text-gray-600 mt-2">Registro de todos los pagos y transacciones</p>
                    </div>
                    <button
                        onClick={cargarHistorial}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                            <p className="mt-2 text-gray-600">Cargando...</p>
                        </div>
                    ) : historial.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No hay pagos registrados</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Fecha</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Método</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {historial.map((pago) => (
                                        <tr key={pago.id} className="hover:bg-gray-50">
                                            <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">#{pago.id}</td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${pago.plan === 'premium' ? 'bg-purple-100 text-purple-800' :
                                                        pago.plan === 'basico' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {pago.plan_nombre}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
                                                {new Date(pago.fecha_inicio).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">
                                                Bs. {pago.monto_pagado}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 capitalize hidden md:table-cell">
                                                {pago.metodo_pago || 'N/A'}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoPagoBadge(pago.estado_pago)}`}>
                                                    {pago.estado_pago}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <button
                                                    onClick={() => setSelectedPago(pago)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal de detalles */}
                {selectedPago && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl max-w-lg w-full p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Detalles del Pago</h3>
                                <button onClick={() => setSelectedPago(null)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">ID</p>
                                    <p className="font-medium">#{selectedPago.id}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Plan</p>
                                    <p className="font-medium">{selectedPago.plan_nombre}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Monto</p>
                                    <p className="font-medium">Bs. {selectedPago.monto_pagado}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Método</p>
                                    <p className="font-medium capitalize">{selectedPago.metodo_pago || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Fecha</p>
                                    <p className="font-medium">{new Date(selectedPago.fecha_inicio).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Expiración</p>
                                    <p className="font-medium">{new Date(selectedPago.fecha_expiracion).toLocaleString()}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-gray-500">Estado del Pago</p>
                                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getEstadoPagoBadge(selectedPago.estado_pago)}`}>
                                        {selectedPago.estado_pago}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
