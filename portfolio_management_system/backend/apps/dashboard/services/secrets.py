# dashboard/services/secrets.py

from typing import Optional
from django.db.models import QuerySet

from apps.dashboard.models import AppSecret, Portfolio


def get_secret(
    user,
    key_type: str,
    portfolio_id: Optional[int] = None,
    active_only: bool = True,
) -> QuerySet[AppSecret]:
    """
    Service-layer replacement for the old get_secret(request, type)
    function that lived in dashboard.views.

    Looks up AppSecret entries for a given user and secret type.

    Args:
        user:
            The authenticated user (request.user) whose portfolios
            own the secrets.

        key_type:
            The type/category of secret, e.g.:
                "Gmail"
                "AlphaVantage"
                "NewsAPI"
                "FMP"
                etc.
            This should match the `type` field in AppSecret.

        portfolio_id:
            If provided and not "all", restrict secrets to that
            specific portfolio id. If None or "all", search across
            all of the user’s portfolios.

        active_only:
            If True (default), filter by is_active=True.

    Returns:
        A Django QuerySet of AppSecret objects.
    """

    # Start from all portfolios belonging to this user
    portfolios = Portfolio.objects.filter(user=user)

    if portfolio_id and portfolio_id != "all":
        portfolios = portfolios.filter(id=portfolio_id)

    qs = AppSecret.objects.filter(
        portfolio__in=portfolios,
        type=key_type,
    )

    if active_only:
        qs = qs.filter(is_active=True)

    return qs
