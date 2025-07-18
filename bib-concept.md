# Concept: Single-File BibTeX Manager

This document outlines the concept and a step-by-step guide for creating a bibliography manager that runs entirely within a single HTML file.

## 1. Overview

The goal is to build a simple yet powerful bibliography manager that allows a user to open a local `.bib` file in their browser to filter, sort, view, and edit entries. The entire application will be self-contained in one `.html` file, requiring no installation or backend server.

### Core Principles
- **Portability:** A single HTML file that can be opened in any modern web browser.
- **No Installation:** No dependencies to install (like Node.js, Python, etc.). Any required libraries will be loaded from a public CDN.
- **Client-Side Only:** All logic runs in the user's browser. No data is sent to a server.
- **Local File Operation:** The user explicitly opens and saves the `.bib` file from their local machine.

## 2. Key Challenges & Proposed Solutions

| Challenge | Solution |
| :--- | :--- |
| **Reading a Local File** | Use a standard HTML `<input type="file">` element. The user will select their `.bib` file, and JavaScript will read its content using the FileReader API. |
| **Saving Changes** | Prioritize the **File System Access API** for direct file saving. If the API is unavailable or permission is denied, fall back to the traditional method of triggering a file download, which the user must save manually. |
| **BibTeX Parsing** | Build a **custom BibTeX parser** in vanilla JavaScript. The parser will be designed to handle common BibTeX features, including entries (`@article`, etc.), comments (which will be ignored), string variables (`@string`), and cross-references (`crossref`). This avoids external dependencies. |
| **UI & State Management**| The UI will be built with **vanilla JavaScript** to manipulate the DOM directly. This honors the "no-dependency" spirit and is sufficient for the proposed feature set. The application state (the array of bibliography entries) will be held in a simple JavaScript variable. |

## 3. Implementation Status & Guide

| Step | Status | Description |
| :--- | :--- | :--- |
| **1. HTML Structure** | ✅ Completed | The base `index.html` file with all required UI containers is created. |
| **2. CSS Styling** | ✅ Completed | A clean, modern, two-column layout has been implemented. |
| **3. Custom Parser** | ✅ Completed | A robust character-scanning parser is implemented, correctly handling comments, strings, and balanced-delimiter blocks. |
| **4. Data Processing** | ✅ Completed | The `processEntries` function correctly substitutes string variables and merges `crossref` fields. |
| **5. View & Edit** | ✅ Completed | Users can click an entry to load its data into a form, edit the fields, and save changes to the application's state. |
| **6. Filtering & Sorting**| ⏳ Pending | Event listeners and logic for filtering and sorting the entry list. |
| **7. Saving** | ⏳ Pending | Implementation of the BibTeX serializer and the File System Access API / download fallback logic. |

---

### Step 1: HTML Structure (`index.html`) - (Completed)
Create the basic HTML skeleton. This will include:
- A `<head>` section for metadata.
- A `<style>` tag for all CSS rules.
- A `<body>` containing the UI elements:
    - A header with a file input: `<input type="file" id="bib-file-input" accept=".bib">`.
    - A "Save" button to trigger the download.
    - A toolbar for filter (text search) and sort controls (dropdown menu).
    - A main container (`<div id="entry-list">`) where bibliography entries will be rendered.
    - A modal or dedicated `div` for viewing and editing a single entry.
- A `<script>` tag at the end of the body for all JavaScript logic.

### Step 2: CSS Styling - (Completed)
Inside the `<style>` tag, add CSS rules for:
- A clean, modern layout (e.g., using Flexbox or Grid).
- Styling for buttons, inputs, and other controls.
- A clear visual distinction for the entry list and the editor view.
- Basic responsive design to ensure usability on different screen sizes.

### Step 3: JavaScript - Custom BibTeX Parser - (Completed)
- Design and implement the parser logic within the main `<script>` tag.
- **Tokenizer:** A function to break the raw `.bib` string into a stream of tokens (e.g., `@`, `{`, `}`, `,`, `=`, `string`, `identifier`).
- **Parser:** A state machine that consumes tokens to build up entry objects.
- **Features:**
    - It must correctly parse entries like `@article{...}`.
    - It must identify and store `@string` variables.
    - It must identify `crossref` fields for later processing.
    - It must correctly handle brace- or quote-delimited field values.
    - It must ignore lines starting with `%` or content outside of `@` blocks (BibTeX comments).
