const { getTierForKinship } = require('../src/services/kinship.service');

describe('Kinship tier calculation', () => {
  describe('CITY weddings', () => {
    it('ATA_ANA → TIER_1', () => expect(getTierForKinship('CITY', 'ATA_ANA')).toBe('TIER_1'));
    it('AGA_INI → TIER_2', () => expect(getTierForKinship('CITY', 'AGA_INI')).toBe('TIER_2'));
    it('QUDA → TIER_2',    () => expect(getTierForKinship('CITY', 'QUDA')).toBe('TIER_2'));
    it('ZHIEN → TIER_3',   () => expect(getTierForKinship('CITY', 'ZHIEN')).toBe('TIER_3'));
    it('OTHER → TIER_3',   () => expect(getTierForKinship('CITY', 'OTHER')).toBe('TIER_3'));
  });

  describe('VILLAGE weddings', () => {
    it('ATA_ANA → TIER_1', () => expect(getTierForKinship('VILLAGE', 'ATA_ANA')).toBe('TIER_1'));
    it('AGA_INI → TIER_2', () => expect(getTierForKinship('VILLAGE', 'AGA_INI')).toBe('TIER_2'));
    it('QUDA → TIER_2',    () => expect(getTierForKinship('VILLAGE', 'QUDA')).toBe('TIER_2'));
    it('ZHIEN → TIER_3',   () => expect(getTierForKinship('VILLAGE', 'ZHIEN')).toBe('TIER_3'));
    it('OTHER → TIER_4',   () => expect(getTierForKinship('VILLAGE', 'OTHER')).toBe('TIER_4'));
  });

  it('unknown kinship type falls back to TIER_5', () => {
    expect(getTierForKinship('CITY', 'UNKNOWN')).toBe('TIER_5');
  });
});