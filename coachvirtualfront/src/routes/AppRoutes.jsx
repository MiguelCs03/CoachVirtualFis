// src/routes/AppRoutes.jsx (o como se llame)
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useCategory } from "../context/CategoryContext";
import WizardRutinaIA from "../pages/RutinasIA/WizardRutinaIA";

import Home from "../pages/Home";
import Perfil from "../pages/GestionarUsuario/Perfil";
import Usuario from "../pages/GestionarUsuario/Usuario";
import Alerta from "../pages/GestionarAlerta/Alerta";
import AlertaUsuario from "../pages/GestionarAlerta/AlertaUsuario";
import LoginPage from "../pages/Login/LoginPage";
import PoseTest from "../pages/Detector/PoseTest";
// Nueva ruta reorganizada de rutina bíceps dentro de categoría gimnasio
import BicepsCurl from "../pages/Categoria/gimnasio/brazos/BicepsCurl";
import Flexiones from "../pages/Categoria/gimnasio/brazos/Flexiones";
import PressBanca from "../pages/Categoria/gimnasio/brazos/PressBanca";
import PressInclinado from "../pages/Categoria/gimnasio/brazos/PressInclinado";
import RemoSentadoMaquina from "../pages/Categoria/gimnasio/espalda/RemoSentadoMaquina";
import RemoConMancuernas from "../pages/Categoria/gimnasio/espalda/RemoConMancuernas";
import RemoSentadoPoleaBaja from "../pages/Categoria/gimnasio/espalda/RemoSentadoPoleaBaja";
import RemoUnilateralPiePolea from "../pages/Categoria/gimnasio/espalda/RemoUnilateralPiePolea";
import RemoInclinadoMancuernas from "../pages/Categoria/gimnasio/espalda/RemoInclinadoMancuernas";
import PressBancaPectorales from "../pages/Categoria/gimnasio/pectorales/PressBancaPectorales";
import AperturasInclinadoPectorales from "../pages/Categoria/gimnasio/pectorales/AperturasInclinadoPectorales";
import PressInclinadoPectorales from "../pages/Categoria/gimnasio/pectorales/PressInclinadoPectorales";
import AperturasMariposa from "../pages/Categoria/gimnasio/pectorales/AperturasMariposa";
import DetalleRutina from "../pages/Rutina/DetalleRutina";
import EjercicioDetalleGenerico from "../pages/EjercicioDetalleGenerico";
// Fisioterapia (brazos)
import AduccionHombros from "../pages/Categoria/fisioterapia/brazos/AduccionHombros";
import CurlBicepsSentado from "../pages/Categoria/fisioterapia/brazos/CurlBicepsSentado";
import ElevacionBrazos from "../pages/Categoria/fisioterapia/brazos/ElevacionBrazos";
import ElevacionLateralBrazos from "../pages/Categoria/fisioterapia/brazos/ElevacionLateralBrazos";
import PressHombrosMancuernas from "../pages/Categoria/fisioterapia/brazos/PressHombrosMancuernas";
import RotacionAntebrazoBaston from "../pages/Categoria/fisioterapia/brazos/RotacionAntebrazoBaston";
import EstiramientoManosJuntas from "../pages/Categoria/fisioterapia/brazos/EstiramientoManosJuntas";
import FlexionesFisio from "../pages/Categoria/fisioterapia/brazos/FlexionesFisio";
// Fisioterapia (rodilla)
import FlexionCortaPiernaRodilla from "../pages/Categoria/fisioterapia/rodilla/FlexionCortaPiernaRodilla";
import FlexionCortaPierna from "../pages/Categoria/fisioterapia/rodilla/FlexionCortaPierna";
import ExtensionPiernasAtras from "../pages/Categoria/fisioterapia/rodilla/ExtensionPiernasAtras";
import EstiramientoPiernasFlexionRodillas from "../pages/Categoria/fisioterapia/rodilla/EstiramientoPiernasFlexionRodillas";
import SentadillasRodilla from "../pages/Categoria/fisioterapia/rodilla/SentadillasRodilla";
import ElevacionRodillas from "../pages/Categoria/fisioterapia/rodilla/ElevacionRodillas";
// Fisioterapia (espalda)
import EspaldaRecta from "../pages/Categoria/fisioterapia/espalda/EspaldaRecta";
import BandPullApart from "../pages/Categoria/fisioterapia/espalda/BandPullApart";
import EstiramientoLateralesCintura from "../pages/Categoria/fisioterapia/espalda/EstiramientoLateralesCintura";
import InclinacionLateralTronco from "../pages/Categoria/fisioterapia/espalda/InclinacionLateralTronco";
import RotacionTroncoSentado from "../pages/Categoria/fisioterapia/espalda/RotacionTroncoSentado";
import EstiramientoYoga from "../pages/Categoria/fisioterapia/espalda/EstiramientoYoga";
import FlexionEspaldaPiernaAbdomen from "../pages/Categoria/fisioterapia/espalda/FlexionEspaldaPiernaAbdomen";
// Fisioterapia - pierna
import Sentadillas from "../pages/Categoria/fisioterapia/pierna/Sentadillas";
import ElevacionGluteosSuelo from "../pages/Categoria/fisioterapia/pierna/ElevacionGluteosSuelo";
import PuenteGluteos from "../pages/Categoria/fisioterapia/pierna/PuenteGluteos";
import ElevacionCortaPiernas from "../pages/Categoria/fisioterapia/pierna/ElevacionCortaPiernas";
import ElevacionPiernas from "../pages/Categoria/fisioterapia/pierna/ElevacionPiernas";
import ElevacionPuntasSentado from "../pages/Categoria/fisioterapia/pierna/ElevacionPuntasSentado";
import ElevacionTalonesSentado from "../pages/Categoria/fisioterapia/pierna/ElevacionTalonesSentado";
import CrunchInverso from "../pages/Categoria/fisioterapia/abdominales/CrunchInverso";
import ElevacionPiernasAbd from "../pages/Categoria/fisioterapia/abdominales/ElevacionPiernasAbd";
import Plancha from "../pages/Categoria/gimnasio/abdominales/Plancha";
import ElevacionPiernasSuelo from "../pages/Categoria/gimnasio/abdominales/ElevacionPiernasSuelo";
import ElevacionPiernasBanco from "../pages/Categoria/gimnasio/abdominales/ElevacionPiernasBanco";
import YogaPage from "../pages/Yoga/YogaPage";
import EjerciciosPage from "../pages/Ejercicios/EjerciciosPage";
import IAPage from "../pages/IAPage/IAPage";
import ChatIA from "../pages/Chat/ChatIA";
import Planes from "../pages/Planes/Planes";
import PlanesAdmin from "../pages/Planes/PlanesAdmin";
import HistorialPagos from "../pages/Planes/HistorialPagos";
import MetodosPago from "../pages/Planes/MetodosPago";
import GestionarTiposPlanes from "../pages/Planes/GestionarTiposPlanes";
import Pago from "../pages/Planes/Pago";

