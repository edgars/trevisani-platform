/**
 * Popula veículos de demonstração para o tenant "demo".
 * Carros populares do mercado brasileiro com fotos e preços realistas em BRL.
 *
 * Uso:
 *   DATABASE_URL="..." DIRECT_URL="..." npx tsx prisma/seed-demo-veiculos.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fotos de carros reais via Unsplash (IDs verificados)
const U = (id: string) =>
  `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=crop`;

const FOTOS: Record<string, { url: string; storagePath: string; legenda: string }[]> = {
  "Onix": [
    { url: U("photo-1555215695-3004980ad54e"), storagePath: "demo/onix-1.jpg",    legenda: "Frente" },
    { url: U("photo-1552519507-da3b142c6e3d"), storagePath: "demo/onix-2.jpg",    legenda: "Lateral" },
  ],
  "Gol": [
    { url: U("photo-1494976388531-d1058494cdd8"), storagePath: "demo/gol-1.jpg",  legenda: "Frente" },
  ],
  "HB20": [
    { url: U("photo-1503376780353-7e6692767b70"), storagePath: "demo/hb20-1.jpg", legenda: "Frente" },
    { url: U("photo-1494976388531-d1058494cdd8"), storagePath: "demo/hb20-2.jpg", legenda: "Lateral" },
  ],
  "Creta": [
    { url: U("photo-1519641471654-76ce0107ad1b"), storagePath: "demo/creta-1.jpg",  legenda: "Frente" },
    { url: U("photo-1533473359331-0135ef1b58bf"), storagePath: "demo/creta-2.jpg",  legenda: "Lateral" },
  ],
  "Corolla": [
    { url: U("photo-1583121274602-3e2820c69888"), storagePath: "demo/corolla-1.jpg", legenda: "Frente" },
    { url: U("photo-1552519507-da3b142c6e3d"),    storagePath: "demo/corolla-2.jpg", legenda: "Lateral" },
  ],
  "Polo": [
    { url: U("photo-1552519507-da3b142c6e3d"), storagePath: "demo/polo-1.jpg", legenda: "Frente" },
    { url: U("photo-1555215695-3004980ad54e"), storagePath: "demo/polo-2.jpg", legenda: "Lateral" },
  ],
  "Argo": [
    { url: U("photo-1503376780353-7e6692767b70"), storagePath: "demo/argo-1.jpg", legenda: "Frente" },
    { url: U("photo-1555215695-3004980ad54e"),    storagePath: "demo/argo-2.jpg", legenda: "Lateral" },
  ],
  "Compass": [
    { url: U("photo-1519641471654-76ce0107ad1b"), storagePath: "demo/compass-1.jpg", legenda: "Frente" },
    { url: U("photo-1485291571150-772bcfc10da5"), storagePath: "demo/compass-2.jpg", legenda: "Lateral" },
  ],
  "T-Cross": [
    { url: U("photo-1533473359331-0135ef1b58bf"), storagePath: "demo/tcross-1.jpg", legenda: "Frente" },
    { url: U("photo-1519641471654-76ce0107ad1b"), storagePath: "demo/tcross-2.jpg", legenda: "Lateral" },
  ],
  "HR-V": [
    { url: U("photo-1485291571150-772bcfc10da5"), storagePath: "demo/hrv-1.jpg", legenda: "Frente" },
    { url: U("photo-1533473359331-0135ef1b58bf"), storagePath: "demo/hrv-2.jpg", legenda: "Lateral" },
  ],
  "Toro": [
    { url: U("photo-1511919884226-fd3cad34687c"), storagePath: "demo/toro-1.jpg", legenda: "Frente" },
    { url: U("photo-1519641471654-76ce0107ad1b"), storagePath: "demo/toro-2.jpg", legenda: "Lateral" },
  ],
  "Pulse": [
    { url: U("photo-1519641471654-76ce0107ad1b"), storagePath: "demo/pulse-1.jpg", legenda: "Frente" },
    { url: U("photo-1583121274602-3e2820c69888"), storagePath: "demo/pulse-2.jpg", legenda: "Lateral" },
  ],
};

const VEICULOS = [
  // ── DISPONÍVEL ────────────────────────────────────────────────────────────
  {
    marca: "Chevrolet", modelo: "Onix", versao: "LTZ 1.0 Turbo AT",
    anoFabricacao: 2023, anoModelo: 2024,
    cor: "Prata", combustivel: "FLEX" as const, cambio: "AUTOMATICO" as const,
    kmAtual: 12_800, placa: "ABC1D23", motor: "1.0T",  portas: 4,
    precoCustoCentavos:   6_500000, precoVendaCentavos:  7_490000,
    status: "DISPONIVEL" as const,
    dataChegada: new Date("2024-03-15"),
    observacoes: "Único dono, revisões em dia na Chevrolet. IPVA 2024 pago.",
    manualProprietario: true, chaveReserva: true,
  },
  {
    marca: "Hyundai", modelo: "Creta", versao: "Platinum 2.0 AT",
    anoFabricacao: 2023, anoModelo: 2023,
    cor: "Azul Aqua", combustivel: "FLEX" as const, cambio: "AUTOMATICO" as const,
    kmAtual: 8_200, placa: "EFG2H34", motor: "2.0",  portas: 4,
    precoCustoCentavos:  11_200000, precoVendaCentavos: 13_500000,
    status: "DISPONIVEL" as const,
    dataChegada: new Date("2024-04-01"),
    observacoes: "Teto solar panorâmico, rodas aro 18, câmera 360°. Excelente estado.",
    manualProprietario: true, chaveReserva: true,
  },
  {
    marca: "Toyota", modelo: "Corolla", versao: "XEi 2.0 Hybrid",
    anoFabricacao: 2022, anoModelo: 2023,
    cor: "Preto Metallic", combustivel: "HIBRIDO" as const, cambio: "AUTOMATICO" as const,
    kmAtual: 22_500, placa: "IJK3L45", motor: "2.0",  portas: 4,
    precoCustoCentavos:  13_800000, precoVendaCentavos: 16_900000,
    status: "DISPONIVEL" as const,
    dataChegada: new Date("2024-02-20"),
    observacoes: "Híbrido flex, excelente consumo (~22 km/l cidade). Central multimídia Toyota Connect.",
    manualProprietario: true, chaveReserva: false,
  },
  {
    marca: "Volkswagen", modelo: "Polo", versao: "GTS 1.4 TSI DSG",
    anoFabricacao: 2023, anoModelo: 2024,
    cor: "Cinza Platinum", combustivel: "FLEX" as const, cambio: "AUTOMATICO" as const,
    kmAtual: 5_100, placa: "MNO4P56", motor: "1.4T",  portas: 4,
    precoCustoCentavos:   9_200000, precoVendaCentavos: 10_800000,
    status: "DISPONIVEL" as const,
    dataChegada: new Date("2024-04-10"),
    observacoes: "VW Polo GTS top de linha. ABS, airbags, controle de estabilidade.",
    manualProprietario: true, chaveReserva: true,
  },
  {
    marca: "Honda", modelo: "HR-V", versao: "EXL 1.5 VTEC Turbo CVT",
    anoFabricacao: 2022, anoModelo: 2023,
    cor: "Branco Platinum", combustivel: "FLEX" as const, cambio: "AUTOMATICO" as const,
    kmAtual: 31_700, placa: "QRS5T67", motor: "1.5T",  portas: 4,
    precoCustoCentavos:  10_500000, precoVendaCentavos: 12_700000,
    status: "DISPONIVEL" as const,
    dataChegada: new Date("2024-01-18"),
    observacoes: "Teto solar, couro, banco aquecido. Honda Sensing (frenagem autônoma).",
    manualProprietario: true, chaveReserva: true,
  },
  {
    marca: "Fiat", modelo: "Pulse", versao: "Impetus 1.0 Turbo AT",
    anoFabricacao: 2023, anoModelo: 2024,
    cor: "Vermelho Monza", combustivel: "FLEX" as const, cambio: "AUTOMATICO" as const,
    kmAtual: 9_400, placa: "UVW6X78", motor: "1.0T",  portas: 4,
    precoCustoCentavos:   7_900000, precoVendaCentavos:  9_200000,
    status: "DISPONIVEL" as const,
    dataChegada: new Date("2024-03-28"),
    observacoes: "SUV compacto, teto solar, câmera de ré, central 10.1 polegadas.",
    manualProprietario: true, chaveReserva: true,
  },
  // ── EM PREPARAÇÃO ─────────────────────────────────────────────────────────
  {
    marca: "Volkswagen", modelo: "Gol", versao: "1.6 MSI Trendline",
    anoFabricacao: 2019, anoModelo: 2020,
    cor: "Vermelho Tornado", combustivel: "FLEX" as const, cambio: "MANUAL" as const,
    kmAtual: 68_200, placa: "BCD7E89", motor: "1.6",  portas: 4,
    precoCustoCentavos:   2_800000, precoVendaCentavos:  3_900000,
    status: "EM_PREPARACAO" as const,
    observacoes: "Aguardando troca de pastilhas e revisão completa. Bom estado geral.",
    manualProprietario: false, chaveReserva: true,
  },
  {
    marca: "Hyundai", modelo: "HB20", versao: "Platinum 1.0 Turbo AT",
    anoFabricacao: 2022, anoModelo: 2023,
    cor: "Branco Polar", combustivel: "FLEX" as const, cambio: "AUTOMATICO" as const,
    kmAtual: 18_900, placa: "FGH8I90", motor: "1.0T",  portas: 4,
    precoCustoCentavos:   5_300000, precoVendaCentavos:  6_500000,
    status: "EM_PREPARACAO" as const,
    observacoes: "Lataria perfeita, interior bem conservado. Em higienização e polimento.",
    manualProprietario: true, chaveReserva: false,
  },
  {
    marca: "Fiat", modelo: "Argo", versao: "Drive 1.3 GSE AT6",
    anoFabricacao: 2022, anoModelo: 2022,
    cor: "Laranja Sicilia", combustivel: "FLEX" as const, cambio: "AUTOMATICO" as const,
    kmAtual: 25_300, placa: "JKL9M01", motor: "1.3",  portas: 4,
    precoCustoCentavos:   4_700000, precoVendaCentavos:  5_900000,
    status: "EM_PREPARACAO" as const,
    observacoes: "Revisão em andamento. Cor rara no mercado.",
    manualProprietario: true, chaveReserva: true,
  },
  // ── RESERVADO ─────────────────────────────────────────────────────────────
  {
    marca: "Jeep", modelo: "Compass", versao: "Limited 2.0 TD350 AT9 4x4",
    anoFabricacao: 2021, anoModelo: 2022,
    cor: "Branco Banchisa", combustivel: "DIESEL" as const, cambio: "AUTOMATICO" as const,
    kmAtual: 47_600, placa: "NOP0Q12", motor: "2.0T",  portas: 4,
    precoCustoCentavos:  13_200000, precoVendaCentavos: 16_200000,
    status: "RESERVADO" as const,
    dataChegada: new Date("2024-01-05"),
    observacoes: "RESERVADO para Rafael Souza. Entrada paga. Documentação em andamento.",
    manualProprietario: true, chaveReserva: true,
  },
  {
    marca: "Volkswagen", modelo: "T-Cross", versao: "Highline 1.4 TSI DSG",
    anoFabricacao: 2023, anoModelo: 2023,
    cor: "Prata Reflex", combustivel: "FLEX" as const, cambio: "AUTOMATICO" as const,
    kmAtual: 15_100, placa: "RST1U23", motor: "1.4T",  portas: 4,
    precoCustoCentavos:  11_000000, precoVendaCentavos: 13_200000,
    status: "RESERVADO" as const,
    dataChegada: new Date("2024-02-14"),
    observacoes: "RESERVADO para Ana Carvalho. Financiamento aprovado Santander.",
    manualProprietario: true, chaveReserva: true,
  },
  // ── VENDIDO ───────────────────────────────────────────────────────────────
  {
    marca: "Fiat", modelo: "Toro", versao: "Freedom 2.0 TDI AT9 4x4",
    anoFabricacao: 2022, anoModelo: 2022,
    cor: "Preto Cinema", combustivel: "DIESEL" as const, cambio: "AUTOMATICO" as const,
    kmAtual: 39_800, placa: "VWX2Y34", motor: "2.0T",  portas: 4,
    precoCustoCentavos:  12_500000, precoVendaCentavos: 15_000000,
    status: "VENDIDO" as const,
    dataChegada: new Date("2023-11-10"),
    observacoes: "Vendido para Carlos Mendes. Lucro líquido estimado R$ 18.500.",
    manualProprietario: true, chaveReserva: true,
  },
];

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: "demo" },
    select: { id: true },
  });

  if (!tenant) {
    console.error("❌ Tenant 'demo' não encontrado. Execute o seed principal primeiro.");
    process.exit(1);
  }

  // Remove veículos demo anteriores (para rodar idempotente)
  const existentes = await prisma.veiculo.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, placa: true },
  });

  if (existentes.length > 0) {
    console.log(`ℹ️  Encontrados ${existentes.length} veículos existentes — mantendo-os.`);
    console.log("   Para recriar do zero, delete os veículos manualmente no banco.\n");
  }

  const placasExistentes = new Set(existentes.map(v => v.placa).filter(Boolean));
  let criados = 0;
  let pulados = 0;

  for (const v of VEICULOS) {
    if (placasExistentes.has(v.placa)) {
      console.log(`⏭  ${v.marca} ${v.modelo} (${v.placa}) — já existe, pulando.`);
      pulados++;
      continue;
    }

    const fotos = FOTOS[v.modelo] ?? [];

    const veiculo = await prisma.veiculo.create({
      data: {
        tenantId:           tenant.id,
        placa:              v.placa,
        marca:              v.marca,
        modelo:             v.modelo,
        versao:             v.versao,
        anoFabricacao:      v.anoFabricacao,
        anoModelo:          v.anoModelo,
        cor:                v.cor,
        combustivel:        v.combustivel,
        cambio:             v.cambio,
        kmAtual:            v.kmAtual,
        motor:              v.motor,
        portas:             v.portas,
        precoCustoCentavos: v.precoCustoCentavos,
        precoVendaCentavos: v.precoVendaCentavos,
        status:             v.status,
        dataChegada:        v.dataChegada ?? null,
        observacoes:        v.observacoes,
        manualProprietario: v.manualProprietario,
        chaveReserva:       v.chaveReserva,
        fotos: {
          create: fotos.map((f, i) => ({
            url:         f.url,
            storagePath: f.storagePath,
            legenda:     f.legenda,
            destaque:    i === 0,
            ordem:       i,
            categoria:   "EXTERNA" as const,
            status:      "PRONTO_VENDA" as const,
          })),
        },
      },
    });

    const emoji =
      v.status === "DISPONIVEL"    ? "🟢" :
      v.status === "EM_PREPARACAO" ? "🟡" :
      v.status === "RESERVADO"     ? "🔵" : "⚫";

    const preco = (v.precoVendaCentavos / 100).toLocaleString("pt-BR", {
      style: "currency", currency: "BRL",
    });

    console.log(`${emoji} ${v.marca} ${v.modelo} ${v.versao} (${v.placa}) — ${preco} [${v.status}]`);
    criados++;
  }

  console.log(`\n✅ Concluído: ${criados} criados, ${pulados} pulados.`);
  console.log(`   Tenant: demo | Total de veículos: ${existentes.length + criados}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
