# dashboard/api/views/auth.py
from django.contrib.auth import login
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie

from ..serializers.auth import RegisterSerializer

@ensure_csrf_cookie
def csrf(request):
    return JsonResponse({"detail": "CSRF cookie set"})

class RegisterAPI(APIView):
    permission_classes = []  # allow anyone
    authentication_classes = []  # no auth required to register

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()

        # Optional: directly log them in (session cookie)
        login(request, user)

        return Response(
            {"detail": "User created successfully."},
            status=status.HTTP_201_CREATED,
        )
