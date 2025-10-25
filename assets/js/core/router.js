/**
 * Router - Client-side routing and navigation
 * Handles page navigation without full page reloads
 */

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.basePath = '';
        this.notFoundHandler = null;
        this.beforeNavigate = null;
        this.afterNavigate = null;

        this.init();
    }

    /**
     * Initialize router
     */
    init() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            this.handlePopState(event);
        });

        // Intercept link clicks
        document.addEventListener('click', (event) => {
            this.handleLinkClick(event);
        });

        // Load initial route
        this.loadRoute(window.location.pathname + window.location.search);
    }

    /**
     * Register a route
     */
    route(path, handler, options = {}) {
        const route = {
            path: path,
            handler: handler,
            pattern: this.pathToRegex(path),
            options: options
        };

        this.routes.set(path, route);
        return this;
    }

    /**
     * Navigate to a path
     */
    navigate(path, options = {}) {
        const { replace = false, state = {} } = options;

        // Call beforeNavigate hook
        if (this.beforeNavigate) {
            const result = this.beforeNavigate(path, this.currentRoute);
            if (result === false) {
                return; // Navigation cancelled
            }
        }

        // Update browser history
        if (replace) {
            window.history.replaceState(state, '', this.basePath + path);
        } else {
            window.history.pushState(state, '', this.basePath + path);
        }

        // Load the route
        this.loadRoute(path, state);

        // Call afterNavigate hook
        if (this.afterNavigate) {
            this.afterNavigate(path, this.currentRoute);
        }
    }

    /**
     * Go back in history
     */
    back() {
        window.history.back();
    }

    /**
     * Go forward in history
     */
    forward() {
        window.history.forward();
    }

    /**
     * Reload current route
     */
    reload() {
        this.loadRoute(window.location.pathname + window.location.search);
    }

    /**
     * Load a route
     */
    loadRoute(path, state = {}) {
        // Remove base path if present
        if (path.startsWith(this.basePath)) {
            path = path.substring(this.basePath.length);
        }

        // Find matching route
        let matchedRoute = null;
        let params = {};

        for (const [routePath, route] of this.routes) {
            const match = path.match(route.pattern);
            if (match) {
                matchedRoute = route;
                params = this.extractParams(route.path, match);
                break;
            }
        }

        if (matchedRoute) {
            // Execute route handler
            this.currentRoute = {
                path: path,
                params: params,
                query: this.parseQuery(window.location.search),
                state: state
            };

            matchedRoute.handler(this.currentRoute);
        } else {
            // Route not found
            this.handleNotFound(path);
        }
    }

    /**
     * Handle popstate event (back/forward)
     */
    handlePopState(event) {
        const path = window.location.pathname + window.location.search;
        this.loadRoute(path, event.state || {});
    }

    /**
     * Handle link clicks
     */
    handleLinkClick(event) {
        // Check if it's a link click
        const link = event.target.closest('a');
        if (!link) return;

        // Check if it's an internal link
        const href = link.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('//') || href.startsWith('#')) {
            return;
        }

        // Check if it should be handled by router
        if (link.getAttribute('data-router') === 'false') {
            return;
        }

        // Prevent default and navigate
        event.preventDefault();
        this.navigate(href);
    }

    /**
     * Convert path to regex pattern
     */
    pathToRegex(path) {
        // Convert :param to named capture group
        const pattern = path
            .replace(/\//g, '\\/')
            .replace(/:(\w+)/g, '(?<$1>[^/]+)')
            .replace(/\*/g, '.*');

        return new RegExp(`^${pattern}$`);
    }

    /**
     * Extract params from matched route
     */
    extractParams(path, match) {
        const params = {};
        const paramNames = path.match(/:(\w+)/g);

        if (paramNames && match.groups) {
            paramNames.forEach(param => {
                const name = param.substring(1);
                params[name] = match.groups[name];
            });
        }

        return params;
    }

    /**
     * Parse query string
     */
    parseQuery(queryString) {
        const query = {};
        if (!queryString) return query;

        const params = new URLSearchParams(queryString);
        for (const [key, value] of params) {
            query[key] = value;
        }

        return query;
    }

    /**
     * Handle 404 - Route not found
     */
    handleNotFound(path) {
        if (this.notFoundHandler) {
            this.notFoundHandler(path);
        } else {
            console.warn(`Route not found: ${path}`);
        }
    }

    /**
     * Set 404 handler
     */
    notFound(handler) {
        this.notFoundHandler = handler;
        return this;
    }

    /**
     * Set before navigate hook
     */
    before(handler) {
        this.beforeNavigate = handler;
        return this;
    }

    /**
     * Set after navigate hook
     */
    after(handler) {
        this.afterNavigate = handler;
        return this;
    }

    /**
     * Set base path
     */
    setBasePath(path) {
        this.basePath = path;
        return this;
    }

    /**
     * Get current route
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Check if path matches current route
     */
    isActive(path) {
        return this.currentRoute && this.currentRoute.path === path;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Router;
}
