import React from 'react';
import ReactDOM from 'react-dom/client';
import { Layout } from '@douyinfe/semi-ui';

import App from './App';
import HeaderBar from './components/HeaderBar';
import reportWebVitals from './reportWebVitals';
import 'semantic-ui-css/semantic.min.css';
import './index.css';
import { ThemeProvider } from './context/Theme';

const root = ReactDOM.createRoot(document.getElementById('root'));
const { Content, Header } = Layout;

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <Layout style={{ minHeight: '100vh' }}>
        <Header className="app-header">
          <HeaderBar />
        </Header>
        <Content className="app-content">
          <div className="app-content-shell">
            <App />
          </div>
        </Content>
      </Layout>
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();
