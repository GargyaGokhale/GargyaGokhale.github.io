/**
 * Publications Loader
 * Dynamically loads publication data from the publications directory structure
 * and renders publication cards on the page
 */

document.addEventListener('DOMContentLoaded', function() {
    loadPublications();
});

/**
 * Load publication data from the folder structure
 */
async function loadPublications() {
    try {
        console.log("Starting to load publications...");
        // Fetch publication metadata from a manifest file that lists all publications
        const response = await fetch('publications/manifest.json');
        if (!response.ok) {
            throw new Error('Failed to load publications manifest');
        }
        
        const manifest = await response.json();
        console.log("Manifest loaded:", manifest);
        
        const publicationPromises = manifest.publications.map(loadPublicationData);
        
        // Wait for all publication data to be loaded
        const publications = await Promise.all(publicationPromises);
        console.log("Publications loaded:", publications);
        
        // Filter out any nulls (failed loads)
        const validPublications = publications.filter(pub => pub !== null);
        console.log("Valid publications:", validPublications);
        
        // Hide the loading indicator
        document.querySelector('.loading-indicator').style.display = 'none';
        
        // Render the publications
        renderPublications(validPublications);
        
        // Initialize filters and other UI functionality
        initializePublicationFilters();
    } catch (error) {
        console.error('Error loading publications:', error);
        document.querySelector('.publication-grid').innerHTML = 
            '<div class="error-message">Failed to load publications. Please try again later.</div>';
    }
}

/**
 * Load data for a single publication from a folder
 * @param {Object} pubInfo - Publication info from manifest
 * @return {Promise<Object>} Publication data with BibTeX and markdown parsed
 */
async function loadPublicationData(pubInfo) {
    const folder = pubInfo.folder;
    const publicationData = {
        folder: folder,
        id: pubInfo.id || '',
        featured: pubInfo.featured || false
    };
    
    try {
        // 1. Load BibTeX file
        const bibtexResponse = await fetch(`publications/${folder}/bibtex.bib`);
        if (!bibtexResponse.ok) {
            throw new Error(`Failed to load BibTeX for ${folder}`);
        }
        
        const bibtexText = await bibtexResponse.text();
        const parser = new BibtexParser();
        const parsedPublications = parser.parse(bibtexText);
        
        if (parsedPublications.length === 0) {
            throw new Error(`No valid BibTeX entries found for ${folder}`);
        }
        
        // Merge BibTeX data with publication data (abstract/links come from the manifest)
        Object.assign(publicationData, parsedPublications[0], pubInfo);

        return publicationData;
    } catch (error) {
        console.error(`Error loading publication ${folder}:`, error);
        return null;
    }
}

/**
 * Render publication cards on the page
 * @param {Array} publications - Array of publication data objects
 */
function renderPublications(publications) {
    const publicationGrid = document.querySelector('.publication-grid');
    
    if (publications.length === 0) {
        publicationGrid.innerHTML = '<div class="empty-state">No publications found.</div>';
        return;
    }
    
    // Sort by year (newest first)
    publications.sort((a, b) => {
        return parseInt(b.year || 0) - parseInt(a.year || 0);
    });
    
    // Render each publication card
    const cards = publications.map(pub => {
        const card = createPublicationCard(pub);
        publicationGrid.appendChild(card);
        return card;
    });

    // Reveal cards (they start hidden via animations.js); done on the next
    // frame so the fade-in transition plays for dynamically added cards.
    requestAnimationFrame(() => cards.forEach(card => card.classList.add('visible')));
}

/**
 * Create a publication card DOM element
 * @param {Object} publication - Publication data
 * @return {HTMLElement} Publication card element
 */
