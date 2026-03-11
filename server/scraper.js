import { chromium } from 'playwright';

const LISTING_ID = "1503584633402633674";

const ROOMS = {
    "1503584633402633674": { name: "Suíte Costa Azul" },
    "1535677362018464574": { name: "Suíte Praia da Tartaruga" },
    "1507145359441207299": { name: "Suíte Praia da Baleia" }
};

// Lista de user agents para rotacionar
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

// Função para extrair preço do card
async function extrairPrecoDoCard(card) {
    try {
        const priceSelectors = [
            'span.u174bpcy',
            'span[class*="price"]',
            'div[class*="price"] span',
            'span[class*="_tyxjp1"]'
        ];
        
        for (const selector of priceSelectors) {
            const priceElement = await card.$(selector);
            if (priceElement) {
                const priceText = await priceElement.textContent();
                const match = priceText.match(/R\$\s*([\d.,]+)/);
                if (match) {
                    const priceStr = match[1].replace(/\./g, '').replace(',', '.');
                    return parseFloat(priceStr);
                }
            }
        }
        
        // Se não encontrou com seletores, busca qualquer R$ no texto
        const allText = await card.textContent();
        const matches = allText.match(/R\$\s*([\d.,]+)/g);
        if (matches) {
            const match = matches[0].match(/R\$\s*([\d.,]+)/);
            if (match) {
                const priceStr = match[1].replace(/\./g, '').replace(',', '.');
                return parseFloat(priceStr);
            }
        }
        
        return null;
    } catch (error) {
        console.error('Erro ao extrair preço:', error);
        return null;
    }
}

// Função para verificar disponibilidade
async function verificarDisponibilidade(card) {
    try {
        // Verificar se existe o elemento "Indisponível"
        const unavailableSelectors = [
            'div.s1ll9psn:has-text("Indisponível")',
            'div:has-text("Indisponível")',
            'div:has-text("não disponível")'
        ];
        
        for (const selector of unavailableSelectors) {
            const unavailableElement = await card.$(selector);
            if (unavailableElement) {
                return false;
            }
        }
        
        // Verificar se há botão de reservar
        const reserveButton = await card.$('button:has-text("Reservar")');
        return !!reserveButton;
        
    } catch (error) {
        console.error('Erro ao verificar disponibilidade:', error);
        return false;
    }
}

