/**
 * Calcula el ángulo entre tres puntos (A-B-C) donde B es el vértice
 * @param {Object} pointA - Punto A con propiedades x, y
 * @param {Object} pointB - Punto B (vértice) con propiedades x, y
 * @param {Object} pointC - Punto C con propiedades x, y
 * @returns {number} - Ángulo en grados
 */
export function calculateAngle(pointA, pointB, pointC) {
  const radians = Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) -
                  Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  
  return angle;
}

/**
 * Calcula ángulos relevantes del cuerpo a partir de los landmarks
 * @param {Array} landmarks - Array de puntos clave de BlazePose
 * @returns {Object} - Objeto con ángulos calculados
 */
export function calculateBodyAngles(landmarks) {
  return {
    // Ángulo del codo izquierdo (hombro-codo-muñeca)
    leftElbow: calculateAngle(
      landmarks[11], // hombro izquierdo
      landmarks[13], // codo izquierdo
      landmarks[15]  // muñeca izquierda
    ),
    
    // Ángulo del codo derecho
    rightElbow: calculateAngle(
      landmarks[12], // hombro derecho
      landmarks[14], // codo derecho
      landmarks[16]  // muñeca derecha
    ),
    
    // Ángulo de la rodilla izquierda (cadera-rodilla-tobillo)
    leftKnee: calculateAngle(
      landmarks[23], // cadera izquierda
      landmarks[25], // rodilla izquierda
      landmarks[27]  // tobillo izquierdo
    ),
    
    // Ángulo de la rodilla derecha
    rightKnee: calculateAngle(
      landmarks[24], // cadera derecha
      landmarks[26], // rodilla derecha
      landmarks[28]  // tobillo derecho
    ),
    
    // Ángulo del hombro izquierdo (cadera-hombro-codo)
    leftShoulder: calculateAngle(
      landmarks[23], // cadera izquierda
      landmarks[11], // hombro izquierdo
      landmarks[13]  // codo izquierdo
    ),
    
    // Ángulo del hombro derecho
    rightShoulder: calculateAngle(
      landmarks[24], // cadera derecha
      landmarks[12], // hombro derecho
      landmarks[14]  // codo derecho
    ),
  };
}
