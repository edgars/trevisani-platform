/**
 * Catálogo de veículos do mercado brasileiro — baseado na tabela FIPE.
 * Cobre carros de passeio, motos e utilitários leves mais comercializados.
 * Usado nos selects de Marca → Modelo do formulário de cadastro.
 */

export type TipoVeiculo = "carros" | "motos" | "caminhoes";

export interface MarcaVeiculo {
  nome: string;
  modelos: string[];
}

// ─── CARROS DE PASSEIO ───────────────────────────────────────────────────────

const CARROS: MarcaVeiculo[] = [
  {
    nome: "Volkswagen",
    modelos: [
      "Gol", "Gol G4", "Gol G5", "Gol G6", "Gol G7",
      "Polo", "Polo GTS", "Polo Track",
      "Virtus", "Virtus GTS",
      "T-Cross", "Nivus",
      "Tiguan", "Tiguan Allspace",
      "Jetta", "Jetta GLi",
      "up!", "Fox", "Voyage", "Saveiro", "Saveiro Cross",
      "Golf", "Golf GTI", "Golf R",
      "Crossfox", "SpaceFox", "SpaceCross",
      "Amarok", "Amarok V6",
      "Passat", "Touareg", "Arteon",
      "ID.4", "ID.6",
    ],
  },
  {
    nome: "Fiat",
    modelos: [
      "Argo", "Argo Drive", "Argo HGT", "Argo Trekking",
      "Mobi", "Mobi Drive", "Mobi Like",
      "Cronos", "Cronos Drive", "Cronos Precision",
      "Pulse", "Pulse Audace", "Pulse Impetus",
      "Fastback", "Fastback Abarth",
      "Strada", "Strada Ranch", "Strada Volcano",
      "Toro", "Toro Ranch", "Toro Ultra",
      "Uno", "Palio", "Siena", "Grand Siena",
      "Doblo", "Doblo Cargo",
      "Bravo", "Linea",
      "500", "500 Abarth",
      "Freemont",
      "Ducato",
    ],
  },
  {
    nome: "GM - Chevrolet",
    modelos: [
      "Onix", "Onix Plus", "Onix RS", "Onix Turbo",
      "Tracker", "Tracker Premier", "Tracker Midnight",
      "Montana", "Montana AT",
      "S10", "S10 LTZ", "S10 High Country",
      "Spin", "Spin LTZ", "Spin Activ",
      "Equinox", "Trailblazer", "Trailblazer Premier",
      "Cruze", "Cruze Sport6",
      "Prisma", "Cobalt", "Agile",
      "Classic", "Corsa", "Celta",
      "Zafira", "Captiva", "Vectra",
      "Camaro", "Blazer",
    ],
  },
  {
    nome: "Hyundai",
    modelos: [
      "HB20", "HB20 Diamond", "HB20 Platinum",
      "HB20S", "HB20S Diamond", "HB20S Platinum",
      "Creta", "Creta Action", "Creta Platinum",
      "Creta New", "Creta New Ultimate",
      "IX35", "IX35 GL",
      "Tucson", "Tucson GLS",
      "i30",
      "Azera", "Veloster",
      "Santa Fe", "Santa Fe GLS",
      "Ioniq 5", "Ioniq 6",
    ],
  },
  {
    nome: "Toyota",
    modelos: [
      "Corolla", "Corolla Altis", "Corolla Altis Premium",
      "Corolla Cross", "Corolla Cross XRX",
      "Hilux", "Hilux SRX", "Hilux GR-S", "Hilux SR", "Hilux STD",
      "SW4", "SW4 Diamond",
      "Yaris", "Yaris XL", "Yaris XS",
      "RAV4", "RAV4 Hybrid",
      "Land Cruiser", "Land Cruiser Prado",
      "Etios", "Etios Cross",
      "Prius", "C-HR",
      "Camry",
      "GR Supra", "GR86",
    ],
  },
  {
    nome: "Honda",
    modelos: [
      "Civic", "Civic EXL", "Civic Touring", "Civic Si", "Civic Type R",
      "City", "City Hatch", "City EXL", "City Touring",
      "Fit", "Fit EXL",
      "HR-V", "HR-V EX", "HR-V EXL", "HR-V Touring",
      "WR-V", "WR-V EX", "WR-V EXL",
      "CR-V", "CR-V Touring",
      "ZR-V",
      "Accord", "Accord Touring",
      "Odyssey",
    ],
  },
  {
    nome: "Renault",
    modelos: [
      "Kwid", "Kwid Zen", "Kwid Intense", "Kwid E-Tech",
      "Sandero", "Sandero Stepway", "Sandero RS",
      "Logan", "Logan Expression",
      "Duster", "Duster Iconic", "Duster Oroch",
      "Oroch", "Oroch Expression", "Oroch Outsider",
      "Captur", "Captur Intense", "Captur Bose",
      "Zoe", "Zoe Life",
      "Fluence", "Symbol",
      "Clio", "Megane",
      "Arkana",
    ],
  },
  {
    nome: "Ford",
    modelos: [
      "Ka", "Ka Sedan", "Ka SE", "Ka SEL", "Ka Freestyle",
      "EcoSport", "EcoSport SE", "EcoSport Titanium", "EcoSport Storm",
      "Territory", "Territory SEL", "Territory Titanium",
      "Ranger", "Ranger XLS", "Ranger XLT", "Ranger Limited", "Ranger Raptor",
      "Maverick", "Maverick Tremor",
      "Mustang", "Mustang Mach-E",
      "Bronco Sport",
      "Edge", "Focus", "Fiesta",
      "Fusion",
    ],
  },
  {
    nome: "Jeep",
    modelos: [
      "Renegade", "Renegade Sport", "Renegade Longitude", "Renegade Limited", "Renegade Trailhawk",
      "Compass", "Compass Sport", "Compass Longitude", "Compass Limited", "Compass Overland", "Compass Trailhawk",
      "Commander", "Commander Sport", "Commander Longitude", "Commander Limited", "Commander Overland",
      "Wrangler", "Wrangler Rubicon", "Wrangler Unlimited",
      "Grand Cherokee", "Grand Cherokee Limited", "Grand Cherokee Overland", "Grand Cherokee L",
      "Cherokee",
    ],
  },
  {
    nome: "Nissan",
    modelos: [
      "Kicks", "Kicks S", "Kicks SV", "Kicks Advance",
      "Sentra", "Sentra SV", "Sentra Advance",
      "Versa", "Versa SV", "Versa Advance",
      "Frontier", "Frontier S", "Frontier XE", "Frontier LE", "Frontier Pro-4X",
      "Leaf",
      "X-Trail", "Altima", "Murano",
      "March",
    ],
  },
  {
    nome: "BMW",
    modelos: [
      "116i", "118i", "120i", "M135i",
      "320i", "330i", "330e", "M340i", "M3",
      "420i", "430i", "M4",
      "520i", "530i", "530e", "M5",
      "X1", "X2", "X3", "X3 M", "X4", "X5", "X5 M", "X6", "X7",
      "Z4",
      "i3", "i4", "iX3", "iX",
      "M2",
    ],
  },
  {
    nome: "Mercedes-Benz",
    modelos: [
      "A 200", "A 250", "A 35 AMG", "A 45 AMG",
      "C 180", "C 200", "C 300", "C 43 AMG", "C 63 AMG",
      "E 200", "E 300", "E 43 AMG",
      "S 500", "S 580",
      "GLA 200", "GLA 250",
      "GLB 200", "GLB 250",
      "GLC 200", "GLC 300", "GLC 43 AMG",
      "GLE 300d", "GLE 400d", "GLE 53 AMG",
      "GLS 450", "G 500", "G 63 AMG",
      "EQA", "EQB", "EQC", "EQS",
      "CLA 200", "CLA 250",
    ],
  },
  {
    nome: "Audi",
    modelos: [
      "A1 Sportback", "A3 Sedan", "A3 Sportback",
      "A4", "A4 Avant",
      "A5 Coupé", "A5 Sportback",
      "A6", "A7", "A8",
      "Q2", "Q3", "Q3 Sportback",
      "Q5", "Q5 Sportback",
      "Q7", "Q8",
      "TT", "TTS",
      "RS3", "RS5", "RS6", "RS7", "RS Q3", "RS Q8",
      "R8",
      "e-tron", "e-tron GT", "Q4 e-tron",
    ],
  },
  {
    nome: "Mitsubishi",
    modelos: [
      "Eclipse Cross", "Eclipse Cross HPE-S",
      "Outlander", "Outlander PHEV",
      "ASX", "ASX HPE-S",
      "L200 Triton", "L200 Triton Sport", "L200 Triton GLS",
      "Pajero", "Pajero Full", "Pajero Sport", "Pajero Dakar",
      "Lancer",
      "Galant",
    ],
  },
  {
    nome: "Peugeot",
    modelos: [
      "208", "208 Active", "208 Allure", "208 GT", "208 GT Line",
      "2008", "2008 Active", "2008 Allure", "2008 GT",
      "3008", "3008 Griffe", "3008 GT",
      "5008", "5008 GT",
      "408", "408 Griffe",
      "Partner",
      "308", "508",
    ],
  },
  {
    nome: "Citroën",
    modelos: [
      "C3", "C3 Feel", "C3 Origins", "C3 Shine",
      "C4 Cactus", "C4 Cactus Feel", "C4 Cactus Shine",
      "C3 Aircross", "C3 Aircross Feel", "C3 Aircross Shine",
      "C5 Aircross", "C5 Aircross Feel", "C5 Aircross Shine",
      "Jumpy",
      "C4", "C5 X",
    ],
  },
  {
    nome: "Kia",
    modelos: [
      "Stonic", "Stonic EX",
      "Sportage", "Sportage EX", "Sportage LX",
      "Sorento", "Sorento EX",
      "Cerato", "Cerato SX",
      "Carnival", "Carnival EX",
      "Picanto", "Soul",
      "EV6",
      "Niro",
    ],
  },
  {
    nome: "Subaru",
    modelos: [
      "Impreza", "Impreza 2.0i",
      "Forester", "Forester 2.0i", "Forester XT",
      "Outback", "Outback 2.5i",
      "XV", "XV 2.0i",
      "WRX", "WRX STi",
      "BRZ",
      "Ascent",
    ],
  },
  {
    nome: "Volvo",
    modelos: [
      "XC40", "XC40 Recharge",
      "XC60", "XC60 Inscription", "XC60 Recharge",
      "XC90", "XC90 Inscription", "XC90 Recharge",
      "S60", "S90",
      "V60", "V90",
      "C40 Recharge",
      "EX30", "EX90",
    ],
  },
  {
    nome: "Land Rover",
    modelos: [
      "Range Rover", "Range Rover HSE", "Range Rover Autobiography", "Range Rover SVAutobiography",
      "Range Rover Sport", "Range Rover Sport HSE", "Range Rover Sport SVR",
      "Range Rover Velar", "Range Rover Evoque",
      "Defender", "Defender 90", "Defender 110", "Defender 130",
      "Discovery", "Discovery HSE",
      "Discovery Sport", "Discovery Sport HSE",
    ],
  },
  {
    nome: "Porsche",
    modelos: [
      "Cayenne", "Cayenne S", "Cayenne GTS", "Cayenne Turbo", "Cayenne E-Hybrid",
      "Macan", "Macan S", "Macan GTS",
      "911 Carrera", "911 Carrera S", "911 Carrera 4S", "911 Turbo", "911 GT3",
      "Panamera", "Panamera 4S", "Panamera GTS", "Panamera Turbo",
      "Taycan", "Taycan 4S", "Taycan GTS", "Taycan Turbo",
      "Boxster", "Cayman",
    ],
  },
  {
    nome: "BYD",
    modelos: [
      "Dolphin", "Dolphin Mini",
      "Seal", "Seal DM-i",
      "Song Plus", "Song Plus DM-i",
      "Atto 3",
      "Han", "Han EV",
      "Tan", "Tang",
      "Yuan Plus",
    ],
  },
  {
    nome: "CAOA Chery",
    modelos: [
      "Tiggo 2", "Tiggo 2 Pro", "Tiggo 2 Pro Max",
      "Tiggo 5x", "Tiggo 5x Pro",
      "Tiggo 7", "Tiggo 7 Pro", "Tiggo 7 Pro Max",
      "Tiggo 8", "Tiggo 8 Pro", "Tiggo 8 Pro e+",
      "Arrizo 6", "Arrizo 6 Pro",
    ],
  },
  {
    nome: "GWM",
    modelos: [
      "Haval H6", "Haval H6 GT",
      "Haval H2",
      "Haval Jolion", "Haval Jolion HEV",
      "Ora 03", "Ora Punk Cat",
      "Poer",
      "Tank 300",
    ],
  },
  {
    nome: "JAC",
    modelos: [
      "J3", "J5",
      "T6", "T6 Turbo",
      "T8", "T8 Pro",
      "E-JS1",
      "iEV40",
    ],
  },
  {
    nome: "Dodge",
    modelos: [
      "Durango", "Durango SXT", "Durango GT", "Durango Citadel", "Durango SRT",
      "Journey", "Journey SXT", "Journey RT", "Journey Crossroad",
      "Challenger", "Challenger SXT", "Challenger R/T", "Challenger SRT",
      "Charger", "Charger SXT", "Charger R/T",
      "RAM 1500",
    ],
  },
  {
    nome: "RAM",
    modelos: [
      "1000", "1000 Sport",
      "2500", "2500 Laramie", "2500 Longhorn", "2500 Limited",
      "3500", "3500 Laramie", "3500 Longhorn",
    ],
  },
  {
    nome: "Lexus",
    modelos: [
      "ES 250", "ES 300h",
      "IS 300", "IS 350",
      "GS 350",
      "RX 300", "RX 350", "RX 450h",
      "NX 200t", "NX 300h", "NX 350h",
      "UX 250h",
      "LX 570", "LX 600",
      "LC 500", "LC 500h",
    ],
  },
  {
    nome: "Mazda",
    modelos: [
      "Mazda2", "Mazda3", "Mazda6",
      "CX-3", "CX-30", "CX-5", "CX-9",
      "MX-5", "MX-30",
    ],
  },
  {
    nome: "Suzuki",
    modelos: [
      "Swift", "Swift Sport",
      "Vitara", "Vitara 4Life",
      "Jimny", "Jimny Sierra",
      "Baleno",
      "S-Cross", "SX4",
      "Grand Vitara",
    ],
  },
  {
    nome: "MINI",
    modelos: [
      "Cooper", "Cooper S", "John Cooper Works",
      "Cooper Cabrio", "Cooper S Cabrio",
      "Countryman", "Countryman S",
      "Clubman", "Clubman S",
      "Paceman",
      "Coupe", "Roadster",
      "Cooper SE",
    ],
  },
  {
    nome: "Alfa Romeo",
    modelos: [
      "Giulia", "Giulia Ti", "Giulia Veloce", "Giulia Quadrifoglio",
      "Stelvio", "Stelvio Ti", "Stelvio Veloce", "Stelvio Quadrifoglio",
      "Tonale", "Tonale Ti",
      "Giulietta", "MiTo",
    ],
  },
  {
    nome: "Ferrari",
    modelos: [
      "296 GTB", "296 GTS",
      "F8 Tributo", "F8 Spider",
      "SF90 Stradale", "SF90 Spider",
      "Roma", "Roma Spider",
      "Portofino M",
      "812 Superfast", "812 GTS",
      "Purosangue",
    ],
  },
  {
    nome: "Lamborghini",
    modelos: [
      "Urus", "Urus Performante", "Urus S",
      "Huracán EVO", "Huracán STO",
      "Aventador SVJ", "Aventador LP",
      "Revuelto",
    ],
  },
  {
    nome: "Maserati",
    modelos: [
      "Ghibli", "Ghibli S",
      "Levante", "Levante S", "Levante GT",
      "Quattroporte", "Quattroporte S",
      "GranTurismo", "GranCabrio",
      "Grecale",
    ],
  },
  {
    nome: "Jaguar",
    modelos: [
      "XE", "XE R-Dynamic",
      "XF", "XF R-Dynamic",
      "F-Pace", "F-Pace R-Dynamic", "F-Pace SVR",
      "E-Pace", "E-Pace R-Dynamic",
      "F-Type", "F-Type R",
      "I-Pace",
    ],
  },
  {
    nome: "Acura",
    modelos: ["ILX", "TLX", "TLX Type S", "MDX", "RDX", "RDX A-Spec"],
  },
  {
    nome: "Chrysler",
    modelos: ["300", "300C", "300S", "Pacifica", "Voyager"],
  },
  {
    nome: "Daewoo",
    modelos: ["Lanos", "Nubira", "Leganza", "Tacuma", "Matiz"],
  },
  {
    nome: "EFFA",
    modelos: ["M100", "M200", "Starmax"],
  },
  {
    nome: "Geely",
    modelos: ["Coolray", "Tugella", "Monjaro", "Atlas"],
  },
];

