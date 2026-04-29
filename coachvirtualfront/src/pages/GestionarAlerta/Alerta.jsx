import React, { Component } from "react";
import { AlertaService } from "../../services/AlertaService";
import Paginacion from "../../components/Paginacion"; // ⬅️ ajusta la ruta si es necesario

const fmtDateTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
};

// ISO -> <input type="datetime-local">
const toInputDateTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

// <input datetime-local> -> "YYYY-MM-DDTHH:mm:ss"
const fromInputDateTime = (val) => (!val ? "" : `${val}:00`);

class Alerta extends Component {
  state = {
    form: { id: null, mensaje: "", fecha: "", usuario: "" },
    items: [],
    users: [],
    usersById: {},
    loadingList: false,
    loadingUsers: false,
    loadingSave: false,
    errorList: null,
    errorUsers: null,
    errorSave: null,
    successSave: null,
    errorsByField: {},
    isEditing: false,

    // ===== Paginación =====
    currentPage: 1, // 1-based
    pageSize: 5,    // 5 en 5
  };

  componentDidMount() {
    this.loadList();
    this.loadUsers();
  }

  componentDidUpdate(prevProps, prevState) {
    // Si cambia el total de items o el pageSize, asegúrate de que la página quede en rango
    if (
      prevState.items.length !== this.state.items.length ||
      prevState.pageSize !== this.state.pageSize
    ) {
      this.ensurePageInRange();
    }
  }

  // ====== Helpers de paginación ======
  ensurePageInRange = () => {
    this.setState((prev) => {
      const totalPages = Math.max(
        1,
        Math.ceil(prev.items.length / prev.pageSize)
      );
      const newPage = Math.min(prev.currentPage, totalPages) || 1;
      return newPage !== prev.currentPage ? { currentPage: newPage } : null;
    });
  };

  goToPage = (p) => {
    this.setState({ currentPage: p });
  };

  getPagedItems = () => {
    const { items, currentPage, pageSize } = this.state;
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  };

  // ====== API ======
  loadList = async () => {
    this.setState({ loadingList: true, errorList: null });
    try {
      const data = await AlertaService.list();
      const sorted = [...(data || [])].sort((a, b) => {
        const da = new Date(a.created_at).getTime() || 0;
        const db = new Date(b.created_at).getTime() || 0;
        if (db !== da) return db - da;
        return (b.id || 0) - (a.id || 0);
      });
      this.setState({ items: sorted, loadingList: false }, this.ensurePageInRange);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "No se pudo cargar la lista de alertas.";
      this.setState({ loadingList: false, errorList: msg });
    }
  };

  loadUsers = async () => {
    this.setState({ loadingUsers: true, errorUsers: null });
    try {
      const users = await AlertaService.listUsers();
      const usersById = {};
      (users || []).forEach((u) => (usersById[u.id] = u));
      this.setState({ users, usersById, loadingUsers: false });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "No se pudo cargar usuarios.";
      this.setState({ loadingUsers: false, errorUsers: msg });
    }
  };

