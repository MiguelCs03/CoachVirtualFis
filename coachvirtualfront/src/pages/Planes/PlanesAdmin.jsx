import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, X, Save, CheckCircle } from 'lucide-react';
import PlanService from '../../services/PlanService';

export default function PlanesAdmin() {
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Modales
    const [showModal, setShowModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    // Formulario
    const [formData, setFormData] = useState({
        plan: 'basico',
        metodo_pago: 'manual',
        duracion_dias: 30,
        referencia_pago: ''
    });

    useEffect(() => {
        cargarHistorial();
    }, []);

    const cargarHistorial = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await PlanService.getHistorial();
            setHistorial(data.historial || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCrear = async (e) => {
        e.preventDefault();

        try {
            await PlanService.comprarPlan(formData.plan, {
                metodoPago: formData.metodo_pago,
                referenciaPago: formData.referencia_pago,
                duracionDias: parseInt(formData.duracion_dias)
            });

            setSuccess('Plan creado exitosamente');
            setShowCreateModal(false);
            setFormData({
                plan: 'basico',
                metodo_pago: 'manual',
                duracion_dias: 30,
                referencia_pago: ''
            });
            await cargarHistorial();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEditar = (plan) => {
        setSelectedPlan(plan);
        setFormData({
            plan: plan.plan,
            metodo_pago: plan.metodo_pago || 'manual',
            duracion_dias: 30,
            referencia_pago: plan.referencia_pago || ''
        });
        setShowEditModal(true);
    };

    const handleActualizar = async (e) => {
        e.preventDefault();

        try {
            // Crear una nueva suscripción con los datos actualizados
            await PlanService.comprarPlan(formData.plan, {
                metodoPago: formData.metodo_pago,
                referenciaPago: formData.referencia_pago,
                duracionDias: parseInt(formData.duracion_dias)
            });

            setSuccess('Plan actualizado exitosamente');
            setShowEditModal(false);
            setSelectedPlan(null);
            await cargarHistorial();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEliminar = async (planId) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este plan permanentemente?')) return;

        try {
            await PlanService.cancelarPlan(true); // true = cancelación inmediata
            setSuccess('Plan eliminado exitosamente');
            await cargarHistorial();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleVerDetalles = (plan) => {
        setSelectedPlan(plan);
        setShowModal(true);
    };

    const handleConfirmarPago = async (planId, referenciaPago = '') => {
        if (!confirm('¿Confirmar el pago y activar esta suscripción?')) return;

        try {
            await PlanService.confirmarPago(planId, referenciaPago);
            setSuccess('Pago confirmado y plan activado exitosamente');
            await cargarHistorial();
        } catch (err) {
            setError(err.message);
        }
    };

    const closeAllModals = () => {
        setShowModal(false);
        setShowCreateModal(false);
        setShowEditModal(false);
        setSelectedPlan(null);
        setFormData({
            plan: 'basico',
            metodo_pago: 'manual',
            duracion_dias: 30,
            referencia_pago: ''
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gestión de Planes</h1>
                        <p className="text-gray-600 mt-2">Administra todas las suscripciones y planes</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Crear Plan
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                                <Eye className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <h2 className="text-sm font-medium text-gray-500">Total Suscripciones</h2>
                                <p className="text-2xl font-semibold text-gray-900">{historial.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                                <Plus className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <h2 className="text-sm font-medium text-gray-500">Planes Activos</h2>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {historial.filter(h => h.activo).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <h2 className="text-sm font-medium text-gray-500">Cancelados</h2>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {historial.filter(h => h.cancelado).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex justify-between">
                        <span>{success}</span>
                        <button onClick={() => setSuccess(null)} className="font-bold">×</button>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex justify-between">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="font-bold">×</button>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Historial de Suscripciones</h2>
                    </div>

                    {loading ? (
                        <div className="px-6 py-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-600">Cargando...</p>
                        </div>
                    ) : historial.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-500">
                            <p>No hay suscripciones registradas</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="mt-4 text-blue-600 hover:text-blue-800"
                            >
                                Crear primera suscripción
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Plan
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Fecha Inicio
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Expiración
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Monto
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Estado Pago
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Estado
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {historial.map((plan) => (
                                        <tr key={plan.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                #{plan.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${plan.plan === 'premium'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : plan.plan === 'basico'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {plan.plan_nombre}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(plan.fecha_inicio).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(plan.fecha_expiracion).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                Bs. {plan.monto_pagado}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {plan.estado_pago === 'confirmado' ? (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                        ✓ Pagado
                                                    </span>
                                                ) : plan.estado_pago === 'pendiente' ? (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                        ⏳ Pendiente
                                                    </span>
                                                ) : plan.estado_pago === 'rechazado' ? (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                        ✗ Rechazado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                        {plan.estado_pago}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {plan.activo ? (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                        Activo
                                                    </span>
                                                ) : plan.cancelado ? (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                        Cancelado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                        Inactivo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleVerDetalles(plan)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Ver detalles"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    {plan.estado_pago === 'pendiente' && (
                                                        <button
                                                            onClick={() => handleConfirmarPago(plan.id, plan.referencia_pago)}
                                                            className="text-green-600 hover:text-green-900"
                                                            title="Confirmar pago"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleEditar(plan)}
                                                        className="text-orange-600 hover:text-orange-900"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEliminar(plan.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal de Detalles */}
                {showModal && selectedPlan && (
                    <Modal title="Detalles del Plan" onClose={closeAllModals}>
                        <div className="grid grid-cols-2 gap-4">
                            <DetailField label="ID" value={`#${selectedPlan.id}`} />
                            <DetailField label="Plan" value={selectedPlan.plan_nombre} />
                            <DetailField label="Fecha Inicio" value={new Date(selectedPlan.fecha_inicio).toLocaleString()} />
                            <DetailField label="Fecha Expiración" value={new Date(selectedPlan.fecha_expiracion).toLocaleString()} />
                            <DetailField label="Monto Pagado" value={`Bs. ${selectedPlan.monto_pagado}`} />
                            <DetailField label="Método de Pago" value={selectedPlan.metodo_pago || 'N/A'} />
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Estado</label>
                                <p className="mt-1">
                                    {selectedPlan.activo ? (
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            Activo
                                        </span>
                                    ) : selectedPlan.cancelado ? (
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                            Cancelado
                                        </span>
                                    ) : (
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                            Expirado
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </Modal>
                )}

                {/* Modal de Crear */}
                {showCreateModal && (
                    <Modal title="Crear Nuevo Plan" onClose={closeAllModals}>
                        <form onSubmit={handleCrear} className="space-y-4">
                            <FormSelect
                                label="Tipo de Plan"
                                value={formData.plan}
                                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                options={[
                                    { value: 'basico', label: 'Básico - Bs. 25' },
                                    { value: 'premium', label: 'Premium - Bs. 49' }
                                ]}
                            />

                            <FormSelect
                                label="Método de Pago"
                                value={formData.metodo_pago}
                                onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                                options={[
                                    { value: 'manual', label: 'Manual' },
                                    { value: 'stripe', label: 'Stripe' },
                                    { value: 'qr', label: 'QR' }
                                ]}
                            />

                            <FormInput
                                label="Duración (días)"
                                type="number"
                                value={formData.duracion_dias}
                                onChange={(e) => setFormData({ ...formData, duracion_dias: e.target.value })}
                                min="1"
                            />

                            <FormInput
                                label="Referencia de Pago (opcional)"
                                type="text"
                                value={formData.referencia_pago}
                                onChange={(e) => setFormData({ ...formData, referencia_pago: e.target.value })}
                                placeholder="ej: stripe_session_xxx"
                            />

                            <div className="flex gap-2 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={closeAllModals}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Crear Plan
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}

                {/* Modal de Editar */}
                {showEditModal && selectedPlan && (
                    <Modal title="Editar Plan" onClose={closeAllModals}>
                        <form onSubmit={handleActualizar} className="space-y-4">
                            <FormSelect
                                label="Tipo de Plan"
                                value={formData.plan}
                                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                options={[
                                    { value: 'basico', label: 'Básico - Bs. 25' },
                                    { value: 'premium', label: 'Premium - Bs. 49' }
                                ]}
                            />

                            <FormSelect
                                label="Método de Pago"
                                value={formData.metodo_pago}
                                onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                                options={[
                                    { value: 'manual', label: 'Manual' },
                                    { value: 'stripe', label: 'Stripe' },
                                    { value: 'qr', label: 'QR' }
                                ]}
                            />

                            <FormInput
                                label="Duración (días)"
                                type="number"
                                value={formData.duracion_dias}
                                onChange={(e) => setFormData({ ...formData, duracion_dias: e.target.value })}
                                min="1"
                            />

                            <FormInput
                                label="Referencia de Pago (opcional)"
                                type="text"
                                value={formData.referencia_pago}
                                onChange={(e) => setFormData({ ...formData, referencia_pago: e.target.value })}
                                placeholder="ej: stripe_session_xxx"
                            />

                            <div className="flex gap-2 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={closeAllModals}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Actualizar
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}
            </div>
        </div>
    );
}

// Componentes auxiliares
function Modal({ title, children, onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <h3 className="text-xl font-semibold">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

function DetailField({ label, value }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <p className="mt-1 text-sm text-gray-900">{value}</p>
        </div>
    );
}

function FormInput({ label, ...props }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                {...props}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
}

function FormSelect({ label, options, ...props }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <select
                {...props}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}