import AlertNotifier from "../pages/GestionarAlerta/AlertNotifier";
import PaymentSuccessModal from "../components/PaymentSuccessModal";

// Flujo de ejercicios limpio
import CategoriaEjercicios from "../pages/EjerciciosFlow/CategoriaEjercicios";
import ParteCuerpo from "../pages/EjerciciosFlow/ParteCuerpo";
import SeleccionEjercicio from "../pages/EjerciciosFlow/SeleccionEjercicio";
import EjercicioDetector from "../pages/Detector/EjercicioDetector";
import RoutineWorkoutPage from "../pages/Routines/RoutineWorkoutPage";
import UniversalExercisePage from "../pages/Exercises/UniversalExercisePage";

// Flujo categoría / músculo / ejercicios (solo admin)
import Musculo from "../pages/GestionarMusculo/Musculo";
import Ejercicio from "../pages/GestionarEjercicio/Ejercicio";
import Detalle_Musculo from "../pages/Detalle_Musculo/Detalle_Musculo";
import Ejercicio_Asignado from "../pages/GestionarEjercicio_Asignacion/Ejercicio_Asignado";
import GestionarTipo from "../pages/GestionarTipo/GestionarTipo";

// ====== Guards ======
function RequireAuth() {
  const { isAuthenticated, initializing } = useAuth();
  if (initializing) return <div style={{ padding: 24 }}>Verificando sesión…</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function GuestOnly() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <div style={{ padding: 24 }}>Verificando sesión…</div>;

  if (isAuthenticated) {
    // Todos los usuarios autenticados van a /home
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}

function RootRedirect() {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) return <div style={{ padding: 24 }}>Verificando sesión…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Todos los usuarios autenticados van a /home
  return <Navigate to="/home" replace />;
}

function RequireSuper() {
  const { isSuper, initializing } = useAuth();
  if (initializing) return <div style={{ padding: 24 }}>Verificando sesión…</div>;
  return isSuper ? <Outlet /> : <Navigate to="/home" replace />;
}

