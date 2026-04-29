import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, Wallet, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../api/api';

export default function GestionarMetodosPago() {
    const [metodos, setMetodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMetodo, setEditingMetodo] = useState(null);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        nombre: '',
        clave: '',
        descripcion: '',
        icono: '💳',
        color: 'bg-blue-500',
        activo: true,
        orden: 0,
        requiere_referencia: false,
        instrucciones: '',
    });

    useEffect(() => {
        cargarMetodos();
    }, []);

    const cargarMetodos = async () => {
        try {
            setLoading(true);
            const response = await api.get('/suscripciones/metodos-pago/?activos=false');
            setMetodos(response.data.metodos || []);
        } catch (err) {
            setError('Error cargando métodos de pago');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingMetodo) {
                await api.put(`/suscripciones/metodos-pago/${editingMetodo.id}/`, form);
                setSuccess('Método actualizado exitosamente');
            } else {
                await api.post('/suscripciones/metodos-pago/crear/', form);
                setSuccess('Método creado exitosamente');
            }
            setShowModal(false);
            resetForm();
            await cargarMetodos();
        } catch (err) {
            setError(err.response?.data?.error || 'Error guardando método');
        }
    };

    const handleEdit = (metodo) => {
        setEditingMetodo(metodo);
        setForm(metodo);
        setShowModal(true);
    };

    const handleDelete = async (metodo) => {
        if (!confirm(`¿Eliminar método "${metodo.nombre}"?`)) return;
        try {
            await api.delete(`/suscripciones/metodos-pago/${metodo.id}/eliminar/`);
            setSuccess('Método eliminado');
            await cargarMetodos();
        } catch (err) {
            setError('Error eliminando método');
        }
    };

    const handleToggleActivo = async (metodo) => {
        try {
            await api.patch(`/suscripciones/metodos-pago/${metodo.id}/`, { activo: !metodo.activo });
            await cargarMetodos();
        } catch (err) {
            setError('Error actualizando método');
        }
    };

    const resetForm = () => {
        setEditingMetodo(null);
        setForm({
            nombre: '', clave: '', descripcion: '', icono: '💳', color: 'bg-blue-500',
            activo: true, orden: 0, requiere_referencia: false, instrucciones: '',
        });
    };

    const coloresDisponibles = [
        { value: 'bg-blue-500', label: 'Azul', preview: 'bg-blue-500' },
        { value: 'bg-green-500', label: 'Verde', preview: 'bg-green-500' },
        { value: 'bg-purple-500', label: 'Morado', preview: 'bg-purple-500' },
        { value: 'bg-orange-500', label: 'Naranja', preview: 'bg-orange-500' },
        { value: 'bg-red-500', label: 'Rojo', preview: 'bg-red-500' },
        { value: 'bg-gray-500', label: 'Gris', preview: 'bg-gray-500' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Wallet className="w-8 h-8 text-green-600" />
                            Gestionar Métodos de Pago
                        </h1>
                        <p className="text-gray-600 mt-1">Configura las opciones de pago disponibles</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                    >
                        <Plus className="w-5 h-5" /> Nuevo Método
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

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full text-center py-12">Cargando...</div>
                    ) : metodos.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No hay métodos de pago. Crea el primero.
                        </div>
                    ) : (
                        metodos.map((metodo) => (
                            <div
                                key={metodo.id}
                                className={`bg-white rounded-xl shadow-lg overflow-hidden ${!metodo.activo ? 'opacity-60' : ''}`}
                            >
                                <div className={`h-2 ${metodo.color}`}></div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className={`${metodo.color} text-white p-4 rounded-xl text-3xl`}>
                                                {metodo.icono}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{metodo.nombre}</h3>
                                                <p className="text-gray-500 text-sm">Clave: {metodo.clave}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleToggleActivo(metodo)}>
                                            {metodo.activo ? (
                                                <ToggleRight className="w-8 h-8 text-green-500" />
                                            ) : (
                                                <ToggleLeft className="w-8 h-8 text-gray-400" />
                                            )}
                                        </button>
                                    </div>

                                    {metodo.descripcion && (
                                        <p className="mt-4 text-gray-600 text-sm">{metodo.descripcion}</p>
                                    )}

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {metodo.activo && (
                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Activo</span>
                                        )}
                                        {metodo.requiere_referencia && (
                                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Req. Referencia</span>
                                        )}
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => handleEdit(metodo)}
                                            className="flex-1 bg-blue-100 text-blue-600 py-2 rounded-lg hover:bg-blue-200 flex items-center justify-center gap-2"
                                        >
                                            <Edit2 className="w-4 h-4" /> Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(metodo)}
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
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center p-6 border-b">
                                <h3 className="text-xl font-bold">{editingMetodo ? 'Editar Método' : 'Nuevo Método'}</h3>
                                <button onClick={() => setShowModal(false)}><X className="w-6 h-6" /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <Input label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} required />
                                <Input label="Clave" value={form.clave} onChange={(v) => setForm({ ...form, clave: v })} required disabled={!!editingMetodo} />
                                <Input label="Icono (emoji)" value={form.icono} onChange={(v) => setForm({ ...form, icono: v })} />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                                    <div className="flex flex-wrap gap-2">
                                        {coloresDisponibles.map((c) => (
                                            <button
                                                key={c.value}
                                                type="button"
                                                onClick={() => setForm({ ...form, color: c.value })}
                                                className={`w-10 h-10 rounded-lg ${c.preview} ${form.color === c.value ? 'ring-4 ring-offset-2 ring-blue-500' : ''}`}
                                                title={c.label}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <Input label="Orden" type="number" value={form.orden} onChange={(v) => setForm({ ...form, orden: parseInt(v) })} />

                                <textarea
                                    placeholder="Descripción"
                                    value={form.descripcion}
                                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                    className="w-full p-3 border rounded-lg"
                                    rows={2}
                                />

                                <textarea
                                    placeholder="Instrucciones para el usuario"
                                    value={form.instrucciones}
                                    onChange={(e) => setForm({ ...form, instrucciones: e.target.value })}
                                    className="w-full p-3 border rounded-lg"
                                    rows={2}
                                />

                                <div className="flex gap-6">
                                    <Toggle label="Activo" value={form.activo} onChange={(v) => setForm({ ...form, activo: v })} />
                                    <Toggle label="Requiere referencia" value={form.requiere_referencia} onChange={(v) => setForm({ ...form, requiere_referencia: v })} />
                                </div>

                                <div className="flex gap-2 justify-end pt-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
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
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
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
