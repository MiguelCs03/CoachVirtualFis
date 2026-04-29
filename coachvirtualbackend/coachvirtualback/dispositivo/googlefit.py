"""
Cliente para Google Fit usando una cuenta fija (token de acceso y refresh).
Lee pasos, calorías y frecuencia cardiaca del día actual.

Requiere variables en .env o entorno:
- GOOGLE_FIT_CLIENT_ID
- GOOGLE_FIT_CLIENT_SECRET
- GOOGLE_FIT_ACCESS_TOKEN
- GOOGLE_FIT_REFRESH_TOKEN
"""

import time
from datetime import datetime
from typing import Dict, Any

import requests
from decouple import config
from django.core.cache import cache


class GoogleFitClient:
    AGGREGATE_URL = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate"
    TOKEN_URL = "https://oauth2.googleapis.com/token"

    CACHE_TOKEN_KEY = "google_fit_access_token"
    CACHE_STATS_KEY = "google_fit_stats"
    CACHE_STATS_TTL = 15  # segundos

    def __init__(self):
        self.client_id = config("GOOGLE_FIT_CLIENT_ID", default="")
        self.client_secret = config("GOOGLE_FIT_CLIENT_SECRET", default="")
        self.refresh_token = config("GOOGLE_FIT_REFRESH_TOKEN", default="")

        # access token preferentemente desde cache (puede venir de un refresh previo)
        cached = cache.get(self.CACHE_TOKEN_KEY)
        self.access_token = cached or config("GOOGLE_FIT_ACCESS_TOKEN", default="")

        if not self.access_token:
            raise ValueError("Falta GOOGLE_FIT_ACCESS_TOKEN en entorno o cache")

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

    def _refresh_access_token_if_possible(self) -> bool:
        """Intenta refrescar el access_token si hay client_id/secret y refresh_token."""
        if not (self.client_id and self.client_secret and self.refresh_token):
            return False
        try:
            data = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": self.refresh_token,
                "grant_type": "refresh_token",
            }
            r = requests.post(self.TOKEN_URL, data=data, timeout=15)
            r.raise_for_status()
            payload = r.json()
            new_access = payload.get("access_token")
            expires_in = int(payload.get("expires_in", 3600))
            if new_access:
                self.access_token = new_access
                # guarda en cache ligeramente menor al expires_in
                cache.set(self.CACHE_TOKEN_KEY, new_access, max(60, expires_in - 60))
                return True
            return False
        except requests.RequestException:
            return False

    def _post_aggregate(self, body: Dict[str, Any]) -> Dict[str, Any]:
        # primer intento con el access_token actual
        r = requests.post(self.AGGREGATE_URL, json=body, headers=self._headers(), timeout=20)
        if r.status_code == 401:
            # intenta refresh si se puede
            if self._refresh_access_token_if_possible():
                r = requests.post(self.AGGREGATE_URL, json=body, headers=self._headers(), timeout=20)
        r.raise_for_status()
        return r.json()

    @staticmethod
    def _start_end_today_ms():
        now = datetime.now()
        start = datetime(now.year, now.month, now.day)
        return int(start.timestamp() * 1000), int(time.time() * 1000)

    def get_today_stats(self) -> Dict[str, Any]:
        # 1) Intentar servir desde cache inmediato para reducir latencia percibida
        cached = cache.get(self.CACHE_STATS_KEY)
        if cached:
            return cached

        start_ms, end_ms = self._start_end_today_ms()
        body = {
            "aggregateBy": [
                {"dataTypeName": "com.google.step_count.delta"},
                {"dataTypeName": "com.google.calories.expended"},
                {"dataTypeName": "com.google.heart_rate.bpm"},
            ],
            "bucketByTime": {"durationMillis": end_ms - start_ms},
            "startTimeMillis": start_ms,
            "endTimeMillis": end_ms,
        }

        data = self._post_aggregate(body)

        # parse buckets → datasets → points
        steps = 0
        calories = 0
        hr_avg = 0

        buckets = data.get("bucket", [])
        if buckets:
            ds = buckets[0].get("dataset", [])
            # steps
            if len(ds) > 0 and ds[0].get("point"):
                p = ds[0]["point"][0]
                v = p.get("value", [{}])[0]
                steps = int(v.get("intVal") or v.get("fpVal") or 0)
            # calories
            if len(ds) > 1 and ds[1].get("point"):
                p = ds[1]["point"][0]
                v = p.get("value", [{}])[0]
                calories = int(round(v.get("fpVal") or v.get("intVal") or 0))
            # heart rate (puede venir como summary con avg)
            if len(ds) > 2 and ds[2].get("point"):
                p = ds[2]["point"][0]
                v = p.get("value", [{}])[0]
                # algunos retornan avg/min/max en mapVal, otros en fpVal
                if "fpVal" in v:
                    hr_avg = int(round(v["fpVal"]))
                elif "mapVal" in v and v["mapVal"]:
                    # buscar clave 'avg'
                    avg_items = [m for m in v["mapVal"] if m.get("key") == "avg"]
                    if avg_items:
                        hr_avg = int(round(avg_items[0].get("value", {}).get("fpVal", 0)))

        result = {
            "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "steps": steps,
            "calories": calories,
            "heartRate": hr_avg,
            "owner": "joandanielrr@gmail.com",
            "fuente": "Google Fit",
        }

        # Guardar en cache por unos segundos para responder más rápido
        cache.set(self.CACHE_STATS_KEY, result, self.CACHE_STATS_TTL)
        return result
