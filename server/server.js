import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { consultarAirbnb } from './scraper.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// Configuração dos quartos
const ROOMS = {
    "1503584633402633674": {
        "name": "Suíte Costa Azul",
        "description": "tem uma varanda excepcional com vista mar, somada com uma rede para relaxar em uma vista maravilhosa do mar, que dá para ser apreciado deitado na cama. O quarto conta com frigobar, cafeteira, e ar-condicionado. Este quarto possui uma cama de casal. (Não tem piscina e nem tv). possibilitando 2 pessoas.",
        "max_guests": 2
    },
    "1535677362018464574": {
        "name": "Suíte Praia da Tartaruga",
        "description": "preparada para descansar, tendo um ambiente mais silencioso. Conta com uma cama de casal, e uma beliche com duas camas de solteiro, ventilador, cafeteira, tv e frigobar. (Não tem piscina, nem ar-condicionado). possibilitando 4 pessoas.",
        "max_guests": 4
    },
    "1507145359441207299": {
        "name": "Suíte Praia da Baleia",
        "description": "dispõe de varanda com vista mar, piscina de borda infinita, churrasqueira, frigobar, cafeteira, ventilador, tv, mesa externa, e tudo isso privativo no quarto, somente vocês irão utilizar. Este quarto conta com 1 cama de casal e duas camas de solteiro. (Não tem ar-condicionado). possibilitando 4 pessoas.",
        "max_guests": 4
    }
};

// Função para validar mínimo de noites
function validarMinimoNoites(checkinDate, noites) {
    const diaSemana = checkinDate.getDay(); // 0=domingo, 5=sexta, 6=sábado
    
    if (diaSemana === 5 || diaSemana === 6) { // Sexta ou sábado
        if (noites < 2) {
            return false;
        }
    }
    return true;
}

// Endpoint de consulta
app.post('/api/consultar', async (req, res) => {
    try {
        const { checkin, checkout, adultos, criancas = 0, bebes = 0, pets = 0, desconto = 12 } = req.body;
        
        // Validar datas
        const checkinDate = new Date(checkin + 'T00:00:00');
        const checkoutDate = new Date(checkout + 'T00:00:00');
        const noites = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
        
        if (checkoutDate <= checkinDate) {
            return res.status(400).json({ error: 'Data de check-out deve ser após check-in' });
        }
        
        if (noites > 30) {
            return res.status(400).json({ error: 'Período máximo de 30 dias' });
        }
        
        if (!validarMinimoNoites(checkinDate, noites)) {
            return res.status(400).json({ error: 'Reservas com check-in na sexta ou sábado exigem no mínimo 2 diárias.' });
        }
        
        console.log(`\n${'='.repeat(50)}`);
        console.log(`Consultando Airbnb para ${checkin} até ${checkout}`);
        console.log(`${'='.repeat(50)}`);
        
        // Consultar Airbnb
        const results = await consultarAirbnb(checkin, checkout, adultos, criancas, bebes, pets);
        
        // Processar resultados
        const allSuites = [];
        const pricesWithDiscount = {};
        
        for (const [roomId, data] of Object.entries(results)) {
            const roomInfo = ROOMS[roomId];
            
            // Verificar capacidade
            const totalHospedes = adultos + criancas;
            const capacidadeExcedida = totalHospedes > roomInfo.max_guests;
            
            // Calcular preço com desconto
            let precoComDesconto = 0;
            if (data.available && data.price > 0) {
                precoComDesconto = data.price * (1 - desconto / 100);
                pricesWithDiscount[roomId] = precoComDesconto;
            }
            
            allSuites.push({
                id: roomId,
                name: roomInfo.name,
                description: roomInfo.description,
                price: data.price || 0,
                priceWithDiscount: precoComDesconto,
                available: data.available,
                url: data.url,
                note: data.note || '',
                reason: data.reason || '',
                capacidadeExcedida
            });
        }
        
        // Gerar mensagem WhatsApp
        const mensagem = gerarMensagemWhatsApp(
            checkin, checkout, adultos, criancas, bebes, pets, noites,
            results, pricesWithDiscount, desconto
        );
        
        console.log(`\nConsulta finalizada. ${allSuites.length} quartos processados.`);
        
        res.json({
            success: true,
            allSuites,
            results,
            whatsappMessage: mensagem
        });
        
    } catch (error) {
        console.error('Erro na consulta:', error);
        res.status(500).json({ error: error.message });
    }
});

// Função para gerar mensagem WhatsApp
function gerarMensagemWhatsApp(checkin, checkout, adultos, criancas, bebes, pets, noites, results, pricesWithDiscount, desconto) {
    const checkinDate = new Date(checkin + 'T00:00:00');
    const checkoutDate = new Date(checkout + 'T00:00:00');
    
    const checkinFmt = checkin.split('-').reverse().join('/');
    const checkoutFmt = checkout.split('-').reverse().join('/');
    
    const diaSemana = checkinDate.getDay();
    const isWeekend = diaSemana === 5 || diaSemana === 6;
    
    let mensagem = `🏨 *POUSADA DOS SONHOS COSTA AZUL*
🌊 *Consulta de Disponibilidade*

📅 *PERÍODO:*
• Check-in: ${checkinFmt} (14h)
• Check-out: ${checkoutFmt} (11h)
• Total de noites: ${noites} noites
${isWeekend ? '⚠️ *Mínimo de 2 noites para fins de semana aplicado*' : ''}

👥 *HÓSPEDES:*
• Adultos: ${adultos}
• Crianças: ${criancas}
• Bebês: ${bebes}
• Pets: ${pets}

━━━━━━━━━━━━━━━━━━━━━
`;
    
    let quartosDisponiveis = 0;
    
    for (const [roomId, data] of Object.entries(results)) {
        if (data.available && data.price > 0) {
            quartosDisponiveis++;
            const roomInfo = ROOMS[roomId];
            const precoComDesconto = pricesWithDiscount[roomId] || 0;
            
            mensagem += `

*${roomInfo.name}*
${roomInfo.description}

💰 *PREÇOS:*
• Original: R$ ${data.price.toFixed(2).replace('.', ',')}
• Com ${desconto}% desconto: R$ ${precoComDesconto.toFixed(2).replace('.', ',')}
${data.note ? `📌 *Nota:* ${data.note}` : ''}

🔗 Link: ${data.url}

━━━━━━━━━━━━━━━━━━━━━`;
        }
    }
    
    if (quartosDisponiveis === 0) {
        mensagem += '\n\n❌ *Nenhum quarto disponível para as datas selecionadas*\n';
    }
    
    mensagem += `

💳 *CONDIÇÕES DE PAGAMENTO:*
• Opção 1: 50% no ato da reserva + 50% no check-in
• Opção 2: 100% à vista com ${desconto}% de desconto

📱 *PIX PARA PAGAMENTO:*
pousadadossonhoscostaazul@gmail.com

✅ *PARA RESERVAR:*
1. Escolha a suíte desejada.
2. Faça o pagamento da entrada de 50% ou o valor de 100% com desconto.
3. Envie o comprovante por este WhatsApp.
4. Informe os dados do titular da reserva e seus acompanhantes (nome completo e documento de identificação).
5. Receba a confirmação da reserva.

🌊 *Política de Cancelamento:*
• Cancelamento grátis até 14 dias antes do check-in.
• Após este período, será cobrado 50% do valor.
• Cancelamento no dia do check-in, não tem reembolso.
• Não comparecimento no dia do check-in, não tem reembolso.

Agradecemos o contato e estamos à disposição!
Equipe Pousada dos Sonhos ✨`;
    
    return mensagem;
}

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});