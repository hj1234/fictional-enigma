/**
 * ContentLoader - Fetches game content from the backend API
 */

// Use environment variable for API URL, fallback to localhost
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Cache for content (cleared on page reload)
let _cache = null;
let _cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class ContentLoader {
  static async loadFlavorText() {
    try {
      const response = await fetch(`${API_BASE}/api/content/flavor`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Extract text from objects, filter active items
      return data
        .filter(item => item.active !== false)
        .map(item => typeof item === 'string' ? item : item.text);
    } catch (error) {
      console.warn('Failed to load flavor text from API, using defaults', error);
      // Fallback to hardcoded defaults
      return [
        "Analyst spotted crying in the bathroom.",
        "Compliance officer is asking about your WhatsApps.",
        "Your star trader wants a bigger bonus.",
        "ZeroHedge tweeted about your positions.",
        "The coffee machine is broken. Morale -10.",
        "A junior analyst sent an Excel sheet with hardcoded values.",
        "The printer is out of toner. The deal is stalled."
      ];
    }
  }

  static async loadRecruitmentData() {
    try {
      const response = await fetch(`${API_BASE}/api/content/recruitment`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        specialisms: data.specialisms || {},
        names_first: data.names_first || [],
        names_last: data.names_last || [],
        bios: data.bios || []
      };
    } catch (error) {
      console.warn('Failed to load recruitment data from API, using defaults', error);
      // Return null to use defaults in Recruitment.js
      return null;
    }
  }

  static async loadNewsTemplates() {
    try {
      const response = await fetch(`${API_BASE}/api/content/news`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Filter active items
      return data.filter(item => item.active !== false);
    } catch (error) {
      console.warn('Failed to load news templates from API, using defaults', error);
      // Return null to use defaults in NewsWire.js
      return null;
    }
  }

  static async loadAll() {
    // Check cache
    const now = Date.now();
    if (_cache && _cacheTimestamp && (now - _cacheTimestamp) < CACHE_DURATION) {
      return _cache;
    }

    try {
      const [flavorText, recruitmentData, newsTemplates] = await Promise.all([
        this.loadFlavorText(),
        this.loadRecruitmentData(),
        this.loadNewsTemplates()
      ]);
      
      const result = {
        flavorText,
        recruitmentData,
        newsTemplates
      };

      // Cache the result
      _cache = result;
      _cacheTimestamp = now;

      return result;
    } catch (error) {
      console.error('Failed to load content:', error);
      // Return empty object to trigger fallback to defaults
      return {
        flavorText: null,
        recruitmentData: null,
        newsTemplates: null
      };
    }
  }

  static clearCache() {
    _cache = null;
    _cacheTimestamp = null;
  }
}