function AuthenticatedLayout() {
  return (
    <>
      <AlertNotifier intervalMs={10000} />
      <PaymentSuccessModal />
      <Outlet />
    </>
  );
}

// ====== Rutas ======
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      {/* Invitados */}
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Autenticados */}
      <Route element={<RequireAuth />}>
        <Route element={<AuthenticatedLayout />}>
          {/* Rutas principales */}
          <Route path="/home" element={<Home />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/planes" element={<Planes />} />
          <Route path="/planes/pago" element={<Pago />} />
          <Route path="/pose-test" element={<PoseTest />} />
          <Route path="/rutinas/crear-ia" element={<WizardRutinaIA />} />
          {/* Rutina específica reorganizada */}
          <Route path="/categoria/gimnasio/brazos/biceps-curl" element={<BicepsCurl />} />
          <Route path="/categoria/gimnasio/brazos/flexiones" element={<Flexiones />} />
          <Route path="/categoria/gimnasio/brazos/press-banca" element={<PressBanca />} />
          <Route path="/categoria/gimnasio/brazos/press-inclinado" element={<PressInclinado />} />
          {/* Fisioterapia - brazos */}
          <Route path="/categoria/fisioterapia/brazos/aduccion-hombros" element={<AduccionHombros />} />
          <Route path="/categoria/fisioterapia/brazos/curl-biceps-sentado" element={<CurlBicepsSentado />} />
          <Route path="/categoria/fisioterapia/brazos/elevacion-brazos" element={<ElevacionBrazos />} />
          <Route path="/categoria/fisioterapia/brazos/elevacion-lateral-brazos" element={<ElevacionLateralBrazos />} />
          <Route path="/categoria/fisioterapia/brazos/press-hombros-mancuernas" element={<PressHombrosMancuernas />} />
          <Route path="/categoria/fisioterapia/brazos/rotacion-antebrazo-baston" element={<RotacionAntebrazoBaston />} />
          <Route path="/categoria/fisioterapia/brazos/estiramiento-manos-juntas" element={<EstiramientoManosJuntas />} />
          <Route path="/categoria/fisioterapia/brazos/flexiones" element={<FlexionesFisio />} />
          {/* Fisioterapia - rodilla */}
          <Route path="/categoria/fisioterapia/rodilla/flexion-corta-pierna-rodilla" element={<FlexionCortaPiernaRodilla />} />
          <Route path="/categoria/fisioterapia/rodilla/flexion-corta-pierna" element={<FlexionCortaPierna />} />
          <Route path="/categoria/fisioterapia/rodilla/extension-piernas-atras" element={<ExtensionPiernasAtras />} />
          <Route path="/categoria/fisioterapia/rodilla/estiramiento-piernas-flexion-rodillas" element={<EstiramientoPiernasFlexionRodillas />} />
          <Route path="/categoria/fisioterapia/rodilla/sentadillas" element={<SentadillasRodilla />} />
          <Route path="/categoria/fisioterapia/rodilla/elevacion-rodillas" element={<ElevacionRodillas />} />
          {/* Fisioterapia - espalda */}
          <Route path="/categoria/fisioterapia/espalda/espalda-recta" element={<EspaldaRecta />} />
          <Route path="/categoria/fisioterapia/espalda/band-pull-apart" element={<BandPullApart />} />
          <Route path="/categoria/fisioterapia/espalda/estiramiento-laterales-cintura" element={<EstiramientoLateralesCintura />} />
          <Route path="/categoria/fisioterapia/espalda/inclinacion-lateral-tronco" element={<InclinacionLateralTronco />} />
          <Route path="/categoria/fisioterapia/espalda/rotacion-tronco-sentado" element={<RotacionTroncoSentado />} />
          <Route path="/categoria/fisioterapia/espalda/estiramiento-yoga" element={<EstiramientoYoga />} />
          <Route path="/categoria/fisioterapia/espalda/flexion-espalda-pierna-abdomen" element={<FlexionEspaldaPiernaAbdomen />} />
          {/* Fisioterapia - pierna */}
          <Route path="/categoria/fisioterapia/pierna/sentadillas" element={<Sentadillas />} />
          <Route path="/categoria/fisioterapia/pierna/elevacion-gluteos-suelo" element={<ElevacionGluteosSuelo />} />
          <Route path="/categoria/fisioterapia/pierna/puente-gluteos" element={<PuenteGluteos />} />
          <Route path="/categoria/fisioterapia/pierna/elevacion-corta-piernas" element={<ElevacionCortaPiernas />} />
          <Route path="/categoria/fisioterapia/pierna/elevacion-piernas" element={<ElevacionPiernas />} />
          <Route path="/categoria/fisioterapia/pierna/elevacion-puntas-sentado" element={<ElevacionPuntasSentado />} />
          <Route path="/categoria/fisioterapia/pierna/elevacion-talones-sentado" element={<ElevacionTalonesSentado />} />
          {/* Pectorales */}
          <Route path="/categoria/gimnasio/pectorales/flexiones" element={<Flexiones />} />
          <Route path="/categoria/gimnasio/pectorales/press-banca" element={<PressBancaPectorales />} />
          <Route path="/categoria/gimnasio/pectorales/aperturas-inclinado" element={<AperturasInclinadoPectorales />} />
          <Route path="/categoria/gimnasio/pectorales/press-inclinado" element={<PressInclinadoPectorales />} />
          <Route path="/categoria/gimnasio/pectorales/aperturas-mariposa" element={<AperturasMariposa />} />
          {/* Espalda */}
          <Route path="/categoria/gimnasio/espalda/remo-sentado-maquina" element={<RemoSentadoMaquina />} />
          <Route path="/categoria/gimnasio/espalda/remo-con-mancuernas" element={<RemoConMancuernas />} />
          <Route path="/categoria/gimnasio/espalda/remo-sentado-polea-baja" element={<RemoSentadoPoleaBaja />} />
          <Route path="/categoria/gimnasio/espalda/remo-unilateral-pie-polea" element={<RemoUnilateralPiePolea />} />
          <Route path="/categoria/gimnasio/espalda/remo-inclinado-mancuernas" element={<RemoInclinadoMancuernas />} />
          <Route path="/yoga" element={<YogaPage />} />
          <Route path="/rutinas/:id" element={<DetalleRutina />} />
          <Route path="/generar-rutina-ia" element={<WizardRutinaIA />} />
          <Route path="/ejercicio/generico" element={<EjercicioDetalleGenerico />} />
          {/* Abdominales */}
          <Route path="/categoria/gimnasio/abdominales/plancha" element={<Plancha />} />
          <Route path="/categoria/gimnasio/abdominales/elevacion-piernas-suelo" element={<ElevacionPiernasSuelo />} />
          <Route path="/categoria/gimnasio/abdominales/elevacion-piernas-banco" element={<ElevacionPiernasBanco />} />
          {/* Fisioterapia - abdominales */}
          <Route path="/categoria/fisioterapia/abdominales/crunch-inverso" element={<CrunchInverso />} />
          <Route path="/categoria/fisioterapia/abdominales/elevacion-piernas" element={<ElevacionPiernasAbd />} />
          <Route path="/ejercicios" element={<EjerciciosPage />} />
          <Route path="/ia" element={<IAPage />} />
          <Route path="/chat-ia" element={<ChatIA />} />

          {/* Flujo limpio de ejercicios */}
          <Route path="/ejercicios/categoria" element={<CategoriaEjercicios />} />
          <Route path="/ejercicios/parte-cuerpo" element={<ParteCuerpo />} />
          <Route path="/ejercicios/seleccion" element={<SeleccionEjercicio />} />
          <Route path="/ejercicio/:id" element={<EjercicioDetector />} />
          <Route path="/rutina/:rutinaId/workout" element={<RoutineWorkoutPage />} />
          <Route path="/workout/exercise/:id" element={<UniversalExercisePage />} />
          <Route path="/mis-alertas" element={<AlertaUsuario />} />

          {/* SOLO superusuario */}
          <Route element={<RequireSuper />}>
            <Route path="/musculos" element={<Musculo />} />
            <Route path="/usuarios" element={<Usuario />} />
            <Route path="/alertas" element={<Alerta />} />
            <Route path="/tipos-plan" element={<GestionarTiposPlanes />} />
            <Route path="/planes-admin" element={<PlanesAdmin />} />
            <Route path="/historial-pagos" element={<HistorialPagos />} />
            <Route path="/metodos-pago" element={<MetodosPago />} />
            <Route path="/banca-de-ejercicios" element={<Ejercicio />} />
            <Route path="/detalles-musculo" element={<Detalle_Musculo />} />
            <Route path="/ejercicios-asignados" element={<Ejercicio_Asignado />} />
            <Route path="/tipo" element={<GestionarTipo />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