// Função principal de consulta com tentativas
async function consultarAirbnbComTentativas(checkin, checkout, adultos, criancas = 0, bebes = 0, pets = 0, tentativa = 1) {
    console.log(`\n🔄 Tentativa ${tentativa} de 3...`);
    
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-web-security'
        ]
    });
    
    try {
        const context = await browser.newContext({
            userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
            viewport: { width: 1920, height: 1080 },
            locale: 'pt-BR',
            timezoneId: 'America/Sao_Paulo'
        });
        
        // Injetar script para esconder automação
        await context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        });
        
        const page = await context.newPage();
        
        const guests = adultos + criancas;
        const url = `https://www.airbnb.com.br/rooms/${LISTING_ID}/room-details?guests=${guests}&adults=${adultos}&children=${criancas}&infants=${bebes}&check_in=${checkin}&check_out=${checkout}&s=67`;
        
        console.log(`🌐 Acessando: ${url}`);
        
        const timeout = tentativa === 1 ? 60000 : 90000;
        const waitUntil = tentativa === 1 ? 'networkidle' : 'domcontentloaded';
        
        await page.goto(url, { waitUntil, timeout });
        await page.waitForTimeout(3000 + (tentativa * 2000));
        
        const results = {};
        
        for (const [roomId, roomInfo] of Object.entries(ROOMS)) {
            console.log(`\n🔍 Buscando: ${roomInfo.name} (ID: ${roomId})`);
            
            // Buscar card pelo aria-describedby
            const cardSelector = `button[aria-describedby*="${roomId}"]`;
            let card = await page.$(cardSelector);
            
            if (!card) {
                console.log(`  ⚠️  Card não encontrado com aria-describedby, tentando outras estratégias...`);
                
                const strategies = [
                    `[id*="${roomId}"]`,
                    `//div[contains(text(), "${roomInfo.name}")]/ancestor::button`
                ];
                
                for (const strategy of strategies) {
                    if (strategy.startsWith('//')) {
                        card = await page.$(`xpath=${strategy}`);
                    } else {
                        card = await page.$(strategy);
                    }
                    if (card) break;
                }
            }
            
            if (card) {
                console.log(`  ✅ Card encontrado!`);
                
                const preco = await extrairPrecoDoCard(card);
                const disponivel = await verificarDisponibilidade(card);
                
                if (preco) console.log(`  💰 Preço: R$ ${preco}`);
                console.log(`  📊 Disponível: ${disponivel}`);
                
                const urlQuarto = `https://www.airbnb.com.br/rooms/${LISTING_ID}/room-details?guests=${guests}&adults=${adultos}&children=${criancas}&infants=${bebes}&check_in=${checkin}&check_out=${checkout}&room_id=${roomId}&room_origin=room_section&s=67`;
                
                results[roomId] = {
                    name: roomInfo.name,
                    price: preco || 0,
                    available: disponivel && preco > 0,
                    url: urlQuarto
                };
            } else {
                console.log(`  ❌ Card NÃO encontrado - quarto indisponível`);
                results[roomId] = {
                    name: roomInfo.name,
                    price: 0,
                    available: false,
                    reason: "Quarto não disponível para as datas selecionadas",
                    url: `https://www.airbnb.com.br/rooms/${LISTING_ID}/room-details?room_id=${roomId}&check_in=${checkin}&check_out=${checkout}`
                };
            }
        }
        
        await browser.close();
        return results;
        
    } catch (error) {
        console.error(`❌ Erro na tentativa ${tentativa}:`, error.message);
        await browser.close();
        
        if (tentativa < 3) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            return consultarAirbnbComTentativas(checkin, checkout, adultos, criancas, bebes, pets, tentativa + 1);
        } else {
            // Fallback: preços base
            console.log('\n⚠️  Usando preços base (fallback)');
            const results = {};
            const guests = adultos + criancas;
            
            const precosBase = {
                "1503584633402633674": 208,
                "1535677362018464574": 163,
                "1507145359441207299": 268
            };
            
            for (const [roomId, roomInfo] of Object.entries(ROOMS)) {
                const urlQuarto = `https://www.airbnb.com.br/rooms/${LISTING_ID}/room-details?guests=${guests}&adults=${adultos}&children=${criancas}&infants=${bebes}&check_in=${checkin}&check_out=${checkout}&room_id=${roomId}&room_origin=room_section&s=67`;
                
                results[roomId] = {
                    name: roomInfo.name,
                    price: precosBase[roomId] || 200,
                    available: true,
                    url: urlQuarto,
                    note: "Preço base (consulta em tempo real indisponível)"
                };
            }
            
            return results;
        }
    }
}

// Função pública de consulta
export async function consultarAirbnb(checkin, checkout, adultos, criancas = 0, bebes = 0, pets = 0) {
    try {
        return await consultarAirbnbComTentativas(checkin, checkout, adultos, criancas, bebes, pets);
    } catch (error) {
        console.error('Erro na consulta:', error);
        
        // Fallback em caso de erro
        const results = {};
        const guests = adultos + criancas;
        
        const precosBase = {
            "1503584633402633674": 208,
            "1535677362018464574": 163,
            "1507145359441207299": 268
        };
        
        for (const [roomId, roomInfo] of Object.entries(ROOMS)) {
            const urlQuarto = `https://www.airbnb.com.br/rooms/${LISTING_ID}/room-details?guests=${guests}&adults=${adultos}&children=${criancas}&infants=${bebes}&check_in=${checkin}&check_out=${checkout}&room_id=${roomId}&room_origin=room_section&s=67`;
            
            results[roomId] = {
                name: roomInfo.name,
                price: precosBase[roomId] || 200,
                available: true,
                url: urlQuarto,
                note: "Preço base (erro na consulta)"
            };
        }
        
        return results;
    }
}