// ─── MOTOS ───────────────────────────────────────────────────────────────────

const MOTOS: MarcaVeiculo[] = [
  {
    nome: "Honda",
    modelos: [
      "CG 160 Fan", "CG 160 Start", "CG 160 Cargo",
      "CG 150 Fan", "CG 150 Titan",
      "CB 250F Twister", "CB 300F Twister",
      "CB 300R", "CB 500F", "CB 500X",
      "CB 600F Hornet", "CB 650R",
      "CB 1000R", "CB 1000X",
      "CBR 500R", "CBR 600RR", "CBR 1000RR Fireblade",
      "NC 750X", "NC 750S",
      "XRE 190", "XRE 300",
      "Africa Twin", "Africa Twin Adventure Sports",
      "PCX 150", "PCX 160",
      "NXR 150 Bros", "NXR 160 Bros",
      "Biz 100", "Biz 110", "Biz 125",
      "ADV 150", "ADV 350",
      "Monkey",
    ],
  },
  {
    nome: "Yamaha",
    modelos: [
      "Factor 125", "Factor 150",
      "Fazer 150", "Fazer 250",
      "MT-03", "MT-07", "MT-09", "MT-10",
      "R3", "R6", "R1",
      "Crosser 150", "Crosser 150 Z",
      "NMAX 160", "NMAX 160 Connected",
      "XMAX 250", "TMAX 560",
      "Lander 250",
      "Ténéré 250", "Ténéré 700",
      "FZ25",
      "Drag'Star 650",
      "Neo 115", "Neo 125",
    ],
  },
  {
    nome: "Kawasaki",
    modelos: [
      "Ninja 300", "Ninja 400", "Ninja 650", "Ninja ZX-6R", "Ninja ZX-10R",
      "Z 300", "Z 400", "Z 650", "Z 900", "Z H2",
      "Versys 300", "Versys 650", "Versys 1000",
      "W800",
      "KLX 300",
    ],
  },
  {
    nome: "Suzuki",
    modelos: [
      "V-Strom 650", "V-Strom 1050",
      "GSX-R 750", "GSX-R 1000R",
      "GSX-S 750", "GSX-S 1000",
      "Burgman 125", "Burgman 200", "Burgman 400",
      "Bandit 650S", "Bandit 1250S",
      "Hayabusa",
      "DR 650",
    ],
  },
  {
    nome: "BMW",
    modelos: [
      "G 310 R", "G 310 GS",
      "F 750 GS", "F 850 GS",
      "R 1250 GS", "R 1250 GS Adventure",
      "S 1000 RR", "S 1000 R", "S 1000 XR",
      "M 1000 RR",
      "C 400 X", "C 400 GT", "C Evolution",
    ],
  },
  {
    nome: "Triumph",
    modelos: [
      "Tiger 660 Sport", "Tiger 850 Sport", "Tiger 900", "Tiger 1200",
      "Bonneville T120", "Bonneville Bobber", "Bonneville Speedmaster",
      "Speed Triple 1200 RS",
      "Scrambler 400 X", "Scrambler 900", "Scrambler 1200",
      "Trident 660",
      "Rocket 3",
      "Daytona 675",
    ],
  },
  {
    nome: "Royal Enfield",
    modelos: [
      "Himalayan 411", "Himalayan 450",
      "Meteor 350",
      "Classic 350", "Classic 500",
      "Interceptor 650", "Continental GT 650",
      "Hunter 350",
      "Super Meteor 650",
      "Guerrilla 450",
    ],
  },
  {
    nome: "Dafra",
    modelos: [
      "Speed 150", "Speed 170",
      "Horizon 150",
      "Kansas 150",
      "Roadwin 250R",
      "Super 50",
      "Citycom 300",
      "Apache RTR 200 4V",
    ],
  },
  {
    nome: "Ducati",
    modelos: [
      "Monster", "Monster SP",
      "Panigale V2", "Panigale V4", "Panigale V4 S",
      "Multistrada V4", "Multistrada V4 S",
      "Hypermotard 698", "Hypermotard 950",
      "Diavel V4",
      "Scrambler Icon", "Scrambler Desert Sled",
      "SuperSport",
      "Streetfighter V4",
    ],
  },
  {
    nome: "Harley-Davidson",
    modelos: [
      "Sportster S", "Sportster Iron 883", "Nightster",
      "Street Glide", "Street Glide Special",
      "Road Glide", "Road King",
      "Fat Boy", "Fat Bob", "Softail Standard",
      "Low Rider S", "Low Rider ST",
      "Pan America 1250",
      "Livewire",
    ],
  },
];

