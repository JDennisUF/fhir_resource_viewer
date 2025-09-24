// Favorites Management System
class FavoritesManager {
    constructor() {
        this.storageKey = 'fhir-viewer-favorites';
        this.favorites = new Map();
        this.loadFavorites();
    }

    // Load favorites from localStorage
    loadFavorites() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const favoritesArray = JSON.parse(stored);
                this.favorites = new Map(favoritesArray);
            }
        } catch (error) {
            console.error('Failed to load favorites:', error);
            this.favorites = new Map();
        }
    }

    // Save favorites to localStorage
    saveFavorites() {
        try {
            const favoritesArray = Array.from(this.favorites.entries());
            localStorage.setItem(this.storageKey, JSON.stringify(favoritesArray));
        } catch (error) {
            console.error('Failed to save favorites:', error);
        }
    }

    // Add a resource to favorites
    addFavorite(resourceName, spec, type = 'resource', title = null) {
        const favoriteKey = `${spec}:${resourceName}`;
        const favorite = {
            name: resourceName,
            spec: spec,
            type: type,
            title: title || resourceName,
            dateAdded: new Date().toISOString()
        };
        
        this.favorites.set(favoriteKey, favorite);
        this.saveFavorites();
        this.updateFavoritesUI();
        
        return favorite;
    }

    // Remove a resource from favorites
    removeFavorite(resourceName, spec) {
        const favoriteKey = `${spec}:${resourceName}`;
        const removed = this.favorites.delete(favoriteKey);
        
        if (removed) {
            this.saveFavorites();
            this.updateFavoritesUI();
        }
        
        return removed;
    }

    // Check if a resource is favorited
    isFavorite(resourceName, spec) {
        const favoriteKey = `${spec}:${resourceName}`;
        return this.favorites.has(favoriteKey);
    }

    // Toggle favorite status
    toggleFavorite(resourceName, spec, type = 'resource', title = null) {
        if (this.isFavorite(resourceName, spec)) {
            this.removeFavorite(resourceName, spec);
            return false; // Removed
        } else {
            this.addFavorite(resourceName, spec, type, title);
            return true; // Added
        }
    }

    // Get all favorites
    getAllFavorites() {
        return Array.from(this.favorites.values());
    }

    // Get favorites by spec
    getFavoritesBySpec(spec) {
        return Array.from(this.favorites.values()).filter(fav => fav.spec === spec);
    }

    // Get favorites by type
    getFavoritesByType(type) {
        return Array.from(this.favorites.values()).filter(fav => fav.type === type);
    }

    // Get favorites count
    getFavoritesCount() {
        return this.favorites.size;
    }

    // Clear all favorites
    clearAllFavorites() {
        this.favorites.clear();
        this.saveFavorites();
        this.updateFavoritesUI();
    }

    // Export favorites
    exportFavorites() {
        const favorites = this.getAllFavorites();
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            favorites: favorites
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    // Import favorites
    importFavorites(jsonData) {
        try {
            const importData = JSON.parse(jsonData);
            if (importData.favorites && Array.isArray(importData.favorites)) {
                // Clear existing favorites
                this.favorites.clear();
                
                // Import new favorites
                importData.favorites.forEach(fav => {
                    const favoriteKey = `${fav.spec}:${fav.name}`;
                    this.favorites.set(favoriteKey, fav);
                });
                
                this.saveFavorites();
                this.updateFavoritesUI();
                return true;
            }
        } catch (error) {
            console.error('Failed to import favorites:', error);
        }
        return false;
    }

    // Update the favorites UI
    updateFavoritesUI() {
        this.renderFavoritesList();
        this.updateFavoriteButtons();
        this.updateFavoritesCount();
    }

    // Render the favorites list in the sidebar
    renderFavoritesList() {
        const favoritesContainer = document.getElementById('favoritesContainer');
        if (!favoritesContainer) return;

        const favorites = this.getAllFavorites();
        
        if (favorites.length === 0) {
            favoritesContainer.innerHTML = `
                <div class="no-favorites">
                    <p>No favorites yet</p>
                    <p class="favorites-hint">Click the ⭐ icon next to any resource to add it to your favorites.</p>
                </div>
            `;
            return;
        }

        const favoritesBySpec = {
            'fhir-r4': favorites.filter(fav => fav.spec === 'fhir-r4'),
            'us-core-stu6.1': favorites.filter(fav => fav.spec === 'us-core-stu6.1')
        };

        // Sort favorites alphabetically within each specification group
        favoritesBySpec['fhir-r4'].sort((a, b) => a.title.localeCompare(b.title));
        favoritesBySpec['us-core-stu6.1'].sort((a, b) => a.title.localeCompare(b.title));

        let html = '';

        // Render FHIR R4 favorites
        if (favoritesBySpec['fhir-r4'].length > 0) {
            html += `
                <div class="favorites-group">
                    <h4 class="favorites-group-title">🌐 FHIR R4</h4>
                    <div class="favorites-list">
                        ${favoritesBySpec['fhir-r4'].map(fav => this.renderFavoriteItem(fav)).join('')}
                    </div>
                </div>
            `;
        }

        // Render US Core favorites
        if (favoritesBySpec['us-core-stu6.1'].length > 0) {
            html += `
                <div class="favorites-group">
                    <h4 class="favorites-group-title">🇺🇸 US Core</h4>
                    <div class="favorites-list">
                        ${favoritesBySpec['us-core-stu6.1'].map(fav => this.renderFavoriteItem(fav)).join('')}
                    </div>
                </div>
            `;
        }

        favoritesContainer.innerHTML = html;
    }

    // Render individual favorite item
    renderFavoriteItem(favorite) {
        // Get proper icon using navigation manager's logic
        let icon = '📋'; // Default fallback
        if (window.app && window.app.navigationManager) {
            const resourceData = this.getResourceData(favorite.name, favorite.spec);
            if (resourceData) {
                icon = window.app.navigationManager.getResourceIcon(resourceData.type || 'resource', favorite.name);
            } else {
                // Fallback: try to get icon without resource data
                icon = window.app.navigationManager.getResourceIcon('resource', favorite.name);
            }
        }
        
        // Generate external documentation link
        let docLink = '';
        const cleanName = favorite.title || favorite.name;
        
        if (favorite.spec === 'us-core-stu6.1') {
            // US Core profile link
            if (window.app && window.app.navigationManager && window.app.navigationManager.usCoreLinks) {
                if (window.app.navigationManager.usCoreLinks.hasProfileLink(cleanName)) {
                    const linkUrl = window.app.navigationManager.usCoreLinks.getProfileLink(cleanName);
                    docLink = `<a href="${linkUrl}" target="_blank" class="doc-link" title="View ${cleanName} official US Core documentation" onclick="event.stopPropagation();">🔥</a>`;
                }
            }
        } else if (favorite.spec === 'fhir-r4') {
            // FHIR R4 resource or datatype link
            if (window.app && window.app.navigationManager && window.app.navigationManager.fhirR4Links) {
                const resourceData = this.getResourceData(favorite.name, favorite.spec);
                if (resourceData && resourceData.type === 'datatype') {
                    // Data type icon
                    if (window.app.navigationManager.fhirR4Links.hasResourceLink(cleanName, 'datatype')) {
                        const linkUrl = window.app.navigationManager.fhirR4Links.getResourceLink(cleanName, 'datatype');
                        docLink = `<a href="${linkUrl}" target="_blank" class="doc-link datatype-link" title="View ${cleanName} official FHIR R4 data type documentation" onclick="event.stopPropagation();">🔡</a>`;
                    }
                } else {
                    // Fire icon for resources (or when we can't determine type)
                    if (window.app.navigationManager.fhirR4Links.hasResourceLink(cleanName, 'resource')) {
                        const linkUrl = window.app.navigationManager.fhirR4Links.getResourceLink(cleanName, 'resource');
                        docLink = `<a href="${linkUrl}" target="_blank" class="doc-link" title="View ${cleanName} official FHIR R4 documentation" onclick="event.stopPropagation();">🔥</a>`;
                    }
                }
            }
        }
        
        return `
            <div class="favorite-item" data-resource="${favorite.name}" data-spec="${favorite.spec}">
                <div class="favorite-content" onclick="app.selectResource('${favorite.name}', '${favorite.spec}')">
                    <span class="favorite-icon">${icon}</span>
                    <span class="favorite-name">${this.escapeHtml(favorite.title)}</span>
                    ${docLink}
                </div>
                <button class="favorite-remove" onclick="window.favoritesManager.removeFavorite('${favorite.name}', '${favorite.spec}')" title="Remove from favorites">
                    ✕
                </button>
            </div>
        `;
    }

    // Update favorite star buttons throughout the UI
    updateFavoriteButtons() {
        const favoriteButtons = document.querySelectorAll('.favorite-button');
        favoriteButtons.forEach(button => {
            const resourceName = button.getAttribute('data-resource');
            const spec = button.getAttribute('data-spec');
            
            if (resourceName && spec) {
                const isFavorited = this.isFavorite(resourceName, spec);
                button.classList.toggle('favorited', isFavorited);
                button.textContent = isFavorited ? '⭐' : '☆';
                button.title = isFavorited ? 'Remove from favorites' : 'Add to favorites';
            }
        });
    }

    // Update favorites count in UI
    updateFavoritesCount() {
        const countElement = document.getElementById('favoritesCount');
        if (countElement) {
            const count = this.getFavoritesCount();
            countElement.textContent = count;
            countElement.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    // Helper to get resource data from the app's loaded data
    getResourceData(resourceName, spec) {
        if (window.app && window.app.fhirData && window.app.fhirData[spec] && window.app.fhirData[spec][resourceName]) {
            return window.app.fhirData[spec][resourceName];
        }
        return null;
    }

    // Utility function to escape HTML
    escapeHtml(text) {
        if (typeof text !== 'string') return text;
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Make it available globally
window.FavoritesManager = FavoritesManager;