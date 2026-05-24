"""drf-spectacular preprocessing and postprocessing hooks."""

from decouple import config

# Hostnames treated as template placeholders (not real deployments).
_PLACEHOLDER_HOST_PARTS = ('yourdomain.com', 'example.com', 'change-me')


def is_placeholder_site_url(url: str) -> bool:
    if not url or not str(url).strip():
        return True
    lower = str(url).lower()
    return any(part in lower for part in _PLACEHOLDER_HOST_PARTS)


def _dedupe_servers(servers):
    seen = set()
    unique = []
    for entry in servers:
        url = entry['url'].rstrip('/')
        if url in seen:
            continue
        seen.add(url)
        unique.append({**entry, 'url': url})
    return unique


def build_openapi_servers():
    """
    Static server list when schema is generated without an HTTP request (CLI).
    In DEBUG or when SITE_URL is a placeholder, local URLs are listed first.
    """
    debug = config('DEBUG', default='True', cast=bool)
    site = config('SITE_URL', default='').strip().rstrip('/')

    local = [
        {'url': 'http://127.0.0.1:8000', 'description': 'Local development (127.0.0.1)'},
        {'url': 'http://localhost:8000', 'description': 'Local development (localhost)'},
    ]

    if is_placeholder_site_url(site):
        return _dedupe_servers(local)

    configured = {'url': site, 'description': 'SITE_URL from .env'}
    if debug:
        return _dedupe_servers(local + [configured])
    return [configured]


def preprocess_exclude_admin(endpoints, **kwargs):
    """Keep OpenAPI focused on REST API routes."""
    return [
        (path, path_regex, method, callback)
        for path, path_regex, method, callback in endpoints
        if not path.startswith('/admin/')
    ]


def postprocess_schema_servers(result, generator, request, public, **kwargs):
    """
    Swagger "Try it out" must call the same host that serves /api/docs/.
    Never default to template URLs like https://yourdomain.com.
    """
    if request is not None:
        current = request.build_absolute_uri('/').rstrip('/')
        servers = [
            {'url': current, 'description': 'Current host (recommended for Try it out)'},
        ]
        site = config('SITE_URL', default='').strip().rstrip('/')
        if site and not is_placeholder_site_url(site) and site.rstrip('/') != current:
            servers.append({'url': site.rstrip('/'), 'description': 'SITE_URL from .env'})
    else:
        servers = build_openapi_servers()

    result['servers'] = _dedupe_servers(servers)
    return result
