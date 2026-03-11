import React, { useState } from 'react';

function MensagemWhatsApp({ mensagem }) {
  const [copiado, setCopiado] = useState(false);

  const copiarMensagem = () => {
    navigator.clipboard.writeText(mensagem);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const compartilharWhatsApp = () => {
    const encodedMessage = encodeURIComponent(mensagem);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>💬 Mensagem para WhatsApp</h2>
      </div>
      <div className="card-body">
        <div className="whatsapp-message">
          <pre>{mensagem}</pre>
        </div>

        <div className="btn-group">
          <button onClick={copiarMensagem} className="btn-outline-success">
            📋 Copiar Mensagem
          </button>
          <button onClick={compartilharWhatsApp} className="btn-success">
            📱 Compartilhar
          </button>
        </div>

        {copiado && (
          <div className="toast">
            ✅ Mensagem copiada!
          </div>
        )}
      </div>
    </div>
  );
}

export default MensagemWhatsApp;