// ─── CAMINHÕES E UTILITÁRIOS ─────────────────────────────────────────────────

const CAMINHOES: MarcaVeiculo[] = [
  {
    nome: "Ford",
    modelos: ["Cargo 816", "Cargo 1119", "Cargo 1519", "Cargo 2429", "F-250", "F-350", "F-4000"],
  },
  {
    nome: "Volkswagen",
    modelos: ["Delivery 6.160", "Delivery 9.170", "Constellation 17.280", "Constellation 24.280", "Meteor 29.530"],
  },
  {
    nome: "Mercedes-Benz",
    modelos: ["Accelo 815", "Atego 1719", "Actros 2646", "Sprinter 313", "Sprinter 415"],
  },
  {
    nome: "Volvo",
    modelos: ["VM 270", "FH 460", "FH 500", "FM 380", "FMX 460"],
  },
  {
    nome: "Scania",
    modelos: ["G 360", "P 310", "R 440", "R 540", "S 500"],
  },
  {
    nome: "Iveco",
    modelos: ["Daily 35-150", "Daily 45-200", "Tector 9.190", "Stralis 480", "Hi-Way 440"],
  },
  {
    nome: "MAN",
    modelos: ["TGX 29.520", "TGS 26.420", "TGM 18.250", "TGL 8.180"],
  },
  {
    nome: "DAF",
    modelos: ["XF 480", "XG 480", "CF 340"],
  },
];

