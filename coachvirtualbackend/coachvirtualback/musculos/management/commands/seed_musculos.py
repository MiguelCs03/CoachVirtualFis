"""
Django management command para poblar la base de datos con datos iniciales de tipos, músculos,
ejercicios y detalles músculo-ejercicio.

Uso:
    python manage.py seed_musculos
    python manage.py seed_musculos --clear  # Borra datos existentes primero
"""
from django.core.management.base import BaseCommand
from musculos.models import Musculo, Ejercicio, DetalleMusculo, Tipo


class Command(BaseCommand):
    help = 'Poblar base de datos con datos iniciales de músculos, ejercicios y detalles'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Eliminar todos los datos existentes antes de insertar',
        )

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("🚀 INICIANDO POBLACIÓN DE BASE DE DATOS"))
        self.stdout.write("=" * 60)

        if options['clear']:
            self.clear_data()

        self.seed_tipos()
        self.seed_musculos()
        self.seed_ejercicios()
        self.seed_detalles()

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("✅ POBLACIÓN COMPLETADA"))
        self.stdout.write("=" * 60)
        self.stdout.write("\n📊 Resumen:")
        self.stdout.write(f"  - Tipos: {Tipo.objects.count()}")
        self.stdout.write(f"  - Músculos: {Musculo.objects.count()}")
        self.stdout.write(f"  - Ejercicios: {Ejercicio.objects.count()}")
        self.stdout.write(f"  - Detalles: {DetalleMusculo.objects.count()}")
        self.stdout.write("")

    def clear_data(self):
        """Elimina todos los datos existentes"""
        self.stdout.write("\n🗑️  Limpiando datos existentes...")
        DetalleMusculo.objects.all().delete()
        Ejercicio.objects.all().delete()
        Musculo.objects.all().delete()
        Tipo.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("✅ Datos eliminados"))

    def seed_tipos(self):
        """Inserta los tipos (Gimnasio / Fisioterapia)"""
        self.stdout.write("\n📝 Insertando tipos...")
        tipos_data = [
            {'id': 1, 'nombre': 'Gimnasio', 'estado': True},
            {'id': 2, 'nombre': 'Fisioterapia', 'estado': True},
        ]

        for t in tipos_data:
            tipo, created = Tipo.objects.update_or_create(
                id=t['id'],
                defaults={'nombre': t['nombre'], 'estado': t['estado']}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"  ✓ Tipo creado: {tipo.nombre}"))
            else:
                self.stdout.write(self.style.WARNING(f"  ↺ Tipo actualizado: {tipo.nombre}"))

    def seed_musculos(self):
        """Inserta los músculos con su tipo"""
        self.stdout.write("\n💪 Insertando músculos...")
        musculos_data = [
            # Gimnasio (tipo_id=1)
            {'id': 1, 'nombre': 'Espalda', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763604770/plwajctd1bmiaz7tc9ai.png', 'tipo_id': 1},
            {'id': 2, 'nombre': 'Pectorales', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763604900/lozehp9xse2jk0bebq74.png', 'tipo_id': 1},
            {'id': 3, 'nombre': 'Abdominales', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763604953/pawh9dn24zfrpchfag8g.png', 'tipo_id': 1},
            {'id': 4, 'nombre': 'Brazos', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763604987/sektsdmnzjrzrdb1ziyl.png', 'tipo_id': 1},
            {'id': 5, 'nombre': 'Piernas', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763605250/lko0ysnyhslnmixk4le9.png', 'tipo_id': 1},

            # Fisioterapia (tipo_id=2)
            {'id': 6, 'nombre': 'Rodilla', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763605419/dq0vqy6dcggcenypviqj.png', 'tipo_id': 2},
            {'id': 7, 'nombre': 'Espalda', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763604770/plwajctd1bmiaz7tc9ai.png', 'tipo_id': 2},
            {'id': 8, 'nombre': 'Abdominales', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763604953/pawh9dn24zfrpchfag8g.png', 'tipo_id': 2},
            {'id': 9, 'nombre': 'Brazos', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763604987/sektsdmnzjrzrdb1ziyl.png', 'tipo_id': 2},
            {'id': 10, 'nombre': 'Piernas', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763605250/lko0ysnyhslnmixk4le9.png', 'tipo_id': 2},
        ]

        for m in musculos_data:
            musculo, created = Musculo.objects.update_or_create(
                id=m['id'],
                defaults={
                    'nombre': m['nombre'],
                    'url': m['url'],
                    'tipo_id': m['tipo_id'],
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"  ✓ Músculo creado: {musculo.nombre} (tipo {m['tipo_id']})"))
            else:
                self.stdout.write(self.style.WARNING(f"  ↺ Músculo actualizado: {musculo.nombre}"))

    def seed_ejercicios(self):
        """Inserta los ejercicios (1-50)"""
        self.stdout.write("\n🏋️  Insertando ejercicios...")
        ejercicios_data = [
            # Gimnasio (1-18)
            {'id': 1, 'nombre': 'Remo sentado en máquina', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763608918/rmbx2k6sjjuw6puwejwk.gif', 'estado': True},
            {'id': 2, 'nombre': 'Remo con mancuernas', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763608975/mhhvbnw6vvi33d6bxcqz.gif', 'estado': True},
            {'id': 3, 'nombre': 'Remo sentado en polea baja', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763609058/ucq1yvu64owemhcaojih.gif', 'estado': True},
            {'id': 4, 'nombre': 'Remo unilateral de pie en polea', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763609107/goqpdjoplofvfijya6kx.gif', 'estado': True},
            {'id': 5, 'nombre': 'Flexiones', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763609718/vxovdtgeio24tphfqxgs.gif', 'estado': True},
            {'id': 6, 'nombre': 'Press de banca con mancuernas', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763609767/rqggibhnjqpt77mqmmu6.gif', 'estado': True},
            {'id': 7, 'nombre': 'Aperturas inclinadas con mancuernas', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763609864/g9dyvja3tsal4fvtyvqb.gif', 'estado': True},
            {'id': 8, 'nombre': 'Press inclinado con mancuernas', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763609903/wk6abpvgkec6vndgypto.gif', 'estado': True},
            {'id': 9, 'nombre': 'Aperturas en máquina Mariposa', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610163/n6s6rehxkgkiwiwxltgj.gif', 'estado': True},
            {'id': 10, 'nombre': 'Plancha', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610214/robowud7tp0tnsomju7n.gif', 'estado': True},
            {'id': 11, 'nombre': 'Elevación de piernas en el suelo', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610227/ga5myoe1c7rvnlsdjisp.gif', 'estado': True},
            {'id': 12, 'nombre': 'Elevación de piernas en banco', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610319/unwmijpgd0km2qarqvhq.gif', 'estado': True},
            {'id': 13, 'nombre': 'Curl de bíceps con mancuernas de pie', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610353/jlyeogqte2xi1hvxdwtg.gif', 'estado': True},
            {'id': 14, 'nombre': 'Remo inclinado con mancuernas', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610423/gz7onxfhrhuuechwsp5p.gif', 'estado': True},
            {'id': 15, 'nombre': 'Sentadilla Hack', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610458/diuthklvq2yd6tqcflz1.gif', 'estado': True},
            {'id': 16, 'nombre': 'Prensa de piernas', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610518/ptdtxoykgv3ngji3bqca.gif', 'estado': True},
            {'id': 17, 'nombre': 'Elevación de talones con barra', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610552/i2dwa1ihjuhbj1yyy799.gif', 'estado': True},
            {'id': 18, 'nombre': 'Zancadas con mancuernas', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763610615/u8wsrsqh0sxhb9d6no93.gif', 'estado': True},

            # Fisioterapia (19-50)
            {'id': 19, 'nombre': 'Aducción de hombros', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655102/blzvewcw4k3gs3uht450.gif', 'estado': True},
            {'id': 20, 'nombre': 'Band Pull-Apart', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655147/lbydcpft1y2vfqvvgw6u.gif', 'estado': True},
            {'id': 21, 'nombre': 'Crunch Inverso', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655167/prk9ycsam4vnk0h2irg0.gif', 'estado': True},
            {'id': 22, 'nombre': 'Curl de bíceps Sentado', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655204/sur512lswaiycgscwonz.gif', 'estado': True},
            {'id': 23, 'nombre': 'Elevación de brazos', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655235/z8lhbirrm8gvijaa31bw.gif', 'estado': True},
            {'id': 24, 'nombre': 'Elevación corta de piernas', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655261/ctfckucoexxsi8pjvh6h.gif', 'estado': True},
            {'id': 25, 'nombre': 'Elevación Corta con mancuernas', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655285/lbzlhsx66mmzaavmgefw.gif', 'estado': True},
            {'id': 26, 'nombre': 'Elevación de manos', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655314/ecbsazfh02rtkasfsmkj.gif', 'estado': True},
            {'id': 27, 'nombre': 'Elevacion de Piernas', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655361/zfd32qjxyke65e7yjt5g.gif', 'estado': True},
            {'id': 28, 'nombre': 'Elevación de Puntas sentado', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655402/sfefs0bjpbuv97jsqnsj.gif', 'estado': True},
            {'id': 29, 'nombre': 'Elevación de rodillas', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655447/a4at2px52b10sao9bbok.gif', 'estado': True},
            {'id': 30, 'nombre': 'Elevación de talones sentado', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655485/lpeoem8bwj9nr6btvz6i.gif', 'estado': True},
            {'id': 31, 'nombre': 'Elevación lateral de brazos', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655501/a2umplnxxittuz8f5hov.gif', 'estado': True},
            {'id': 32, 'nombre': 'Espalda Recta', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655529/r6ucaqfecnyezjcrw9se.gif', 'estado': True},
            {'id': 33, 'nombre': 'Elevación de glúteos del suelo', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655578/taao0a2t11p75tzqhcqy.gif', 'estado': True},
            {'id': 34, 'nombre': 'Estiramiento yoga', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655634/ybf3qox3lfs9osmkrvr7.gif', 'estado': True},
            {'id': 35, 'nombre': 'Estiramiento de piernas y flexión de rodillas', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655683/txr3d4mrgotcn0vigbby.gif', 'estado': True},
            {'id': 36, 'nombre': 'Estiramiento laterales de cintura', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655725/zwlpw6j8aykvvqofwnod.gif', 'estado': True},
            {'id': 37, 'nombre': 'Extensión de piernas hacia atras', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655767/lgv7c5clvtecdx6ij0n9.gif', 'estado': True},
            {'id': 38, 'nombre': 'Flexión corta de Pierna y Rodilla', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655824/bp3ok1uomzacph8hq6gx.gif', 'estado': True},
            {'id': 39, 'nombre': 'flexión corta de pierna', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655859/catsffggsbnim5qn7nie.gif', 'estado': True},
            {'id': 40, 'nombre': 'Flexión de espalda, pierna y abdomen', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655884/ytrgoo1wzthgeytomyjg.gif', 'estado': True},
            {'id': 41, 'nombre': 'Flexiones', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655924/xtzm50dfuxjnkfug8joi.gif', 'estado': True},
            {'id': 42, 'nombre': 'Inclinación lateral de tronco', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655946/wwlzyizbeblquj6tztpa.gif', 'estado': True},
            {'id': 43, 'nombre': 'Inclinación lateral de tronco con brazos abiertos', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763655973/yiqdqkc4hk3weypjafbo.gif', 'estado': True},
            {'id': 44, 'nombre': 'Plancha con elevación de brazo', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763656011/lfadvrx5ymovfijqvr4h.gif', 'estado': True},
            {'id': 45, 'nombre': 'Press de hombros con mancuernas', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763656043/naqovviofjsbr6f8dcjl.gif', 'estado': True},
            {'id': 46, 'nombre': 'Puente de glúteos elevando espalda del suelo', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763656076/xurdhxfojz7rmqx3tylr.gif', 'estado': True},
            {'id': 47, 'nombre': 'Estiramiento con manos juntas', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763656112/ummf5tq7rteigpugeoga.gif', 'estado': True},
            {'id': 48, 'nombre': 'Rotación de antebrazo con bastón', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763656150/qocgforfofowwo9rtg8i.gif', 'estado': True},
            {'id': 49, 'nombre': 'Rotación de tronco sentado', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763656184/ah5ecoud4o3i5gkrx5mc.gif', 'estado': True},
            {'id': 50, 'nombre': 'Sentadillas', 'url': 'https://res.cloudinary.com/dwerzrgya/image/upload/v1763656211/fq9hjiqfidviolcpmfmj.gif', 'estado': True},
        ]

        for e in ejercicios_data:
            ejercicio, created = Ejercicio.objects.update_or_create(
                id=e['id'],
                defaults={'nombre': e['nombre'], 'url': e['url'], 'estado': e['estado']}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"  ✓ Ejercicio creado: {ejercicio.nombre}"))
            else:
                self.stdout.write(self.style.WARNING(f"  ↺ Ejercicio actualizado: {ejercicio.nombre}"))

    def seed_detalles(self):
        """
        Inserta detalles músculo-ejercicio.
        OJO: DetalleMusculo NO tiene tipo directo; el tipo viene desde musculo.tipo.
        Campos reales: porcentaje, musculo(FK), ejercicio(FK).
        """
        self.stdout.write("\n🔗 Insertando detalles músculo-ejercicio...")

        detalles_data = [
            # ===== Gimnasio (musculos 1-5) =====
            {'id': 1, 'porcentaje': '22', 'musculo_id': 1, 'ejercicio_id': 1},
            {'id': 2, 'porcentaje': '20', 'musculo_id': 1, 'ejercicio_id': 2},
            {'id': 3, 'porcentaje': '20', 'musculo_id': 1, 'ejercicio_id': 3},
            {'id': 4, 'porcentaje': '18', 'musculo_id': 1, 'ejercicio_id': 4},
            {'id': 5, 'porcentaje': '20', 'musculo_id': 1, 'ejercicio_id': 14},

            {'id': 6, 'porcentaje': '20', 'musculo_id': 2, 'ejercicio_id': 5},
            {'id': 7, 'porcentaje': '25', 'musculo_id': 2, 'ejercicio_id': 6},
            {'id': 8, 'porcentaje': '20', 'musculo_id': 2, 'ejercicio_id': 7},
            {'id': 9, 'porcentaje': '20', 'musculo_id': 2, 'ejercicio_id': 8},
            {'id': 10, 'porcentaje': '15', 'musculo_id': 2, 'ejercicio_id': 9},

            {'id': 11, 'porcentaje': '35', 'musculo_id': 3, 'ejercicio_id': 10},
            {'id': 12, 'porcentaje': '35', 'musculo_id': 3, 'ejercicio_id': 11},
            {'id': 13, 'porcentaje': '30', 'musculo_id': 3, 'ejercicio_id': 12},

            {'id': 14, 'porcentaje': '40', 'musculo_id': 4, 'ejercicio_id': 13},
            {'id': 15, 'porcentaje': '20', 'musculo_id': 4, 'ejercicio_id': 5},
            {'id': 16, 'porcentaje': '20', 'musculo_id': 4, 'ejercicio_id': 6},
            {'id': 17, 'porcentaje': '20', 'musculo_id': 4, 'ejercicio_id': 8},

            {'id': 18, 'porcentaje': '30', 'musculo_id': 5, 'ejercicio_id': 15},
            {'id': 19, 'porcentaje': '30', 'musculo_id': 5, 'ejercicio_id': 16},
            {'id': 20, 'porcentaje': '20', 'musculo_id': 5, 'ejercicio_id': 17},
            {'id': 21, 'porcentaje': '20', 'musculo_id': 5, 'ejercicio_id': 18},

            # ===== Fisioterapia (musculos 6-10) =====
            {'id': 22, 'porcentaje': '20', 'musculo_id': 6, 'ejercicio_id': 38},
            {'id': 23, 'porcentaje': '15', 'musculo_id': 6, 'ejercicio_id': 39},
            {'id': 24, 'porcentaje': '15', 'musculo_id': 6, 'ejercicio_id': 37},
            {'id': 25, 'porcentaje': '15', 'musculo_id': 6, 'ejercicio_id': 35},
            {'id': 26, 'porcentaje': '20', 'musculo_id': 6, 'ejercicio_id': 50},
            {'id': 27, 'porcentaje': '15', 'musculo_id': 6, 'ejercicio_id': 29},

            {'id': 28, 'porcentaje': '20', 'musculo_id': 7, 'ejercicio_id': 32},
            {'id': 29, 'porcentaje': '15', 'musculo_id': 7, 'ejercicio_id': 20},
            {'id': 30, 'porcentaje': '15', 'musculo_id': 7, 'ejercicio_id': 36},
            {'id': 31, 'porcentaje': '15', 'musculo_id': 7, 'ejercicio_id': 42},
            {'id': 32, 'porcentaje': '15', 'musculo_id': 7, 'ejercicio_id': 49},
            {'id': 33, 'porcentaje': '10', 'musculo_id': 7, 'ejercicio_id': 34},
            {'id': 34, 'porcentaje': '10', 'musculo_id': 7, 'ejercicio_id': 40},

            {'id': 35, 'porcentaje': '20', 'musculo_id': 8, 'ejercicio_id': 21},
            {'id': 36, 'porcentaje': '20', 'musculo_id': 8, 'ejercicio_id': 27},
            {'id': 37, 'porcentaje': '20', 'musculo_id': 8, 'ejercicio_id': 44},
            {'id': 38, 'porcentaje': '15', 'musculo_id': 8, 'ejercicio_id': 42},
            {'id': 39, 'porcentaje': '15', 'musculo_id': 8, 'ejercicio_id': 49},
            {'id': 40, 'porcentaje': '10', 'musculo_id': 8, 'ejercicio_id': 40},

            {'id': 41, 'porcentaje': '15', 'musculo_id': 9, 'ejercicio_id': 19},
            {'id': 42, 'porcentaje': '15', 'musculo_id': 9, 'ejercicio_id': 22},
            {'id': 43, 'porcentaje': '15', 'musculo_id': 9, 'ejercicio_id': 23},
            {'id': 44, 'porcentaje': '15', 'musculo_id': 9, 'ejercicio_id': 31},
            {'id': 45, 'porcentaje': '15', 'musculo_id': 9, 'ejercicio_id': 45},
            {'id': 46, 'porcentaje': '10', 'musculo_id': 9, 'ejercicio_id': 48},
            {'id': 47, 'porcentaje': '10', 'musculo_id': 9, 'ejercicio_id': 47},
            {'id': 48, 'porcentaje': '5', 'musculo_id': 9, 'ejercicio_id': 41},

            {'id': 49, 'porcentaje': '20', 'musculo_id': 10, 'ejercicio_id': 50},
            {'id': 50, 'porcentaje': '15', 'musculo_id': 10, 'ejercicio_id': 33},
            {'id': 51, 'porcentaje': '15', 'musculo_id': 10, 'ejercicio_id': 46},
            {'id': 52, 'porcentaje': '15', 'musculo_id': 10, 'ejercicio_id': 24},
            {'id': 53, 'porcentaje': '15', 'musculo_id': 10, 'ejercicio_id': 27},
            {'id': 54, 'porcentaje': '10', 'musculo_id': 10, 'ejercicio_id': 28},
            {'id': 55, 'porcentaje': '10', 'musculo_id': 10, 'ejercicio_id': 30},
        ]

        for d in detalles_data:
            try:
                detalle, created = DetalleMusculo.objects.update_or_create(
                    # clave natural para respetar unique_together
                    musculo_id=d['musculo_id'],
                    ejercicio_id=d['ejercicio_id'],
                    defaults={
                        'porcentaje': d['porcentaje'],
                        # si quieres mantener ids fijos:
                        'id': d['id'],
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(
                        f"  ✓ Detalle creado: Musculo {d['musculo_id']} - Ejercicio {d['ejercicio_id']}"
                    ))
                else:
                    self.stdout.write(self.style.WARNING(
                        f"  ↺ Detalle actualizado: Musculo {d['musculo_id']} - Ejercicio {d['ejercicio_id']}"
                    ))
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"  ❌ Error detalle Musculo {d['musculo_id']} - Ejercicio {d['ejercicio_id']}: {e}"
                ))
