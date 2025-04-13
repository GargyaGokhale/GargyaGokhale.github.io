/**
 * BibTeX Parser
 * Parses BibTeX entries and extracts publication information
 */

class BibtexParser {
    constructor() {
        // Regular expressions for markdown parsing
        this.mdHeaderRegex = /^#+\s+(.*?)$/;
        this.mdSubHeaderRegex = /^##\s+(.*?)$/;
        this.mdListItemRegex = /^-\s+(.*?)$/;
        this.mdLinkRegex = /\[(.*?)\]\((.*?)\)/;
        
        // Debug flag
        this.debug = true;
    }

    /**
     * Parse BibTeX string into publication objects
     * @param {string} bibtexString - BibTeX string to parse
     * @return {Array} Array of parsed publication objects
     */
    parse(bibtexString) {
        if (!bibtexString) return [];
        
        if (this.debug) console.log("Original BibTeX string:", bibtexString);
        
        // Remove comment lines and normalize whitespace
        bibtexString = bibtexString.split('\n')
            .filter(line => !line.trim().startsWith('//'))
            .join('\n');
        
        if (this.debug) console.log("BibTeX string after comment removal:", bibtexString);
        
        // Find the starting position of the entry
        const entryStart = bibtexString.indexOf('@');
        if (entryStart === -1) {
            console.error("No BibTeX entry found");
            return [];
        }
        
        // Parse entry type and citation key
        const typeMatch = /@(\w+)\s*\{([^,]*),/.exec(bibtexString);
        if (!typeMatch) {
            console.error("Could not parse entry type and citation key");
            return [];
        }
        
        const entryType = typeMatch[1].toLowerCase();
        const citationKey = typeMatch[2].trim();
        
        if (this.debug) {
            console.log("Entry type:", entryType);
            console.log("Citation key:", citationKey);
        }
        
        // Create publication object
        const publication = {
            entryType,
            citationKey,
            rawBibtex: bibtexString
        };
        
        // Manual parsing of fields using string operations
        let content = bibtexString.substring(bibtexString.indexOf(',') + 1);
        
        // Split the content by field
        const fieldLines = content.split(/,\s*\n\s*/);
        
        fieldLines.forEach(line => {
            line = line.trim();
            if (!line || line === '}') return; // Skip empty lines and closing brace
            
            // Find the field name (before the equals sign)
            const equalsPos = line.indexOf('=');
            if (equalsPos === -1) return;
            
            const fieldName = line.substring(0, equalsPos).trim().toLowerCase();
            
            // Find the field value (between braces)
            let fieldValue = '';
            let valueStart = line.indexOf('{', equalsPos);
            if (valueStart === -1) return;
            
            // Find the matching closing brace, handling nested braces
            let braceCount = 1;
            let valueEnd = -1;
            for (let i = valueStart + 1; i < line.length; i++) {
                if (line[i] === '{') braceCount++;
                else if (line[i] === '}') braceCount--;
                
                if (braceCount === 0) {
                    valueEnd = i;
                    break;
                }
            }
            
            if (valueEnd === -1) {
                // If we didn't find a closing brace on this line, it's likely 
                // a multi-line value. For now, just take the rest of the line.
                fieldValue = line.substring(valueStart + 1).trim();
                
                // Remove trailing closing brace if present
                if (fieldValue.endsWith('}')) {
                    fieldValue = fieldValue.substring(0, fieldValue.length - 1);
                }
            } else {
                fieldValue = line.substring(valueStart + 1, valueEnd).trim();
            }
            
            if (this.debug) console.log(`Field found: ${fieldName} = ${fieldValue}`);
            
            // Special handling for links field which contains multiple URLs
            if (fieldName === 'links') {
                publication.links = {};
                
                // Extract each link with simpler method
                const linkParts = fieldValue.split(',');
                linkParts.forEach(part => {
                    const trimmed = part.trim();
                    const colonPos = trimmed.indexOf(':');
                    if (colonPos > 0) {
                        const linkType = trimmed.substring(0, colonPos).trim();
                        const linkUrl = trimmed.substring(colonPos + 1).trim();
                        if (this.debug) console.log(`Link found: ${linkType} -> ${linkUrl}`);
                        publication.links[linkType] = linkUrl;
                    }
                });
            } 
            // Handle url field (used in many BibTeX entries)
            else if (fieldName === 'url') {
                if (!publication.links) publication.links = {};
                publication.links.url = fieldValue;
                if (this.debug) console.log(`URL found: ${fieldValue}`);
                
                // If no journal or PDF link is specified yet, use this URL for those links as well
                if (!publication.links.journal) publication.links.journal = fieldValue;
                if (!publication.links.pdf) publication.links.pdf = fieldValue;
            }
            else {
                publication[fieldName] = fieldValue;
            }
        });
        
        // Determine publication type (journal, conference, preprint)
        if (!publication.type) {
            if (entryType === 'article') publication.type = 'journal';
            else if (entryType === 'inproceedings' || entryType === 'conference') publication.type = 'conference';
            else if (entryType === 'techreport' || entryType === 'unpublished') publication.type = 'preprint';
            else publication.type = 'other';
        }
        
        if (this.debug) console.log("Final publication object:", publication);
        return [publication];
    }
    
    /**
     * Parse markdown summary file into an object
     * @param {string} markdownString - Markdown string to parse
     * @return {Object} Object containing parsed markdown data
     */
    parseSummary(markdownString) {
        if (!markdownString) return {};
        
        console.log("Original markdown string:", markdownString);
        
        // Remove comment lines (lines starting with //)
        markdownString = markdownString.split('\n')
            .filter(line => !line.trim().startsWith('//'))
            .join('\n');
        
        console.log("Markdown after comment removal:", markdownString);
        
        // Split the markdown into lines
        const lines = markdownString.split('\n').map(line => line.trim()).filter(Boolean);
        const result = {
            title: '',
            sections: {},
            resources: []
        };
        
        let currentSection = null;
        let sectionContent = [];
        
        // Process each line
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            console.log(`Processing line: '${line}'`);
            
            // Check if line is a main header (title)
            const titleMatch = line.match(this.mdHeaderRegex);
            if (titleMatch && !result.title) {
                result.title = titleMatch[1];
                console.log(`Found title: ${result.title}`);
                continue;
            }
            
            // Check if line is a section header
            const sectionMatch = line.match(this.mdSubHeaderRegex);
            if (sectionMatch) {
                // Save previous section if exists
                if (currentSection && sectionContent.length > 0) {
                    result.sections[currentSection.toLowerCase()] = sectionContent;
                    console.log(`Saved section '${currentSection}' with content:`, sectionContent);
                }
                
                // Start new section
                currentSection = sectionMatch[1];
                console.log(`Starting new section: '${currentSection}'`);
                sectionContent = [];
                continue;
            }
            
            // Check if line is a list item
            const listItemMatch = line.match(this.mdListItemRegex);
            if (listItemMatch) {
                const itemContent = listItemMatch[1];
                console.log(`Found list item: ${itemContent}`);
                
                // Check if this is in a Resources section
                if (currentSection && currentSection.toLowerCase() === 'resources') {
                    // Parse links in resources section
                    const linkMatch = itemContent.match(this.mdLinkRegex);
                    if (linkMatch) {
                        const resource = {
                            title: linkMatch[1],
                            url: linkMatch[2]
                        };
                        console.log(`Found resource: ${resource.title} -> ${resource.url}`);
                        result.resources.push(resource);
                    } else {
                        sectionContent.push(itemContent);
                    }
                } else {
                    // Regular list item in another section
                    sectionContent.push(itemContent);
                }
                continue;
            }
            
            // Add line to current section content
            if (currentSection) {
                sectionContent.push(line);
                console.log(`Added line to section '${currentSection}': ${line}`);
            } else {
                console.log(`Skipping line as no section is active: ${line}`);
            }
        }
        
        // Save the last section if exists
        if (currentSection && sectionContent.length > 0) {
            result.sections[currentSection.toLowerCase()] = sectionContent;
            console.log(`Saved final section '${currentSection}' with content:`, sectionContent);
        }
        
        console.log("Final parsed summary:", result);
        return result;
    }
    
