import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { Lock, ShieldCheck, ChevronRight } from "lucide-react";

/** Input de contraseña accesible con estilo industrial */
const PasswordInput = ({
  value,
  onChange,
  name = "password",
  placeholder = "••••••••",
  autoComplete = "current-password",
  required = false,
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2 relative">
      <div className="flex justify-between items-center text-yellow-400 font-black text-[10px] tracking-widest uppercase">
        <span>Clave de Acceso</span>
        <div className="flex items-center gap-2">
           <button 
             type="button"
             onClick={() => setShow(!show)}
             className="text-[8px] hover:text-white transition-colors"
           >
             {show ? "OCULTAR" : "MOSTRAR"}
           </button>
           <ShieldCheck className="w-3 h-3" />
        </div>
      </div>
      <input
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        className="w-full bg-white/[0.03] border-l-4 border-yellow-400 p-4 text-white font-mono text-sm focus:bg-white/[0.08] outline-none transition-all"
        placeholder={placeholder}
      />
    </div>
  );
};

const IniciarSesion = ({ signIn, onSuccess }) => {
  const navigate = useNavigate();
  const { isSuper } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await signIn(formData.email, formData.password);
      onSuccess?.();

      // Redirección por rol:
      if (isSuper) {
        navigate("/home", { replace: true });
      } else {
        const next = localStorage.getItem("cv.category") ? "/musculo" : "/seleccionar";
        navigate(next, { replace: true });
      }
    } catch (err) {
      setError(
        err?.message || "Error al iniciar sesión. Verifica tus credenciales."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-6 bg-red-500/10 border-l-4 border-red-500 text-red-500 p-4 font-mono text-[10px] uppercase tracking-widest">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-yellow-400 font-black text-[10px] tracking-widest uppercase">
            <span>ID de Atleta</span>
            <Lock className="w-3 h-3" />
          </div>
          <input 
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="USUARIO@GYM.PRO"
            autoComplete="email"
            required
            className="w-full bg-white/[0.03] border-l-4 border-yellow-400 p-4 text-white font-mono text-sm focus:bg-white/[0.08] outline-none transition-all"
          />
        </div>

        <PasswordInput
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button 
          type="submit"
          disabled={isLoading}
          className="w-full bg-yellow-400 hover:bg-white text-black font-black py-5 uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sincronizando..." : "Iniciar Sincronización"} 
          {!isLoading && <ChevronRight className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};

export default IniciarSesion;