  // ====== Form ======
  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState((prev) => ({
      form: { ...prev.form, [name]: value },
      errorSave: null,
      successSave: null,
      errorsByField: { ...prev.errorsByField, [name]: undefined },
    }));
  };

  resetForm = () => {
    this.setState({
      form: { id: null, mensaje: "", fecha: "", usuario: "" },
      isEditing: false,
      errorSave: null,
      successSave: null,
      errorsByField: {},
    });
  };

  editRow = (row) => {
    const usuarioId =
      typeof row.usuario === "object" ? row.usuario?.id : row.usuario;
    this.setState({
      form: {
        id: row.id,
        mensaje: row.mensaje,
        fecha: toInputDateTime(row.fecha),
        usuario: usuarioId || "",
      },
      isEditing: true,
      errorSave: null,
      successSave: null,
      errorsByField: {},
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  removeRow = async (row) => {
    if (!window.confirm(`¿Eliminar la alerta "${row.mensaje}"?`)) return;
    try {
      await AlertaService.remove(row.id);
      this.setState(
        (prev) => ({
          items: prev.items.filter((x) => x.id !== row.id),
        }),
        this.ensurePageInRange
      );
      if (this.state.form.id === row.id) this.resetForm();
    } catch (err) {
      const msg =
        err?.response?.data?.detail || err?.message || "No se pudo eliminar.";
      alert(msg);
    }
  };

  validate = () => {
    const { mensaje, fecha, usuario } = this.state.form;
    const errors = {};
    if (!mensaje?.trim()) errors.mensaje = "Mensaje requerido";
    if (!fecha) errors.fecha = "Fecha/hora límite requerida";
    if (!usuario) errors.usuario = "Selecciona un usuario destinatario";
    this.setState({ errorsByField: errors });
    return Object.keys(errors).length === 0;
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    if (this.state.loadingSave) return;
    if (!this.validate()) return;

    this.setState({ loadingSave: true, errorSave: null, successSave: null });

    const payload = {
      mensaje: this.state.form.mensaje.trim(),
      fecha: fromInputDateTime(this.state.form.fecha),
      usuario: this.state.form.usuario,
    };

    try {
      let saved;
      if (this.state.isEditing && this.state.form.id) {
        saved = await AlertaService.update(this.state.form.id, payload);
        this.setState({
          successSave: "Alerta actualizada correctamente.",
          loadingSave: false,
        });
        this.setState((prev) => ({
          items: prev.items.map((x) => (x.id === saved.id ? saved : x)),
        }));
      } else {
        saved = await AlertaService.create(payload);
        this.setState({
          successSave: "Alerta creada correctamente.",
          loadingSave: false,
        });
        this.setState((prev) => ({ items: [saved, ...prev.items] }));
      }
      this.resetForm();
      this.loadList(); // reordenar por recibida desc y ajustar página
    } catch (err) {
      let msg = "Error al guardar.";
      let fieldErrors = {};
      if (err.response) {
        if (typeof err.response.data === "object") fieldErrors = err.response.data;
        msg = err.response.data?.detail || msg;
      } else if (err.message) msg = err.message;
      this.setState({
        loadingSave: false,
        errorSave: msg,
        errorsByField: fieldErrors,
      });
    }
  };

  // ====== UI helpers ======
  renderField(label, name, type = "text", props = {}) {
    const { form, errorsByField } = this.state;
    const hasError = Boolean(errorsByField?.[name]);
    return (
      <div className="flex flex-col gap-1">
        <label className="text-white/80 text-sm" htmlFor={name}>
          {label}
        </label>
        <input
          id={name}
          name={name}
          type={type}
          value={form[name]}
          onChange={this.handleChange}
          className={`px-4 py-3 rounded-xl bg-white/10 border ${
            hasError ? "border-red-400" : "border-white/20"
          } text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40`}
          {...props}
        />
        {hasError && (
          <span className="text-red-300 text-xs">
            {Array.isArray(errorsByField[name])
              ? errorsByField[name].join(", ")
              : String(errorsByField[name])}
          </span>
        )}
      </div>
    );
  }

  renderUserSelect() {
    const { users, form, errorsByField, loadingUsers, errorUsers } = this.state;
    const hasError = Boolean(errorsByField?.usuario);
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor="usuario" className="text-white/80 text-sm">
          Usuario destinatario
        </label>
        <select
          id="usuario"
          name="usuario"
          value={form.usuario}
          onChange={this.handleChange}
          className={`px-4 py-3 rounded-xl bg-white/10 border ${
            hasError ? "border-red-400" : "border-white/20"
          } text-white focus:outline-none focus:ring-2 focus:ring-white/40`}
          disabled={loadingUsers || !!errorUsers}
        >
          <option value="" className="bg-gray-800">
            {loadingUsers ? "Cargando usuarios..." : "Seleccione un usuario"}
          </option>
          {users.map((u) => (
            <option key={u.id} value={u.id} className="bg-gray-800 text-white">
              {u.email || u.username}{" "}
              {u.first_name || u.last_name
                ? `(${u.first_name ?? ""} ${u.last_name ?? ""})`
                : ""}
            </option>
          ))}
        </select>
        {errorUsers && (
          <span className="text-yellow-200 text-xs">{errorUsers}</span>
        )}
        {hasError && (
          <span className="text-red-300 text-xs">
            {String(errorsByField.usuario)}
          </span>
        )}
      </div>
    );
  }

  render() {
    const {
      items,
      usersById,
      loadingList,
      errorList,
      loadingSave,
      errorSave,
      successSave,
      isEditing,
      currentPage,
      pageSize,
    } = this.state;

    const total = items.length;
    const paged = this.getPagedItems();

    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-6">
        {/* Form */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 w-full max-w-3xl mx-auto border border-white/20 mb-8">
          <h1 className="text-2xl font-bold text-white text-center mb-4">
            {isEditing ? "Editar alerta" : "Crear alerta"}
          </h1>

          {errorSave && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-400 text-red-100 text-sm">
              {errorSave}
            </div>
          )}
          {successSave && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-100 text-sm">
              {successSave}
            </div>
          )}

          <form className="grid grid-cols-1 gap-4" onSubmit={this.handleSubmit}>
            {this.renderField("Mensaje", "mensaje", "text", {
              placeholder: "Recordatorio…",
            })}
            {this.renderField("Fecha y hora límite", "fecha", "datetime-local")}
            {this.renderUserSelect()}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loadingSave}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg hover:scale-[1.02]"
              >
                {loadingSave
                  ? "Guardando…"
                  : isEditing
                  ? "Guardar cambios"
                  : "Crear"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={this.resetForm}
                  className="bg-white/10 border border-white/30 text-white py-3 px-6 rounded-2xl hover:bg-white/20"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Listado */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 w-full max-w-5xl mx-auto border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Listado de alertas</h2>
            <button
              onClick={this.loadList}
              className="text-white/80 text-sm underline hover:text-white"
            >
              Recargar
            </button>
          </div>

          {loadingList ? (
            <p className="text-white/80">Cargando…</p>
          ) : errorList ? (
            <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-400 text-yellow-100 text-sm">
              {errorList}
            </div>
          ) : total === 0 ? (
            <p className="text-white/80">No hay alertas.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-white/90">
                  <thead>
                    <tr className="text-left border-b border-white/20">
                      <th className="py-2 pr-4">ID</th>
                      <th className="py-2 pr-4">Mensaje</th>
                      <th className="py-2 pr-4">Fecha/Hora límite</th>
                      <th className="py-2 pr-4">Creado</th>
                      <th className="py-2 pr-4">Usuario</th>
                      <th className="py-2 pr-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((row) => {
                      const userObj =
                        typeof row.usuario === "object"
                          ? row.usuario
                          : usersById[row.usuario];
                      const userLabel =
                        userObj?.email ||
                        userObj?.username ||
                        (row.usuario ?? "—");
                      return (
                        <tr key={row.id} className="border-b border-white/10">
                          <td className="py-2 pr-4">{row.id}</td>
                          <td className="py-2 pr-4">{row.mensaje}</td>
                          <td className="py-2 pr-4">{fmtDateTime(row.fecha)}</td>
                          <td className="py-2 pr-4">{fmtDateTime(row.created_at)}</td>
                          <td className="py-2 pr-4">{userLabel}</td>
                          <td className="py-2 pr-4">
                            <div className="flex gap-2">
                              <button
                                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700"
                                onClick={() => this.editRow(row)}
                              >
                                Editar
                              </button>
                              <button
                                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700"
                                onClick={() => this.removeRow(row)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Paginacion
                currentPage={currentPage}
                totalItems={total}
                pageSize={pageSize}
                onPageChange={this.goToPage}
              />
            </>
          )}
        </section>
      </main>
    );
  }
}

export default Alerta;
