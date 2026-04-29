import React, { useState, useRef, useEffect } from "react";

export default function ChatIA() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "¡Hola! ¿En qué puedo ayudarte?", from: "bot" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { text: input, from: "user" }]);
    setInput("");
    // Aquí podrías agregar lógica para enviar al backend
  }

  function handleAudioSend() {
    // Lógica para enviar audio (solo interfaz)
    alert("Función de audio no implementada");
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed top-16 right-0 z-40">
      {/* Botón para abrir/cerrar el chat */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-xs px-3 py-2 text-center inline-flex items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 shadow-lg"
        style={{ 
          position: "fixed", 
          right: open ? "calc(min(100vw, 320px))" : 0, 
          top: 80, 
          zIndex: 41, 
          transition: 'right 0.5s cubic-bezier(0.4,0,0.2,1)' 
        }}
      >
        <svg
          className="w-3 h-3 mr-1"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 14 10"
          style={{
            transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
            transform: open ? 'rotate(0deg)' : 'rotate(180deg)'
          }}
        >
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
        </svg>
        <span className="font-semibold">Chat IA</span>
      </button>

      {/* Panel del chat */}
      <div
        className="fixed top-16 right-0 z-40"
        style={{
          width: "min(100vw, 320px)",
          height: "calc(100vh - 4rem)",
          background: "rgba(30, 41, 59, 0.95)",
          boxShadow: "-2px 0 16px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(110%)",
          opacity: open ? 1 : 0.5,
          pointerEvents: open ? "auto" : "none",
          transition: "transform 0.7s cubic-bezier(0.4,0,0.2,1), opacity 0.7s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div className="p-4 border-b border-white/10 text-white text-lg font-bold">Chat IA</div>
        <div
          className="flex-1 overflow-y-auto p-4 space-y-2"
          style={{ maxHeight: "calc(100vh - 160px)" }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-4 py-2 rounded-2xl shadow text-sm max-w-[70%] ${msg.from === "user" ? "bg-blue-600 text-white" : "bg-white text-gray-800"}`}
                style={{
                  background: msg.from === "user" ? "#6366f1" : "#fff",
                  color: msg.from === "user" ? "#fff" : "#222",
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
         <form onSubmit={handleSend} className="p-4 border-t border-white/10 flex gap-2 items-center bg-gray-800/90 border-b border-gray-700">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus={open}
            disabled={!open}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition"
            disabled={!open || !input.trim()}
          >
            Enviar
          </button>
          
           </form>
        {/* Botón grande para enviar audio debajo del input */}
        <div className="w-full px-4 pb-4 bg-gray-800/90 border-b border-gray-700 flex items-center">
          <button
            type="button"
            onClick={handleAudioSend}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl transition-all duration-300 focus:ring-4 focus:outline-none focus:ring-blue-300 font-bold text-lg py-5"
            disabled={!open}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v3m0 0h-3m3 0h3m-3-3a4 4 0 004-4V8a4 4 0 10-8 0v6a4 4 0 004 4z" />
            </svg>
            <span className="font-semibold text-xl tracking-wide">Audio</span>
          </button>
        </div>
     
      </div>
    </div>
  );
}

