// src/pages/GestionarAlerta/AlertNotifier.jsx
import { useEffect, useRef, useState } from "react";
import { AlertaService } from "../../services/AlertaService";
import NotificationService from "../../services/NotificationService";
import { useNavigate } from "react-router-dom";
import {
  CreditCard, CheckCircle, AlertTriangle, Dumbbell,
  Bell, BarChart3, Trophy, Volume2
} from 'lucide-react';

const SOUND_PREF_KEY = "alerts:soundEnabled";

// Configuración de tipos de notificación con componentes de icono
const NOTIFICATION_TYPES = {
  payment: { Icon: CreditCard, color: 'bg-red-500/20 border-red-400', label: 'Pago' },
  routine_complete: { Icon: CheckCircle, color: 'bg-green-500/20 border-green-400', label: 'Rutina' },
  exercise_limit: { Icon: AlertTriangle, color: 'bg-yellow-500/20 border-yellow-400', label: 'Límite' },
  motivation: { Icon: Dumbbell, color: 'bg-purple-500/20 border-purple-400', label: 'Motivación' },
  inactivity: { Icon: Bell, color: 'bg-blue-500/20 border-blue-400', label: 'Recordatorio' },
  progress: { Icon: BarChart3, color: 'bg-blue-500/20 border-blue-400', label: 'Progreso' },
  achievement: { Icon: Trophy, color: 'bg-yellow-500/20 border-yellow-400', label: 'Logro' },
  default: { Icon: Bell, color: 'bg-white/10 border-white/20', label: 'Alerta' },
};

function getNotificationType(mensaje) {
  if (mensaje?.includes('💳') || mensaje?.includes('plan') || mensaje?.includes('expir')) {
    return NOTIFICATION_TYPES.payment;
  }
  if (mensaje?.includes('✅') || mensaje?.includes('Completaste') || mensaje?.includes('Rutina')) {
    return NOTIFICATION_TYPES.routine_complete;
  }
  if (mensaje?.includes('⚠️') || mensaje?.includes('límite') || mensaje?.includes('minutos')) {
    return NOTIFICATION_TYPES.exercise_limit;
  }
  if (mensaje?.includes('💪') || mensaje?.includes('motivación') || mensaje?.toLowerCase().includes('sigue')) {
    return NOTIFICATION_TYPES.motivation;
  }
  if (mensaje?.includes('🏆') || mensaje?.includes('logro')) {
    return NOTIFICATION_TYPES.achievement;
  }
  if (mensaje?.includes('extrañamos') || mensaje?.includes('vuelve')) {
    return NOTIFICATION_TYPES.inactivity;
  }
  return NOTIFICATION_TYPES.default;
}

function canNotify() {
  return typeof window !== "undefined" && "Notification" in window;
}
function requestNotifyPermission() {
  if (!canNotify()) return Promise.resolve("denied");
  if (Notification.permission === "granted") return Promise.resolve("granted");
  if (Notification.permission === "denied") return Promise.resolve("denied");
  return Notification.requestPermission();
}

const fmtDateTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
};

