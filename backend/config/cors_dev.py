from django.conf import settings
from django.http import HttpResponse

from config.settings import lista

# App mobile aberto no navegador (Expo web) roda em outra porta. Só em DEBUG e só para as origens listadas.
ORIGENS = set(lista("DJANGO_CORS_DEV", ""))


def cors_dev(get_response):
    def middleware(request):
        origem = request.headers.get("Origin")
        if not (settings.DEBUG and origem in ORIGENS):
            return get_response(request)
        response = HttpResponse() if request.method == "OPTIONS" else get_response(request)
        response["Access-Control-Allow-Origin"] = origem
        response["Access-Control-Allow-Headers"] = "authorization, content-type"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response["Vary"] = "Origin"
        return response

    return middleware
