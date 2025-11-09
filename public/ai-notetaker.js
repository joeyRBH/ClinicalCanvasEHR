// AI Clinical NoteTaker JavaScript
// Platform-integrated recording, transcription, and note generation

// State Management
let aiMediaRecorder = null;
let aiAudioChunks = [];
let aiIsRecording = false;
let aiStartTime = null;
let aiTimerInterval = null;
let aiAudioContext = null;
let aiAnalyser = null;
let aiRecognition = null;
let aiTranscript = '';
let aiRecordingDurationSeconds = 0;
let aiGeneratedNote = '';
let aiCurrentNoteId = null;
let aiCurrentNoteData = null;
let signatureCanvas = null;
let signatureCtx = null;
let isDrawing = false;

// Initialize AI NoteTaker
function initAINoteTaker() {
    console.log('Initializing AI NoteTaker...');

    // Initialize Speech Recognition
    initAISpeechRecognition();

    // Initialize Visualizer Canvas
    const canvas = document.getElementById('aiVisualizer');
    if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    // Initialize Signature Canvas
    initSignatureCanvas();

    // Setup Event Listeners
    setupAIEventListeners();

    // Load clients into dropdown
    loadClientsDropdown();

    console.log('✓ AI NoteTaker initialized');
}

// Setup Event Listeners
function setupAIEventListeners() {
    const recordBtn = document.getElementById('aiRecordBtn');
    const generateBtn = document.getElementById('aiGenerateBtn');
    const copyBtn = document.getElementById('aiCopyBtn');
    const saveBtn = document.getElementById('aiSaveBtn');
    const clearBtn = document.getElementById('aiClearTranscript');
    const editBtn = document.getElementById('aiEditTranscript');
    const typedSig = document.getElementById('typedSignature');

    if (recordBtn) {
        recordBtn.addEventListener('click', toggleRecording);
    }

    if (generateBtn) {
        generateBtn.addEventListener('click', generateAIClinicalNotes);
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', copyAIToClipboard);
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', saveAINoteToDatabase);
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', clearAITranscript);
    }

    if (editBtn) {
        editBtn.addEventListener('click', editAITranscript);
    }

    if (typedSig) {
        typedSig.addEventListener('input', updateTypedSignaturePreview);
    }
}

// Initialize Speech Recognition
function initAISpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        aiRecognition = new webkitSpeechRecognition();
        aiRecognition.continuous = true;  // Enables continuous recording
        aiRecognition.interimResults = true;
        aiRecognition.lang = 'en-US';

        aiRecognition.onresult = function(event) {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcriptPiece = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcriptPiece + ' ';
                } else {
                    interimTranscript += transcriptPiece;
                }
            }

            if (finalTranscript) {
                aiTranscript += finalTranscript;
                document.getElementById('aiTranscript').textContent = aiTranscript + interimTranscript;
                document.getElementById('aiGenerateBtn').disabled = false;
            } else {
                document.getElementById('aiTranscript').textContent = aiTranscript + interimTranscript;
            }
        };

        aiRecognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            // Don't show error for 'no-speech' during long sessions
            if (event.error !== 'no-speech') {
                showAIStatus('Speech recognition error: ' + event.error, 'warning');
            }
        };

        // Auto-restart for long sessions (recognition stops after ~60 seconds by default)
        aiRecognition.onend = function() {
            if (aiIsRecording) {
                console.log('Recognition ended, restarting for continuous session...');
                try {
                    aiRecognition.start();
                } catch (e) {
                    console.error('Error restarting recognition:', e);
                }
            }
        };
    } else {
        showAIStatus('Speech recognition not supported. You can manually enter the transcript.', 'warning');
    }
}

// Toggle Recording
async function toggleRecording() {
    if (aiIsRecording) {
        stopAIRecording();
    } else {
        await startAIRecording();
    }
}

