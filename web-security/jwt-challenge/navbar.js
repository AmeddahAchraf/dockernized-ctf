// utils/navbar.js
const fs = require('fs');
const path = require('path');

class NavbarRenderer {
    constructor(templatePath) {
        this.templatePath = templatePath;
        this.template = null;
        this.loadTemplate();
    }

    loadTemplate() {
        try {
            this.template = fs.readFileSync(this.templatePath, 'utf8');
        } catch (error) {
            console.error('Error loading navbar template:', error);
            this.template = '<nav>Navigation not available</nav>';
        }
    }

    render(activeItem = '') {
        let navbar = this.template;

        // Remove all active classes first
        navbar = navbar.replace(/class="nav-\w+ active"/g, (match) => {
            return match.replace(' active', '');
        });

        // Add active class to current page
        if (activeItem) {
            navbar = navbar.replace(`class="nav-${activeItem}"`, `class="nav-${activeItem} active"`);
        }

        return navbar;
    }

    // Method to reload template (useful for development)
    reload() {
        this.loadTemplate();
    }
}

// Create singleton instance
const navbarRenderer = new NavbarRenderer(path.join(__dirname, '..', 'navbar.html'));

// Export both class and instance
module.exports = {
    NavbarRenderer,
    getNavbar: (activeItem) => navbarRenderer.render(activeItem),
    reloadNavbar: () => navbarRenderer.reload()
};