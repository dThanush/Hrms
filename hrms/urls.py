from django.urls import path
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    CustomUserListCreateView, CustomUserDetailView,
    EmployeesListCreateView,
    LeaveListCreateView, LeaveUpdateStatusView,
    PunchTimeListCreateView,
    PunchTimeDetailView
)

urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('api/users/', CustomUserListCreateView.as_view(), name='user-list-create'),
    path('api/users/<int:pk>/', CustomUserDetailView.as_view(), name='user-detail'),

    path('api/employees/<int:pk>', EmployeesListCreateView.as_view(), name='employee-list'),

    path('api/leaves/', LeaveListCreateView.as_view(), name='leave-list-create'),
    path('api/leaves/<int:pk>/update_status/', LeaveUpdateStatusView.as_view(), name='leave-update-status'),

    path('api/punchtimes/', PunchTimeListCreateView.as_view(), name='punchtime-list-create'),
    path('api/punchtimes/<int:pk>/', PunchTimeDetailView.as_view(), name='punchtime-detail'),

]


# from django.conf import settings
# from django.conf.urls.static import static
# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from .views import CustomUserViewSet, EmployeesViewSet, LeaveViewSet, PunchTimeViewSet
# from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# router = DefaultRouter()
# router.register(r'users', CustomUserViewSet)
# router.register(r'employees', EmployeesViewSet)
# router.register(r'leaves', LeaveViewSet)
# router.register(r'punchtimes', PunchTimeViewSet)

# urlpatterns = [
#     path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
#     path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
#     path('api/', include(router.urls)), 
# ]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
   
