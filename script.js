document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('snippetForm');
    const snippetsContainer = document.getElementById('snippetsContainer');
    const clearAllButton = document.getElementById('clearAll');
    const modal = document.getElementById('modal');
    const openModalButton = document.getElementById('openModal');
    let snippets = JSON.parse(localStorage.getItem('snippets')) || [];
    let editingIndex = null;
    const toggleDescriptionsButton = document.getElementById('toggleDescriptions');
    let descriptionsVisible = JSON.parse(localStorage.getItem('descriptionsVisible')) ?? true; // Retrieve the state or default to true
    let lastCopiedButton = null;

    const toggleDescriptions = () => {
        descriptionsVisible = !descriptionsVisible;
        localStorage.setItem('descriptionsVisible', descriptionsVisible); // Save the new state to localStorage
        updateDescriptionsVisibility();
    };

    const updateDescriptionsVisibility = () => {
        snippets.forEach((snippet, index) => {
            const descriptionElement = document.querySelector(`#snippet-${index} .snippet-text`);
            if (descriptionElement) {
                descriptionElement.style.display = descriptionsVisible ? 'block' : 'none';
            }
        });
        toggleDescriptionsButton.textContent = descriptionsVisible ? 'Hide Text' : 'Show Text';
    };


    toggleDescriptionsButton.addEventListener('click', toggleDescriptions);



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

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const label = form.label.value.trim();
        const text = form.snippet.value.trim();
    
        if (editingIndex !== null) {
            // Editing an existing snippet
            snippets[editingIndex] = { label, text };
            editingIndex = null; // Reset the editingIndex after the update
        } else {
            // Adding a new snippet
            if (label && text) {
                snippets.push({ label, text });
            }
        }
    
        localStorage.setItem('snippets', JSON.stringify(snippets));
        renderSnippets();
        modal.classList.add('hidden');
    });

    openModalButton.addEventListener('click', () => openModal());

    // Close modal when clicking outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.add('hidden');
        }
    });

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
    };

    const copyToClipboard = (text, buttonElement) => {
        navigator.clipboard.writeText(text).then(() => {
            if (lastCopiedButton) {
                lastCopiedButton.textContent = 'Copy'; // Reset the last copied button text
            }
            buttonElement.textContent = 'Copied!'; // Change the text of the current button
            lastCopiedButton = buttonElement; // Update the last copied button reference
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    };

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

    clearAllButton.addEventListener('click', () => {
        snippets = [];
        localStorage.setItem('snippets', JSON.stringify(snippets));
        renderSnippets();
    });

    // Initialize snippets from local storage
    renderSnippets();
    updateDescriptionsVisibility();
});
