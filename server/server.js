import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { consultarAirbnb } from './scraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta public (que está na raiz do projeto)
app.use(express.static(path.join(__dirname, '../public')));

// Rota principal - serve o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

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

// ... (resto do código do servidor permanece igual)