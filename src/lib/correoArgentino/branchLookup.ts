export type CorreoSucursalOption = {
  id: string;
  title: string;
  address: string;
  locality: string;
  province: string;
  postalCode?: string;
  city?: string;
  services?: any;
  latitude?: string;
  longitude?: string;
};

const branchZones: Array<{
  match: (cp: string) => boolean;
  branches: CorreoSucursalOption[];
}> = [
  {
    match: (cp) => /^1\d{3}$/.test(cp),
    branches: [
      {
        id: 'ba-caba-1',
        title: 'Sucursal CABA Centro',
        address: 'Av. Corrientes 1234',
        locality: 'CABA',
        province: 'Ciudad Autónoma de Buenos Aires',
      },
      {
        id: 'ba-palermo',
        title: 'Sucursal Palermo',
        address: 'Córdoba 4600',
        locality: 'CABA',
        province: 'Ciudad Autónoma de Buenos Aires',
      },
      {
        id: 'ba-recoleta',
        title: 'Sucursal Recoleta',
        address: 'Av. Santa Fe 2415',
        locality: 'CABA',
        province: 'Ciudad Autónoma de Buenos Aires',
      },
    ],
  },
  {
    match: (cp) => /^2\d{3}$/.test(cp),
    branches: [
      {
        id: 'ba-laplata',
        title: 'Sucursal La Plata Centro',
        address: 'Calle 12 N° 620',
        locality: 'La Plata',
        province: 'Buenos Aires',
      },
      {
        id: 'ba-zarate',
        title: 'Sucursal Zárate',
        address: 'Av. 25 de Mayo 150',
        locality: 'Zárate',
        province: 'Buenos Aires',
      },
      {
        id: 'ba-san-isidro',
        title: 'Sucursal San Isidro',
        address: 'Av. Centenario 1243',
        locality: 'San Isidro',
        province: 'Buenos Aires',
      },
    ],
  },
  {
    match: (cp) => /^3\d{3}$/.test(cp),
    branches: [
      {
        id: 'sf-rosario',
        title: 'Sucursal Rosario Centro',
        address: 'Av. Pellegrini 1200',
        locality: 'Rosario',
        province: 'Santa Fe',
      },
      {
        id: 'sf-sf',
        title: 'Sucursal Santa Fe',
        address: 'Hipólito Yrigoyen 1325',
        locality: 'Santa Fe',
        province: 'Santa Fe',
      },
    ],
  },
  {
    match: (cp) => /^4\d{3}$/.test(cp),
    branches: [
      {
        id: 'cba-centro',
        title: 'Sucursal Córdoba Centro',
        address: 'Av. Colón 500',
        locality: 'Córdoba',
        province: 'Córdoba',
      },
      {
        id: 'cba-nueva',
        title: 'Sucursal Nueva Córdoba',
        address: 'Av. Vélez Sarsfield 1300',
        locality: 'Córdoba',
        province: 'Córdoba',
      },
      {
        id: 'cba-ceder',
        title: 'Sucursal Córdoba Norte',
        address: 'Av. Rafael Núñez 4600',
        locality: 'Córdoba',
        province: 'Córdoba',
      },
    ],
  },
  {
    match: (cp) => /^5\d{3}$/.test(cp),
    branches: [
      {
        id: 'mza-centro',
        title: 'Sucursal Mendoza Centro',
        address: 'Calle Sarmiento 810',
        locality: 'Mendoza',
        province: 'Mendoza',
      },
      {
        id: 'mza-godoy',
        title: 'Sucursal Godoy Cruz',
        address: 'Av. San Martín 2420',
        locality: 'Godoy Cruz',
        province: 'Mendoza',
      },
      {
        id: 'mza-gral',
        title: 'Sucursal Luján de Cuyo',
        address: 'Calle Rivadavia 1200',
        locality: 'Luján de Cuyo',
        province: 'Mendoza',
      },
    ],
  },
  {
    match: (cp) => /^6\d{3}$/.test(cp),
    branches: [
      {
        id: 'noa-salta',
        title: 'Sucursal Salta Centro',
        address: 'Calle Caseros 370',
        locality: 'Salta',
        province: 'Salta',
      },
      {
        id: 'noa-jujuy',
        title: 'Sucursal San Salvador de Jujuy',
        address: 'Av. 9 de Julio 742',
        locality: 'San Salvador de Jujuy',
        province: 'Jujuy',
      },
    ],
  },
  {
    match: (cp) => /^7\d{3}$/.test(cp),
    branches: [
      {
        id: 'sj-centro',
        title: 'Sucursal San Juan Centro',
        address: 'Av. Libertador 1260',
        locality: 'San Juan',
        province: 'San Juan',
      },
      {
        id: 'sj-rivadavia',
        title: 'Sucursal Rivadavia',
        address: 'Calle 7 y 25 de Mayo',
        locality: 'Rivadavia',
        province: 'San Juan',
      },
    ],
  },
  {
    match: (cp) => /^8\d{3}$/.test(cp),
    branches: [
      {
        id: 'ri-centro',
        title: 'Sucursal Bariloche',
        address: 'Av. Mitre 1080',
        locality: 'San Carlos de Bariloche',
        province: 'Río Negro',
      },
      {
        id: 'ne-centro',
        title: 'Sucursal Neuquén Centro',
        address: 'Cipolletti 100',
        locality: 'Neuquén',
        province: 'Neuquén',
      },
    ],
  },
  {
    match: (cp) => /^9\d{3}$/.test(cp),
    branches: [
      {
        id: 'tf-ush',
        title: 'Sucursal Ushuaia',
        address: 'Av. San Martín 700',
        locality: 'Ushuaia',
        province: 'Tierra del Fuego',
      },
      {
        id: 'sc-rio',
        title: 'Sucursal Río Gallegos',
        address: 'Av. San Martín 400',
        locality: 'Río Gallegos',
        province: 'Santa Cruz',
      },
    ],
  },
];

export const genericBranches: CorreoSucursalOption[] = [
  {
    id: 'generic-1',
    title: 'Sucursal más cercana',
    address: 'Coordinamos la sucursal exacta tras confirmar el pedido',
    locality: 'Zona según código postal',
    province: 'Argentina',
  },
  {
    id: 'generic-2',
    title: 'Sucursal alternativa',
    address: 'Sucursal disponible según el destino de Correo Argentino',
    locality: 'Zona cercana',
    province: 'Argentina',
  },
];

export function getSucursalOptionsForCp(postalCode: string) {
  const cp = String(postalCode || '').trim();
  if (cp.length < 4) return [];

  const matched = branchZones.find((zone) => zone.match(cp));
  return matched?.branches ?? genericBranches;
}
