document.addEventListener("DOMContentLoaded", () => {
    // Element references
    const form = document.getElementById('snippetForm');
    const snippetsContainer = document.getElementById('snippetsContainer');
    const clearAllButton = document.getElementById('clearAll');
    const modal = document.getElementById('modal');
    const openModalButton = document.getElementById('openModal');
    const toggleDescriptionsButton = document.getElementById('toggleDescriptions');

    // State variables
    let snippets = JSON.parse(localStorage.getItem('snippets')) || [];
    let editingIndex = null;
    let descriptionsVisible = JSON.parse(localStorage.getItem('descriptionsVisible')) ?? true;
    let lastCopiedButton = null;

    // Function to toggle snippet descriptions visibility
    const toggleDescriptions = () => {
        descriptionsVisible = !descriptionsVisible;
        localStorage.setItem('descriptionsVisible', descriptionsVisible);
        updateDescriptionsVisibility();
    };

    // Function to update the visibility of snippet descriptions
    const updateDescriptionsVisibility = () => {
        snippets.forEach((snippet, index) => {
            const descriptionElement = document.querySelector(`#snippet-${index} .snippet-text`);
            descriptionElement.style.display = descriptionsVisible ? 'block' : 'none';
        });
        toggleDescriptionsButton.textContent = descriptionsVisible ? 'Hide Text' : 'Show Text';
    };

    // Event listener for toggling descriptions
    toggleDescriptionsButton.addEventListener('click', toggleDescriptions);

    // Function to open the modal for adding/editing a snippet
    const openModal = (isEdit = false, label = '', text = '', index = null) => {
        if (isEdit) {
            form.label.value = label;
            form.snippet.value = text;
            editingIndex = index;
        } else {
            form.reset();
            editingIndex = null;
        }
        modal.classList.remove('hidden');
    };

    // Event listener for form submission to add/edit snippets
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const label = form.label.value.trim();
        const text = form.snippet.value.trim();

        if (editingIndex !== null) {
            snippets[editingIndex] = { label, text };
        } else if (label && text) {
            snippets.push({ label, text });
        }

        localStorage.setItem('snippets', JSON.stringify(snippets));
        renderSnippets();
        modal.classList.add('hidden');
    });

    // Event listener for opening the modal
    openModalButton.addEventListener('click', () => openModal());

    // Event listener to close modal when clicking outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.add('hidden');
        }
        else if (event.target === importExportModal) {
            importExportModal.classList.add('hidden');
        }
    });

    // Function to render snippets in the container
    const renderSnippets = () => {
        if (snippets.length === 0) {
            snippetsContainer.innerHTML = '<p class="text-center text-gray-500 font-bold italic py-4">No snippets yet. Create your first snippet!</p>';
            // Optionally hide other elements that are not relevant when there are no snippets
            clearAllButton.classList.add('opacity-50', 'cursor-not-allowed'); // Make button faded and change cursor
            clearAllButton.disabled = true; // Optionally disable the button
        } else {
            snippetsContainer.innerHTML = ''; // Clear existing snippets
            snippets.forEach((snippet, index) => {
                const snippetDiv = document.createElement('div');
                snippetDiv.classList.add('p-4', 'border-b', 'border-gray-200', 'flex', 'justify-between', 'items-center');
                snippetDiv.id = `snippet-${index}`;
                snippetDiv.setAttribute('data-index', index);
                snippetDiv.innerHTML = `
                    <div>
                        <p class="font-semibold">${snippet.label}</p>
                        <p class="snippet-text">${snippet.text}</p>
                    </div>
                    <div>
                        <button class="copyButton bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-1 px-2 rounded mr-2" data-text="${snippet.text}">Copy</button>
                        <button class="editButton bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded mr-2" data-index="${index}">&#x270E;</button> <!-- Pencil Icon -->
                        <button class="deleteButton bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded" data-index="${index}">&times;</button> <!-- X Icon -->
                    </div>
                `;
                snippetsContainer.appendChild(snippetDiv);
                // Now query and modify the snippet text display
                const snippetTextElement = snippetDiv.querySelector('.snippet-text');
                snippetTextElement.style.display = descriptionsVisible ? 'block' : 'none';
            });
            clearAllButton.classList.remove('opacity-50', 'cursor-not-allowed'); // Restore normal button style
            clearAllButton.disabled = false; // Re-enable the button
        }
        initializeSortable();
    };

    // Function to make snippets draggable
    const initializeSortable = () => {
        new Sortable(snippetsContainer, {
            group: 'stored',
            forceFallback: true,
            dragoverBubble: true,
            animation: 150,
            ghostClass: "sortable-ghost", // Class name for the drop placeholder
            chosenClass: 'sortable-chosen', // Class applied to the dragged item itself
            onStart: function (evt) {
                // This ensures the dragged element is hidden during the drag
                evt.item.style.display = 'none';
            },
            onEnd: function (evt) {
                // Reset display style after drag ends
                evt.item.style.display = '';
    
                // Logic to update the order of snippets array
                updateSnippetOrderAfterSort();
            }
        });
    };
    
    const updateSnippetOrderAfterSort = () => {
        // Create a new array to store the updated order
        const newOrder = [];
    
        // Get all snippet elements in their current order in the DOM
        const snippetElements = document.querySelectorAll('#snippetsContainer > div');
    
        snippetElements.forEach(snippetDiv => {
            const index = parseInt(snippetDiv.getAttribute('data-index'));
            if (index >= 0 && index < snippets.length) {
                newOrder.push(snippets[index]);
            }
        });
    
        // Update the snippets array and save to localStorage
        snippets = newOrder;
        localStorage.setItem('snippets', JSON.stringify(snippets));
    };    

    // Function to handle copying text to clipboard and updating button text
    const copyToClipboard = (text, buttonElement) => {
        navigator.clipboard.writeText(text).then(() => {
            if (lastCopiedButton) lastCopiedButton.textContent = 'Copy';
            buttonElement.textContent = 'Copied!';
            lastCopiedButton = buttonElement;
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    };

    // Event listener for snippet actions (copy, edit, delete)
    snippetsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('copyButton')) {
            const textToCopy = e.target.getAttribute('data-text');
            copyToClipboard(textToCopy, e.target);
        } else if (e.target.classList.contains('editButton')) {
            const index = e.target.getAttribute('data-index');
            const { label, text } = snippets[index];
            openModal(true, label, text, index);
        } else if (e.target.classList.contains('deleteButton')) {
            const index = e.target.getAttribute('data-index');
            snippets.splice(index, 1);
            localStorage.setItem('snippets', JSON.stringify(snippets));
            renderSnippets();
        }
    });

    // Event listener for clearing all snippets
    clearAllButton.addEventListener('click', () => {
        snippets = [];
        localStorage.setItem('snippets', JSON.stringify(snippets));
        renderSnippets();
    });

    // Import/Export JSON
    document.getElementById('openImportExportModal').addEventListener('click', function() {
        const jsonStr = JSON.stringify(snippets, null, 2);
        document.getElementById('importExportData').value = jsonStr;
        document.getElementById('importExportModal').classList.remove('hidden');
    });
    
    document.getElementById('copyData').addEventListener('click', function() {
        const importExportData = document.getElementById('importExportData');
        importExportData.select();
        document.execCommand('copy');
    });
    
    document.getElementById('insertData').addEventListener('click', function() {
        try {
            const inputData = document.getElementById('importExportData').value;
            const importedSnippets = JSON.parse(inputData);
            if (Array.isArray(importedSnippets)) {
                snippets = importedSnippets;
                localStorage.setItem('snippets', JSON.stringify(snippets));
                renderSnippets();
            } else {
                alert("Invalid JSON format");
            }
        } catch (e) {
            alert("Error parsing JSON: " + e.message);
        }
    });
    
    // Initial rendering of snippets and setting description visibility
    renderSnippets();
    updateDescriptionsVisibility();
});