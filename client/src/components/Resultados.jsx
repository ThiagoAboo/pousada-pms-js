import React from 'react';

function Resultados({ suites }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>🏨 Suítes</h2>
      </div>
      <div className="card-body">
        {suites.map((suite) => (
          <div key={suite.id} className="result-card">
            <h3 className="suite-name">🏨 {suite.name}</h3>
            <p className="suite-description">{suite.description}</p>
            
            <div className={suite.available ? 'badge-available' : 'badge-unavailable'}>
              {suite.available ? '✅ Disponível' : '❌ Indisponível'}
            </div>

            {suite.note && (
              <div className="price-note">
                <span>ℹ️ {suite.note}</span>
              </div>
            )}

            {suite.reason && !suite.available && (
              <div className="price-note">
                <span>⚠️ {suite.reason}</span>
              </div>
            )}

            {suite.capacidadeExcedida && (
              <div className="price-note">
                <span>⚠️ Capacidade máxima excedida para o número de hóspedes</span>
              </div>
            )}

            <div className="price-row">
              <div>
                <span className="price-original">
                  De: R$ {suite.price.toFixed(2).replace('.', ',')}
                </span>
                <span className="price-discount">
                  Por: R$ {suite.priceWithDiscount.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <a href={suite.url} target="_blank" rel="noopener noreferrer" className="btn-outline">
                Ver no Airbnb
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Resultados;