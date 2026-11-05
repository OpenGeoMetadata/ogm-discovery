import { describe, expect, it } from 'vitest';
import {
  cameraText,
  parseResearchCamera,
  parseResearchPoint,
  pointText,
} from '../../components/research/editionEvidence';
describe('research view links', () => {
  it('parses reproducible camera and location parameters and rejects blank or out-of-range input', () => {
    for (const input of [
      null,
      '',
      ',',
      '1,',
      ',2',
      '1,2,3',
      'Infinity,0',
      '0,86',
      '181,0',
    ])
      expect(parseResearchPoint(input)).toBeNull();
    expect(parseResearchPoint('-180, -85')).toEqual([-180, -85]);
    expect(pointText([-89.4, 43.07])).toBe('-89.40000, 43.07000');
    const camera = parseResearchCamera('-89.4,43.07,12.25');
    expect(cameraText(camera!)).toBe('-89.40000,43.07000,12.250');
    for (const input of [
      null,
      '',
      '1,2,',
      '1,2,-1',
      '1,2,23',
      '1,86,12',
      '1,2,NaN',
    ])
      expect(parseResearchCamera(input)).toBeNull();
  });
});
