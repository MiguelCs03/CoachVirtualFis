# coachvirtualback/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('api/', include('usuarios.urls')),
    path('api/poses/', include('poses.urls')),
    path('api/suscripciones/', include('suscripciones.urls')),

    # ⬇️ ESTA línea es la que te falta
    path('api/', include('musculos.urls')),
    path('api/', include('dispositivo.urls')),
]
