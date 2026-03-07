import type { Site } from './types';

export const sites: Site[] = [
  {
    id: 'site1',
    code: '99TS12S0912',
    legacyCode: 'ZXC-12-444',
    ll: 'Ari Putra',
    negotiator: 'Lina Hartono',
    towerType: 'Macro Rooftop',
    province: 'DKI Jakarta',
    existingPricePerYear: 125000000,
    newPricePerYear: 140000000,
    contractEnd: '2027-08-31',
    coordinates: '-6.2088, 106.8456'
  },
  {
    id: 'site2',
    code: '78TS12S1892',
    legacyCode: 'LAS-09-111',
    ll: 'Sari Dewi',
    negotiator: 'Dimas Wibowo',
    towerType: 'Greenfield',
    province: 'Jawa Barat',
    existingPricePerYear: 87000000,
    newPricePerYear: 95000000,
    contractEnd: '2026-12-12',
    coordinates: '-6.9039, 107.6186'
  },
  {
    id: 'site3',
    code: '65TM09J2784',
    legacyCode: 'EMW-11-666',
    ll: 'Fajar Santoso',
    negotiator: 'Rina Wulandari',
    towerType: 'Monopole',
    province: 'Jawa Timur',
    existingPricePerYear: 73000000,
    newPricePerYear: 82000000,
    contractEnd: '2025-10-01',
    coordinates: '-7.2575, 112.7521'
  }
];

export const profileFields: Array<{ label: string; key: keyof Site }> = [
  { label: 'Negotiator', key: 'negotiator' },
  { label: 'Province', key: 'province' },
  { label: 'Existing Price / year', key: 'existingPricePerYear' },
  { label: 'New Price / year', key: 'newPricePerYear' },
  { label: 'Tower Type', key: 'towerType' },
  { label: 'Contract End', key: 'contractEnd' },
  { label: 'Landlord', key: 'll' },
  { label: 'Lat/Long', key: 'coordinates' }
];