function createPublicationCard(publication) {
    const card = document.createElement('div');
    card.className = 'publication-card section-card';
    card.setAttribute('data-type', publication.type || 'other');
    
    // Format publication type for display
    let pubTypeDisplay = publication.type || 'Other';
    pubTypeDisplay = pubTypeDisplay.charAt(0).toUpperCase() + pubTypeDisplay.slice(1);
    
    // Format authors for display
    const authors = BibtexParser.formatAuthors(publication.author || '');
    
    // Create venue with icon based on type
    let venueIcon = 'fa-file-text-o';
    if (publication.type === 'journal') venueIcon = 'fa-book';
    else if (publication.type === 'conference') venueIcon = 'fa-microphone';
    
    const venue = publication.journal || publication.booktitle || publication.publisher || publication.school || 'Unknown Venue';

    // Resolve links: DOI (original page), arXiv, and direct PDF
    const doiLink = publication.doi || publication.links?.journal || '';
    const arxivLink = publication.arxiv || '';
    const pdfLink = publication.pdf || '';

    // Build abstract text
    const abstractText = publication.abstract || 'No abstract available';

    // Action buttons in order: DOI, arXiv, PDF, BibTeX
    const actionButtons = [
        doiLink && `<a href="${doiLink}" class="pub-btn primary" target="_blank" rel="noopener noreferrer"><i class="fa fa-external-link"></i><span class="btn-tooltip">DOI</span></a>`,
        arxivLink && `<a href="${arxivLink}" class="pub-btn" target="_blank" rel="noopener noreferrer"><i class="fa fa-file-text-o"></i><span class="btn-tooltip">arXiv</span></a>`,
        pdfLink && `<a href="${pdfLink}" class="pub-btn" target="_blank" rel="noopener noreferrer"><i class="fa fa-file-pdf-o"></i><span class="btn-tooltip">PDF</span></a>`,
        `<a href="#" class="pub-btn copy-bibtex" data-bibtex="${encodeURIComponent(publication.rawBibtex || '')}"><i class="fa fa-quote-right"></i><span class="btn-tooltip">Copy BibTeX</span></a>`
    ].filter(Boolean).join('');

    // Build HTML for the card
    card.innerHTML = `
        <div class="pub-top">
            <span class="pub-year">${publication.year || 'Unknown Year'}</span>
            <span class="pub-type ${publication.type || 'other'}">${pubTypeDisplay}</span>
        </div>
        <h3 class="pub-title">${publication.title || 'Untitled Publication'}</h3>
        <p class="pub-authors">${authors}</p>
        <p class="pub-venue"><i class="fa ${venueIcon}"></i> ${venue}</p>
        <div class="pub-abstract">
            <p>${abstractText}</p>
            <div class="abstract-overlay"></div>
        </div>
        <button class="read-more-btn">
            <i class="fa fa-chevron-down"></i>
        </button>
        <div class="pub-actions">
            ${actionButtons}
        </div>
    `;

    // Clicking the card (outside of buttons/links) opens the original DOI page
    if (doiLink) {
        card.classList.add('clickable');
        card.addEventListener('click', function(e) {
            if (e.target.closest('a, button')) return;
            window.open(doiLink, '_blank', 'noopener');
        });
    }

    // Add event listener for Read More button
    const readMoreBtn = card.querySelector('.read-more-btn');
    readMoreBtn.addEventListener('click', function() {
        card.classList.toggle('expanded');
        if (card.classList.contains('expanded')) {
            this.innerHTML = '<i class="fa fa-chevron-up"></i>';
        } else {
            this.innerHTML = '<i class="fa fa-chevron-down"></i>';
            // Scroll back to the top of the card if it's collapsed
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
    
    // Add event listeners for copy buttons
    setupCopyButtons(card);
    
    return card;
}

/**
 * Set up event listeners for copy buttons
 * @param {HTMLElement} card - Publication card element
 */
function setupCopyButtons(card) {
    // BibTeX copy
    card.querySelector('.copy-bibtex').addEventListener('click', function(e) {
        e.preventDefault();
        const bibtex = decodeURIComponent(this.getAttribute('data-bibtex'));
        copyToClipboard(bibtex, 'BibTeX copied to clipboard!');
    });
}

/**
 * Copy text to clipboard and show notification
 * @param {string} text - Text to copy
 * @param {string} message - Notification message
 */
function copyToClipboard(text, message) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(message);
    }).catch(err => {
        console.error('Could not copy text: ', err);
        showToast('Failed to copy to clipboard');
    });
}

/**
 * Show a toast notification
 * @param {string} message - Message to show
 */
function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Show and then hide toast
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }, 10);
}

/**
 * Initialize publication filter controls
 */
function initializePublicationFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const publicationCards = document.querySelectorAll('.publication-card');
    
    // Filter publications
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            const filterValue = button.getAttribute('data-filter');
            
            publicationCards.forEach(card => {
                if (filterValue === 'all' || card.getAttribute('data-type') === filterValue) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
    
    // Citation dropdown functionality
    setupDropdowns();
}

/**
 * Set up dropdown controls
 */
function setupDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-toggle');
    let activeDropdown = null;
    
    // Close any open dropdowns
    function closeDropdowns() {
        document.querySelectorAll('.dropdown-content').forEach(content => {
            content.classList.remove('show');
        });
        activeDropdown = null;
    }
    
    // Toggle dropdown
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const dropdownContent = dropdown.nextElementSibling;
            
            // If this dropdown is already active, close it
            if (activeDropdown === dropdownContent) {
                closeDropdowns();
                return;
            }
            
            // Close any open dropdown
            closeDropdowns();
            
            // Open this dropdown
            dropdownContent.classList.add('show');
            activeDropdown = dropdownContent;
        });
    });
    
    // Close dropdowns when clicking elsewhere
    document.addEventListener('click', () => {
        closeDropdowns();
    });
}
