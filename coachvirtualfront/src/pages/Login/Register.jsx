import { useEffect, useRef, useState, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import api from "../../api/api";
import { ChevronRight, ArrowRight, UserPlus } from "lucide-react";

/* ===== Estilos para el input de fecha nativo (para que no se vea feo el icono negro) ===== */
const HideNativeDateStyles = () => (
  <style>{`
    .hide-native-date::-webkit-calendar-picker-indicator {
      filter: invert(1);
      opacity: 0.5;
      cursor: pointer;
    }
  `}</style>
);

const IndustrialInput = ({ label, ...props }) => (
  <div className="space-y-1">
    {label && (
      <label className="text-white/40 font-black text-[9px] tracking-widest uppercase ml-1">
        {label}
      </label>
    )}
    <input 
      {...props}
      className={`w-full bg-white/[0.03] border-l-2 border-white/20 p-4 text-white font-mono text-xs focus:border-yellow-400 outline-none transition-all placeholder:text-white/20 ${props.className || ""}`}
    />
  </div>
);

const IndustrialSelect = ({ label, options, ...props }) => (
  <div className="space-y-1">
    {label && (
      <label className="text-white/40 font-black text-[9px] tracking-widest uppercase ml-1">
        {label}
      </label>
    )}
    <select 
      {...props}
      className={`w-full bg-white/[0.03] border-l-2 border-white/20 p-4 text-white font-mono text-xs focus:border-yellow-400 outline-none transition-all appearance-none cursor-pointer ${props.className || ""}`}
    >
      {options.map(o => (
        <option key={o.value} value={o.value} className="bg-black text-white">
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

const Register = ({ signIn, onSuccess, onSwitchToLogin }) => {
  const navigate = useNavigate();
  const { isSuper } = useAuth();

  const [regData, setRegData] = useState({
    email: "",
    username: "",
    password: "",
    nombre: "",
    apellido: "",
    fecha_nacimiento: "",
    genero: "",
    altura: "",
    peso: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const handleRegChange = (e) =>
    setRegData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setOkMsg("");

    const {
      email,
      username,
      password,
      nombre,
      apellido,
      fecha_nacimiento,
      genero,
      altura,
      peso,
    } = regData;

    // Validaciones básicas
    if (!email.trim() || !username.trim() || !password || !nombre.trim() || !apellido.trim() || !fecha_nacimiento || !genero || !altura || !peso) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    const h = parseFloat(altura);
    const p = parseFloat(peso);

    setIsLoading(true);
    try {
      const payload = {
        email: email.trim(),
        username: username.trim(),
        password,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        fecha_nacimiento,
        genero,
        altura: h,
        peso: p,
      };

      await api.post("/usuarios/", payload);

      setOkMsg("¡Cuenta creada! Sincronizando datos...");
      try {
        await signIn(email, password);
        onSuccess?.();

        if (isSuper) {
          navigate("/home", { replace: true });
        } else {
          const next = localStorage.getItem("cv.category") ? "/musculo" : "/seleccionar";
          navigate(next, { replace: true });
        }
      } catch {
        setOkMsg("Cuenta creada. Procesa tu acceso manual.");
        onSwitchToLogin?.();
      }
    } catch (err) {
      const msg = err?.response?.data
        ? Object.entries(err.response.data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
            .join(" | ")
        : err?.message || "Error al registrar la cuenta.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <HideNativeDateStyles />
      
      {error && (
        <div className="mb-6 bg-red-500/10 border-l-4 border-red-500 text-red-500 p-4 font-mono text-[9px] uppercase tracking-widest">
          {error}
        </div>
      )}
      {okMsg && (
        <div className="mb-6 bg-green-500/10 border-l-4 border-green-500 text-green-500 p-4 font-mono text-[9px] uppercase tracking-widest">
          {okMsg}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-2 gap-4">
          <IndustrialInput 
            label="PRIMER NOMBRE"
            name="nombre"
            placeholder="NOMBRE"
            value={regData.nombre}
            onChange={handleRegChange}
            type="text"
            required
          />
          <IndustrialInput 
            label="APELLIDOS"
            name="apellido"
            placeholder="APELLIDOS"
            value={regData.apellido}
            onChange={handleRegChange}
            type="text"
            required
          />
        </div>

        <IndustrialInput 
          label="IDENTIDAD DE USUARIO"
          name="username"
          placeholder="ELGEFE123"
          value={regData.username}
          onChange={handleRegChange}
          type="text"
          required
        />

        <IndustrialInput 
          label="EMAIL DE CONTACTO"
          name="email"
          placeholder="EMAIL@GYM.COM"
          value={regData.email}
          onChange={handleRegChange}
          type="email"
          required
        />

        <IndustrialInput 
          label="CÓDIGO DE ACCESO"
          name="password"
          placeholder="CONTRASEÑA"
          value={regData.password}
          onChange={handleRegChange}
          type="password"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <IndustrialInput 
            label="NACIMIENTO"
            name="fecha_nacimiento"
            value={regData.fecha_nacimiento}
            onChange={handleRegChange}
            type="date"
            className="hide-native-date"
            required
          />
          <IndustrialSelect 
            label="GÉNERO"
            name="genero"
            value={regData.genero}
            onChange={handleRegChange}
            options={[
              { value: "", label: "SELECCIONAR" },
              { value: "M", label: "MASCULINO" },
              { value: "F", label: "FEMENINO" },
              { value: "O", label: "OTRO" },
            ]}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <IndustrialInput 
            label="ESTATURA (m)"
            name="altura"
            placeholder="1.75"
            value={regData.altura}
            onChange={handleRegChange}
            type="number"
            step="0.01"
            min="0"
            required
          />
          <IndustrialInput 
            label="PESO ACTUAL (kg)"
            name="peso"
            placeholder="75.0"
            value={regData.peso}
            onChange={handleRegChange}
            type="number"
            step="0.1"
            min="0"
            required
          />
        </div>

        <button 
          type="submit"
          disabled={isLoading}
          className="w-full border-2 border-white text-white font-black py-5 hover:bg-white hover:text-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 active:scale-[0.97] mt-4"
        >
          {isLoading ? "Sincronizando Atleta..." : "Confirmar Registro"} 
          {!isLoading && <UserPlus className="w-4 h-4" />}
        </button>
      </form>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 230, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default Register;