// Start Recording
async function startAIRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        aiMediaRecorder = new MediaRecorder(stream);
        aiAudioChunks = [];

        aiMediaRecorder.ondataavailable = (event) => {
            aiAudioChunks.push(event.data);
        };

        aiMediaRecorder.onstop = () => {
            const audioBlob = new Blob(aiAudioChunks, { type: 'audio/wav' });
            // Could upload to storage if needed
        };

        aiMediaRecorder.start();
        if (aiRecognition) aiRecognition.start();

        setupAudioVisualization(stream);
        startAITimer();

        aiIsRecording = true;
        const recordBtn = document.getElementById('aiRecordBtn');
        recordBtn.style.background = '#e74c3c';
        document.getElementById('aiRecordIcon').textContent = '⏹️';
        document.getElementById('aiRecordText').textContent = 'Stop Recording';

        showAIStatus('Recording in progress...', 'success');
    } catch (error) {
        console.error('Error starting recording:', error);
        showAIStatus('Error accessing microphone. Please check permissions.', 'error');
    }
}

// Stop Recording
function stopAIRecording() {
    if (aiMediaRecorder && aiMediaRecorder.state !== 'inactive') {
        aiMediaRecorder.stop();
        aiMediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    if (aiRecognition) {
        aiRecognition.stop();
    }

    if (aiAudioContext) {
        aiAudioContext.close();
    }

    if (aiStartTime) {
        aiRecordingDurationSeconds = Math.floor((Date.now() - aiStartTime) / 1000);
    }

    stopAITimer();

    aiIsRecording = false;
    const recordBtn = document.getElementById('aiRecordBtn');
    recordBtn.style.background = '';
    document.getElementById('aiRecordIcon').textContent = '🎙️';
    document.getElementById('aiRecordText').textContent = 'Start Recording';

    showAIStatus('Recording stopped. Ready to generate notes.', 'info');
}

// Audio Visualization
function setupAudioVisualization(stream) {
    const canvas = document.getElementById('aiVisualizer');
    if (!canvas) return;

    aiAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    aiAnalyser = aiAudioContext.createAnalyser();
    const source = aiAudioContext.createMediaStreamSource(stream);
    source.connect(aiAnalyser);
    aiAnalyser.fftSize = 256;

    const bufferLength = aiAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const ctx = canvas.getContext('2d');

    function draw() {
        if (!aiIsRecording) return;

        requestAnimationFrame(draw);
        aiAnalyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = '#f7f7f7';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * canvas.height;
            ctx.fillStyle = `rgb(${Math.floor(barHeight + 100)}, 126, 234)`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    }

    draw();
}

// Timer Functions
function startAITimer() {
    aiStartTime = Date.now();
    aiTimerInterval = setInterval(updateAITimer, 1000);
}

function stopAITimer() {
    clearInterval(aiTimerInterval);
    document.getElementById('aiTimer').textContent = '00:00:00';
}

function updateAITimer() {
    const elapsed = Date.now() - aiStartTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    document.getElementById('aiTimer').textContent =
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0');
}

// Status Messages
function showAIStatus(message, type = 'info') {
    const statusEl = document.getElementById('aiStatusMessage');
    if (!statusEl) return;

    const classMap = {
        info: 'ai-status-info',
        success: 'ai-status-success',
        error: 'ai-status-error',
        warning: 'ai-status-warning'
    };

    statusEl.className = classMap[type] || classMap.info;
    statusEl.textContent = message;
    statusEl.style.display = 'block';
    statusEl.style.padding = '12px';
    statusEl.style.borderRadius = '8px';
    statusEl.style.marginTop = '15px';

    if (type === 'info') {
        statusEl.style.background = '#e3f2fd';
        statusEl.style.color = '#1976d2';
        statusEl.style.borderLeft = '4px solid #1976d2';
    } else if (type === 'success') {
        statusEl.style.background = '#e8f5e9';
        statusEl.style.color = '#388e3c';
        statusEl.style.borderLeft = '4px solid #388e3c';
    } else if (type === 'error') {
        statusEl.style.background = '#ffebee';
        statusEl.style.color = '#c62828';
        statusEl.style.borderLeft = '4px solid #c62828';
    } else if (type === 'warning') {
        statusEl.style.background = '#fff3e0';
        statusEl.style.color = '#f57c00';
        statusEl.style.borderLeft = '4px solid #f57c00';
    }
}

// Generate Clinical Notes
async function generateAIClinicalNotes() {
    const noteFormat = document.getElementById('aiNoteFormat').value;
    const clientSelect = document.getElementById('aiClientSelect');
    const clientId = clientSelect.value;
    const clientName = clientSelect.options[clientSelect.selectedIndex]?.text || '[Client Name]';
    const sessionType = document.getElementById('aiSessionType').value;

    if (!aiTranscript.trim()) {
        showAIStatus('No transcript available. Please record a session first.', 'error');
        return;
    }

    const generateBtn = document.getElementById('aiGenerateBtn');
    generateBtn.disabled = true;
    generateBtn.textContent = '⏳ Generating Notes...';
    showAIStatus('Generating clinical notes...', 'info');

    try {
        const response = await fetch('/api/ai-generate-note', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                transcript: aiTranscript,
                noteFormat: noteFormat,
                clientName: clientName,
                sessionType: sessionType
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to generate notes');
        }

        aiGeneratedNote = data.note;

        // Display formatted notes
        document.getElementById('aiNotesOutput').innerHTML = formatAINotes(aiGeneratedNote);
        document.getElementById('aiCopyBtn').disabled = false;

        // Enable save button if client is selected
        if (clientId) {
            document.getElementById('aiSaveBtn').disabled = false;
        }

        showAIStatus('Clinical notes generated successfully!', 'success');
    } catch (error) {
        console.error('Error generating notes:', error);
        showAIStatus('Error: ' + error.message, 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Clinical Notes';
    }
}

// Format notes for display
function formatAINotes(notes) {
    return notes
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

// Copy to clipboard
function copyAIToClipboard() {
    const notesText = document.getElementById('aiNotesOutput').innerText;
    navigator.clipboard.writeText(notesText).then(() => {
        showAIStatus('Notes copied to clipboard!', 'success');
    }).catch(err => {
        showAIStatus('Failed to copy notes', 'error');
    });
}

// Save Note to Database
async function saveAINoteToDatabase() {
    const clientSelect = document.getElementById('aiClientSelect');
    const clientId = clientSelect.value;

    if (!clientId) {
        showAIStatus('Please select a client before saving', 'error');
        return;
    }

    if (!aiGeneratedNote) {
        showAIStatus('No note to save', 'error');
        return;
    }

    const saveBtn = document.getElementById('aiSaveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = '💾 Saving...';

    try {
        // Include appointment_id if recording was started from an appointment
        const noteData = {
            client_id: clientId,
            session_type: document.getElementById('aiSessionType').value,
            note_format: document.getElementById('aiNoteFormat').value,
            transcript: aiTranscript,
            clinical_note: aiGeneratedNote,
            duration_seconds: aiRecordingDurationSeconds,
            user_id: currentUser?.id || 1
        };

        // Link to appointment if available (when opened from appointment context)
        if (window.currentAppointmentId) {
            noteData.appointment_id = window.currentAppointmentId;
        }

        const response = await fetch('/api/clinical-notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(noteData)
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || data.error || 'Failed to save note');
        }

        // Show success message
        window.lastSavedNoteId = data.data.id;
        document.getElementById('aiSavedNoteId').textContent = data.data.id;
        document.getElementById('aiSavedNoteInfo').style.display = 'block';
        saveBtn.style.display = 'none';

        showAIStatus('Note saved to client record successfully!', 'success');

        // Refresh notes list if visible
        if (document.getElementById('noteTakerNotesListView').style.display !== 'none') {
            refreshClinicalNotesList();
        }
    } catch (error) {
        console.error('Error saving note:', error);
        showAIStatus('Error saving to database: ' + error.message, 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Save to Record';
    }
}

// Clear Transcript
function clearAITranscript() {
    aiTranscript = '';
    document.getElementById('aiTranscript').textContent = 'Transcript will appear here as you record...';
    document.getElementById('aiGenerateBtn').disabled = true;
    showAIStatus('Transcript cleared', 'info');
}

// Edit Transcript
function editAITranscript() {
    const transcriptBox = document.getElementById('aiTranscript');
    const currentText = transcriptBox.textContent;

    const textarea = document.createElement('textarea');
    textarea.value = currentText;
    textarea.className = 'input';
    textarea.style.width = '100%';
    textarea.style.minHeight = '300px';
    textarea.style.fontSize = '0.95em';
    textarea.style.fontFamily = 'inherit';

    transcriptBox.innerHTML = '';
    transcriptBox.appendChild(textarea);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-success';
    saveBtn.textContent = 'Save Changes';
    saveBtn.style.marginTop = '10px';
    saveBtn.onclick = () => {
        aiTranscript = textarea.value;
        transcriptBox.textContent = aiTranscript;
        document.getElementById('aiGenerateBtn').disabled = !aiTranscript.trim();
    };

    transcriptBox.appendChild(saveBtn);
}

// View/List Functions
function showNoteTakerRecorder() {
    document.getElementById('noteTakerRecorderView').style.display = 'block';
    document.getElementById('noteTakerNotesListView').style.display = 'none';
}

function showNoteTakerNotesList() {
    document.getElementById('noteTakerRecorderView').style.display = 'none';
    document.getElementById('noteTakerNotesListView').style.display = 'block';
    refreshClinicalNotesList();
}

// Load Clients Dropdown
async function loadClientsDropdown() {
    const select = document.getElementById('aiClientSelect');
    const filterSelect = document.getElementById('notesFilterClient');

    if (!select) return;

    // Use existing clients array if available
    if (typeof clients !== 'undefined' && clients.length > 0) {
        select.innerHTML = '<option value="">Select Client</option>';
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">All Clients</option>';
        }

        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            select.appendChild(option);

            if (filterSelect) {
                const filterOption = option.cloneNode(true);
                filterSelect.appendChild(filterOption);
            }
        });
    }
}

// Refresh Clinical Notes List
async function refreshClinicalNotesList() {
    const listEl = document.getElementById('clinicalNotesList');
    const filterClient = document.getElementById('notesFilterClient')?.value;

    if (!listEl) return;

    listEl.innerHTML = '<div style="padding: 20px; text-align: center;">Loading notes...</div>';

    try {
        let url = '/api/clinical-notes?limit=100';
        if (filterClient) {
            url = `/api/clinical-notes?client_id=${filterClient}&limit=100`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to load notes');
        }

        if (data.data.length === 0) {
            listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No clinical notes found</div>';
            return;
        }

        listEl.innerHTML = '';
        data.data.forEach(note => {
            const noteCard = createNoteCard(note);
            listEl.appendChild(noteCard);
        });
    } catch (error) {
        console.error('Error loading notes:', error);
        listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: #c62828;">Error loading notes: ' + error.message + '</div>';
    }
}

// Create Note Card
function createNoteCard(note) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.padding = '20px';
    card.style.cursor = 'pointer';
    card.onclick = () => viewClinicalNote(note.id);

    const signedBadge = note.is_signed
        ? '<span style="background: #10B981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px;">✓ Signed</span>'
        : '<span style="background: #f59e0b; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px;">Unsigned</span>';

    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
            <h4 style="margin: 0;">${note.client_name || 'Unknown Client'}</h4>
            ${signedBadge}
        </div>
        <p style="margin: 5px 0; color: var(--text-secondary); font-size: 14px;">
            ${note.note_format.toUpperCase()} · ${note.session_type}
        </p>
        <p style="margin: 5px 0; color: var(--text-secondary); font-size: 14px;">
            📅 ${new Date(note.session_date).toLocaleDateString()}
        </p>
        ${note.created_by_name ? `<p style="margin: 5px 0; color: var(--text-secondary); font-size: 12px;">By: ${note.created_by_name}</p>` : ''}
    `;

    return card;
}

// View Clinical Note
async function viewClinicalNote(noteId) {
    aiCurrentNoteId = noteId;

    try {
        const response = await fetch(`/api/clinical-notes?id=${noteId}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to load note');
        }

        aiCurrentNoteData = data.data;

        // Populate modal
        document.getElementById('viewNoteClient').textContent = data.data.client_name || 'Unknown';
        document.getElementById('viewNoteDate').textContent = new Date(data.data.session_date).toLocaleString();
        document.getElementById('viewNoteFormat').textContent = data.data.note_format.toUpperCase();
        document.getElementById('viewNoteType').textContent = data.data.session_type;
        document.getElementById('viewNoteCreatedBy').textContent = data.data.created_by_name || 'Unknown';
        document.getElementById('viewNoteTranscript').textContent = data.data.transcript || 'No transcript';
        document.getElementById('viewNoteClinicalNote').innerHTML = formatAINotes(data.data.clinical_note);

        // Show/hide signed info
        if (data.data.is_signed) {
            document.getElementById('viewNoteSignedInfo').style.display = 'block';
            document.getElementById('viewNoteSignedBy').textContent = data.data.signed_by_name || 'Unknown';
            document.getElementById('editNoteBtn').style.display = 'none';
            document.getElementById('signNoteBtn').style.display = 'none';
            document.getElementById('deleteNoteBtn').style.display = 'none';
        } else {
            document.getElementById('viewNoteSignedInfo').style.display = 'none';
            document.getElementById('editNoteBtn').style.display = 'inline-block';
            document.getElementById('signNoteBtn').style.display = 'inline-block';
            document.getElementById('deleteNoteBtn').style.display = 'inline-block';
        }

        openModal('clinicalNoteModal');
    } catch (error) {
        console.error('Error loading note:', error);
        showNotification('Error loading note: ' + error.message, 'error');
    }
}

