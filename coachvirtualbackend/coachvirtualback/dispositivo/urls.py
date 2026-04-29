from django.urls import path
from . import views

urlpatterns = [
    path("dispositivo/googlefit/", views.googlefit_stats, name="dispositivo-googlefit-stats"),
    path("dispositivo/exercise/", views.record_exercise, name="dispositivo-record-exercise"),
]

