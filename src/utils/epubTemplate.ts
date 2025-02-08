export const createEPUBTemplate = (bookPath: string, theme: 'light' | 'dark') => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/epubjs/0.3.93/epub.min.js"></script>
    <style>
        body {
            margin: 0;
            background: ${theme === 'light' ? '#ffffff' : '#121212'};
            color: ${theme === 'light' ? '#000000' : '#ffffff'};
        }
        #reader {
            height: 100vh;
            width: 100vw;
            overflow: hidden;
        }
        ::selection {
            background: #b4d5fe;
        }
        .loading-placeholder {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: ${theme === 'light' ? '#666' : '#999'};
        }
        .page {
            will-change: contents;
            contain: strict;
        }
    </style>
</head>
<body>
    <div id="reader"></div>
    <script>
        // Initialize EPUB
        var book = ePub("${bookPath}");
        var rendition = book.renderTo("reader", {
            flow: "paginated",
            width: "100%",
            height: "100%"
        });

        // Basic event handlers
        rendition.on("locationChanged", function(location) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: "positionChanged",
                payload: {
                    cfi: location.start.cfi,
                    progress: book.locations.percentageFromCfi(location.start.cfi)
                }
            }));
        });

        rendition.on("rendered", function(section) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: "chapterLoaded",
                payload: {
                    title: section.title,
                    href: section.href
                }
            }));
        });

        book.ready.then(() => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: "bookLoaded",
                payload: {
                    title: book.package.metadata.title,
                    author: book.package.metadata.creator,
                    totalLocations: book.locations.total
                }
            }));

            // Load existing annotations
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: "loadAnnotations"
            }));

            // Save annotations on unload
            window.addEventListener("beforeunload", () => {
                const annotations = rendition.annotations.get("highlight");
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: "saveAnnotations",
                    payload: annotations
                }));
            });
        });

        // Text selection handling
        rendition.on("selected", function(cfiRange, contents) {
            const selection = contents.window.getSelection();
            const range = selection.getRangeAt(0);
            const rects = range.getClientRects();
            
            // Get bounding rectangles of selection
            const boundingRects = Array.from(rects).map(rect => ({
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height
            }));

            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: "textSelected",
                payload: {
                    cfi: cfiRange,
                    text: selection.toString(),
                    boundingRects,
                    section: contents.section.href
                }
            }));
        });

        // Add annotation support
        rendition.on("selected", function(cfiRange, contents) {
            const selection = contents.window.getSelection();
            const range = selection.getRangeAt(0);
            const rects = range.getClientRects();
            
            // Get bounding rectangles of selection
            const boundingRects = Array.from(rects).map(rect => ({
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height
            }));

            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: "textSelected",
                payload: {
                    cfi: cfiRange,
                    text: selection.toString(),
                    boundingRects,
                    section: contents.section.href
                }
            }));
        });

        // Add annotation rendering
        rendition.hooks.content.register((content) => {
            content.document.querySelectorAll('[data-cfi]').forEach(element => {
                element.style.backgroundColor = 'rgba(255,255,0,0.3)';
            });
        });

        // Add context menu handling
        document.addEventListener('contextmenu', (e) => {
            const selection = window.getSelection();
            if (selection && !selection.isCollapsed) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: "contextMenuRequested",
                    payload: {
                        x: e.clientX,
                        y: e.clientY
                    }
                }));
                e.preventDefault();
            }
        });

        // Error handling
        book.on("openFailed", function(error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: "error",
                payload: "Failed to open book: " + error
            }));
        });

        const config = {
            previewPages: 3,
            unloadMargin: 5,
            maxResources: 50,
            progressiveLoading: true
        };

        rendition.configure({
            manager: "continuous",
            spread: "none",
            flow: "paginated",
            snap: true,
            preload: "none"
        });

        let currentLocation = 0;
        let loadingQueue = [];
        
        function manageResources() {
            const pages = document.querySelectorAll('.page');
            pages.forEach((page, index) => {
                if (Math.abs(index - currentLocation) > config.unloadMargin) {
                    page.style.visibility = 'hidden';
                    page.innerHTML = '<div class="loading-placeholder">Loading...</div>';
                }
            });
            
            // Preload upcoming pages
            const toLoad = [];
            for (let i = currentLocation; i < currentLocation + config.previewPages; i++) {
                if (pages[i]) toLoad.push(i);
            }
            
            toLoad.forEach(index => {
                if (pages[index].innerHTML.includes('Loading')) {
                    loadingQueue.push(index);
                }
            });
            
            processQueue();
        }

        async function processQueue() {
            if (loadingQueue.length === 0) return;
            
            const index = loadingQueue.shift();
            await rendition.display(index);
            const page = pages[index];
            page.style.visibility = 'visible';
            processQueue();
        }

        rendition.on('relocated', (location) => {
            currentLocation = location.start.displayed.page;
            manageResources();
        });

        // Initial load
        rendition.display().then(() => {
            manageResources();
        });
    </script>
</body>
</html>
`; 