- **Serializer:** A function to convert the array of entry objects back into a valid BibTeX string.

### Step 4: JavaScript - Loading and Processing - (Completed)
- Add an event listener to the file input.
- When a file is selected, use `FileReader` to read its text content.
- Pass the text to the **custom BibTeX parser** to get an array of entry objects and a map of string variables.
- Write a `processEntries()` function to resolve dependencies:
    - Substitute string variables in entry fields.
    - Merge fields from `crossref` targets into the entries that reference them.
- Write a `renderEntries()` function that takes the processed array of entries, generates HTML for each, and injects it into the `<div id="entry-list">`.

### Step 5: JavaScript - Filtering and Sorting
- Add event listeners to the filter input and sort dropdown.
- **Filter:** On input, filter the main entries array based on the search term (e.g., matching against author, title, year). Then, call `renderEntries()` with the filtered list.
- **Sort:** On change, sort the main entries array by the selected key (e.g., author, year, entry type). Then, call `renderEntries()` to update the view.

### Step 6: JavaScript - View and Edit - (Completed)
- Add click listeners to the entries in the list.
- When an entry is clicked, display the editor view/modal.
- Populate a form within the editor with the data from the clicked entry object (e.g., `title`, `author`, `year`).
- On submitting the form, update the corresponding entry object in the main JavaScript array.
- Re-render the entry list to show the updated information and hide the editor.

### Step 7: JavaScript - Saving
- Add a click listener to the "Save" button.
- When clicked, use the **custom serializer** to convert the JavaScript array of entries back into a valid `.bib` text string.
- **Attempt File System Access API:**
    - Check if `window.showSaveFilePicker` is available.
    - If so, call it to open the native "Save As" dialog.
    - If the user selects a file, get the writable stream and write the `.bib` string to the file.
- **Fallback to Download:**
    - If the API is not supported or the user cancels the dialog, create a temporary `<a>` element.
    - Set its `href` to a `data:` URL containing the `.bib` string, set the `download` attribute, and programmatically click it.

## 5. Advanced Feature: Duplicate Author Detection & Merging

This feature addresses the common problem of authors being spelled differently across entries.

| Sub-Task | Status | Description |
| :--- | :--- | :--- |
| **1. UI Scaffolding** | ✅ Completed | An "Advanced" dropdown menu and a modal window for the merge UI have been added. |
| **2. Duplicate Detection** | ✅ Completed | Implement the Jaro-Winkler similarity algorithm to identify and group potential duplicate authors. |
| **3. Merge Interface** | ✅ Completed | Display the duplicate groups in the modal with controls to specify a canonical name and a `@STRING` key. |
| **4. Merge Logic** | ✅ Completed | Implement the logic to create the new `@STRING` variable and rewrite the `author` fields using formal concatenation. |

### Implementation Details

1.  **Detection Algorithm**: Use the **Jaro-Winkler similarity** algorithm to compare author names. A similarity score of `0.85` or higher will be used to flag a potential duplicate. This handles variations in spelling, initials, and diacritics.

2.  **User Workflow**:
    - The user clicks "Find Duplicate Authors" from the "Advanced" menu.
    - A modal appears, showing groups of similar names (e.g., `["Dukowicz, J", "Dukowicz, JK"]`).
    - For each group, the user can:
        - Edit a text field (pre-filled with the first name) to set the correct canonical name.
        - Provide a unique key for the new `@STRING` variable.
        - Click a "Merge" button.

3.  **Saving the Merge**:
    - The merge action creates a new `@string` variable in the data (e.g., `@STRING{str_dukowicz = "Dukowicz, John K."}`).
    - All entries containing one of the old names will have their `author` field updated to use the new string variable with formal concatenation (e.g., `author = "Hirt, CW and " # str_dukowicz`). The system will automatically switch from `{}` to `""` delimiters for the field.

## 4. Future Enhancements
- **Local Storage:** Use `localStorage` to cache the content of the last opened file, allowing the user to resume their session on page reload without having to select the file again.
- **Advanced Editing:** Add functionality to create new entries from scratch or delete existing ones.
- **Citation Key Generation:** Automatically suggest a citation key for new entries based on author and year.
- **Error Handling:** Provide user-friendly feedback for parse errors or invalid `.bib` file structures.
