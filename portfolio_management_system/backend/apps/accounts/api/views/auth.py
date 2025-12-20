# dashboard/api/views/auth.py
from django.contrib.auth import login, authenticate, logout
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.permissions import AllowAny,IsAuthenticated

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


class LoginAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("login")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"detail": "Both login and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=username, password=password)

        if user is None:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = login(request, user)
        return Response({"detail": "Login successful."}, status=status.HTTP_200_OK)


class LogoutAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)
    
class CurrentUserAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_authenticated": user.is_authenticated,
        })
