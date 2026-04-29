import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, Crown, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../api/api';

export default function GestionarTiposPlanes() {
    const [planes, setPlanes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        nombre: '',
        clave: '',
        descripcion: '',
        precio: 0,
        duracion_dias: 30,
        minutos_por_dia: 15,
        feedback_voz: false,
        analisis_angulos: false,
        historial_dias: 0,
        con_anuncios: true,
        rutinas_personalizadas: false,
        soporte_prioritario: false,
        icono: '⭐',
        color: 'from-blue-500 to-blue-600',
        orden: 0,
        popular: false,
        activo: true,
    });

    useEffect(() => {
        cargarPlanes();
    }, []);

    const cargarPlanes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/suscripciones/tipos-plan/?activos=false');
            setPlanes(response.data.planes || []);
        } catch (err) {
            setError('Error cargando planes');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPlan) {
                await api.put(`/suscripciones/tipos-plan/${editingPlan.id}/`, form);
                setSuccess('Plan actualizado exitosamente');
            } else {
                await api.post('/suscripciones/tipos-plan/crear/', form);
                setSuccess('Plan creado exitosamente');
            }
            setShowModal(false);
            resetForm();
            await cargarPlanes();
        } catch (err) {
            setError(err.response?.data?.error || 'Error guardando plan');
        }
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setForm(plan);
        setShowModal(true);
    };

    const handleDelete = async (plan) => {
        if (!confirm(`¿Eliminar plan "${plan.nombre}"?`)) return;
        try {
            await api.delete(`/suscripciones/tipos-plan/${plan.id}/eliminar/`);
            setSuccess('Plan eliminado');
            await cargarPlanes();
        } catch (err) {
            setError('Error eliminando plan');
        }
    };

    const handleToggleActivo = async (plan) => {
        try {
            await api.patch(`/suscripciones/tipos-plan/${plan.id}/`, { activo: !plan.activo });
            await cargarPlanes();
        } catch (err) {
            setError('Error actualizando plan');
        }
    };

    const resetForm = () => {
        setEditingPlan(null);
        setForm({
            nombre: '', clave: '', descripcion: '', precio: 0, duracion_dias: 30,
            minutos_por_dia: 15, feedback_voz: false, analisis_angulos: false,
            historial_dias: 0, con_anuncios: true, rutinas_personalizadas: false,
            soporte_prioritario: false, icono: '⭐', color: 'from-blue-500 to-blue-600',
            orden: 0, popular: false, activo: true,
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Crown className="w-8 h-8 text-yellow-500" />
                            Gestionar Tipos de Plan
                        </h1>
                        <p className="text-gray-600 mt-1">Crea y edita los planes disponibles para usuarios</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5" /> Nuevo Plan
                    </button>
                </div>

                {/* Messages */}
                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex justify-between">
                        <span>{success}</span>
                        <button onClick={() => setSuccess(null)}>×</button>
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between">
                        <span>{error}</span>
                        <button onClick={() => setError(null)}>×</button>
                    </div>
                )}

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full text-center py-12">Cargando...</div>
                    ) : planes.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No hay planes. Crea el primero.
                        </div>
                    ) : (
                        planes.map((plan) => (
                            <div
                                key={plan.id}
                                className={`bg-white rounded-xl shadow-lg overflow-hidden ${!plan.activo ? 'opacity-60' : ''}`}
                            >
                                <div className={`h-3 bg-gradient-to-r ${plan.color}`}></div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <span className="text-4xl">{plan.icono}</span>
                                            <div>
                                                <h3 className="font-bold text-xl">{plan.nombre}</h3>
                                                <p className="text-gray-500 text-sm">Clave: {plan.clave}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleToggleActivo(plan)}
                                            title={plan.activo ? 'Desactivar' : 'Activar'}
                                        >
                                            {plan.activo ? (
                                                <ToggleRight className="w-8 h-8 text-green-500" />
                                            ) : (
                                                <ToggleLeft className="w-8 h-8 text-gray-400" />
                                            )}
                                        </button>
                                    </div>

                                    <div className="mt-4">
                                        <span className="text-3xl font-bold">Bs. {plan.precio}</span>
                                        <span className="text-gray-500">/{plan.duracion_dias} días</span>
                                    </div>

                                    <div className="mt-4 space-y-1 text-sm text-gray-600">
                                        <p>✓ {plan.minutos_por_dia === -1 ? 'Ilimitado' : `${plan.minutos_por_dia} min/día`}</p>
                                        <p>{plan.feedback_voz ? '✓' : '✗'} Feedback con voz</p>
                                        <p>{plan.analisis_angulos ? '✓' : '✗'} Análisis de ángulos</p>
                                        <p>{!plan.con_anuncios ? '✓' : '✗'} Sin anuncios</p>
                                    </div>

                                    {plan.popular && (
                                        <span className="mt-3 inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                            🔥 Popular
                                        </span>
                                    )}

                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => handleEdit(plan)}
                                            className="flex-1 bg-blue-100 text-blue-600 py-2 rounded-lg hover:bg-blue-200 flex items-center justify-center gap-2"
                                        >
                                            <Edit2 className="w-4 h-4" /> Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(plan)}
                                            className="px-4 bg-red-100 text-red-600 py-2 rounded-lg hover:bg-red-200"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
                                <h3 className="text-xl font-bold">{editingPlan ? 'Editar Plan' : 'Nuevo Plan'}</h3>
                                <button onClick={() => setShowModal(false)}><X className="w-6 h-6" /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} required />
                                    <Input label="Clave" value={form.clave} onChange={(v) => setForm({ ...form, clave: v })} required disabled={!!editingPlan} />
                                    <Input label="Precio (Bs.)" type="number" value={form.precio} onChange={(v) => setForm({ ...form, precio: parseFloat(v) })} />
                                    <Input label="Duración (días)" type="number" value={form.duracion_dias} onChange={(v) => setForm({ ...form, duracion_dias: parseInt(v) })} />
                                    <Input label="Min/día (-1 = ∞)" type="number" value={form.minutos_por_dia} onChange={(v) => setForm({ ...form, minutos_por_dia: parseInt(v) })} />
                                    <Input label="Historial días (-1 = ∞)" type="number" value={form.historial_dias} onChange={(v) => setForm({ ...form, historial_dias: parseInt(v) })} />
                                    <Input label="Icono (emoji)" value={form.icono} onChange={(v) => setForm({ ...form, icono: v })} />
                                    <Input label="Orden" type="number" value={form.orden} onChange={(v) => setForm({ ...form, orden: parseInt(v) })} />
                                </div>
                                <Input label="Color (Tailwind gradient)" value={form.color} onChange={(v) => setForm({ ...form, color: v })} />
                                <textarea
                                    placeholder="Descripción"
                                    value={form.descripcion}
                                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                    className="w-full p-3 border rounded-lg"
                                    rows={2}
                                />
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <Toggle label="Voz de retroalimentación" value={form.feedback_voz} onChange={(v) => setForm({ ...form, feedback_voz: v })} />
                                    <Toggle label="Análisis ángulos" value={form.analisis_angulos} onChange={(v) => setForm({ ...form, analisis_angulos: v })} />
                                    <Toggle label="Con anuncios" value={form.con_anuncios} onChange={(v) => setForm({ ...form, con_anuncios: v })} />
                                    <Toggle label="Popular" value={form.popular} onChange={(v) => setForm({ ...form, popular: v })} />
                                    <Toggle label="Activo" value={form.activo} onChange={(v) => setForm({ ...form, activo: v })} />
                                </div>
                                <div className="flex gap-2 justify-end pt-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
                                        <Save className="w-4 h-4" /> Guardar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function Input({ label, type = 'text', value, onChange, required, disabled }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                disabled={disabled}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
        </div>
    );
}

function Toggle({ label, value, onChange }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="rounded" />
            <span className="text-sm">{label}</span>
        </label>
    );
}
