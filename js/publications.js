/* filepath: /Users/gargyagokhale/github/GargyaGokhale.github.io/js/publications.js */
// Publication-specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Publication filter functionality
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
    
    // BibTeX functionality
    document.querySelectorAll('.copy-bibtex').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get publication details
            const card = link.closest('.publication-card');
            const title = card.querySelector('.pub-title').textContent;
            const authors = card.querySelector('.pub-authors').textContent;
            const venue = card.querySelector('.pub-venue').textContent.replace(/^\s*[^\s]+\s*/, '');
            const year = card.querySelector('.pub-year').textContent;
            
            // Create author surname for key
            const authorSurname = authors.split(',')[0].trim().split(' ').pop();
            const bibtexKey = `${authorSurname}${year}`;
            
            // Generate BibTeX
            const bibtex = `@article{${bibtexKey},
  title={${title}},
  author={${authors}},
  journal={${venue}},
  year={${year}}
}`;
            
            // Copy to clipboard and show feedback
            navigator.clipboard.writeText(bibtex).then(() => {
                // Create toast notification
                const toast = document.createElement('div');
                toast.className = 'toast';
                toast.textContent = 'BibTeX copied to clipboard!';
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
            });
            
            // Close dropdown after copying
            closeDropdowns();
        });
    });
    
    // APA Citation functionality
    document.querySelectorAll('.copy-citation').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get publication details
            const card = link.closest('.publication-card');
            const title = card.querySelector('.pub-title').textContent;
            const authors = card.querySelector('.pub-authors').textContent;
            const venue = card.querySelector('.pub-venue').textContent.replace(/^\s*[^\s]+\s*/, '');
            const year = card.querySelector('.pub-year').textContent;
            
            // Format authors for APA
            const authorsList = authors.split(', ');
            let apaAuthors = '';
            
            if (authorsList.length === 1) {
                apaAuthors = authorsList[0];
            } else if (authorsList.length === 2) {
                apaAuthors = `${authorsList[0]} & ${authorsList[1]}`;
            } else {
                apaAuthors = `${authorsList[0]} et al.`;
            }
            
            // Generate APA citation
            const apaCitation = `${apaAuthors} (${year}). ${title}. ${venue}.`;
            
            // Copy to clipboard and show feedback
            navigator.clipboard.writeText(apaCitation).then(() => {
                const toast = document.createElement('div');
                toast.className = 'toast';
                toast.textContent = 'APA citation copied to clipboard!';
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.classList.add('show');
                    setTimeout(() => {
                        toast.classList.remove('show');
                        setTimeout(() => {
                            document.body.removeChild(toast);
                        }, 300);
                    }, 2000);
                }, 10);
            });
            
            // Close dropdown after copying
            closeDropdowns();
        });
    });
});