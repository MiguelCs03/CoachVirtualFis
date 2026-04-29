/**
 * Base de datos COMPLETA de descripciones de ejercicios (50 ejercicios)
 * Incluye: propósito, beneficios, instrucciones, músculos trabajados
 */

export const EXERCISE_DESCRIPTIONS = {
    // ===== GIMNASIO (1-18) =====
    1: {
        nombre: 'Remo sentado en máquina',
        proposito: 'Fortalece la espalda y mejora la postura',
        beneficios: ['Fortalece dorsales', 'Mejora postura', 'Tonifica brazos'],
        musculos: ['Dorsales', 'Romboides', 'Bíceps'],
        instrucciones: 'Siéntate con la espalda recta, agarra las manijas y jala hacia tu pecho manteniendo los codos cerca del cuerpo. Regresa lentamente.',
        erroresComunes: ['Encorvar la espalda', 'Usar impulso', 'Levantar los hombros'],
        reps: 12, series: 3, descanso: 60,
    },
    2: {
        nombre: 'Remo con mancuernas',
        proposito: 'Desarrolla fuerza en la espalda de manera unilateral',
        beneficios: ['Corrige desbalances', 'Fortalece core', 'Mejora agarre'],
        musculos: ['Dorsales', 'Trapecio', 'Bíceps'],
        instrucciones: 'Apoya una mano en un banco, inclina el torso. Sube la mancuerna hacia la cadera. Baja controladamente.',
        erroresComunes: ['Girar el torso', 'Subir muy rápido', 'No completar el rango'],
        reps: 10, series: 3, descanso: 60,
    },
    3: {
        nombre: 'Remo sentado en polea baja',
        proposito: 'Trabaja la espalda con tensión constante',
        beneficios: ['Tensión continua', 'Mejor control', 'Fortalece espalda media'],
        musculos: ['Dorsales', 'Romboides', 'Trapecio'],
        instrucciones: 'Siéntate frente a la polea, pies apoyados. Jala el cable hacia el abdomen. Aprieta los omóplatos.',
        erroresComunes: ['Inclinarse demasiado', 'No apretar omóplatos', 'Movimiento brusco'],
        reps: 12, series: 3, descanso: 60,
    },
    4: {
        nombre: 'Remo unilateral de pie en polea',
        proposito: 'Mejora estabilidad y trabaja cada lado independiente',
        beneficios: ['Mejora equilibrio', 'Corrige asimetrías', 'Trabaja core'],
        musculos: ['Dorsales', 'Oblicuos', 'Bíceps'],
        instrucciones: 'De pie frente a la polea, jala con un brazo hacia la cadera rotando ligeramente. Controla el regreso.',
        erroresComunes: ['Rotar demasiado', 'Perder postura', 'Usar impulso'],
        reps: 12, series: 3, descanso: 45,
    },
    5: {
        nombre: 'Flexiones',
        proposito: 'Ejercicio fundamental para pecho, hombros y tríceps',
        beneficios: ['Fortalece pecho', 'Trabaja core', 'No requiere equipo'],
        musculos: ['Pectorales', 'Deltoides', 'Tríceps', 'Core'],
        instrucciones: 'Manos al ancho de hombros. Baja el pecho hacia el suelo manteniendo el cuerpo recto. Empuja hacia arriba.',
        erroresComunes: ['Cadera muy alta', 'Cadera muy baja', 'Codos hacia afuera'],
        reps: 15, series: 3, descanso: 45,
    },
    6: {
        nombre: 'Press de banca con mancuernas',
        proposito: 'Desarrolla el pecho con mayor rango de movimiento',
        beneficios: ['Mayor rango', 'Trabaja estabilizadores', 'Desarrollo equilibrado'],
        musculos: ['Pectorales', 'Deltoides anteriores', 'Tríceps'],
        instrucciones: 'Acostado en banco, mancuernas a los lados del pecho. Empuja hacia arriba juntando las mancuernas. Baja controlado.',
        erroresComunes: ['Arquear espalda', 'Bajar muy rápido', 'No controlar peso'],
        reps: 10, series: 3, descanso: 90,
    },
    7: {
        nombre: 'Aperturas inclinadas con mancuernas',
        proposito: 'Estira y fortalece el pecho superior',
        beneficios: ['Estiramiento profundo', 'Pecho superior', 'Definición'],
        musculos: ['Pectorales superiores', 'Deltoides'],
        instrucciones: 'En banco inclinado, brazos extendidos arriba. Abre los brazos en arco hasta sentir estiramiento. Cierra.',
        erroresComunes: ['Brazos muy rectos', 'Bajar demasiado', 'Usar mucho peso'],
        reps: 12, series: 3, descanso: 60,
    },
    8: {
        nombre: 'Press inclinado con mancuernas',
        proposito: 'Enfocado en el pecho superior',
        beneficios: ['Pecho superior definido', 'Hombros fuertes', 'Simetría'],
        musculos: ['Pectorales superiores', 'Deltoides', 'Tríceps'],
        instrucciones: 'Banco a 30-45 grados. Empuja las mancuernas desde el pecho hacia arriba. Baja controladamente.',
        erroresComunes: ['Ángulo muy alto', 'Rebotar peso', 'Codos muy abiertos'],
        reps: 10, series: 3, descanso: 90,
    },
    9: {
        nombre: 'Aperturas en máquina Mariposa',
        proposito: 'Aislamiento del pecho con tensión constante',
        beneficios: ['Aislamiento pectoral', 'Seguro para articulaciones', 'Definición'],
        musculos: ['Pectorales', 'Deltoides anteriores'],
        instrucciones: 'Siéntate, brazos en las almohadillas. Junta los brazos frente a ti. Regresa controlando.',
        erroresComunes: ['Usar impulso', 'No apretar en el centro', 'Peso excesivo'],
        reps: 15, series: 3, descanso: 45,
    },
    10: {
        nombre: 'Plancha',
        proposito: 'Fortalece el core y estabilidad general',
        beneficios: ['Core fuerte', 'Mejora postura', 'Previene dolor de espalda'],
        musculos: ['Abdominales', 'Oblicuos', 'Espalda baja'],
        instrucciones: 'Apoya antebrazos y puntas de los pies. Mantén el cuerpo recto como una tabla. Aguanta la posición.',
        erroresComunes: ['Cadera alta', 'Cadera baja', 'Contener respiración'],
        reps: 30, series: 3, descanso: 30, esTiempo: true, tiempoMantenimiento: 30,
    },
    11: {
        nombre: 'Elevación de piernas en el suelo',
        proposito: 'Trabaja el abdomen inferior',
        beneficios: ['Abdomen bajo definido', 'Fortalece hip flexors', 'Core fuerte'],
        musculos: ['Abdominales inferiores', 'Hip flexors'],
        instrucciones: 'Acostado boca arriba, piernas juntas. Sube las piernas hasta 90 grados. Baja sin tocar el suelo.',
        erroresComunes: ['Arquear espalda', 'Doblar rodillas', 'Bajar muy rápido'],
        reps: 15, series: 3, descanso: 45,
    },
    12: {
        nombre: 'Elevación de piernas en banco',
        proposito: 'Mayor rango de movimiento para abdomen',
        beneficios: ['Mayor rango', 'Más intensidad', 'Abdomen completo'],
        musculos: ['Abdominales', 'Hip flexors'],
        instrucciones: 'Acostado en banco, agarra los bordes. Sube las piernas rectas. Baja controladamente.',
        erroresComunes: ['Usar impulso', 'No controlar bajada', 'Arquear espalda'],
        reps: 12, series: 3, descanso: 45,
    },
    13: {
        nombre: 'Curl de bíceps con mancuernas de pie',
        proposito: 'Desarrollar y tonificar los bíceps',
        beneficios: ['Brazos fuertes', 'Mejora agarre', 'Definición muscular'],
        musculos: ['Bíceps', 'Antebrazos'],
        instrucciones: 'De pie, codos pegados. Sube las mancuernas girando la palma hacia arriba. Baja lentamente.',
        erroresComunes: ['Balancear cuerpo', 'Mover codos', 'Subir muy rápido'],
        reps: 12, series: 3, descanso: 45,
    },
    14: {
        nombre: 'Remo inclinado con mancuernas',
        proposito: 'Trabaja espalda media y baja',
        beneficios: ['Espalda completa', 'Mejora postura', 'Fuerza funcional'],
        musculos: ['Dorsales', 'Romboides', 'Trapecio'],
        instrucciones: 'Inclinado hacia adelante, mancuernas colgando. Jala hacia las caderas. Aprieta omóplatos.',
        erroresComunes: ['Espalda redondeada', 'No apretar arriba', 'Peso excesivo'],
        reps: 10, series: 3, descanso: 60,
    },
    15: {
        nombre: 'Sentadilla Hack',
        proposito: 'Fortalecer cuádriceps de manera segura',
        beneficios: ['Cuádriceps fuertes', 'Menos estrés en espalda', 'Mayor carga'],
        musculos: ['Cuádriceps', 'Glúteos', 'Isquiotibiales'],
        instrucciones: 'Espalda contra respaldo, pies al frente. Baja doblando rodillas a 90 grados. Sube.',
        erroresComunes: ['Rodillas hacia adentro', 'Talones elevados', 'Bajar rápido'],
        reps: 12, series: 4, descanso: 90,
    },
    16: {
        nombre: 'Prensa de piernas',
        proposito: 'Desarrollar piernas con control y seguridad',
        beneficios: ['Piernas fuertes', 'Seguro', 'Alta carga posible'],
        musculos: ['Cuádriceps', 'Glúteos', 'Isquiotibiales'],
        instrucciones: 'Pies en plataforma al ancho de hombros. Baja la plataforma doblando rodillas. Empuja sin bloquear.',
        erroresComunes: ['Bloquear rodillas', 'Levantar glúteos', 'Bajar demasiado'],
        reps: 12, series: 4, descanso: 90,
    },
    17: {
        nombre: 'Elevación de talones con barra',
        proposito: 'Desarrollar los músculos de la pantorrilla',
        beneficios: ['Pantorrillas definidas', 'Mejor estabilidad', 'Salto más potente'],
        musculos: ['Gastrocnemios', 'Sóleo'],
        instrucciones: 'Barra en hombros, puntas de pies en elevación. Sube los talones lo más alto posible. Baja lento.',
        erroresComunes: ['Rango incompleto', 'Rebotar abajo', 'Doblar rodillas'],
        reps: 15, series: 4, descanso: 45,
    },
    18: {
        nombre: 'Zancadas con mancuernas',
        proposito: 'Trabaja piernas y glúteos unilateralmente',
        beneficios: ['Equilibrio', 'Glúteos firmes', 'Piernas simétricas'],
        musculos: ['Cuádriceps', 'Glúteos', 'Isquiotibiales'],
        instrucciones: 'Mancuernas a los lados. Da un paso largo, baja la rodilla trasera. Empuja para volver.',
        erroresComunes: ['Rodilla pasa el pie', 'Inclinarse', 'Paso muy corto'],
        reps: 10, series: 3, descanso: 60,
    },

    // ===== FISIOTERAPIA (19-50) =====
    19: {
        nombre: 'Aducción de hombros',
        proposito: 'Rehabilitar y fortalecer los hombros',
        beneficios: ['Movilidad de hombro', 'Prevención lesiones', 'Fortalecimiento'],
        musculos: ['Deltoides', 'Manguito rotador'],
        instrucciones: 'De pie, lleva el brazo hacia el centro del cuerpo cruzando. Mantén 3 segundos. Alterna.',
        erroresComunes: ['Forzar movimiento', 'No controlar', 'Tensar cuello'],
        reps: 12, series: 2, descanso: 30,
    },
    20: {
        nombre: 'Band Pull-Apart',
        proposito: 'Fortalecer espalda alta y mejorar postura',
        beneficios: ['Postura mejorada', 'Hombros saludables', 'Espalda fuerte'],
        musculos: ['Romboides', 'Trapecio', 'Deltoides posteriores'],
        instrucciones: 'Banda elástica frente a ti, brazos extendidos. Separa las manos llevando la banda al pecho. Controla el regreso.',
        erroresComunes: ['Codos doblados', 'Usar impulso', 'Encoger hombros'],
        reps: 15, series: 3, descanso: 30,
    },
    21: {
        nombre: 'Crunch Inverso',
        proposito: 'Trabajar abdomen inferior',
        beneficios: ['Abdomen bajo', 'Core fuerte', 'Espalda protegida'],
        musculos: ['Abdominales inferiores', 'Oblicuos'],
        instrucciones: 'Acostado, rodillas dobladas. Levanta las caderas del suelo contrayendo el abdomen. Baja controlado.',
        erroresComunes: ['Usar impulso', 'Tensar cuello', 'No controlar bajada'],
        reps: 15, series: 3, descanso: 45,
    },
    22: {
        nombre: 'Curl de bíceps Sentado',
        proposito: 'Fortalecer bíceps con estabilidad',
        beneficios: ['Aislamiento bíceps', 'Sin compensaciones', 'Control total'],
        musculos: ['Bíceps', 'Braquial'],
        instrucciones: 'Sentado, codo apoyado en muslo. Sube la mancuerna lentamente. Baja controlando.',
        erroresComunes: ['Mover el codo', 'Usar impulso', 'No rango completo'],
        reps: 12, series: 3, descanso: 45,
    },
    23: {
        nombre: 'Elevación de brazos',
        proposito: 'Mejorar movilidad y fortalecer hombros',
        beneficios: ['Movilidad', 'Hombros saludables', 'Rehabilitación'],
        musculos: ['Deltoides', 'Trapecio'],
        instrucciones: 'De pie, eleva los brazos lentamente hasta arriba de la cabeza. Baja controladamente.',
        erroresComunes: ['Arquear espalda', 'Subir hombros', 'Movimiento brusco'],
        reps: 12, series: 2, descanso: 30,
    },
    24: {
        nombre: 'Elevación corta de piernas',
        proposito: 'Fortalecer abdomen sin estrés lumbar',
        beneficios: ['Abdomen fuerte', 'Seguro para espalda', 'Progresión suave'],
        musculos: ['Abdominales', 'Hip flexors'],
        instrucciones: 'Acostado, eleva las piernas solo 15-20 cm del suelo. Mantén y baja.',
        erroresComunes: ['Arquear espalda', 'Subir muy alto', 'Contener respiración'],
        reps: 15, series: 2, descanso: 30,
    },
    25: {
        nombre: 'Elevación Corta con mancuernas',
        proposito: 'Fortalecer hombros con control',
        beneficios: ['Hombros definidos', 'Control muscular', 'Prevención'],
        musculos: ['Deltoides laterales', 'Trapecio'],
        instrucciones: 'De pie, mancuernas a los lados. Eleva hasta 45 grados lateralmente. Baja lento.',
        erroresComunes: ['Subir muy alto', 'Usar impulso', 'Encoger hombros'],
        reps: 12, series: 3, descanso: 45,
    },
    26: {
        nombre: 'Elevación de manos',
        proposito: 'Mejorar circulación y movilidad de muñecas',
        beneficios: ['Circulación', 'Movilidad', 'Calentamiento'],
        musculos: ['Antebrazos', 'Muñecas'],
        instrucciones: 'Brazos frente a ti. Abre y cierra las manos repetidamente. Mantén brazos quietos.',
        erroresComunes: ['Mover brazos', 'Hacer muy rápido', 'Tensar hombros'],
        reps: 20, series: 2, descanso: 20,
    },
    27: {
        nombre: 'Elevación de Piernas',
        proposito: 'Fortalecer piernas y abdomen',
        beneficios: ['Piernas fuertes', 'Core activo', 'Hip flexors'],
        musculos: ['Hip flexors', 'Cuádriceps', 'Abdominales'],
        instrucciones: 'Acostado o sentado, eleva una pierna recta. Mantén 2 segundos. Alterna.',
        erroresComunes: ['Doblar rodilla', 'Arquear espalda', 'Movimiento brusco'],
        reps: 12, series: 2, descanso: 30,
    },
    28: {
        nombre: 'Elevación de Puntas sentado',
        proposito: 'Fortalecer tibiales y mejorar equilibrio',
        beneficios: ['Tibiales fuertes', 'Mejor caminata', 'Prevención caídas'],
        musculos: ['Tibial anterior', 'Músculos del pie'],
        instrucciones: 'Sentado, pies planos. Levanta las puntas de los pies manteniendo talones en el suelo. Baja.',
        erroresComunes: ['Levantar talones', 'Hacer muy rápido', 'Tensar rodillas'],
        reps: 15, series: 2, descanso: 20,
    },
    29: {
        nombre: 'Elevación de rodillas',
        proposito: 'Mejorar movilidad de cadera y fortalecer hip flexors',
        beneficios: ['Movilidad cadera', 'Marcha mejorada', 'Core activo'],
        musculos: ['Hip flexors', 'Cuádriceps', 'Core'],
        instrucciones: 'De pie, eleva una rodilla hacia el pecho. Mantén equilibrio. Baja y alterna.',
        erroresComunes: ['Inclinarse atrás', 'Perder equilibrio', 'No elevar suficiente'],
        reps: 12, series: 2, descanso: 30,
    },
    30: {
        nombre: 'Elevación de talones sentado',
        proposito: 'Fortalecer pantorrillas de forma segura',
        beneficios: ['Pantorrillas fuertes', 'Seguro', 'Fácil progresión'],
        musculos: ['Sóleo', 'Gastrocnemios'],
        instrucciones: 'Sentado, pies planos. Eleva los talones lo más alto posible. Baja controlado.',
        erroresComunes: ['Rango incompleto', 'Hacer muy rápido', 'No mantener arriba'],
        reps: 15, series: 3, descanso: 30,
    },
    31: {
        nombre: 'Elevación lateral de brazos',
        proposito: 'Fortalecer deltoides laterales',
        beneficios: ['Hombros anchos', 'Definición', 'Estabilidad'],
        musculos: ['Deltoides laterales', 'Trapecio'],
        instrucciones: 'De pie, brazos a los lados. Eleva lateralmente hasta la altura de los hombros. Baja lento.',
        erroresComunes: ['Subir muy alto', 'Usar impulso', 'Codos rectos'],
        reps: 12, series: 3, descanso: 45,
    },
    32: {
        nombre: 'Espalda Recta',
        proposito: 'Mejorar la postura y fortalecer músculos posturales',
        beneficios: ['Mejor postura', 'Reducción dolor', 'Conciencia corporal'],
        musculos: ['Erectores espinales', 'Core', 'Trapecio'],
        instrucciones: 'Siéntate con los pies en el suelo. Mantén la espalda completamente recta. Mantén 5 segundos.',
        erroresComunes: ['Encorvar hombros', 'Tensar cuello', 'Olvidar respirar'],
        reps: 10, series: 2, descanso: 30, esTiempo: true, tiempoMantenimiento: 5,
    },
    33: {
        nombre: 'Elevación de glúteos del suelo',
        proposito: 'Fortalecer glúteos y espalda baja',
        beneficios: ['Glúteos firmes', 'Espalda fuerte', 'Estabilidad de cadera'],
        musculos: ['Glúteo mayor', 'Isquiotibiales', 'Espalda baja'],
        instrucciones: 'Acostado, rodillas dobladas. Aprieta glúteos y levanta la cadera. Baja lentamente.',
        erroresComunes: ['Arquear demasiado', 'No apretar glúteos', 'Subir rápido'],
        reps: 15, series: 3, descanso: 45,
    },
    34: {
        nombre: 'Estiramiento yoga',
        proposito: 'Flexibilidad y relajación general',
        beneficios: ['Flexibilidad', 'Relajación', 'Mejor respiración'],
        musculos: ['Espalda', 'Caderas', 'Piernas'],
        instrucciones: 'Posición de niño o gato-vaca. Estira suavemente manteniendo la respiración profunda.',
        erroresComunes: ['Forzar posición', 'Contener respiración', 'Movimiento brusco'],
        reps: 5, series: 2, descanso: 20, esTiempo: true, tiempoMantenimiento: 20,
    },
    35: {
        nombre: 'Estiramiento de piernas y flexión de rodillas',
        proposito: 'Mejorar flexibilidad de piernas y movilidad de rodillas',
        beneficios: ['Flexibilidad', 'Rodillas saludables', 'Mejor rango'],
        musculos: ['Isquiotibiales', 'Cuádriceps'],
        instrucciones: 'Sentado, extiende una pierna. Dobla la rodilla llevando el talón hacia ti. Alterna.',
        erroresComunes: ['Forzar estiramiento', 'Encorvar espalda', 'Movimiento brusco'],
        reps: 10, series: 2, descanso: 30,
    },
    36: {
        nombre: 'Estiramiento laterales de cintura',
        proposito: 'Flexibilidad lateral y alivio de tensión',
        beneficios: ['Flexibilidad lateral', 'Alivia tensión', 'Mejor respiración'],
        musculos: ['Oblicuos', 'Intercostales', 'Cuadrado lumbar'],
        instrucciones: 'De pie, levanta un brazo e inclínate al lado opuesto. Siente el estiramiento. Mantén 15 segundos.',
        erroresComunes: ['Inclinarse adelante', 'Rotar torso', 'Forzar mucho'],
        reps: 5, series: 2, descanso: 15, esTiempo: true, tiempoMantenimiento: 15,
    },
    37: {
        nombre: 'Extensión de piernas hacia atrás',
        proposito: 'Fortalecer glúteos y espalda baja',
        beneficios: ['Glúteos fuertes', 'Espalda estable', 'Mejor postura'],
        musculos: ['Glúteo mayor', 'Espalda baja', 'Isquiotibiales'],
        instrucciones: 'En cuatro puntos, extiende una pierna hacia atrás. Mantén 2 segundos. Alterna.',
        erroresComunes: ['Arquear espalda', 'Subir muy alto', 'Perder estabilidad'],
        reps: 12, series: 2, descanso: 30,
    },
    38: {
        nombre: 'Flexión corta de Pierna y Rodilla',
        proposito: 'Rehabilitación de rodilla y movilidad',
        beneficios: ['Rodilla saludable', 'Movilidad', 'Fortalecimiento suave'],
        musculos: ['Cuádriceps', 'Isquiotibiales'],
        instrucciones: 'Sentado o acostado, dobla la rodilla llevando el talón hacia el glúteo. Extiende.',
        erroresComunes: ['Forzar flexión', 'Movimiento brusco', 'Dolor en rodilla'],
        reps: 12, series: 2, descanso: 30,
    },
    39: {
        nombre: 'Flexión corta de pierna',
        proposito: 'Movilidad de rodilla sin carga',
        beneficios: ['Movilidad', 'Rehabilitación', 'Sin estrés articular'],
        musculos: ['Isquiotibiales', 'Gemelos'],
        instrucciones: 'De pie o sentado, dobla la rodilla llevando el pie hacia atrás. Baja controlado.',
        erroresComunes: ['Usar impulso', 'No controlar', 'Inclinar cuerpo'],
        reps: 12, series: 2, descanso: 30,
    },
    40: {
        nombre: 'Flexión de espalda, pierna y abdomen',
        proposito: 'Ejercicio integrado para core y flexibilidad',
        beneficios: ['Core fuerte', 'Flexibilidad', 'Coordinación'],
        musculos: ['Abdominales', 'Espalda', 'Hip flexors'],
        instrucciones: 'Acostado, lleva las rodillas al pecho abrazándolas. Mantén y rueda suavemente.',
        erroresComunes: ['Tensar cuello', 'Movimiento brusco', 'Contener respiración'],
        reps: 10, series: 2, descanso: 30,
    },
    41: {
        nombre: 'Flexiones',
        proposito: 'Rehabilitación y fortalecimiento progresivo de tren superior',
        beneficios: ['Fortalece gradualmente', 'Mejora estabilidad', 'Recuperación'],
        musculos: ['Pectorales', 'Tríceps', 'Core'],
        instrucciones: 'Puedes hacerlas de rodillas. Baja el pecho controladamente y empuja hacia arriba.',
        erroresComunes: ['Forzar demasiado', 'Mala alineación', 'Movimiento brusco'],
        reps: 8, series: 2, descanso: 60,
    },
    42: {
        nombre: 'Inclinación lateral de tronco',
        proposito: 'Flexibilidad y fortalecimiento de oblicuos',
        beneficios: ['Oblicuos fuertes', 'Flexibilidad', 'Cintura definida'],
        musculos: ['Oblicuos', 'Cuadrado lumbar'],
        instrucciones: 'De pie, manos en la cadera. Inclínate lateralmente a un lado. Vuelve y alterna.',
        erroresComunes: ['Rotar', 'Inclinarse adelante', 'Movimiento muy rápido'],
        reps: 12, series: 2, descanso: 30,
    },
    43: {
        nombre: 'Inclinación lateral de tronco con brazos abiertos',
        proposito: 'Mayor estiramiento lateral con brazos como palanca',
        beneficios: ['Estiramiento profundo', 'Movilidad torso', 'Oblicuos activos'],
        musculos: ['Oblicuos', 'Intercostales', 'Deltoides'],
        instrucciones: 'Brazos extendidos a los lados. Inclínate lateralmente manteniendo brazos en línea.',
        erroresComunes: ['Bajar brazos', 'Rotar', 'Perder equilibrio'],
        reps: 10, series: 2, descanso: 30,
    },
    44: {
        nombre: 'Plancha con elevación de brazo',
        proposito: 'Core avanzado con desafío de estabilidad',
        beneficios: ['Core muy fuerte', 'Estabilidad', 'Coordinación'],
        musculos: ['Abdominales', 'Oblicuos', 'Deltoides'],
        instrucciones: 'En plancha, levanta un brazo al frente manteniendo la posición estable. Alterna.',
        erroresComunes: ['Rotar cadera', 'Perder posición', 'Subir cadera'],
        reps: 8, series: 2, descanso: 45, esTiempo: false,
    },
    45: {
        nombre: 'Press de hombros con mancuernas',
        proposito: 'Fortalecer hombros completamente',
        beneficios: ['Hombros fuertes', 'Brazos definidos', 'Postura mejorada'],
        musculos: ['Deltoides', 'Tríceps', 'Trapecio'],
        instrucciones: 'Sentado, mancuernas a la altura de los hombros. Empuja hacia arriba. Baja controlado.',
        erroresComunes: ['Arquear espalda', 'Codos hacia atrás', 'Bloquear codos'],
        reps: 10, series: 3, descanso: 60,
    },
    46: {
        nombre: 'Puente de glúteos elevando espalda del suelo',
        proposito: 'Versión avanzada del puente para glúteos',
        beneficios: ['Glúteos muy fuertes', 'Core activo', 'Espalda fuerte'],
        musculos: ['Glúteo mayor', 'Isquiotibiales', 'Core'],
        instrucciones: 'Acostado, eleva caderas hasta formar línea recta. Aprieta glúteos arriba. Baja lento.',
        erroresComunes: ['Hiperextender', 'No apretar arriba', 'Bajar rápido'],
        reps: 15, series: 3, descanso: 45,
    },
    47: {
        nombre: 'Estiramiento con manos juntas',
        proposito: 'Estirar hombros y pecho',
        beneficios: ['Hombros flexibles', 'Pecho abierto', 'Mejor postura'],
        musculos: ['Deltoides', 'Pectorales', 'Bíceps'],
        instrucciones: 'Manos entrelazadas detrás. Estira los brazos hacia atrás abriendo el pecho.',
        erroresComunes: ['Forzar demasiado', 'Encorvar espalda', 'Contener respiración'],
        reps: 5, series: 2, descanso: 20, esTiempo: true, tiempoMantenimiento: 15,
    },
    48: {
        nombre: 'Rotación de antebrazo con bastón',
        proposito: 'Rehabilitación y movilidad de muñeca y antebrazo',
        beneficios: ['Movilidad', 'Rehabilitación', 'Prevención túnel carpiano'],
        musculos: ['Supinadores', 'Pronadores', 'Antebrazos'],
        instrucciones: 'Sostén un bastón o palo. Rota el antebrazo de palma hacia arriba a palma hacia abajo.',
        erroresComunes: ['Mover codo', 'Hacer muy rápido', 'Tensar hombro'],
        reps: 15, series: 2, descanso: 20,
    },
    49: {
        nombre: 'Rotación de tronco sentado',
        proposito: 'Mejorar movilidad de columna',
        beneficios: ['Movilidad espinal', 'Alivio tensión', 'Mejor digestión'],
        musculos: ['Oblicuos', 'Erectores espinales', 'Core'],
        instrucciones: 'Sentado, espalda recta. Gira el torso hacia un lado manteniendo caderas fijas. Mantén 3 segundos.',
        erroresComunes: ['Mover caderas', 'Forzar rotación', 'Encorvar espalda'],
        reps: 10, series: 2, descanso: 30,
    },
    50: {
        nombre: 'Sentadillas',
        proposito: 'El ejercicio rey para piernas y glúteos',
        beneficios: ['Piernas fuertes', 'Quema calorías', 'Mejora movilidad'],
        musculos: ['Cuádriceps', 'Glúteos', 'Core'],
        instrucciones: 'Pies al ancho de hombros. Baja como si te sentaras manteniendo espalda recta. Sube empujando talones.',
        erroresComunes: ['Rodillas hacia adentro', 'Inclinar torso', 'Talones elevados'],
        reps: 15, series: 3, descanso: 60,
    },
};

