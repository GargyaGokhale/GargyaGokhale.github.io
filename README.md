# GargyaGokhale.github.io
Personal Website

## How to Add a New Publication

1. Create a new folder under the `publications` directory with a descriptive name (format: `YEAR_short_title`).
   ```
   publications/
     ├── YEAR_short_title/
   ```

2. Create the following files in the new folder:
   - `bibtex.bib`: The BibTeX citation for your publication
   - `summary.md`: A markdown file with an overview and key contributions

3. Structure of `summary.md`:
   ```markdown
   # Title of Publication

   ## Overview
   Brief description of the research.

   ## Key Contributions
   - First contribution point
   - Second contribution point
   - etc.

   ## Resources (optional)
   - [Resource Name](url)
   - [Another Resource](url)
   ```

4. Update `publications/manifest.json` to include the new publication:
   ```json
   {
     "publications": [
       // ...existing publications...
       {
         "folder": "YEAR_short_title",
         "id": "citationKey",
         "featured": true/false
       }
     ]
   }
   ```
   - `folder`: The name of the folder you created
   - `id`: The citation key from your BibTeX file
   - `featured`: Set to `true` if you want to highlight this publication

5. Verification: Open the website and check that your publication appears in the Publications page.
