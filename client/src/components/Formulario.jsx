import React, { useState, useEffect } from 'react';

function Formulario({ onSubmit, loading }) {
  const hoje = new Date().toISOString().split('T')[0];
  const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [checkin, setCheckin] = useState(hoje);
  const [checkout, setCheckout] = useState(amanha);
  const [adultos, setAdultos] = useState(2);
  const [criancas, setCriancas] = useState(0);
  const [bebes, setBebes] = useState(0);
  const [pets, setPets] = useState(0);
  const [desconto, setDesconto] = useState(12);

  // Validar mínimo de 2 noites para fim de semana
  useEffect(() => {
    const checkinDate = new Date(checkin + 'T00:00:00');
    const checkoutDate = new Date(checkout + 'T00:00:00');
    const diaSemana = checkinDate.getDay();
    const noites = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));

    if ((diaSemana === 5 || diaSemana === 6) && noites < 2) {
      const newCheckout = new Date(checkinDate);
      newCheckout.setDate(newCheckout.getDate() + 2);
      setCheckout(newCheckout.toISOString().split('T')[0]);
    }
  }, [checkin]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ checkin, checkout, adultos, criancas, bebes, pets, desconto });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>📅 Nova Consulta</h2>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col">
              <label>Check-in</label>
              <input
                type="date"
                value={checkin}
                onChange={(e) => setCheckin(e.target.value)}
                min={hoje}
                required
              />
            </div>
            <div className="col">
              <label>Check-out</label>
              <input
                type="date"
                value={checkout}
                onChange={(e) => setCheckout(e.target.value)}
                min={checkin}
                required
              />
            </div>
          </div>

          <div className="row">
            <div className="col">
              <label>Adultos</label>
              <input
                type="number"
                value={adultos}
                onChange={(e) => setAdultos(parseInt(e.target.value))}
                min="1"
                max="10"
                required
              />
            </div>
            <div className="col">
              <label>Crianças</label>
              <input
                type="number"
                value={criancas}
                onChange={(e) => setCriancas(parseInt(e.target.value))}
                min="0"
                max="8"
              />
            </div>
            <div className="col">
              <label>Bebês</label>
              <input
                type="number"
                value={bebes}
                onChange={(e) => setBebes(parseInt(e.target.value))}
                min="0"
                max="5"
              />
            </div>
            <div className="col">
              <label>Pets</label>
              <input
                type="number"
                value={pets}
                onChange={(e) => setPets(parseInt(e.target.value))}
                min="0"
                max="5"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Desconto (%)</label>
            <input
              type="number"
              value={desconto}
              onChange={(e) => setDesconto(parseFloat(e.target.value))}
              min="0"
              max="50"
              step="0.1"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Consultando...' : '🔍 Consultar Disponibilidade'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Formulario;