// Obtener descripción de un ejercicio
export function getExerciseDescription(exerciseId) {
    return EXERCISE_DESCRIPTIONS[exerciseId] || {
        nombre: 'Ejercicio',
        proposito: 'Mejorar la condición física general',
        beneficios: ['Fortalece el cuerpo', 'Mejora la salud'],
        musculos: ['Varios grupos musculares'],
        instrucciones: 'Sigue las indicaciones del GIF de referencia',
        erroresComunes: ['No calentar antes', 'Moverse muy rápido'],
        reps: 12, series: 3, descanso: 60,
    };
}

// Generar texto de explicación completa para voz
export function generateExerciseExplanation(exerciseId, format = 'full') {
    const desc = getExerciseDescription(exerciseId);

    // Determinar posición inicial según el ejercicio
    const getPositionInstruction = (id, nombre) => {
        const nombreLower = (nombre || '').toLowerCase();

        // Ejercicios sentados
        if (nombreLower.includes('sentado') || nombreLower.includes('sentada') ||
            nombreLower.includes('curl de bíceps sentado') || id === 22 || id === 28 || id === 30 || id === 49) {
            return 'Siéntate en una silla o banco con la espalda recta y los pies apoyados en el suelo.';
        }

        // Ejercicios acostados
        if (nombreLower.includes('elevación de piernas') || nombreLower.includes('glúteos del suelo') ||
            nombreLower.includes('puente') || nombreLower.includes('crunch') ||
            id === 11 || id === 12 || id === 21 || id === 24 || id === 33 || id === 40 || id === 46) {
            return 'Acuéstate boca arriba en una colchoneta con las rodillas dobladas y los brazos a los lados.';
        }

        // Ejercicios en cuatro puntos
        if (nombreLower.includes('extensión de piernas hacia atrás') || id === 37) {
            return 'Ponte en cuatro puntos apoyando las manos y las rodillas en el suelo.';
        }

        // Plancha
        if (nombreLower.includes('plancha') || id === 10 || id === 44) {
            return 'Ponte en posición de plancha apoyando los antebrazos y las puntas de los pies en el suelo.';
        }

        // Flexiones
        if (nombreLower.includes('flexion') || id === 5 || id === 41) {
            return 'Ponte boca abajo, manos al ancho de los hombros, cuerpo recto como una tabla.';
        }

        // Banco inclinado
        if (nombreLower.includes('inclinado') || nombreLower.includes('inclinada') ||
            nombreLower.includes('press de banca') || id === 6 || id === 7 || id === 8) {
            return 'Acuéstate en el banco con los pies firmemente apoyados en el suelo.';
        }

        // Con mancuernas de pie
        if (nombreLower.includes('mancuernas') && !nombreLower.includes('sentado')) {
            return 'Ponte de pie con los pies al ancho de los hombros, mancuernas en las manos a los lados.';
        }

        // Zancadas
        if (nombreLower.includes('zancada') || id === 18) {
            return 'Ponte de pie con las mancuernas en las manos y los pies juntos.';
        }

        // Sentadillas
        if (nombreLower.includes('sentadilla') || id === 15 || id === 50) {
            return 'Ponte de pie con los pies al ancho de los hombros, puntas ligeramente hacia afuera.';
        }

        // Por defecto - de pie
        return 'Ponte de pie con los pies al ancho de los hombros, espalda recta y hombros relajados.';
    };

    if (format === 'short') {
        return `${desc.nombre}. ${desc.proposito}.`;
    }

    if (format === 'instructions') {
        return `Para hacer ${desc.nombre}: ${desc.instrucciones}. Evita: ${desc.erroresComunes[0]}.`;
    }

    if (format === 'position') {
        return getPositionInstruction(exerciseId, desc.nombre);
    }

    // Full explanation con instrucciones de posicionamiento
    const posicion = getPositionInstruction(exerciseId, desc.nombre);

    return `
    Vamos a hacer ${desc.nombre}. 
    ${desc.proposito}. 
    ${posicion}
    Este ejercicio trabaja: ${desc.musculos.slice(0, 2).join(' y ')}. 
    ${desc.instrucciones}. 
    Recuerda: no ${desc.erroresComunes[0].toLowerCase()}. 
    Haremos ${desc.reps} ${desc.esTiempo ? 'segundos' : 'repeticiones'}.
    Cuando estés en posición, comenzamos.
  `.replace(/\s+/g, ' ').trim();
}

export default {
    EXERCISE_DESCRIPTIONS,
    getExerciseDescription,
    generateExerciseExplanation,
};
