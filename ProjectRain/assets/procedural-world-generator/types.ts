
export interface MapSettings {
  width: number;
  height: number;
  baseHeightFactor: number;
  smoothPasses: number;
  sin1Amp: number;
  sin1Freq: number;
  sin2Amp: number;
  sin2Freq: number;
  sin3Amp: number;
  sin3Freq: number;
  sin4Amp: number;
  sin4Freq: number;
  randomAmp: number;
  grassThickness: number;
  dirtLayerDepth: number;
  caveDensity: number;
  caveSize: number;
  caveVerticalBias: number;
  caveVerticalFreq: number;
}

export const INITIAL_SETTINGS: MapSettings = {
  width: 1280,
  height: 720,
  baseHeightFactor: 0.7,
  smoothPasses: 5,
  sin1Amp: 20,
  sin1Freq: 0.01,
  sin2Amp: 10,
  sin2Freq: 0.02,
  sin3Amp: 5,
  sin3Freq: 0.05,
  sin4Amp: 2,
  sin4Freq: 0.1,
  randomAmp: 5,
  grassThickness: 3,
  dirtLayerDepth: 30,
  caveDensity: 35,
  caveSize: 70,
  caveVerticalBias: 0.3,
  caveVerticalFreq: 0.05,
};
