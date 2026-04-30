import React, { useState, useEffect } from 'react';

/**
 * CachedImage
 * Este componente intercepta la URL de la imagen (Cloudinary o cualquier otra),
 * verifica si ya existe en la caché del navegador (Cache Storage API) y si es así,
 * la carga desde la caché sin hacer peticiones a la red.
 * Si no existe, la descarga y la guarda en caché para usos futuros.
 */
export default function CachedImage({ src, alt, className, style, ...props }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAndCacheImage = async () => {
      if (!src) {
        setIsLoading(false);
        return;
      }

      try {
        // Abrimos (o creamos) una caché específica para nuestra app
        const cache = await caches.open('v-coach-media-cache-v1');
        
        // Buscamos si la imagen ya está guardada
        const cachedResponse = await cache.match(src);

        if (cachedResponse) {
          // Si está en caché, extraemos el blob (archivo binario)
          const blob = await cachedResponse.blob();
          const objectUrl = URL.createObjectURL(blob);
          if (isMounted) {
            setImgSrc(objectUrl);
            setIsLoading(false);
          }
          return;
        }

        // Si no está en caché, la descargamos de la red
        const networkResponse = await fetch(src);
        
        if (networkResponse.ok) {
          // Guardamos un clon de la respuesta en caché para la próxima vez
          cache.put(src, networkResponse.clone());
          
          const blob = await networkResponse.blob();
          const objectUrl = URL.createObjectURL(blob);
          if (isMounted) {
            setImgSrc(objectUrl);
            setIsLoading(false);
          }
        } else {
          // Si falla (ej. error 404), usamos el src directo como respaldo
          if (isMounted) {
            setImgSrc(src);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.warn('Error en CachedImage:', error);
        // Fallback: Si el navegador no soporta caché o falla por CORS, usar src normal
        if (isMounted) {
          setImgSrc(src);
          setIsLoading(false);
        }
      }
    };

    fetchAndCacheImage();

    // Limpieza de memoria cuando el componente se desmonta
    return () => {
      isMounted = false;
      // Opcional: Si quieres liberar memoria de los ObjectURLs cuando ya no se usan
      // if (imgSrc && imgSrc.startsWith('blob:')) URL.revokeObjectURL(imgSrc);
    };
  }, [src]);

  // Mientras carga puedes poner un esqueleto (skeleton), spinner o mantenerlo invisible
  if (isLoading) {
    return (
      <div className={`animate-pulse bg-white/5 rounded ${className}`} style={style}></div>
    );
  }

  return (
    <img 
      src={imgSrc || src} 
      alt={alt} 
      className={className} 
      style={style} 
      {...props} 
    />
  );
}
