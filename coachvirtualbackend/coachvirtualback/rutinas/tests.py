from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Rutina

User = get_user_model()


class RutinaAPITestCase(APITestCase):
    """Tests unitarios para la API de Rutinas."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@coachvirtual.com",
            password="testpass123",
        )
        self.other_user = User.objects.create_user(
            username="otheruser",
            email="other@coachvirtual.com",
            password="testpass123",
        )
        self.client.force_authenticate(user=self.user)

        self.rutina_payload = {
            "nombre": "Mi Rutina de Prueba",
            "descripcion": "Descripción de prueba",
            "objetivo": "fuerza",
            "nivel": "intermedio",
            "categoria": "gimnasio",
            "parte_cuerpo": "Espalda",
            "dias_por_semana": 3,
            "duracion_minutos": 45,
            "datos_rutina": [
                {
                    "ejercicio_id": 1,
                    "nombre": "Bíceps Curl",
                    "repeticiones": 12,
                    "series": 3,
                }
            ],
        }

    def test_listar_rutinas_vacias(self):
        """Test: Listar rutinas cuando no hay creadas."""
        response = self.client.get("/api/rutinas/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_crear_rutina(self):
        """Test: Crear una rutina a través del API."""
        response = self.client.post("/api/rutinas/", self.rutina_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["nombre"], "Mi Rutina de Prueba")
        self.assertEqual(response.data["parte_cuerpo"], "Espalda")
        self.assertEqual(Rutina.objects.filter(usuario=self.user).count(), 1)

    def test_listar_rutinas_usuario(self):
        """Test: Listar rutinas creadas por el usuario."""
        # Crear rutina
        Rutina.objects.create(usuario=self.user, nombre="Rutina 1")
        # Crear rutina de otro usuario
        Rutina.objects.create(usuario=self.other_user, nombre="Rutina 2")

        response = self.client.get("/api/rutinas/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["nombre"], "Rutina 1")

    def test_detalle_y_actualizar_rutina(self):
        """Test: Detalle, actualización y eliminación de una rutina."""
        rutina = Rutina.objects.create(usuario=self.user, nombre="Rutina Original")

        # Detalle
        response = self.client.get(f"/api/rutinas/{rutina.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["nombre"], "Rutina Original")

        # Actualizar
        update_payload = {"nombre": "Rutina Actualizada"}
        response = self.client.put(f"/api/rutinas/{rutina.id}/", update_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["nombre"], "Rutina Actualizada")

        # Eliminar
        response = self.client.delete(f"/api/rutinas/{rutina.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Rutina.objects.filter(id=rutina.id).count(), 0)
