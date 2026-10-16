document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = 'http://localhost:8000';

    // DOM Elements
    const userDigitsInput = document.getElementById('userDigitsInput');
    const sourceAirlineInput = document.getElementById('sourceAirlineInput');
    const originalPreviewVal = document.getElementById('originalPreviewVal');
    const outputPreviewVal = document.getElementById('outputPreviewVal');
    const applySmartTfnBtn = document.getElementById('applySmartTfnBtn');
    const exportVectorPdfBtn = document.getElementById('exportVectorPdfBtn');
    const exportHtmlBtn = document.getElementById('exportHtmlBtn');
    const docTitleInput = document.getElementById('docTitleInput');
    const statusBadge = document.getElementById('statusBadge');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const googleSheetsCsvInput = document.getElementById('googleSheetsCsvInput');
    const generateBulkZipBtn = document.getElementById('generateBulkZipBtn');
    const appModalOverlay = document.getElementById('appModalOverlay');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalBody = document.getElementById('modalBody');

    const openModal = (html) => { if (modalBody && appModalOverlay) { modalBody.innerHTML = html; appModalOverlay.style.display = 'flex'; } };
    const closeModal = () => { if (appModalOverlay) appModalOverlay.style.display = 'none'; };
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (appModalOverlay) appModalOverlay.addEventListener('click', e => { if (e.target === appModalOverlay) closeModal(); });

    // ── Mobile Responsive Drawer Controls ─────────────────────────────────────
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobilePanelBtn = document.getElementById('mobilePanelBtn');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    const leftSidebar = document.getElementById('leftSidebar');
    const rightSidebar = document.querySelector('.right-sidebar');

    const closeDrawers = () => {
        if (leftSidebar) leftSidebar.classList.remove('mobile-open');
        if (rightSidebar) rightSidebar.classList.remove('mobile-open');
        if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
    };

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            if (leftSidebar) leftSidebar.classList.toggle('mobile-open');
            if (rightSidebar) rightSidebar.classList.remove('mobile-open');
            if (sidebarBackdrop) sidebarBackdrop.classList.toggle('active');
        });
    }

    if (mobilePanelBtn) {
        mobilePanelBtn.addEventListener('click', () => {
            if (rightSidebar) rightSidebar.classList.toggle('mobile-open');
            if (leftSidebar) leftSidebar.classList.remove('mobile-open');
            if (sidebarBackdrop) sidebarBackdrop.classList.toggle('active');
        });
    }

    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', closeDrawers);
    }

    // ── Quill Editor ──────────────────────────────────────────────────────────
    const sourceQuill = new Quill('#sourceEditor', {
        theme: 'snow',
        placeholder: 'Type or paste document content here...',
        modules: {
            toolbar: [
                [{ header: [1, 2, 3, 4, 5, 6, false] }],
                [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ color: [] }, { background: [] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                [{ align: [] }],
                ['link', 'clean']
            ],
            clipboard: { matchVisual: false }
        }
    });

    // Clean empty editor by default
    sourceQuill.root.innerHTML = '';

    // ── Helpers ───────────────────────────────────────────────────────────────
    function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    function convertGoogleSheetUrlToCsvUrl(inputUrl) {
        const trimmed = (inputUrl || '').trim();
        const m = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (m && m[1]) {
            const gid = trimmed.match(/[?&#]gid=([0-9]+)/);
            return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv${gid ? '&gid=' + gid[1] : ''}`;
        }
        return trimmed;
    }

    function formatDigitsToCompetitorPattern(competitorStr, userInputStr) {
        if (!competitorStr || !userInputStr) return competitorStr || '';

        const cleanComp = competitorStr.trim();
        const cleanUser = userInputStr.trim();

        const compHasPlus = cleanComp.startsWith('+');
        const userHasPlus = cleanUser.startsWith('+');

        if (compHasPlus || userHasPlus) {
            let compCcLength = 0;
            let compBodyStr = cleanComp;

            if (compHasPlus) {
                const compDigits = cleanComp.replace(/\D/g, '');
                if (cleanComp.startsWith('+1')) {
                    compCcLength = 1;
                } else {
                    const cc3 = compDigits.substring(0, 3);
                    const known3Digit = ['351', '380', '971', '506', '502', '503', '504', '505', '507', '591', '592', '593', '595', '598'];
                    compCcLength = known3Digit.includes(cc3) ? 3 : 2;
                }
                let digitsSeen = 0;
                let ccEndIdx = 0;
                for (let i = 0; i < cleanComp.length; i++) {
                    if (/\d/.test(cleanComp[i])) {
                        digitsSeen++;
                        if (digitsSeen === compCcLength) {
                            ccEndIdx = i + 1;
                            break;
                        }
                    }
                }
                compBodyStr = cleanComp.substring(ccEndIdx);
            }

            const userDigits = cleanUser.replace(/\D/g, '');
            let userCcStr = '';
            let userBodyDigits = userDigits;

            if (userHasPlus) {
                let userCcLen = 1;
                if (cleanUser.startsWith('+1')) {
                    userCcLen = 1;
                } else {
                    const cc3 = userDigits.substring(0, 3);
                    const known3Digit = ['351', '380', '971', '506', '502', '503', '504', '505', '507', '591', '592', '593', '595', '598'];
                    userCcLen = known3Digit.includes(cc3) ? 3 : 2;
                }
                userCcStr = '+' + userDigits.substring(0, userCcLen);
                userBodyDigits = userDigits.substring(userCcLen);
            } else if (compHasPlus) {
                if (userDigits.length > 10) {
                    const userCcLen = userDigits.length - 10;
                    userCcStr = '+' + userDigits.substring(0, userCcLen);
                    userBodyDigits = userDigits.substring(userCcLen);
                } else {
                    const compDigits = cleanComp.replace(/\D/g, '');
                    userCcStr = '+' + compDigits.substring(0, compCcLength || 1);
                    userBodyDigits = userDigits;
                }
            }

            let resultBody = '';
            let bIdx = 0;
            for (const ch of compBodyStr) {
                if (/\d/.test(ch.normalize('NFKC'))) {
                    if (bIdx < userBodyDigits.length) {
                        resultBody += userBodyDigits[bIdx++];
                    }
                } else {
                    resultBody += ch;
                }
            }
            while (bIdx < userBodyDigits.length) {
                resultBody += userBodyDigits[bIdx++];
            }

            return userCcStr + resultBody;
        }

        const targetDigits = cleanUser.replace(/\D/g, '');
        if (!targetDigits) return competitorStr;
        let result = '', idx = 0;
        for (const ch of competitorStr) {
            result += /\d/.test(ch.normalize('NFKC'))
                ? (idx < targetDigits.length ? targetDigits[idx++] : '')
                : ch;
        }
        while (idx < targetDigits.length) result += targetDigits[idx++];
        return result;
    }

    function extractAllTfnsFromText(text) {
        if (!text) return [];
        const pattern = /(?:\+?\d{1,3}[^\w\n]{0,3})?(?:\(\s*\d{1,4}\s*\)|\d{1,4})[^\w\n]{0,3}\d{2,4}[^\w\n]{0,3}\d{2,4}(?:[^\w\n]{0,3}\d{1,5})?/gu;
        let matches = [];
        let m;
        while ((m = pattern.exec(text)) !== null) {
            let raw = m[0].replace(/^[\s.,;:/\-]+|[\s.,;:/\-]+$/g, '');
            const digits = raw.replace(/\D/g, '');
            if (digits.length >= 10 && digits.length <= 15) {
                if (raw.includes(' / ')) {
                    const parts = raw.split(' / ');
                    for (const p of parts) {
                        const d = p.replace(/\D/g, '');
                        if (d.length >= 10 && d.length <= 15) {
                            matches.push({ index: m.index + m[0].indexOf(p), length: p.length, text: p.trim() });
                        }
                    }
                } else {
                    matches.push({ index: m.index, length: m[0].length, text: raw });
                }
            }
        }
        return matches;
    }

    function updateLivePreview() {
        const text = sourceQuill.getText();
        const foundMatches = extractAllTfnsFromText(text).map(m => m.text);
        const matches = [...new Set(foundMatches)];
        const rawInput = userDigitsInput?.value.trim() || '';
        const targets = rawInput.split('\n').map(l => l.trim()).filter(Boolean);
        const primary = targets[0] || '+1 (888) 830-8592';
        const comp = matches[0] || '+51*23*456(7890)';
        if (originalPreviewVal) originalPreviewVal.innerText = comp;
        if (outputPreviewVal) {
            const out = formatDigitsToCompetitorPattern(comp, primary);
            if (targets.length > 1) {
                const out2 = formatDigitsToCompetitorPattern(matches[1] || comp, targets[1]);
                outputPreviewVal.innerHTML = `${out} <span style="font-size:.72rem;color:var(--text-muted)">(TFN 1)</span><br><span style="color:#60a5fa">${out2}</span> <span style="font-size:.72rem;color:var(--text-muted)">(TFN 2)</span>`;
            } else {
                outputPreviewVal.innerText = out;
            }
        }
    }

    if (userDigitsInput) userDigitsInput.addEventListener('input', updateLivePreview);
    updateLivePreview();

    // ── Apply TFN Button ──────────────────────────────────────────────────────
    if (applySmartTfnBtn) {
        applySmartTfnBtn.addEventListener('click', () => {
            const rawInput = userDigitsInput.value.trim();
            if (!rawInput) return alert('Please enter target replacement number(s) first!');
            const targets = rawInput.split('\n').map(l => l.trim()).filter(Boolean);
            const text = sourceQuill.getText();
            const found = extractAllTfnsFromText(text);
            if (!found.length) return alert('No competitor numbers found.');
            for (let i = found.length - 1; i >= 0; i--) {
                const mv = found[i];
                const replacement = formatDigitsToCompetitorPattern(mv.text, targets[i % targets.length]);
                const fmt = sourceQuill.getFormat(mv.index, 1);
                sourceQuill.deleteText(mv.index, mv.length);
                if (replacement) sourceQuill.insertText(mv.index, replacement, fmt);
            }
            if (statusBadge) statusBadge.innerHTML = `<i class="fa-solid fa-check"></i> ${found.length} Replaced`;
            updateLivePreview();
        });
    }

    function applyTfnReplacementToHtml(htmlString, tfnLines) {
        const div = document.createElement('div');
        div.innerHTML = htmlString;
        let counter = 0;
        function walk(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const matches = extractAllTfnsFromText(node.textContent);
                if (matches.length > 0) {
                    let text = node.textContent;
                    for (let i = matches.length - 1; i >= 0; i--) {
                        const m = matches[i];
                        const replacement = formatDigitsToCompetitorPattern(m.text, tfnLines[counter++ % tfnLines.length]);
                        text = text.substring(0, m.index) + replacement + text.substring(m.index + m.length);
                    }
                    node.textContent = text;
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                [...node.childNodes].forEach(walk);
            }
        }
        walk(div);
        return div.innerHTML;
    }

    function generateUniqueFilename(context) {
        const slug = (context || 'SEO_Document')
            .replace(/<[^>]*>/g, '').trim()
            .replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '_').substring(0, 45) || 'SEO_Document';
        const d = new Date();
        const ts = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${slug}_${ts}_${rnd}.pdf`;
    }

    // ── BACKEND PDF API (LibreOffice pipeline) ────────────────────────────────
    async function backendAvailable() {
        try {
            const r = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
            if (r.ok) {
                const d = await r.json();
                return d.status === 'ok';
            }
        } catch { /* backend not running */ }
        return false;
    }

    async function generatePdfViaBackend(htmlContent, title) {
        const response = await fetch(`${BACKEND_URL}/api/v1/pdf/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html_content: htmlContent, title: title || 'SEO PDF Document' })
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(err.detail || `Backend error ${response.status}`);
        }
        return await response.blob();
    }

    async function generateBulkZipViaBackend(sourceAirline, templateHtml, tfnLines, csvRows) {
        const response = await fetch(`${BACKEND_URL}/api/v1/pdf/bulk-zip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source_airline: sourceAirline,
                template_html: templateHtml,
                target_tfn_lines: tfnLines,
                csv_rows: csvRows
            })
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(err.detail || `Backend error ${response.status}`);
        }
        return await response.blob();
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 3000);
    }

    // ── Export PDF Button ─────────────────────────────────────────────────────
    if (exportVectorPdfBtn) {
        exportVectorPdfBtn.addEventListener('click', async () => {
            const html = sourceQuill.root.innerHTML;
            if (!html || html === '<p><br></p>') return alert('Document is empty!');

            const docTitle = docTitleInput?.value.trim() || 'SEO PDF Document';
            const origHtml = exportVectorPdfBtn.innerHTML;
            exportVectorPdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating PDF...';
            exportVectorPdfBtn.disabled = true;

            try {
                const isAvailable = await backendAvailable();

                if (isAvailable) {
                    // ✅ Backend running: use LibreOffice pipeline
                    if (statusBadge) statusBadge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> LibreOffice converting...';
                    const blob = await generatePdfViaBackend(html, docTitle);
                    const filename = generateUniqueFilename(docTitle);
                    downloadBlob(blob, filename);
                    if (statusBadge) statusBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> PDF Exported — Google Docs Quality!';
                } else {
                    // ⚠️ Backend not running: show setup instructions
                    if (statusBadge) statusBadge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Backend not running';
                    openModal(`
                        <h3 style="color:#ef4444;margin-bottom:12px"><i class="fa-solid fa-triangle-exclamation"></i> Python Backend Required</h3>
                        <p style="margin-bottom:12px">For Google Docs quality PDF (LibreOffice pipeline), you need to start the Python backend server.</p>
                        <div style="background:#0f172a;border-radius:8px;padding:12px;font-family:monospace;font-size:0.85rem;margin-bottom:12px">
                            <p style="color:#94a3b8;margin:0 0 6px"># Step 1: Install dependencies</p>
                            <p style="color:#34d399;margin:0 0 10px">cd "${window.location.pathname.replace('/index.html', '')}/pdf-engine" && pip install -r requirements.txt</p>
                            <p style="color:#94a3b8;margin:0 0 6px"># Step 2: Install LibreOffice (macOS)</p>
                            <p style="color:#34d399;margin:0 0 10px">brew install libreoffice</p>
                            <p style="color:#94a3b8;margin:0 0 6px"># Step 3: Start backend server</p>
                            <p style="color:#34d399;margin:0">uvicorn app.main:app --reload --port 8000</p>
                        </div>
                        <p style="color:#94a3b8;font-size:0.85rem">Once backend is running at <strong>http://localhost:8000</strong>, click Download PDF again.</p>
                    `);
                }
            } catch (err) {
                console.error('PDF Export Error:', err);
                if (statusBadge) statusBadge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Export failed';
                alert(`PDF Export Error:\n${err.message}`);
            }

            exportVectorPdfBtn.innerHTML = origHtml;
            exportVectorPdfBtn.disabled = false;
        });
    }

    // ── Export HTML Button ────────────────────────────────────────────────────
    if (exportHtmlBtn) {
        exportHtmlBtn.addEventListener('click', () => {
            const html = sourceQuill.root.innerHTML;
            if (!html || html === '<p><br></p>') return alert('Document is empty!');
            downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8;' }),
                generateUniqueFilename('HTML_Export').replace('.pdf', '.html'));
        });
    }

    // ── Bulk ZIP Button ───────────────────────────────────────────────────────
    if (generateBulkZipBtn) {
        generateBulkZipBtn.addEventListener('click', async () => {
            let csvRaw = googleSheetsCsvInput?.value.trim() || '';
            if (!csvRaw) return alert('Please enter Google Sheets CSV URL or CSV data!');

            const sourceAirline = sourceAirlineInput?.value.trim() || '';
            const tfnLines = (userDigitsInput?.value.trim() || '').split('\n').map(l => l.trim()).filter(Boolean);
            const origBtnHtml = generateBulkZipBtn.innerHTML;
            generateBulkZipBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            generateBulkZipBtn.disabled = true;

            try {
                // Fetch CSV if URL provided
                if (csvRaw.startsWith('http')) {
                    if (statusBadge) statusBadge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching CSV...';
                    const res = await fetch(convertGoogleSheetUrlToCsvUrl(csvRaw));
                    csvRaw = await res.text();
                    if (csvRaw.toLowerCase().startsWith('<!doctype') || csvRaw.includes('<html')) {
                        alert('Could not fetch CSV. Make sure Google Sheet is publicly shared.');
                        generateBulkZipBtn.innerHTML = origBtnHtml;
                        generateBulkZipBtn.disabled = false;
                        return;
                    }
                }

                const parsed = Papa.parse(csvRaw, { header: false, skipEmptyLines: true });
                let rows = parsed.data.filter(r => r.length >= 3 && r[0]?.trim());
                if (!rows.length) {
                    alert('No valid CSV rows. Expected: Col A=Airline, Col B=Headline, Col C=PDF Name');
                    generateBulkZipBtn.innerHTML = origBtnHtml;
                    generateBulkZipBtn.disabled = false;
                    return;
                }
                if (rows[0][0].toLowerCase().includes('airline')) rows = rows.slice(1);

                const isAvailable = await backendAvailable();
                const templateHtml = sourceQuill.root.innerHTML;

                if (isAvailable) {
                    // ✅ Backend: send all rows at once
                    if (statusBadge) statusBadge.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Backend generating ${rows.length} PDFs...`;
                    const csvRows = rows.map(([airline, headline, pdfName]) => ({
                        airline_name: airline.trim(),
                        headline: headline.trim(),
                        pdf_name: pdfName.trim()
                    }));
                    const zipBlob = await generateBulkZipViaBackend(sourceAirline, templateHtml, tfnLines, csvRows);
                    downloadBlob(zipBlob, `Bulk_SEO_PDFs_${new Date().toISOString().slice(0, 10)}.zip`);
                    if (statusBadge) statusBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${rows.length} PDFs Downloaded!`;
                } else {
                    alert('Backend server not running. Please start the Python server first.\nSee Download PDF button for setup instructions.');
                }
            } catch (err) {
                console.error('Bulk ZIP Error:', err);
                alert(`Bulk ZIP Error:\n${err.message}`);
            }

            generateBulkZipBtn.innerHTML = origBtnHtml;
            generateBulkZipBtn.disabled = false;
        });
    }

    // ── Modal Bindings ────────────────────────────────────────────────────────
    const bindNavModal = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', () => openModal(html));
    };
    bindNavModal('navProjects', `
        <h3 style="margin-bottom:12px;color:var(--accent-color)"><i class="fa-solid fa-folder-open"></i> Projects Overview</h3>
        <div style="background:var(--bg-main);border:1px solid var(--border-color);padding:12px;border-radius:8px;font-size:0.85rem">
            <p><strong>Delta Airlines Flight Guide</strong></p>
            <p style="color:var(--success-color);margin-top:4px">Engine: LibreOffice → Google Docs Quality PDF</p>
        </div>
    `);
    bindNavModal('navVariables', `
        <h3 style="margin-bottom:12px;color:var(--accent-color)"><i class="fa-solid fa-code"></i> Document Variables</h3>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${['{{AIRLINE}}', '{{HEADLINE}}', '{{TFN}}', '{{KEYWORD}}', '{{CITY}}']
            .map(v => `<span class="tag-pill accent" style="cursor:pointer" onclick="navigator.clipboard.writeText('${v}');alert('Copied ${v}!')">${v}</span>`)
            .join('')}
        </div>
    `);

    if (themeToggleBtn) themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        document.body.classList.toggle('light-theme');
    });

    // ── Check backend on load ─────────────────────────────────────────────────
    backendAvailable().then(ok => {
        if (statusBadge) {
            statusBadge.innerHTML = ok
                ? '<i class="fa-solid fa-circle-check"></i> Backend Ready — LibreOffice PDF'
                : '<i class="fa-solid fa-circle-xmark" style="color:#ef4444"></i> Backend Offline — Start server';
        }
    });
});
