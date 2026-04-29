import React, { Component } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { createUser, buildUserPayload } from "../../services/UsuarioService"; 

class Register extends Component {
  state = {
    form: {
      email: "",
      username: "",
      password: "",
      first_name: "",
      last_name: "",
      fecha_nacimiento: "",
      genero: "",
      altura: "",
      peso: "",
    },
    showPassword: false,
    loading: false,
    success: null,
    error: null,
    errorsByField: {},
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState((prev) => ({
      form: { ...prev.form, [name]: value },
      error: null,
      success: null,
      errorsByField: { ...prev.errorsByField, [name]: undefined },
    }));
  };

  togglePassword = () => {
    this.setState((prev) => ({ showPassword: !prev.showPassword }));
  };

  validate = () => {
    const { email, username, password } = this.state.form;
    const errors = {};
    if (!email) errors.email = "Email requerido";
    if (!username) errors.username = "Usuario requerido";
    if (!password) errors.password = "Contraseña requerida";
    this.setState({ errorsByField: errors });
    return Object.keys(errors).length === 0;
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    if (!this.validate() || this.state.loading) return;

    this.setState({ loading: true, error: null, success: null });

    try {
      const payload = buildUserPayload(this.state.form, { omitPasswordIfEmpty: false });
      const data = await createUser(payload);

      this.setState({
        success: "Usuario registrado correctamente.",
        loading: false,
        error: null,
        form: {
          email: "",
          username: "",
          password: "",
          first_name: "",
          last_name: "",
          fecha_nacimiento: "",
          genero: "",
          altura: "",
          peso: "",
        },
        errorsByField: {},
      });

      if (this.props.onRegistered) this.props.onRegistered(data);
    } catch (err) {
      let msg = "Error registrando usuario";
      let fieldErrors = {};
      if (err.response) {
        if (typeof err.response.data === "object")
          fieldErrors = err.response.data;
        msg = err.response.data?.detail || msg;
      } else if (err.message) {
        msg = err.message;
      }
      this.setState({ loading: false, error: msg, errorsByField: fieldErrors });
    }
  };

  renderField(label, name, type = "text", props = {}) {
    const { form, errorsByField, showPassword } = this.state;
    const hasError = Boolean(errorsByField?.[name]);

    if (name === "password") {
      return (
        <div className="flex flex-col gap-1 relative">
          <label className="text-white/80 text-sm" htmlFor={name}>
            {label}
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
            {...props}
          />
          <button
            type="button"
            onClick={this.togglePassword}
            className="absolute right-3 top-9 text-white/70 hover:text-white focus:outline-none"
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
    const { loading, error, success } = this.state;

    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-xl border border-white/20">
          <h1 className="text-3xl font-bold text-white text-center mb-6">
            Crear cuenta
          </h1>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-400 text-red-100 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-100 text-sm">
              {success}
            </div>
          )}

          <form className="grid grid-cols-1 gap-4" onSubmit={this.handleSubmit}>
            {this.renderField("Email", "email", "email", {
              placeholder: "tucorreo@ejemplo.com",
            })}
            {this.renderField("Usuario", "username", "text", {
              placeholder: "tu sobre nombre",
            })}
            {this.renderField("Contraseña", "password", "password", {
              placeholder: "••••••••",
            })}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {this.renderField("Nombre", "first_name")}
              {this.renderField("Apellido", "last_name")}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {this.renderField(
                "Fecha de nacimiento",
                "fecha_nacimiento",
                "date"
              )}
              <div className="flex flex-col gap-1">
                <label className="text-white/80 text-sm" htmlFor="genero">
                  Género
                </label>
                <select
                  id="genero"
                  name="genero"
                  value={this.state.form.genero}
                  onChange={this.handleChange}
                  className={`px-4 py-3 rounded-xl bg-white/10 border ${
                    this.state.errorsByField?.genero
                      ? "border-red-400"
                      : "border-white/20"
                  } text-white focus:outline-none focus:ring-2 focus:ring-white/40`}
                >
                  <option value="" className="text-black">
                    Selecciona…
                  </option>
                  <option value="Masculino" className="text-black">
                    Masculino
                  </option>
                  <option value="Femenino" className="text-black">
                    Femenino
                  </option>
                  <option value="Otro" className="text-black">
                    Otro
                  </option>
                </select>
                {this.state.errorsByField?.genero && (
                  <span className="text-red-300 text-xs">
                    {String(this.state.errorsByField.genero)}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {this.renderField("Altura (m)", "altura", "text", {
                placeholder: "1.75",
              })}
              {this.renderField("Peso (kg)", "peso", "text", { placeholder: "70" })}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:scale-[1.02]"
            >
              {loading ? "Registrando…" : "Registrarme"}
            </button>
          </form>

          <p className="text-xs text-white/60 mt-4">
            Al registrarte aceptas los Términos y la Política de privacidad.
          </p>
        </section>
      </main>
    );
  }
}

export default Register;
