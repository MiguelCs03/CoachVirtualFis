// src/pages/detalle-musculo/Detalle_Musculo.jsx
import React, { Component } from "react";
import DetalleMusculoService from "../../services/DetalleMusculoService";
import MusculoService from "../../services/MusculoService";
import EjercicioService from "../../services/EjercicioService";
import TipoService from "../../services/TipoService";
import Paginacion from "../../components/Paginacion";

/**
 * DetalleMusculo (NUEVA BD):
 *  - porcentaje
 *  - musculo (FK)
 *  - ejercicio (FK)
 *
 * NO se guarda tipo en DetalleMusculo.
 * El tipo se obtiene automáticamente desde el músculo seleccionado (musculo.tipo).
 */
class Detalle_Musculo extends Component {
  state = {
    form: { porcentaje: "", musculo: "", ejercicio: "" },
    items: [],
    musculos: [],
    ejercicios: [],
    tipos: [],
    loadingList: false,
    loadingSave: false,
    errorList: null,
    errorSave: null,
    successSave: null,
    errorsByField: {},
    isEditing: false,
    editingId: null,
    currentPage: 1,
    pageSize: 5,
  };

  componentDidMount() {
    this.fetchAll();
  }

  // ================== CARGA INICIAL ==================
  fetchAll = async () => {
    this.setState({ loadingList: true, errorList: null });
    try {
      const [detallesData, musculosData, ejerciciosData, tiposData] =
        await Promise.all([
          DetalleMusculoService.getAll(),
          MusculoService.getAll(),
          EjercicioService.getAll(),
          TipoService.getAll(), // solo para mostrar nombres de tipo
        ]);

      this.setState({
        items: Array.isArray(detallesData) ? detallesData : [],
        musculos: Array.isArray(musculosData) ? musculosData : [],
        ejercicios: Array.isArray(ejerciciosData) ? ejerciciosData : [],
        tipos: Array.isArray(tiposData) ? tiposData : [],
        loadingList: false,
      });
    } catch (err) {
      this.setState({
        errorList:
          err?.response?.data?.detail ||
          err?.message ||
          "No se pudo cargar la información.",
        loadingList: false,
      });
    }
  };

  // ================== HELPERS ==================
  normalizeId = (value) => {
    if (value == null) return null;
    if (typeof value === "object") return Number(value.id);
    return Number(value);
  };

  getPagedItems() {
    const { items, currentPage, pageSize } = this.state;
    const start = (currentPage - 1) * pageSize;
    return (items || []).slice(start, start + pageSize);
  }

  findMusculo = (id) => {
    const { musculos } = this.state;
    const numId = this.normalizeId(id);
    if (numId == null || Number.isNaN(numId)) return undefined;
    return musculos.find((m) => Number(m.id) === numId);
  };

  findEjercicio = (id) => {
    const { ejercicios } = this.state;
    const numId = this.normalizeId(id);
    if (numId == null || Number.isNaN(numId)) return undefined;
    return ejercicios.find((e) => Number(e.id) === numId);
  };

  findTipo = (id) => {
    const { tipos } = this.state;
    const numId = this.normalizeId(id);
    if (numId == null || Number.isNaN(numId)) return undefined;
    return tipos.find((t) => Number(t.id) === numId);
  };

  getTipoNombreFromMusculo = (musculoObj) => {
    if (!musculoObj) return "—";
    // 1) si backend manda tipo_data completo (MusculoSerializer)
    if (musculoObj.tipo_data?.nombre) return musculoObj.tipo_data.nombre;
    // 2) si solo manda tipo (id)
    const tipo = this.findTipo(musculoObj.tipo);
    return tipo?.nombre || musculoObj.tipo || "—";
  };

  getTipoNombreFromItem = (item) => {
    // item puede traer tipo embebido por serializer de detalle
    if (item?.tipo?.nombre) return item.tipo.nombre;

    // o item.musculo_data con tipo
    const tipoId =
      item?.musculo_data?.tipo ??
      item?.musculo_data?.tipo_data?.id ??
      null;

    if (tipoId != null) {
      const tipo = this.findTipo(tipoId);
      return tipo?.nombre || tipoId;
    }

    // fallback: buscar musculo en cache
    const musculoObj = this.findMusculo(item?.musculo);
    return this.getTipoNombreFromMusculo(musculoObj);
  };