    /**
     * Format authors string for display
     * @param {string} authors - Raw author string from BibTeX
     * @return {string} Formatted author string
     */
    static formatAuthors(authors) {
        if (!authors) return '';
        
        return authors
            .split(' and ')
            .map(author => {
                const parts = author.split(',');
                if (parts.length > 1) {
                    // Last name, First name format
                    return `${parts[1].trim()} ${parts[0].trim()}`;
                }
                return author.trim();
            })
            .join(', ');
    }
    
    /**
     * Generate formatted citation
     * @param {Object} publication - Parsed publication object
     * @return {string} APA-style citation
     */
    static generateCitation(publication) {
        const authors = this.formatAuthorsForCitation(publication.author);
        const title = publication.title;
        const journal = publication.journal || publication.booktitle || publication.publisher || '';
        const year = publication.year || '';
        const volume = publication.volume ? `Volume ${publication.volume}` : '';
        const number = publication.number ? `(${publication.number})` : '';
        const pages = publication.pages ? `pp. ${publication.pages}` : '';
        
        return `${authors} (${year}). ${title}. ${journal} ${volume} ${number} ${pages}`.trim().replace(/\s+/g, ' ');
    }
    
    /**
     * Format authors for citation
     * @param {string} authors - Raw author string from BibTeX
     * @return {string} Formatted author string for citation
     */
    static formatAuthorsForCitation(authors) {
        if (!authors) return '';
        
        const authorList = authors.split(' and ');
        
        if (authorList.length === 1) {
            return this.formatSingleAuthor(authorList[0]);
        } else if (authorList.length === 2) {
            return `${this.formatSingleAuthor(authorList[0])} & ${this.formatSingleAuthor(authorList[1])}`;
        } else {
            return `${this.formatSingleAuthor(authorList[0])} et al.`;
        }
    }
    
    /**
     * Format a single author for citation
     * @param {string} author - Single author string
     * @return {string} Formatted author string
     */
    static formatSingleAuthor(author) {
        const parts = author.split(',');
        if (parts.length > 1) {
            // Last name, First name format -> Last name, Initial.
            const lastName = parts[0].trim();
            const firstNameParts = parts[1].trim().split(' ');
            const initials = firstNameParts.map(p => `${p.charAt(0)}.`).join(' ');
            return `${lastName}, ${initials}`;
        }
        // First name Last name format -> Last name, Initial.
        const nameParts = author.trim().split(' ');
        const lastName = nameParts.pop();
        const initials = nameParts.map(p => `${p.charAt(0)}.`).join(' ');
        return `${lastName}, ${initials}`;
    }
}

// Make the parser available globally
window.BibtexParser = BibtexParser;
