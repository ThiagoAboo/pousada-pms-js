import React, { useState } from 'react';
import Formulario from './components/Formulario';
import Resultados from './components/Resultados';
import MensagemWhatsApp from './components/MensagemWhatsApp';

function App() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [whatsappMessage, setWhatsappMessage] = useState('');

  const consultar = async (dados) => {
    setLoading(true);
    try {
      const response = await fetch('/api/consultar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });

      const data = await response.json();

      if (data.error) {
        alert('Erro: ' + data.error);
        return;
      }

      setResults(data.allSuites);
      setWhatsappMessage(data.whatsappMessage);
    } catch (error) {
      alert('Erro ao consultar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>🌊 Pousada dos Sonhos</h1>
        <p>Costa Azul - Consulta de Disponibilidade em Tempo Real</p>
      </header>

      <Formulario onSubmit={consultar} loading={loading} />

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <h3>Consultando disponibilidade...</h3>
          <p>Aguarde enquanto verificamos os preços no Airbnb</p>
        </div>
      )}

      {results && !loading && (
        <>
          <Resultados suites={results} />
          <MensagemWhatsApp mensagem={whatsappMessage} />
        </>
      )}
    </div>
  );
}

export default App;