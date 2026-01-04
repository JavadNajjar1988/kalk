"""
Keycloak SSO Integration Module
"""
from typing import Any, Optional
import httpx
import logging
from fastapi import HTTPException, status
from jose import jwt, JWTError

from app.core.config import settings

logger = logging.getLogger(__name__)


class KeycloakClient:
    """Client for Keycloak OIDC operations"""

    def __init__(self):
        self.server_url = settings.KEYCLOAK_SERVER_URL.rstrip("/")
        self.realm = settings.KEYCLOAK_REALM
        self.client_id = settings.KEYCLOAK_CLIENT_ID
        self.client_secret = settings.KEYCLOAK_CLIENT_SECRET
        self.well_known_url = f"{self.server_url}/realms/{self.realm}/.well-known/openid-configuration"
        self._jwks_cache: Optional[dict] = None

    async def get_well_known_config(self) -> dict[str, Any]:
        """Get OpenID Connect well-known configuration"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(self.well_known_url, timeout=5.0)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Failed to fetch Keycloak well-known config: {e}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Keycloak service unavailable"
                )

    async def get_jwks(self) -> dict[str, Any]:
        """Get JSON Web Key Set from Keycloak"""
        config = await self.get_well_known_config()
        jwks_url = config.get("jwks_uri")
        if not jwks_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Keycloak JWKS URI not found"
            )

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(jwks_url, timeout=5.0)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Failed to fetch Keycloak JWKS: {e}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Keycloak JWKS unavailable"
                )

    async def verify_token(self, token: str) -> dict[str, Any]:
        """
        Verify JWT token with Keycloak using introspection endpoint
        This is more reliable than JWKS verification for server-side validation
        Returns decoded token payload
        """
        try:
            # Use introspection endpoint for token verification
            introspection_result = await self.introspect_token(token)
            
            # Check if token is active
            if not introspection_result.get("active", False):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token is not active"
                )
            
            # Return token claims from introspection
            # Introspection returns all token claims
            return introspection_result

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during token verification: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Token verification error"
            )

    async def get_user_info(self, token: str) -> dict[str, Any]:
        """Get user info from Keycloak using access token"""
        config = await self.get_well_known_config()
        userinfo_url = config.get("userinfo_endpoint")
        if not userinfo_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Keycloak userinfo endpoint not found"
            )

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    userinfo_url,
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=5.0
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Failed to get user info from Keycloak: {e}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Keycloak userinfo unavailable"
                )

    async def introspect_token(self, token: str) -> dict[str, Any]:
        """Introspect token using Keycloak token introspection endpoint"""
        config = await self.get_well_known_config()
        introspection_url = config.get("introspection_endpoint")
        if not introspection_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Keycloak introspection endpoint not found"
            )

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    introspection_url,
                    data={
                        "token": token,
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    timeout=5.0
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Failed to introspect token: {e}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Keycloak introspection unavailable"
                )

    def extract_roles_from_token(self, payload: dict[str, Any]) -> list[str]:
        """
        Extract roles from Keycloak token payload
        Keycloak roles can be in different places:
        - realm_access.roles
        - resource_access.{client_id}.roles
        - roles (if client roles are mapped)
        """
        roles: list[str] = []

        # Realm roles
        realm_access = payload.get("realm_access", {})
        if isinstance(realm_access, dict):
            realm_roles = realm_access.get("roles", [])
            if isinstance(realm_roles, list):
                roles.extend(realm_roles)

        # Client roles
        resource_access = payload.get("resource_access", {})
        if isinstance(resource_access, dict):
            client_roles = resource_access.get(self.client_id, {}).get("roles", [])
            if isinstance(client_roles, list):
                roles.extend(client_roles)

        # Direct roles claim (if mapped)
        direct_roles = payload.get("roles", [])
        if isinstance(direct_roles, list):
            roles.extend(direct_roles)

        return list(set(roles))  # Remove duplicates


# Global Keycloak client instance
_keycloak_client: Optional[KeycloakClient] = None


def get_keycloak_client() -> KeycloakClient:
    """Get or create Keycloak client instance"""
    global _keycloak_client
    if _keycloak_client is None:
        _keycloak_client = KeycloakClient()
    return _keycloak_client