export default function AlertNotifier({
  intervalMs = 10000,
  maxVisible = 4,
  cardTTLms = 10000,
}) {
  const navigate = useNavigate();

  const audioRef = useRef(null);
  const lastIdRef = useRef(0);
  const timerRef = useRef(null);
  const autoUnlockListenerRef = useRef(null);

  const [cards, setCards] = useState([]);
  const [soundPref, setSoundPref] = useState(
    typeof window !== "undefined" && localStorage.getItem(SOUND_PREF_KEY) === "1"
  );
  const [soundUnlocked, setSoundUnlocked] = useState(false);
  const [notifyGranted, setNotifyGranted] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );
  const [stats, setStats] = useState(null);

  const pushCard = (a) => {
    const key = `${a.id}-${Date.now()}`;
    const type = getNotificationType(a.mensaje);
    setCards((prev) => [{ ...a, _key: key, _type: type }, ...prev].slice(0, maxVisible));
    setTimeout(() => {
      setCards((prev) => prev.filter((c) => c._key !== key));
    }, cardTTLms);
  };

  const doUnlockSound = async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/alert.mp3");
      audioRef.current.preload = "auto";
    }
    await audioRef.current.play();
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setSoundUnlocked(true);
  };

  const handleEnableSound = async () => {
    try {
      await doUnlockSound();
      localStorage.setItem(SOUND_PREF_KEY, "1");
      setSoundPref(true);
    } catch {
      setSoundPref(false);
      setSoundUnlocked(false);
    }
  };

  const setupAutoUnlock = () => {
    if (!soundPref || soundUnlocked) return;
    const listener = async () => {
      try {
        await doUnlockSound();
      } finally {
        if (autoUnlockListenerRef.current) {
          window.removeEventListener("pointerdown", autoUnlockListenerRef.current, true);
          autoUnlockListenerRef.current = null;
        }
      }
    };
    autoUnlockListenerRef.current = listener;
    window.addEventListener("pointerdown", listener, true);
  };

  const notifyOnce = (a) => {
    pushCard(a);

    if (canNotify() && Notification.permission === "granted") {
      if (document.visibilityState === "hidden") {
        const type = getNotificationType(a.mensaje);
        new Notification(type.label, {
          body: `${a.mensaje}`,
          tag: `alerta-${a.id}`,
          icon: "/favicon.ico",
          renotify: false,
        });
      }
    }

    if (soundUnlocked) {
      audioRef.current?.play().catch(() => { });
    }

    if (navigator.vibrate) navigator.vibrate([180, 80, 180]);
  };

  const handleMarkAsRead = async (alertId) => {
    await NotificationService.markAsRead(alertId);
    setCards((prev) => prev.filter((c) => c.id !== alertId));
    // Recargar stats para actualizar el badge
    loadStats();
  };

  const loadStats = async () => {
    const data = await NotificationService.getStats();
    setStats(data);
  };

  useEffect(() => {
    requestNotifyPermission().then((perm) => setNotifyGranted(perm === "granted"));

    audioRef.current = new Audio("/sounds/alert.mp3");
    audioRef.current.preload = "auto";

    setupAutoUnlock();
    loadStats();

    // Ejecutar verificación de notificaciones automáticas al montar
    NotificationService.checkNotifications();

    let cancelled = false;

    (async () => {
      try {
        const allAsc = await AlertaService.listMineSince(null);
        if (!cancelled) {
          lastIdRef.current =
            Array.isArray(allAsc) && allAsc.length ? allAsc[allAsc.length - 1].id : 0;
        }
      } catch {
        lastIdRef.current = 0;
      }

      if (!cancelled) {
        timerRef.current = setInterval(async () => {
          try {
            const news = await AlertaService.listMineSince(lastIdRef.current);
            if (Array.isArray(news) && news.length > 0) {
              news.forEach((a) => notifyOnce(a));
              lastIdRef.current = news[news.length - 1].id;
            }
          } catch {
            // reintenta en el siguiente tick
          }
        }, intervalMs);
      }
    })();

    // Verificar notificaciones cuando la ventana obtiene foco
    const handleFocus = () => {
      NotificationService.checkNotifications();
      loadStats();
    };
    window.addEventListener('focus', handleFocus);

    // Escuchar cuando se marcan notificaciones como leídas
    const handleNotificationsRead = () => {
      setStats({ unread: 0 }); // Limpiar badge inmediatamente
      loadStats(); // Recargar stats desde el servidor
    };
    window.addEventListener('notifications-read', handleNotificationsRead);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('notifications-read', handleNotificationsRead);
      if (autoUnlockListenerRef.current) {
        window.removeEventListener("pointerdown", autoUnlockListenerRef.current, true);
        autoUnlockListenerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, soundPref]);

  return (
    <>
      {/* Panel lateral derecho */}
      <div className="fixed right-4 top-20 z-[1000] flex w-96 max-w-[92vw] flex-col gap-3">
        {cards.map((a) => (
          <div
            key={a._key}
            className={`translate-x-0 animate-[slideIn_.25s_ease-out] rounded-2xl border p-4 text-white backdrop-blur shadow-xl ${a._type.color}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {a._type.Icon && <a._type.Icon className="w-6 h-6 flex-shrink-0" />}
                <div>
                  <div className="text-xs uppercase tracking-wide text-white/70">
                    {a._type.label}
                  </div>
                  <div className="mt-1 font-semibold">{a.mensaje}</div>
                  <div className="text-xs text-white/60">
                    {fmtDateTime(a.created_at || a.fecha)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  handleMarkAsRead(a.id);
                  setCards((prev) => prev.filter((c) => c._key !== a._key));
                }}
                className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => navigate("/mis-alertas")}
                className="rounded-xl border border-white/30 bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
              >
                Ver todas
              </button>
              {a._type === NOTIFICATION_TYPES.payment && (
                <button
                  onClick={() => navigate("/planes")}
                  className="rounded-xl bg-green-600 px-3 py-1.5 text-xs hover:bg-green-700"
                >
                  Renovar plan
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Badge de alertas sin leer */}
      {stats?.unread > 0 && (
        <div className="fixed right-4 bottom-20 z-[999]">
          <button
            onClick={() => navigate("/mis-alertas")}
            className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-white shadow-lg hover:bg-red-600"
          >
            <Bell className="w-5 h-5" />
            <span className="font-bold">{stats.unread}</span>
            <span className="text-sm">sin leer</span>
          </button>
        </div>
      )}

      {/* Botón: SOLO si nunca lo habilitó antes */}
      {!soundPref && (
        <div className="fixed bottom-3 right-3 z-[1000]">
          <button
            onClick={handleEnableSound}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-white shadow hover:bg-emerald-700"
            title="Habilita sonido de alertas"
          >
            🔊 Habilitar sonido
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(16px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