  // ================== FORM ==================
  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState((prev) => ({
      form: { ...prev.form, [name]: value },
      errorsByField: { ...prev.errorsByField, [name]: undefined },
      errorSave: null,
      successSave: null,
    }));
  };

  validate = () => {
    const { porcentaje, musculo, ejercicio } = this.state.form;
    const errors = {};
    if (!porcentaje?.trim()) errors.porcentaje = "El porcentaje es obligatorio";
    if (!musculo?.trim()) errors.musculo = "El músculo es obligatorio";
    if (!ejercicio?.trim()) errors.ejercicio = "El ejercicio es obligatorio";
    this.setState({ errorsByField: errors });
    return Object.keys(errors).length === 0;
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    if (!this.validate()) return;

    this.setState({ loadingSave: true, errorSave: null, successSave: null });

    // ✅ Payload sin tipo
    const payload = {
      porcentaje: this.state.form.porcentaje.trim(),
      musculo: Number(this.state.form.musculo),
      ejercicio: Number(this.state.form.ejercicio),
    };

    try {
      let savedItem;
      if (this.state.isEditing) {
        savedItem = await DetalleMusculoService.update(
          this.state.editingId,
          payload
        );
        this.setState((prev) => ({
          items: prev.items.map((item) =>
            item.id === savedItem.id ? savedItem : item
          ),
          successSave: "Detalle actualizado exitosamente",
          loadingSave: false,
        }));
      } else {
        savedItem = await DetalleMusculoService.create(payload);
        this.setState((prev) => ({
          items: [...prev.items, savedItem],
          successSave: "Detalle creado exitosamente",
          loadingSave: false,
        }));
      }
      this.resetForm();
    } catch (err) {
      this.setState({
        errorSave:
          err?.response?.data?.detail ||
          err?.message ||
          "No se pudo guardar el detalle.",
        loadingSave: false,
      });
    }
  };

  resetForm = () => {
    this.setState({
      form: { porcentaje: "", musculo: "", ejercicio: "" },
      isEditing: false,
      editingId: null,
      errorSave: null,
      successSave: null,
      errorsByField: {},
    });
  };

  editRow = (item) => {
    const safeMusculo =
      typeof item.musculo === "object" ? item.musculo.id : item.musculo;
    const safeEjercicio =
      typeof item.ejercicio === "object" ? item.ejercicio.id : item.ejercicio;

    this.setState({
      form: {
        porcentaje: item.porcentaje ?? "",
        musculo: safeMusculo != null ? String(safeMusculo) : "",
        ejercicio: safeEjercicio != null ? String(safeEjercicio) : "",
      },
      isEditing: true,
      editingId: item.id,
      errorSave: null,
      successSave: null,
      errorsByField: {},
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  removeRow = async (item) => {
    if (!window.confirm(`¿Eliminar el detalle con ID "${item.id}"?`)) return;
    try {
      await DetalleMusculoService.delete(item.id);
      this.setState((prev) => ({
        items: prev.items.filter((x) => x.id !== item.id),
        successSave: "Detalle eliminado exitosamente",
      }));
    } catch (err) {
      this.setState({
        errorSave:
          err?.response?.data?.detail ||
          err?.message ||
          "No se pudo eliminar el detalle.",
      });
    }
  };

  // ================== COMPONENTES DE UI ==================
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
          value={form[name] || ""}
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

  renderSelect(label, name, options, valueKey, labelKey, extraLabelFn) {
    const { form, errorsByField } = this.state;
    const hasError = Boolean(errorsByField?.[name]);
    const safeOptions = Array.isArray(options) ? options : [];

    const selectStyle = {
      backgroundColor: "rgba(255,255,255,0.08)",
      color: "#ffffff",
    };
    const optionStyle = {
      backgroundColor: "#111827",
      color: "#ffffff",
    };

    return (
      <div className="flex flex-col gap-1">
        <label className="text-white/80 text-sm" htmlFor={name}>
          {label}
        </label>
        <select
          id={name}
          name={name}
          value={form[name] || ""}
          onChange={this.handleChange}
          style={selectStyle}
          className={`px-4 py-3 rounded-xl border ${
            hasError ? "border-red-400" : "border-white/20"
          } text-white focus:outline-none focus:ring-2 focus:ring-white/40`}
        >
          <option value="" style={optionStyle}>
            Seleccione una opción
          </option>
          {safeOptions.map((option) => {
            const baseLabel = option[labelKey];
            const extra = extraLabelFn ? extraLabelFn(option) : "";
            return (
              <option
                key={option[valueKey]}
                value={option[valueKey]}
                style={optionStyle}
              >
                {extra ? `${baseLabel} — ${extra}` : baseLabel}
              </option>
            );
          })}
        </select>

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

  // ================== RENDER ==================
  render() {
    const {
      successSave,
      errorSave,
      loadingSave,
      isEditing,
      musculos,
      ejercicios,
      items,
      currentPage,
      pageSize,
      form,
      loadingList,
    } = this.state;

    const pagedItems = Array.isArray(this.getPagedItems())
      ? this.getPagedItems()
      : [];

    const selectedMusculo = form.musculo
      ? this.findMusculo(form.musculo)
      : null;
    const selectedEjercicio = form.ejercicio
      ? this.findEjercicio(form.ejercicio)
      : null;

    const selectedTipoNombre = this.getTipoNombreFromMusculo(selectedMusculo);

    return (
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 max-w-6xl w-full border border-white/20 text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-6 text-center">
            Gestionar Detalles de Músculo
          </h1>

          {/* Mensajes */}
          {successSave && (
            <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200">
              {successSave}
            </div>
          )}
          {errorSave && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
              Error: {errorSave}
            </div>
          )}

          {/* FORMULARIO */}
          <form onSubmit={this.handleSubmit} className="mb-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              {this.renderField("Porcentaje", "porcentaje", "text", {
                placeholder: "Ej: 75",
              })}

              {/* Tipo automático */}
              <div className="flex flex-col gap-1">
                <label className="text-white/80 text-sm">Tipo (automático)</label>
                <div className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white/90">
                  {selectedTipoNombre}
                </div>
                <span className="text-white/50 text-xs">
                  El tipo se define por el músculo seleccionado.
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {this.renderSelect(
                "Músculo",
                "musculo",
                musculos,
                "id",
                "nombre",
                (m) => this.getTipoNombreFromMusculo(m) // ✅ muestra tipo al lado del músculo
              )}

              {this.renderSelect(
                "Ejercicio",
                "ejercicio",
                ejercicios,
                "id",
                "nombre"
              )}
            </div>

            {/* PREVIEW DE IMÁGENES SELECCIONADAS */}
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col items-center">
                <h2 className="text-sm font-semibold mb-2 text-white/80">
                  Músculo seleccionado
                </h2>
                {selectedMusculo ? (
                  <>
                    {selectedMusculo.url && (
                      <img
                        src={selectedMusculo.url}
                        alt={selectedMusculo.nombre}
                        className="w-full h-40 object-cover rounded-xl mb-2 border border-white/20"
                      />
                    )}
                    <p className="text-white font-semibold">
                      {selectedMusculo.nombre}
                    </p>
                    <p className="text-white/70 text-xs mt-1">
                      Tipo: {selectedTipoNombre}
                    </p>
                  </>
                ) : (
                  <p className="text-white/50 text-xs">
                    Aún no has seleccionado un músculo.
                  </p>
                )}
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col items-center">
                <h2 className="text-sm font-semibold mb-2 text-white/80">
                  Ejercicio seleccionado
                </h2>
                {selectedEjercicio ? (
                  <>
                    {selectedEjercicio.url && (
                      <img
                        src={selectedEjercicio.url}
                        alt={selectedEjercicio.nombre}
                        className="w-full h-40 object-cover rounded-xl mb-2 border border-white/20"
                      />
                    )}
                    <p className="text-white font-semibold">
                      {selectedEjercicio.nombre}
                    </p>
                  </>
                ) : (
                  <p className="text-white/50 text-xs">
                    Aún no has seleccionado un ejercicio.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-center mt-4">
              <button
                type="submit"
                disabled={loadingSave}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingSave
                  ? "Guardando..."
                  : isEditing
                  ? "Actualizar"
                  : "Crear"}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={this.resetForm}
                  className="px-6 py-3 rounded-full border-2 border-white/30 hover:border-white/60 text-white font-semibold transition hover:bg-white/10"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* LISTA */}
          {loadingList ? (
            <div className="text-center py-8">
              <p className="text-white/60">Cargando detalles...</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-left">
                {pagedItems.map((item) => {
                  const musculo = this.findMusculo(item.musculo);
                  const ejercicio = this.findEjercicio(item.ejercicio);
                  const tipoNombre = this.getTipoNombreFromItem(item);

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl p-6 bg-white/10 hover:bg-white/20 border border-white/20 transition-all shadow-lg"
                    >
                      <p className="text-xs text-white/60 mb-2">
                        Detalle #{item.id}
                      </p>

                      <div className="flex gap-3 mb-4">
                        <div className="flex-1">
                          {musculo?.url && (
                            <img
                              src={musculo.url}
                              alt={musculo.nombre}
                              className="w-full h-24 object-cover rounded-xl border border-white/20 mb-1"
                            />
                          )}
                          <p className="text-xs text-white/70">
                            <span className="font-semibold">Músculo:</span>{" "}
                            {musculo ? musculo.nombre : item.musculo}
                          </p>
                          <p className="text-[11px] text-white/60">
                            Tipo: {tipoNombre}
                          </p>
                        </div>

                        <div className="flex-1">
                          {ejercicio?.url && (
                            <img
                              src={ejercicio.url}
                              alt={ejercicio.nombre}
                              className="w-full h-24 object-cover rounded-xl border border-white/20 mb-1"
                            />
                          )}
                          <p className="text-xs text-white/70">
                            <span className="font-semibold">Ejercicio:</span>{" "}
                            {ejercicio ? ejercicio.nombre : item.ejercicio}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-white/80 mb-4">
                        <span className="font-semibold">Porcentaje:</span>{" "}
                        {item.porcentaje}
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => this.editRow(item)}
                          className="flex-1 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => this.removeRow(item)}
                          className="flex-1 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {pagedItems.length === 0 && (
                <p className="text-center text-white/60 mt-8">
                  No hay detalles registrados todavía.
                </p>
              )}

              <Paginacion
                currentPage={currentPage}
                totalItems={items.length}
                pageSize={pageSize}
                onPageChange={(page) => this.setState({ currentPage: page })}
              />
            </>
          )}

          <footer className="mt-8 text-white/40 text-xs text-center">
            Coach Virtual &copy; {new Date().getFullYear()}
          </footer>
        </section>
      </main>
    );
  }
}

export default Detalle_Musculo;
