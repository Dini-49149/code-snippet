import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { FaCompress } from 'react-icons/fa';

interface CodeEditorProps {
  snippet: {
    code?: string;
    programmingLanguage?: string;
  };
  onCodeChange: (code: string | undefined) => void;
  isFullscreen: boolean;
  onExitFullscreen?: () => void;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ 
  snippet, 
  onCodeChange, 
  isFullscreen,
  onExitFullscreen,
  readOnly = false
}) => {
  const [darkMode, setDarkMode] = useState<boolean>(localStorage.getItem('darkMode') === 'true');
  const [wasFullscreen, setWasFullscreen] = useState<boolean>(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  
  // Add better fullscreen event handling
  useEffect(() => {
    // Direct response to fullscreen prop changes
    if (isFullscreen) {
      console.log("CodeEditor entering fullscreen mode");
      setWasFullscreen(true);
      document.body.classList.add('fullscreen-active');
      
      if (editorContainerRef.current) {
        // Apply fullscreen styles directly
        const container = editorContainerRef.current;
        container.style.position = "fixed";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = "100vw";
        container.style.height = "100vh";
        container.style.zIndex = "9999";
      }
      
      // Force editor layout update
      if (editorInstance) {
        setTimeout(() => {
          try {
            editorInstance.layout();
          } catch (e) {
            console.error("Error updating editor layout:", e);
          }
        }, 100);
      }
    } else if (wasFullscreen) {
      console.log("CodeEditor exiting fullscreen mode");
      document.body.classList.remove('fullscreen-active');
      
      // Reset styles directly when exiting fullscreen
      if (editorContainerRef.current) {
        const container = editorContainerRef.current;
        container.style.position = "relative";
        container.style.top = "auto";
        container.style.left = "auto";
        container.style.width = "100%";
        container.style.height = "400px";
        container.style.zIndex = "auto";
      }
      
      // Force editor layout update with delay to ensure DOM has updated
      if (editorInstance) {
        setTimeout(() => {
          try {
            editorInstance.layout();
          } catch (e) {
            console.error("Error updating editor layout:", e);
          }
        }, 200);
      }
      
      // Reset wasFullscreen state
      setWasFullscreen(false);
    } else {
      // Handle the case when isFullscreen is false but wasFullscreen is also false
      // This ensures proper initialization when component first mounts
      console.log("CodeEditor in normal mode");
      document.body.classList.remove('fullscreen-active');
      
      if (editorContainerRef.current) {
        const container = editorContainerRef.current;
        container.style.position = "relative";
        container.style.top = "auto";
        container.style.left = "auto"; 
        container.style.width = "100%";
        container.style.height = "400px";
        container.style.zIndex = "auto";
      }
    }
  }, [isFullscreen, wasFullscreen, editorInstance]);
  
  // Listen for custom fullscreenchange event
  useEffect(() => {
    const handleFullscreenChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const isFullscreenNow = customEvent.detail?.isFullscreen;
      
      console.log("Received fullscreenchange event:", isFullscreenNow);
      
      // Force editor layout update
      if (editorInstance) {
        setTimeout(() => {
          try {
            editorInstance.layout();
            console.log("Forced editor layout update after fullscreen change");
          } catch (e) {
            console.error("Error during forced layout update:", e);
          }
        }, 150);
      }
    };
    
    window.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => window.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [editorInstance]);
  
  const handleEditorDidMount = (editor: any) => {
    setEditorInstance(editor);
    
    // Force layout on mount
    setTimeout(() => {
      try {
        editor.layout();
      } catch (e) {
        console.error("Error on editor mount layout:", e);
      }
    }, 100);
  };
  
  // Listen for dark mode changes
  useEffect(() => {
    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem('darkMode') === 'true');
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also set up a MutationObserver to detect class changes on documentElement
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === 'class' && 
          mutation.target === document.documentElement
        ) {
          setDarkMode(document.documentElement.classList.contains('dark-mode'));
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      observer.disconnect();
    };
  }, []);

  // Simple exit fullscreen handler
  const handleExitFullscreen = useCallback(() => {
    if (onExitFullscreen) {
      onExitFullscreen();
    }
  }, [onExitFullscreen]);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      onCodeChange(value);
    },
    [onCodeChange]
  );

  // Handle Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        handleExitFullscreen();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, handleExitFullscreen]);

  return (
    <div 
      ref={editorContainerRef}
      className={isFullscreen ? 'fullscreen-editor' : 'code-editor-container'}
      style={{
        height: isFullscreen ? '100vh' : '400px',
        width: isFullscreen ? '100vw' : '100%',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? '0' : 'auto',
        left: isFullscreen ? '0' : 'auto',
        right: isFullscreen ? '0' : 'auto',
        bottom: isFullscreen ? '0' : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: darkMode ? '#1e1e1e' : '#f8f9fa'
      }}
    >
      {isFullscreen && (
        <button 
          className="fixed-exit-fullscreen-btn"
          onClick={handleExitFullscreen}
          style={{
            position: 'fixed',
            top: '16px',
            right: '24px',
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 500,
            zIndex: 10000,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          <FaCompress size={16} /> Exit
        </button>
      )}
      <div style={{ 
        flex: 1, 
        position: 'relative',
        height: isFullscreen ? '100vh' : '400px',
        width: isFullscreen ? '100vw' : '100%',
        background: isFullscreen ? (darkMode ? '#1e1e1e' : '#f8f9fa') : undefined,
        borderRadius: isFullscreen ? 0 : '1rem',
        boxShadow: isFullscreen ? 'none' : 'var(--shadow)',
        overflow: 'hidden',
      }}>
        <Editor
          key={`editor-${isFullscreen ? 'fullscreen' : 'normal'}-${darkMode ? 'dark' : 'light'}`}
          height="100%"
          language={snippet?.programmingLanguage || 'javascript'}
          value={snippet?.code || ''}
          theme={darkMode ? 'vs-dark' : 'light'}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            fontSize: 14,
            tabSize: 2,
            automaticLayout: true,
            readOnly: readOnly,
            lineNumbers: 'on',
            folding: true,
            glyphMargin: true,
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor; 