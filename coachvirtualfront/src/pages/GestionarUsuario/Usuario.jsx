import React, { Component } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../services/UsuarioService";
import Paginacion from "../../components/Paginacion";

class Usuario extends Component {
  state = {
    form: {
      id: null,
      email: "",
      username: "",
      password: "",
      first_name: "",
      last_name: "",
      fecha_nacimiento: "",
      genero: "",
      altura: "",
      peso: "",
      is_active: true,
      // campos de suscripción
      plan_actual: "",
      fecha_expiracion_plan: "",
    },
    items: [],
    loadingList: false,
    loadingSave: false,
    errorList: null,
    errorSave: null,
    successSave: null,
    errorsByField: {},
    isEditing: false,

    // Paginación
    currentPage: 1,
    pageSize: 5,

    // Mostrar/ocultar contraseña
    showPassword: false,
  };

  componentDidMount() {
    this.loadList();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.items.length !== this.state.items.length ||
      prevState.pageSize !== this.state.pageSize
    ) {
      this.ensurePageInRange();
    }
  }

  // ====== Helpers de estado real del plan ======
  /**
   * Devuelve true si el plan está ACTIVO hoy.
   * Prioriza el valor enviado por el backend (tiene_plan_activo),
   * y si no viene, lo calcula con la fecha de expiración.
   */
  computePlanActivo = (row) => {
    // 1) si el backend ya manda un booleano, lo usamos
    if (typeof row.tiene_plan_activo === "boolean") {
      return row.tiene_plan_activo;
    }

    // 2) cálculo local: plan + fecha de expiración
    const { plan_actual, fecha_expiracion_plan } = row;
    if (!plan_actual || !fecha_expiracion_plan) return false;

    const exp = new Date(fecha_expiracion_plan);
    if (isNaN(exp.getTime())) return false;

    const hoy = new Date();
    // normalizamos a solo fecha (00:00:00) para evitar líos de hora
    hoy.setHours(0, 0, 0, 0);
    exp.setHours(0, 0, 0, 0);

    return exp >= hoy; // vigente si vence hoy o después
  };

  /**
   * Devuelve true si el usuario puede entrenar:
   * plan activo + usuario activo.
   * Si el backend manda `puede_entrenar`, lo respetamos.
   */
  computePuedeEntrenar = (row) => {
    if (typeof row.puede_entrenar === "boolean") {
      return row.puede_entrenar;
    }
    const planActivo = this.computePlanActivo(row);
    const userActivo = row.is_active !== false;
    return planActivo && userActivo;
  };

  /**
   * Texto amigable del estado del plan (Vigente, Vencido, Sin plan, etc.)
   */
  getPlanEstadoLabel = (row) => {
    const { plan_actual, fecha_expiracion_plan } = row;
    if (!plan_actual) return "Sin plan";

    if (!fecha_expiracion_plan) return "Sin fecha de expiración";

    const activo = this.computePlanActivo(row);
    return activo ? "Vigente" : "Vencido";
  };

  // ====== Paginación ======
  ensurePageInRange = () => {
    this.setState((prev) => {
      const totalPages = Math.max(1, Math.ceil(prev.items.length / prev.pageSize));
      const newPage = Math.min(prev.currentPage, totalPages) || 1;
      return newPage !== prev.currentPage ? { currentPage: newPage } : null;
    });
  };

  goToPage = (p) => this.setState({ currentPage: p });

  getPagedItems = () => {
    const { items, currentPage, pageSize } = this.state;
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  };

  // ====== API ======
  loadList = async () => {
    this.setState({ loadingList: true, errorList: null });
    try {
      const resp = await listUsers();
      this.setState(
        { items: resp.results, loadingList: false },
        this.ensurePageInRange
      );
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "No se pudo cargar la lista de usuarios.";
      this.setState({ loadingList: false, errorList: msg });
    }
  };

  // ====== Form ======
  handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const v = type === "checkbox" ? checked : value;
    this.setState((prev) => ({
      form: { ...prev.form, [name]: v },
      errorSave: null,
      successSave: null,
      errorsByField: { ...prev.errorsByField, [name]: undefined },
    }));
  };

  togglePassword = () => {
    this.setState((prev) => ({ showPassword: !prev.showPassword }));
  };

  resetForm = () => {
    this.setState({
      form: {
        id: null,
        email: "",
        username: "",
        password: "",
        first_name: "",
        last_name: "",
        fecha_nacimiento: "",
        genero: "",
        altura: "",
        peso: "",
        is_active: true,
        plan_actual: "",
        fecha_expiracion_plan: "",
      },
      isEditing: false,
      errorSave: null,
      successSave: null,
      errorsByField: {},
      showPassword: false,
    });
  };

  editRow = (row) => {
    this.setState({
      form: {
        id: row.id,
        email: row.email || "",
        username: row.username || "",
        password: "",
        first_name: row.first_name || "",
        last_name: row.last_name || "",
        fecha_nacimiento: row.fecha_nacimiento || "",
        genero: row.genero || "",
        altura: row.altura ?? "",
        peso: row.peso ?? "",
        is_active: row.is_active ?? true,
        // suscripción
        plan_actual: row.plan_actual || "",
        fecha_expiracion_plan: row.fecha_expiracion_plan
          ? String(row.fecha_expiracion_plan).slice(0, 10)
          : "",
      },
      isEditing: true,
      errorSave: null,
      successSave: null,
      errorsByField: {},
      showPassword: false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  removeRow = async (row) => {
    if (!window.confirm(`¿Eliminar al usuario "${row.username}"?`)) return;
    try {
      await deleteUser(row.id);
      this.setState(
        (prev) => ({ items: prev.items.filter((x) => x.id !== row.id) }),
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
    const { email, username, password } = this.state.form;
    const errors = {};
    if (!email?.trim()) errors.email = "Email requerido";
    if (!username?.trim()) errors.username = "Usuario requerido";
    if (!this.state.isEditing && !password?.trim())
      errors.password = "Contraseña requerida";
    this.setState({ errorsByField: errors });
    return Object.keys(errors).length === 0;
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    if (this.state.loadingSave) return;
    if (!this.validate()) return;

    this.setState({ loadingSave: true, errorSave: null, successSave: null });

    const {
      id,
      email,
      username,
      password,
      first_name,
      last_name,
      fecha_nacimiento,
      genero,
      altura,
      peso,
      is_active,
      plan_actual,
      fecha_expiracion_plan,
    } = this.state.form;

    const payload = {
      email: email.trim(),
      username: username.trim(),
      first_name: first_name?.trim() || "",
      last_name: last_name?.trim() || "",
      fecha_nacimiento: fecha_nacimiento || null,
      genero: genero || "",
      altura: typeof altura === "string" ? altura.trim() : altura,
      peso: typeof peso === "string" ? peso.trim() : peso,
      is_active: !!is_active,
      // suscripción
      plan_actual: plan_actual || null,
      fecha_expiracion_plan: fecha_expiracion_plan || null,
    };

    if (!this.state.isEditing || (password && password.trim())) {
      payload.password = password.trim();
    }

    try {
      let saved;
      if (this.state.isEditing && id) {
        saved = await updateUser(id, payload, { sanitize: false });
        this.setState({
          successSave: "Usuario actualizado correctamente.",
          loadingSave: false,
        });
        this.setState((prev) => ({
          items: prev.items.map((x) => (x.id === saved.id ? saved : x)),
        }));
      } else {
        saved = await createUser(payload);
        this.setState({
          successSave: "Usuario creado correctamente.",
          loadingSave: false,
        });
        this.setState((prev) => ({ items: [saved, ...prev.items] }));
      }
      this.resetForm();
      this.ensurePageInRange();
    } catch (err) {
      let msg = "Error al guardar.";
      let fieldErrors = {};
      if (err.response) {
        if (typeof err.response.data === "object") fieldErrors = err.response.data;
        msg = err.response.data?.detail || msg;
      } else if (err.message) {
        msg = err.message;
      }
      this.setState({
        loadingSave: false,
        errorSave: msg,
        errorsByField: fieldErrors,
      });
    }
  };

  // ====== UI helpers ======
  renderField(label, name, type = "text", props = {}) {
    const { form, errorsByField, showPassword, isEditing } = this.state;
    const hasError = Boolean(errorsByField?.[name]);

    if (name === "password") {
      return (
        <div className="flex flex-col gap-1 relative">
          <label className="text-white/80 text-sm" htmlFor={name}>
            {isEditing ? "Contraseña (opcional)" : "Contraseña"}
          </label>
          <input
            id={name}
            name={name}
            type={showPassword ? "text" : "password"}
            value={form[name]}
            onChange={this.handleChange}
            className={`px-4 py-3 rounded-xl bg-white/10 border ${
              hasError ? "border-red-400" : "border-white/20"
            } text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 pr-10`}
            placeholder={
              isEditing ? "•••••••• (deja vacío para no cambiar)" : "••••••••"
            }
            {...props}
          />
          <button
            type="button"
            onClick={this.togglePassword}
            className="absolute right-3 top-9 text-white/70 hover:text-white focus:outline-none"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
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

  render() {
    const {
      items,
      loadingList,
      errorList,
      loadingSave,
      errorSave,
      successSave,
      isEditing,
      form,
      currentPage,
      pageSize,
    } = this.state;

    const total = items.length;
    const paged = this.getPagedItems();

    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-4 sm:p-6">
        {/* Form */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-4 sm:p-6 w-full max-w-3xl mx-auto border border-white/20 mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-4">
            {isEditing ? "Editar usuario" : "Crear usuario"}
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
            {this.renderField("Email", "email", "email", {
              placeholder: "tucorreo@ejemplo.com",
            })}
            {this.renderField("Usuario", "username", "text", {
              placeholder: "usuario",
            })}
            {this.renderField("Contraseña", "password", "password")}

            {/* Nombres */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {this.renderField("Nombre", "first_name")}
              {this.renderField("Apellido", "last_name")}
            </div>

            {/* Otros datos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {this.renderField("Fecha de nacimiento", "fecha_nacimiento", "date")}
              {this.renderField("Género", "genero", "text", {
                placeholder: "Masculino/Femenino/Otro",
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {this.renderField("Altura (m)", "altura", "text", {
                placeholder: "1.75",
              })}
              {this.renderField("Peso (kg)", "peso", "text", {
                placeholder: "70",
              })}
            </div>

            {/* Plan / suscripción */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {this.renderField("Plan actual", "plan_actual", "text", {
                placeholder: "Premium, Fisio, etc.",
              })}
              {this.renderField(
                "Fecha expiración del plan",
                "fecha_expiracion_plan",
                "date"
              )}
            </div>

            {/* Checkbox activo */}
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={!!form.is_active}
                onChange={this.handleChange}
                className="h-5 w-5"
              />
              <label htmlFor="is_active" className="text-white/80 text-sm">
                Activo
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loadingSave}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg hover:scale-[1.02] w-full sm:w-auto"
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
                  className="bg-white/10 border border-white/30 text-white py-3 px-6 rounded-2xl hover:bg-white/20 w-full sm:w-auto"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Listado */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-4 sm:p-6 w-full max-w-6xl mx-auto border border-white/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <h2 className="text-lg sm:text-xl font-semibold text-white">
              Listado de usuarios
            </h2>
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
            <p className="text-white/80">No hay usuarios.</p>
          ) : (
            <>
              {/* Tabla desktop */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full text-sm text-white/90">
                  <thead>
                    <tr className="text-left border-b border-white/20">
                      <th className="py-2 pr-4">ID</th>
                      <th className="py-2 pr-4">Usuario</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Nombre</th>
                      <th className="py-2 pr-4">Género</th>
                      <th className="py-2 pr-4">Altura</th>
                      <th className="py-2 pr-4">Peso</th>
                      <th className="py-2 pr-4">Activo</th>
                      {/* columnas de plan */}
                      <th className="py-2 pr-4">Plan</th>
                      <th className="py-2 pr-4">Vence</th>
                      <th className="py-2 pr-4">Estado plan</th>
                      <th className="py-2 pr-4">Plan activo</th>
                      <th className="py-2 pr-4">Puede entrenar</th>
                      <th className="py-2 pr-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((row) => {
                      const planActivo = this.computePlanActivo(row);
                      const puedeEntrenar = this.computePuedeEntrenar(row);
                      const estadoPlan = this.getPlanEstadoLabel(row);
                      return (
                        <tr key={row.id} className="border-b border-white/10">
                          <td className="py-2 pr-4">{row.id}</td>
                          <td className="py-2 pr-4">{row.username}</td>
                          <td className="py-2 pr-4">{row.email}</td>
                          <td className="py-2 pr-4">
                            {(row.first_name || "") +
                              " " +
                              (row.last_name || "")}
                          </td>
                          <td className="py-2 pr-4">{row.genero || "-"}</td>
                          <td className="py-2 pr-4">{row.altura ?? "-"}</td>
                          <td className="py-2 pr-4">{row.peso ?? "-"}</td>
                          <td className="py-2 pr-4">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                row.is_active
                                  ? "bg-emerald-600/60"
                                  : "bg-rose-600/60"
                              }`}
                            >
                              {row.is_active ? "Sí" : "No"}
                            </span>
                          </td>
                          {/* datos de plan */}
                          <td className="py-2 pr-4">
                            {row.plan_actual || "Sin plan"}
                          </td>
                          <td className="py-2 pr-4">
                            {row.fecha_expiracion_plan
                              ? String(row.fecha_expiracion_plan).slice(0, 10)
                              : "—"}
                          </td>
                          <td className="py-2 pr-4">{estadoPlan}</td>
                          <td className="py-2 pr-4">
                            {planActivo ? "Sí" : "No"}
                          </td>
                          <td className="py-2 pr-4">
                            {puedeEntrenar ? "Sí" : "No"}
                          </td>
                          <td className="py-2 pr-4">
                            <div className="flex gap-2">
                              <button
                                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                                onClick={() => this.editRow(row)}
                              >
                                Editar
                              </button>
                              <button
                                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-xs sm:text-sm"
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

              {/* Cards móvil / tablet */}
              <div className="lg:hidden grid gap-4">
                {paged.map((row) => {
                  const planActivo = this.computePlanActivo(row);
                  const puedeEntrenar = this.computePuedeEntrenar(row);
                  const estadoPlan = this.getPlanEstadoLabel(row);
                  return (
                    <div
                      key={row.id}
                      className="bg-white/10 border border-white/20 rounded-2xl p-4 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-semibold text-lg">
                            {row.username}
                          </p>
                          <p className="text-white/70 text-sm">{row.email}</p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            row.is_active
                              ? "bg-emerald-600/60"
                              : "bg-rose-600/60"
                          }`}
                        >
                          {row.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <div className="text-white/80 text-sm space-y-1">
                        <p>
                          <span className="font-medium">Nombre:</span>{" "}
                          {(row.first_name || "") +
                            " " +
                            (row.last_name || "") || "-"}
                        </p>
                        <p>
                          <span className="font-medium">Género:</span>{" "}
                          {row.genero || "-"}
                        </p>
                        <p>
                          <span className="font-medium">Altura:</span>{" "}
                          {row.altura ?? "-"} m
                        </p>
                        <p>
                          <span className="font-medium">Peso:</span>{" "}
                          {row.peso ?? "-"} kg
                        </p>
                        {/* datos de plan */}
                        <p>
                          <span className="font-medium">Plan:</span>{" "}
                          {row.plan_actual || "Sin plan"}
                        </p>
                        <p>
                          <span className="font-medium">Vence:</span>{" "}
                          {row.fecha_expiracion_plan
                            ? String(row.fecha_expiracion_plan).slice(0, 10)
                            : "—"}
                        </p>
                        <p>
                          <span className="font-medium">Estado plan:</span>{" "}
                          {estadoPlan}
                        </p>
                        <p>
                          <span className="font-medium">Plan activo:</span>{" "}
                          {planActivo ? "Sí" : "No"}
                        </p>
                        <p>
                          <span className="font-medium">Puede entrenar:</span>{" "}
                          {puedeEntrenar ? "Sí" : "No"}
                        </p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                          onClick={() => this.editRow(row)}
                        >
                          Editar
                        </button>
                        <button
                          className="flex-1 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold"
                          onClick={() => this.removeRow(row)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
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

export default Usuario;