// Filter Clinical Notes
function filterClinicalNotes() {
    refreshClinicalNotesList();
}

// Enable Note Editing
function enableNoteEditing() {
    const noteEl = document.getElementById('viewNoteClinicalNote');
    const currentText = noteEl.innerText;

    noteEl.contentEditable = true;
    noteEl.style.border = '2px solid var(--primary-color)';
    noteEl.focus();

    document.getElementById('editNoteBtn').style.display = 'none';
    document.getElementById('saveNoteEditBtn').style.display = 'inline-block';
    document.getElementById('cancelNoteEditBtn').style.display = 'inline-block';
}

// Save Note Edit
async function saveNoteEdit() {
    const noteEl = document.getElementById('viewNoteClinicalNote');
    const newText = noteEl.innerText;

    try {
        const response = await fetch('/api/clinical-notes', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: aiCurrentNoteId,
                clinical_note: newText,
                user_id: currentUser?.id || 1
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to save note');
        }

        noteEl.contentEditable = false;
        noteEl.style.border = '1px solid var(--border-color)';
        noteEl.innerHTML = formatAINotes(newText);

        document.getElementById('editNoteBtn').style.display = 'inline-block';
        document.getElementById('saveNoteEditBtn').style.display = 'none';
        document.getElementById('cancelNoteEditBtn').style.display = 'none';

        showNotification('Note updated successfully', 'success');
        refreshClinicalNotesList();
    } catch (error) {
        console.error('Error saving note:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Cancel Note Edit
function cancelNoteEdit() {
    const noteEl = document.getElementById('viewNoteClinicalNote');
    noteEl.contentEditable = false;
    noteEl.style.border = '1px solid var(--border-color)';
    noteEl.innerHTML = formatAINotes(aiCurrentNoteData.clinical_note);

    document.getElementById('editNoteBtn').style.display = 'inline-block';
    document.getElementById('saveNoteEditBtn').style.display = 'none';
    document.getElementById('cancelNoteEditBtn').style.display = 'none';
}

// Copy Note Text
function copyNoteText() {
    const noteText = document.getElementById('viewNoteClinicalNote').innerText;
    navigator.clipboard.writeText(noteText).then(() => {
        showNotification('Note copied to clipboard', 'success');
    }).catch(err => {
        showNotification('Failed to copy note', 'error');
    });
}

// Download Note Text
function downloadNoteText() {
    const noteText = document.getElementById('viewNoteClinicalNote').innerText;
    const clientName = aiCurrentNoteData.client_name || 'Client';
    const date = new Date().toISOString().split('T')[0];
    const filename = `${clientName}_Clinical_Note_${date}.txt`;

    const blob = new Blob([noteText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('Note downloaded', 'success');
}

// Delete Clinical Note
async function deleteClinicalNote() {
    if (!confirm('Are you sure you want to delete this clinical note? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/clinical-notes?id=${aiCurrentNoteId}&user_id=${currentUser?.id || 1}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to delete note');
        }

        closeModal('clinicalNoteModal');
        showNotification('Note deleted successfully', 'success');
        refreshClinicalNotesList();
    } catch (error) {
        console.error('Error deleting note:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Signature Functions
function initSignatureCanvas() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;

    signatureCanvas = canvas;
    signatureCtx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 150;

    // Setup drawing
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        canvas.dispatchEvent(mouseEvent);
    });
}

function startDrawing(e) {
    isDrawing = true;
    const rect = signatureCanvas.getBoundingClientRect();
    signatureCtx.beginPath();
    signatureCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e) {
    if (!isDrawing) return;

    const rect = signatureCanvas.getBoundingClientRect();
    signatureCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    signatureCtx.strokeStyle = '#000';
    signatureCtx.lineWidth = 2;
    signatureCtx.lineCap = 'round';
    signatureCtx.stroke();
}

function stopDrawing() {
    isDrawing = false;
}

function clearSignature() {
    if (signatureCtx && signatureCanvas) {
        signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    }
}

function toggleSignatureInput() {
    const method = document.getElementById('signatureMethod').value;
    if (method === 'typed') {
        document.getElementById('typedSignatureSection').style.display = 'block';
        document.getElementById('drawnSignatureSection').style.display = 'none';
    } else {
        document.getElementById('typedSignatureSection').style.display = 'none';
        document.getElementById('drawnSignatureSection').style.display = 'block';
    }
}

function updateTypedSignaturePreview() {
    const text = document.getElementById('typedSignature').value;
    document.getElementById('typedSignaturePreview').textContent = text || 'Signature will appear here...';
}

function openSignatureModal() {
    openModal('signatureModal');
}

async function confirmSignNote() {
    const confirmed = document.getElementById('signatureConfirm').checked;
    if (!confirmed) {
        showNotification('Please confirm the note is accurate before signing', 'error');
        return;
    }

    const method = document.getElementById('signatureMethod').value;
    let signatureData = '';

    if (method === 'typed') {
        signatureData = document.getElementById('typedSignature').value;
        if (!signatureData) {
            showNotification('Please enter your signature', 'error');
            return;
        }
    } else {
        if (signatureCanvas) {
            signatureData = signatureCanvas.toDataURL();
        }
    }

    try {
        const response = await fetch('/api/clinical-notes-sign', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                note_id: aiCurrentNoteId,
                user_id: currentUser?.id || 1,
                signature_data: signatureData,
                action: 'sign'
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to sign note');
        }

        closeModal('signatureModal');
        closeModal('clinicalNoteModal');
        showNotification('Note signed and locked successfully', 'success');
        refreshClinicalNotesList();
    } catch (error) {
        console.error('Error signing note:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Initialize when tab is shown
document.addEventListener('DOMContentLoaded', function() {
    // Initialize when AI NoteTaker tab is clicked
    const aiTab = document.querySelector('.tab-btn[onclick*="ainotetaker"]');
    if (aiTab) {
        const originalOnClick = aiTab.onclick;
        aiTab.onclick = function() {
            if (originalOnClick) originalOnClick.call(this);
            setTimeout(initAINoteTaker, 100);
        };
    }
});
