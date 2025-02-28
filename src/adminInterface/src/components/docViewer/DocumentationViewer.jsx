import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Breadcrumb, Card, Tabs, Spin, Alert, Select, Button } from 'antd';
import { LeftOutlined, RightOutlined, FileTextOutlined, HomeOutlined } from '@ant-design/icons';

// Importiamo la documentazione come file statici
import authDoc from '../../docs/AUTHENTICATION_SYSTEM_DOCUMENTATION.md';
import userDoc from '../../docs/USER_MANAGEMENT_SYSTEM_DOCUMENTATION.md';

const { TabPane } = Tabs;
const { Option } = Select;

const DocumentationViewer = () => {
  const [activeDoc, setActiveDoc] = useState('auth');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toc, setToc] = useState([]);

  // Carica la documentazione in base al tipo selezionato
  const loadDocumentation = async (docType) => {
    try {
      setLoading(true);
      
      let docContent;
      if (docType === 'auth') {
        docContent = authDoc; // Utilizziamo il contenuto importato
      } else if (docType === 'user') {
        docContent = userDoc;
      } else {
        throw new Error('Tipo di documentazione non supportato');
      }
      
      setContent(docContent);
      
      // Estrazione indice dal contenuto markdown
      const headings = docContent.match(/^##\s(.+)$/gm) || [];
      const extractedToc = headings.map(heading => {
        const text = heading.replace('## ', '');
        const anchor = text.toLowerCase().replace(/\s+/g, '-');
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

  // Carica la documentazione al mount del componente
  useEffect(() => {
    loadDocumentation(activeDoc);
  }, [activeDoc]);

  // Gestione del cambio di documentazione
  const handleDocChange = (value) => {
    setActiveDoc(value);
  };

  // Personalizzazione rendering dei blocchi di codice
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
    }
  };

  return (
    <div className="documentation-container" style={{ padding: '20px' }}>
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item>
          <Link to="/dashboard"><HomeOutlined /> Dashboard</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <FileTextOutlined /> Documentazione
        </Breadcrumb.Item>
      </Breadcrumb>

      <Card 
        title="Documentazione Sistema" 
        extra={
          <Select 
            defaultValue={activeDoc} 
            onChange={handleDocChange}
            style={{ width: 240 }}
          >
            <Option value="auth">Sistema di Autenticazione</Option>
            <Option value="user">Gestione Utenti</Option>
          </Select>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <p>Caricamento documentazione...</p>
          </div>
        ) : error ? (
          <Alert message="Errore" description={error} type="error" showIcon />
        ) : (
          <div className="documentation-layout" style={{ display: 'flex' }}>
            {/* Indice laterale */}
            <div className="documentation-toc" style={{ 
              width: '250px', 
              borderRight: '1px solid #f0f0f0',
              paddingRight: '16px',
              marginRight: '16px'
            }}>
              <h3>Indice</h3>
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {toc.map((item, index) => (
                  <li key={index} style={{ margin: '8px 0' }}>
                    <a 
                      href={`#${item.anchor}`}
                      style={{ color: '#1890ff', textDecoration: 'none' }}
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Contenuto principale */}
            <div className="documentation-content" style={{ flex: 1 }}>
              <ReactMarkdown 
                children={content} 
                remarkPlugins={[remarkGfm]} 
                components={components} 
              />
              
              <div style={{ 
                marginTop: '40px',
                padding: '20px 0', 
                borderTop: '1px solid #f0f0f0', 
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <Button 
                  icon={<LeftOutlined />}
                  onClick={() => setActiveDoc(activeDoc === 'auth' ? 'user' : 'auth')}
                >
                  {activeDoc === 'auth' ? 'Gestione Utenti' : 'Sistema Autenticazione'}
                </Button>
                <Button 
                  type="primary"
                  onClick={() => setActiveDoc(activeDoc === 'auth' ? 'user' : 'auth')}
                  icon={<RightOutlined />}
                  iconPosition="right"
                >
                  {activeDoc === 'auth' ? 'Gestione Utenti' : 'Sistema Autenticazione'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DocumentationViewer;