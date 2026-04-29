## PARA LA TABLA 
SELECT * FROM public.musculos_musculo
ORDER BY id ASC 

INSERT INTO public.musculos_musculo (id, nombre, url) VALUES
(4, 'Espalda', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763604770/plwajctd1bmiaz7tc9ai.png'),
(5, 'Pectorales', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763604900/lozehp9xse2jk0bebq74.png'),
(6, 'Abdominales', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763604953/pawh9dn24zfrpchfag8g.png'),
(7, 'Brazos', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763604987/sektsdmnzjrzrdb1ziyl.png'),
(8, 'Piernas', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763605250/lko0ysnyhslnmixk4le9.png'),
(9, 'Rodilla', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763605419/dq0vqy6dcggcenypviqj.png');

## PARA LA TABLA 
SELECT * FROM public.musculos_ejercicio
ORDER BY id ASC 

INSERT INTO public.musculos_ejercicio (id, nombre, url, estado) VALUES
(3, 'Remo sentado en máquina', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763608918/rmbx2k6sjjuw6puwejwk.gif', true),
(4, 'Remo con mancuernas', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763608975/mhhvbnw6vvi33d6bxcqz.gif', true),
(5, 'Remo sentado en polea baja', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763609058/ucq1yvu64owemhcaojih.gif', true),
(6, 'Remo unilateral de pie en polea', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763609107/goqpdjoplofvfijya6kx.gif', true),
(7, 'Flexiones', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763609718/vxovdtgeio24tphfqxgs.gif', true),
(8, 'Press de banca con mancuernas', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763609767/rqggibhnjqpt77mqmmu6.gif', true),
(9, 'Aperturas inclinadas con mancuernas', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763609864/g9dyvja3tsal4fvtyvqb.gif', true),
(10, 'Press inclinado con mancuernas', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763609903/wk6abpvgkec6vndgypto.gif', true),
(11, 'Aperturas en máquina Mariposa', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610163/n6s6rehxkgiwiwxltgj.gif', true),
(12, 'Plancha', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610214/robowud7tp0tnsomju7n.gif', true),
(13, 'Elevación de piesrnas en el suelo', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610227/ga5myoe1c7rvnlsdjisp.gif', true),
(14, 'Elevación de piernas en banco', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610319/unwmijpgd0km2qarqvhq.gif', true),
(15, 'Curl de bíceps con mancuernas de pie', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610353/jlyeogqte2xi1hvxdwtg.gif', true),
(16, 'Remo inclinado con mancuernas', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610423/gz7onxfhrhuuechwsp5p.gif', true),
(17, 'Sentadilla Hack', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610458/diuthklvq2yd6tqcflz1.gif', true),
(18, 'Prensa de piernas', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610518/ptdtxoykgv3ngji3bqca.gif', true),
(19, 'Elevación de talones con barra', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610552/i2dwa1ihjuhbj1yyy799.gif', true),
(20, 'Zancadas con mancuernas', 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610615/u8wsrsqh0sxhb9d6no93.gif', true);


## PARA LA TABLA
SELECT * FROM public.musculos_detallemusculo
ORDER BY id ASC 

INSERT INTO public.musculos_detallemusculo (id, porcentaje, "idEjercicio_id", "idMusculo_id", "idTipo_id") VALUES
(1, '85', 3, 4, 2),
(2, '80', 4, 4, 2),
(3, '85', 5, 4, 2),
(4, '80', 6, 4, 2),
(5, '70', 7, 5, 2),
(6, '75', 8, 5, 2),
(7, '90', 9, 5, 2),
(8, '70', 10, 5, 2),
(9, '95', 11, 5, 2),
(10, '100', 12, 6, 2),
(11, '80', 13, 6, 2),
(12, '85', 14, 6, 2),
(13, '95', 15, 7, 2),
(14, '90', 17, 8, 2),
(15, '90', 18, 8, 2),
(16, '100', 19, 8, 2),
(17, '90', 20, 8, 2),
(18, '90', 3, 4, 1),
(19, '85', 5, 4, 1),
(20, '80', 6, 4, 1),
(21, '90', 18, 8, 1),
(22, '100', 19, 8, 1),
(23, '80', 20, 8, 1),
(24, '100', 12, 6, 1),
(25, '70', 13, 6, 1),
(26, '90', 11, 5, 1),
(27, '60', 7, 5, 1),
(28, '90', 15, 7, 1);