"""Shared test environment initialized before application modules are imported."""

import os


os.environ["ADMIN_BOOTSTRAP_PASSWORD"] = "Test-only-admin-password-2026"
os.environ["DISABLE_AUTH"] = "false"
