/**
 * Dataset de ejercicios con URLs de Cloudinary
 * Sincronizado con seed_musculos.py del backend
 * 
 * Uso: import { EJERCICIOS, MUSCULOS, TIPOS } from './ejerciciosDataset';
 */

export const TIPOS = {
    GIMNASIO: 1,
    FISIOTERAPIA: 2,
};

export const MUSCULOS = [
    // Gimnasio (tipo_id=1)
    { id: 1, nombre: 'Espalda', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763604770/plwajctd1bmiaz7tc9ai.png', tipo_id: 1 },
    { id: 2, nombre: 'Pectorales', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763604900/lozehp9xse2jk0bebq74.png', tipo_id: 1 },
    { id: 3, nombre: 'Abdominales', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763604953/pawh9dn24zfrpchfag8g.png', tipo_id: 1 },
    { id: 4, nombre: 'Brazos', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763604987/sektsdmnzjrzrdb1ziyl.png', tipo_id: 1 },
    { id: 5, nombre: 'Piernas', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763605250/lko0ysnyhslnmixk4le9.png', tipo_id: 1 },
    // Fisioterapia (tipo_id=2)
    { id: 6, nombre: 'Rodilla', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763605419/dq0vqy6dcggcenypviqj.png', tipo_id: 2 },
    { id: 7, nombre: 'Espalda', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763604770/plwajctd1bmiaz7tc9ai.png', tipo_id: 2 },
    { id: 8, nombre: 'Abdominales', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763604953/pawh9dn24zfrpchfag8g.png', tipo_id: 2 },
    { id: 9, nombre: 'Brazos', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763604987/sektsdmnzjrzrdb1ziyl.png', tipo_id: 2 },
    { id: 10, nombre: 'Piernas', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763605250/lko0ysnyhslnmixk4le9.png', tipo_id: 2 },
];

export const EJERCICIOS = [
    // ===== GIMNASIO (1-18) =====
    { id: 1, nombre: 'Remo sentado en máquina', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763608918/rmbx2k6sjjuw6puwejwk.gif', musculo: 'Espalda', tipo: 'Gimnasio' },
    { id: 2, nombre: 'Remo con mancuernas', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763608975/mhhvbnw6vvi33d6bxcqz.gif', musculo: 'Espalda', tipo: 'Gimnasio' },
    { id: 3, nombre: 'Remo sentado en polea baja', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763609058/ucq1yvu64owemhcaojih.gif', musculo: 'Espalda', tipo: 'Gimnasio' },
    { id: 4, nombre: 'Remo unilateral de pie en polea', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763609107/goqpdjoplofvfijya6kx.gif', musculo: 'Espalda', tipo: 'Gimnasio' },
    { id: 5, nombre: 'Flexiones', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763609718/vxovdtgeio24tphfqxgs.gif', musculo: 'Pectorales', tipo: 'Gimnasio' },
    { id: 6, nombre: 'Press de banca con mancuernas', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763609767/rqggibhnjqpt77mqmmu6.gif', musculo: 'Pectorales', tipo: 'Gimnasio' },
    { id: 7, nombre: 'Aperturas inclinadas con mancuernas', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763609864/g9dyvja3tsal4fvtyvqb.gif', musculo: 'Pectorales', tipo: 'Gimnasio' },
    { id: 8, nombre: 'Press inclinado con mancuernas', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763609903/wk6abpvgkec6vndgypto.gif', musculo: 'Pectorales', tipo: 'Gimnasio' },
    { id: 9, nombre: 'Aperturas en máquina Mariposa', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610163/n6s6rehxkgkiwiwxltgj.gif', musculo: 'Pectorales', tipo: 'Gimnasio' },
    { id: 10, nombre: 'Plancha', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610214/robowud7tp0tnsomju7n.gif', musculo: 'Abdominales', tipo: 'Gimnasio' },
    { id: 11, nombre: 'Elevación de piernas en el suelo', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610227/ga5myoe1c7rvnlsdjisp.gif', musculo: 'Abdominales', tipo: 'Gimnasio' },
    { id: 12, nombre: 'Elevación de piernas en banco', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610319/unwmijpgd0km2qarqvhq.gif', musculo: 'Abdominales', tipo: 'Gimnasio' },
    { id: 13, nombre: 'Curl de bíceps con mancuernas de pie', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610353/jlyeogqte2xi1hvxdwtg.gif', musculo: 'Brazos', tipo: 'Gimnasio' },
    { id: 14, nombre: 'Remo inclinado con mancuernas', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610423/gz7onxfhrhuuechwsp5p.gif', musculo: 'Espalda', tipo: 'Gimnasio' },
    { id: 15, nombre: 'Sentadilla Hack', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610458/diuthklvq2yd6tqcflz1.gif', musculo: 'Piernas', tipo: 'Gimnasio' },
    { id: 16, nombre: 'Prensa de piernas', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610518/ptdtxoykgv3ngji3bqca.gif', musculo: 'Piernas', tipo: 'Gimnasio' },
    { id: 17, nombre: 'Elevación de talones con barra', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610552/i2dwa1ihjuhbj1yyy799.gif', musculo: 'Piernas', tipo: 'Gimnasio' },
    { id: 18, nombre: 'Zancadas con mancuernas', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610615/u8wsrsqh0sxhb9d6no93.gif', musculo: 'Piernas', tipo: 'Gimnasio' },

    // ===== FISIOTERAPIA (19-50) =====
    { id: 19, nombre: 'Aducción de hombros', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655102/blzvewcw4k3gs3uht450.gif', musculo: 'Brazos', tipo: 'Fisioterapia' },
    { id: 20, nombre: 'Band Pull-Apart', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655147/lbydcpft1y2vfqvvgw6u.gif', musculo: 'Espalda', tipo: 'Fisioterapia' },
    { id: 21, nombre: 'Crunch Inverso', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655167/prk9ycsam4vnk0h2irg0.gif', musculo: 'Abdominales', tipo: 'Fisioterapia' },
    { id: 22, nombre: 'Curl de bíceps Sentado', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655204/sur512lswaiycgscwonz.gif', musculo: 'Brazos', tipo: 'Fisioterapia' },
    { id: 23, nombre: 'Elevación de brazos', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655235/z8lhbirrm8gvijaa31bw.gif', musculo: 'Brazos', tipo: 'Fisioterapia' },
    { id: 24, nombre: 'Elevación corta de piernas', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655261/ctfckucoexxsi8pjvh6h.gif', musculo: 'Piernas', tipo: 'Fisioterapia' },
    { id: 25, nombre: 'Elevación Corta con mancuernas', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655285/lbzlhsx66mmzaavmgefw.gif', musculo: 'Brazos', tipo: 'Fisioterapia' },
    { id: 26, nombre: 'Elevación de manos', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655314/ecbsazfh02rtkasfsmkj.gif', musculo: 'Brazos', tipo: 'Fisioterapia' },
    { id: 27, nombre: 'Elevacion de Piernas', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655361/zfd32qjxyke65e7yjt5g.gif', musculo: 'Piernas', tipo: 'Fisioterapia' },
    { id: 28, nombre: 'Elevación de Puntas sentado', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655402/sfefs0bjpbuv97jsqnsj.gif', musculo: 'Piernas', tipo: 'Fisioterapia' },
    { id: 29, nombre: 'Elevación de rodillas', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655447/a4at2px52b10sao9bbok.gif', musculo: 'Rodilla', tipo: 'Fisioterapia' },
    { id: 30, nombre: 'Elevación de talones sentado', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655485/lpeoem8bwj9nr6btvz6i.gif', musculo: 'Piernas', tipo: 'Fisioterapia' },
    { id: 31, nombre: 'Elevación lateral de brazos', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655501/a2umplnxxittuz8f5hov.gif', musculo: 'Brazos', tipo: 'Fisioterapia' },
    { id: 32, nombre: 'Espalda Recta', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655529/r6ucaqfecnyezjcrw9se.gif', musculo: 'Espalda', tipo: 'Fisioterapia' },
    { id: 33, nombre: 'Elevación de glúteos del suelo', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655578/taao0a2t11p75tzqhcqy.gif', musculo: 'Piernas', tipo: 'Fisioterapia' },
    { id: 34, nombre: 'Estiramiento yoga', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655634/ybf3qox3lfs9osmkrvr7.gif', musculo: 'Espalda', tipo: 'Fisioterapia' },
    { id: 35, nombre: 'Estiramiento de piernas y flexión de rodillas', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655683/txr3d4mrgotcn0vigbby.gif', musculo: 'Rodilla', tipo: 'Fisioterapia' },
    { id: 36, nombre: 'Estiramiento laterales de cintura', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655725/zwlpw6j8aykvvqofwnod.gif', musculo: 'Espalda', tipo: 'Fisioterapia' },
    { id: 37, nombre: 'Extensión de piernas hacia atras', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655767/lgv7c5clvtecdx6ij0n9.gif', musculo: 'Rodilla', tipo: 'Fisioterapia' },
    { id: 38, nombre: 'Flexión corta de Pierna y Rodilla', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655824/bp3ok1uomzacph8hq6gx.gif', musculo: 'Rodilla', tipo: 'Fisioterapia' },
    { id: 39, nombre: 'Flexión corta de pierna', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655859/catsffggsbnim5qn7nie.gif', musculo: 'Rodilla', tipo: 'Fisioterapia' },
    { id: 40, nombre: 'Flexión de espalda, pierna y abdomen', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655884/ytrgoo1wzthgeytomyjg.gif', musculo: 'Espalda', tipo: 'Fisioterapia' },
    { id: 41, nombre: 'Flexiones', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655924/xtzm50dfuxjnkfug8joi.gif', musculo: 'Brazos', tipo: 'Fisioterapia' },
    { id: 42, nombre: 'Inclinación lateral de tronco', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655946/wwlzyizbeblquj6tztpa.gif', musculo: 'Abdominales', tipo: 'Fisioterapia' },
    { id: 43, nombre: 'Inclinación lateral de tronco con brazos abiertos', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655973/yiqdqkc4hk3weypjafbo.gif', musculo: 'Abdominales', tipo: 'Fisioterapia' },
    { id: 44, nombre: 'Plancha con elevación de brazo', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763656011/lfadvrx5ymovfijqvr4h.gif', musculo: 'Abdominales', tipo: 'Fisioterapia' },
    { id: 45, nombre: 'Press de hombros con mancuernas', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763656043/naqovviofjsbr6f8dcjl.gif', musculo: 'Brazos', tipo: 'Fisioterapia' },
    { id: 46, nombre: 'Puente de glúteos elevando espalda del suelo', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763656076/xurdhxfojz7rmqx3tylr.gif', musculo: 'Piernas', tipo: 'Fisioterapia' },
    { id: 47, nombre: 'Estiramiento con manos juntas', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763656112/ummf5tq7rteigpugeoga.gif', musculo: 'Brazos', tipo: 'Fisioterapia' },
    { id: 48, nombre: 'Rotación de antebrazo con bastón', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763656150/qocgforfofowwo9rtg8i.gif', musculo: 'Brazos', tipo: 'Fisioterapia' },
    { id: 49, nombre: 'Rotación de tronco sentado', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763656184/ah5ecoud4o3i5gkrx5mc.gif', musculo: 'Abdominales', tipo: 'Fisioterapia' },
    { id: 50, nombre: 'Sentadillas', url: 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763656211/fq9hjiqfidviolcpmfmj.gif', musculo: 'Piernas', tipo: 'Fisioterapia' },
];

// Helper functions
export function getEjerciciosByMusculo(musculoNombre) {
    return EJERCICIOS.filter(ej => ej.musculo.toLowerCase() === musculoNombre.toLowerCase());
}

export function getEjerciciosByTipo(tipo) {
    return EJERCICIOS.filter(ej => ej.tipo.toLowerCase() === tipo.toLowerCase());
}

export function getMusculosByTipo(tipoId) {
    return MUSCULOS.filter(m => m.tipo_id === tipoId);
}

export function getEjercicioById(id) {
    return EJERCICIOS.find(ej => ej.id === id);
}

export default {
    TIPOS,
    MUSCULOS,
    EJERCICIOS,
    getEjerciciosByMusculo,
    getEjerciciosByTipo,
    getMusculosByTipo,
    getEjercicioById,
};
