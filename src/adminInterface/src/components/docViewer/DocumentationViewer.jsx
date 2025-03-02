import React, { useState, useEffect, useRef } from 'react';
import { Typography, Box, Select, MenuItem, Button, Alert, CircularProgress } from '@mui/material';
import { ArrowBack as LeftOutlineIcon, ArrowForward as RightOutlineIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ContentLayout from '../common/ContentLayout';
import { useTheme } from '@mui/material/styles';

const DocumentationViewer = () => {
  const [activeDoc, setActiveDoc] = useState('auth');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toc, setToc] = useState([]);
  const theme = useTheme();
  const contentRef = useRef(null);

  // Carica la documentazione in base al tipo selezionato
  const loadDocumentation = async (docType) => {
    try {
      setLoading(true);
      
      let docPath = '';
      if (docType === 'auth') {
        docPath = '/docs/AUTH_DOC.md';
      } else if (docType === 'user') {
        docPath = '/docs/USER_DOC.md';
    } else if (docType === 'user-management') { // Aggiungi questa condizione
        docPath = '/docs/USER_MANAGEMENT_DOC.md';
      } else if (docType === 'School-Year&Section') { // Aggiungi questa condizione
        docPath = '/docs/ACCAD_YEAR_DOC.md';
      } else if (docType === 'Section-system1') { // Aggiungi questa condizione
        docPath = '/docs/SECTION_DOC.md';
      } else if (docType === 'Section-system2') { // Aggiungi questa condizione
        docPath = '/docs/ACCADEMIC_YEARS_DOC.md';
      } else if (docType === 'Section-guide') { // Aggiungi questa condizione
        docPath = '/docs/ACCADEMICYEAR_GUIDE.md';
      } else {
        throw new Error('Tipo di documentazione non supportato');
      }
      
      // Carica il file markdown dalla cartella public
      const response = await fetch(docPath);
      if (!response.ok) {
        throw new Error(`Impossibile caricare la documentazione: ${response.statusText}`);
      }
      
      const docContent = await response.text();
      setContent(docContent);
      
      // Estrazione indice dal contenuto markdown
      const headings = docContent.match(/^##\s(.+)$/gm) || [];
      const extractedToc = headings.map(heading => {
        const text = heading.replace('## ', '');
        const anchor = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        return { text, anchor };
      });
      
      setToc(extractedToc);
      setError(null);
    } catch (err) {
      console.error('Errore nel caricamento della documentazione:', err);
      setError('Impossibile caricare la documentazione. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocumentation(activeDoc);
  }, [activeDoc]);

  // Effetto per aggiungere gli ID agli headers h2 dopo il rendering del markdown
  useEffect(() => {
    if (contentRef.current && !loading) {
      // Aggiungi un breve ritardo per assicurarci che il markdown sia stato renderizzato
      const timer = setTimeout(() => {
        const headers = contentRef.current.querySelectorAll('h2');
        toc.forEach((item, index) => {
          if (headers[index]) {
            headers[index].id = item.anchor;
          }
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [toc, loading]);

  const handleDocChange = (event) => {
    setActiveDoc(event.target.value);
  };

  // Componente personalizzato per i link - importante per il funzionamento corretto dei link interni
  const MarkdownLink = ({ href, children }) => {
    // Gestisci i link interni (ancore)
    if (href.startsWith('#')) {
      return (
        <a
          href={href}
          onClick={(e) => {
            e.preventDefault();
            const targetId = href.substring(1);
            const element = document.getElementById(targetId);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          {children}
        </a>
      );
    }
    
    // Link esterni normali
    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
  };

  const components = {
    code({node, inline, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    // Componente personalizzato per gli heading h2
    h2: ({node, children, ...props}) => {
      const text = children.toString();
      const anchor = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      
      return (
        <h2 id={anchor} {...props}>
          {children}
        </h2>
      );
    },
    // Gestione personalizzata dei link
    a: MarkdownLink
  };

  const breadcrumbs = [
    { text: 'Dashboard', path: '/admin/dashboard' },
    { text: 'Documentazione', path: '/admin/docs' }
  ];

  const actions = (
    <Select
      value={activeDoc}
      onChange={handleDocChange}
      sx={{ minWidth: 200 }}
    >
      <MenuItem value="auth">Sistema di Autenticazione</MenuItem>
      <MenuItem value="user">Gestione Utenti</MenuItem>
      <MenuItem value="user-management">Guida Gestione Utenze</MenuItem>
      <MenuItem value="School-Year&Section">Scuole: Anno accademico e sezioni</MenuItem>
      <MenuItem value="Section-guide">Guida al funzionamento del setup AccademicYear</MenuItem>
      <MenuItem value="Section-system1">Guida al funzionamento delle sezioni</MenuItem>
      <MenuItem value="Section-system2">Guida al funzionamento del AccademicYear</MenuItem>

    </Select>
  );

  return (
    <ContentLayout
      title="Documentazione Sistema"
      subtitle="Documentazione tecnica completa per sviluppatori"
      breadcrumbs={breadcrumbs}
      actions={actions}
      loading={false}
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box sx={{ display: 'flex', height: '100%' }}>
          {/* Indice laterale */}
          <Box sx={{ 
            width: '250px', 
            borderRight: `1px solid ${theme.palette.divider}`,
            pr: 2,
            mr: 2,
            overflowY: 'auto'
          }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Indice</Typography>
            <Box component="ul" sx={{ listStyleType: 'none', p: 0 }}>
              {toc.map((item, index) => (
                <Box component="li" key={index} sx={{ mb: 1 }}>
                  <Box
                    component="a"
                    href={`#${item.anchor}`} 
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById(item.anchor);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        console.warn(`Elemento con id ${item.anchor} non trovato`);
                      }
                    }}
                    sx={{ 
                      color: theme.palette.primary.main, 
                      textDecoration: 'none',
                      display: 'block',
                      padding: '4px 0',
                      cursor: 'pointer'
                    }}
                  >
                    {item.text}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
          
          {/* Contenuto principale */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            <Box
              ref={contentRef}
              sx={{ 
                maxWidth: '900px',
                "& h1": {
                  fontSize: "2.2em",
                  marginBottom: "0.7em",
                  borderBottom: `2px solid ${theme.palette.divider}`,
                  paddingBottom: "0.3em",
                },
                "& h2": { 
                  scrollMarginTop: "80px",
                  fontSize: "1.8em",
                  borderBottom: "1px solid #eaecef",
                  paddingBottom: "0.3em",
                  marginTop: "1.5em"
                },
                "& h3": {
                  scrollMarginTop: "80px",
                  fontSize: "1.4em",
                  marginTop: "1.5em"
                },
                "& pre": {
                  backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f6f8fa',
                  borderRadius: "3px",
                  padding: "16px",
                  overflow: "auto"
                },
                "& code": {
                  backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f6f8fa',
                  borderRadius: "3px",
                  padding: "0.2em 0.4em",
                  fontFamily: "SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace"
                },
                "& table": {
                  borderCollapse: "collapse",
                  width: "100%",
                  marginBottom: "16px",
                  "& th, & td": {
                    padding: "6px 13px",
                    border: `1px solid ${theme.palette.mode === 'dark' ? '#3e3e3e' : '#dfe2e5'}`
                  },
                  "& tr": {
                    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
                    borderTop: `1px solid ${theme.palette.mode === 'dark' ? '#3e3e3e' : '#c6cbd1'}`
                  },
                  "& tr:nth-of-type(2n)": {
                    backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f6f8fa'
                  }
                },
                "& blockquote": {
                  padding: "0 1em",
                  color: theme.palette.mode === 'dark' ? '#a0a0a0' : '#6a737d',
                  borderLeft: `0.25em solid ${theme.palette.mode === 'dark' ? '#3e3e3e' : '#dfe2e5'}`,
                  margin: "0 0 16px 0"
                },
                "& a": {
                  color: theme.palette.primary.main,
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline"
                  }
                },
                "& ul, & ol": {
                  paddingLeft: "2em"
                },
                "& li": {
                  marginBottom: "0.5em"
                }
              }}
            >
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={components}
              >
                {content}
              </ReactMarkdown>
            </Box>
            
            <Box sx={{ 
              mt: 4,
              pt: 2, 
              borderTop: `1px solid ${theme.palette.divider}`, 
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <Button 
                variant="outlined"
                startIcon={<LeftOutlineIcon />}
                onClick={() => setActiveDoc(activeDoc === 'auth' ? 'user' : 'auth')}
              >
                {activeDoc === 'auth' ? 'Gestione Utenti' : 'Sistema Autenticazione'}
              </Button>
              <Button 
                variant="contained"
                endIcon={<RightOutlineIcon />}
                onClick={() => setActiveDoc(activeDoc === 'auth' ? 'user' : 'auth')}
              >
                {activeDoc === 'auth' ? 'Gestione Utenti' : 'Sistema Autenticazione'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </ContentLayout>
  );
};

export default DocumentationViewer;