// ─── Exports ─────────────────────────────────────────────────────────────────

export const CATALOGO_VEICULOS: Record<TipoVeiculo, MarcaVeiculo[]> = {
  carros: CARROS,
  motos: MOTOS,
  caminhoes: CAMINHOES,
};

/** Retorna marcas de um tipo, ordenadas A-Z. */
export function getMarcas(tipo: TipoVeiculo): string[] {
  return CATALOGO_VEICULOS[tipo].map((m) => m.nome).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Retorna modelos de uma marca, ordenados A-Z. */
export function getModelos(tipo: TipoVeiculo, marca: string): string[] {
  const entry = CATALOGO_VEICULOS[tipo].find(
    (m) => m.nome.toLowerCase() === marca.toLowerCase(),
  );
  return (entry?.modelos ?? []).slice().sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Anos de fabricação para selects (1990 até ano atual). */
export function getAnosFabricacao(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y >= 1990; y--) years.push(y);
  return years;
}

/** Anos de modelo (ano atual + 1 até 1990). */
export function getAnosModelo(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current + 1; y >= 1990; y--) years.push(y);
  return years;
}

export const CORES_COMUNS = [
  "Branco", "Preto", "Prata", "Cinza", "Vermelho", "Azul",
  "Verde", "Amarelo", "Laranja", "Marrom", "Bege", "Dourado",
  "Vinho/Bordô", "Rosa", "Roxo", "Champagne", "Grafite", "Outra",
];

export const CATEGORIAS_VEICULO = [
  "Hatch", "Sedan", "SUV / Crossover", "Pickup", "Minivan",
  "Coupé", "Conversível", "Station Wagon", "Furgão / Van",
  "Moto", "Caminhão", "Outro",
];
