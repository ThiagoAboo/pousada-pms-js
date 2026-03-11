import axios from 'axios';

// Configuração dos quartos
const ROOMS = {
    "1503584633402633674": { name: "Suíte Costa Azul" },
    "1535677362018464574": { name: "Suíte Praia da Tartaruga" },
    "1507145359441207299": { name: "Suíte Praia da Baleia" }
};

// Preços base para fallback
const PRECOS_BASE = {
    "1503584633402633674": 450,
    "1535677362018464574": 350,
    "1507145359441207299": 550
};

// Função para consultar preços via API não oficial
async function consultarViaAPI(roomId, checkin, checkout, adultos) {
    try {
        // Tentativa 1: Usar API de calendário público (quando disponível)
        const calendarUrl = `https://www.airbnb.com.br/api/v2/calendar_months?key=d306zoyjsyarp7ifhu67rjxn52tv0t20&currency=BRL&locale=pt&listing_id=${roomId}&month=${new Date(checkin).getMonth() + 1}&year=${new Date(checkin).getFullYear()}&count=3`;
        
        const response = await axios.get(calendarUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
            }
        });

        if (response.data && response.data.calendar_months) {
            // Processar dados do calendário
            for (const month of response.data.calendar_months) {
                for (const day of month.days) {
                    if (day.date === checkin) {
                        return {
                            price: day.price?.total || day.price?.localPrice,
                            available: day.available
                        };
                    }
                }
            }
        }
        
        return null;
    } catch (error) {
        console.log(`⚠️ API fallback para quarto ${roomId} falhou:`, error.message);
        return null;
    }
}

// Função principal de consulta
export async function consultarAirbnbAPI(checkin, checkout, adultos, criancas = 0, bebes = 0, pets = 0) {
    console.log(`\n🔍 Consultando Airbnb via API para ${checkin} até ${checkout}...`);
    
    const results = {};
    const guests = adultos + criancas;
    
    for (const [roomId, roomInfo] of Object.entries(ROOMS)) {
        console.log(`\n📌 Processando: ${roomInfo.name}`);
        
        try {
            // Tentar consultar via API
            const apiResult = await consultarViaAPI(roomId, checkin, checkout, adultos);
            
            if (apiResult && apiResult.available) {
                const preco = apiResult.price * (checkout - checkin) / (1000 * 60 * 60 * 24);
                
                results[roomId] = {
                    name: roomInfo.name,
                    price: preco,
                    available: true,
                    url: `https://www.airbnb.com.br/rooms/1503584633402633674/room-details?guests=${guests}&adults=${adultos}&children=${criancas}&infants=${bebes}&check_in=${checkin}&check_out=${checkout}&room_id=${roomId}&room_origin=room_section&s=67`
                };
                
                console.log(`  ✅ Disponível via API - R$ ${preco.toFixed(2)}`);
            } else {
                // Fallback para preços base
                const noites = (new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24);
                const precoBase = PRECOS_BASE[roomId] * noites;
                
                results[roomId] = {
                    name: roomInfo.name,
                    price: precoBase,
                    available: true,
                    url: `https://www.airbnb.com.br/rooms/1503584633402633674/room-details?guests=${guests}&adults=${adultos}&children=${criancas}&infants=${bebes}&check_in=${checkin}&check_out=${checkout}&room_id=${roomId}&room_origin=room_section&s=67`,
                    note: "Preço base (consulta em tempo real indisponível)"
                };
                
                console.log(`  ⚠️ Usando preço base: R$ ${precoBase.toFixed(2)}`);
            }
            
        } catch (error) {
            console.log(`  ❌ Erro: ${error.message}`);
            
            // Fallback em caso de erro
            const noites = (new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24);
            const precoBase = PRECOS_BASE[roomId] * noites;
            
            results[roomId] = {
                name: roomInfo.name,
                price: precoBase,
                available: true,
                url: `https://www.airbnb.com.br/rooms/1503584633402633674/room-details?guests=${guests}&adults=${adultos}&children=${criancas}&infants=${bebes}&check_in=${checkin}&check_out=${checkout}&room_id=${roomId}&room_origin=room_section&s=67`,
                note: "Preço base (erro na consulta)"
            };
        }
    }
    
    return results;
}