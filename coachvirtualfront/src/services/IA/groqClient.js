

// Cliente Groq para React/Vite: exporta una función asíncrona para usar en componentes

/**
 * Llama al endpoint de completions/chat de Groq usando fetch
 * @param {string} prompt - El texto del usuario
 * @param {string} model - El modelo Groq (por ejemplo, "llama-2-70b-4096")
 * @returns {Promise<string>} - Respuesta del modelo
 */
export async function fetchGroqCompletion({ prompt, model }) {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    const apiUrl = import.meta.env.VITE_GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";
    if (!apiKey) throw new Error("Falta VITE_GROQ_API_KEY");

    const body = {
        model,
        messages: [
            { role: "user", content: prompt }
        ]
    };

    const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Groq API error ${res.status}: ${text}`);
    }
    const data = await res.json();
    // Devuelve solo el texto de la respuesta si existe
    return data.choices?.[0]?.message?.content || JSON.stringify(data);
}
