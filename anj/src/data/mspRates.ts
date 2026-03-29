export const MSP_RATES: Record<string, { current: number; previousYear: number; unit: string }> = {
  wheat:     { current: 2275, previousYear: 2125, unit: '₹/quintal' },
  paddy:     { current: 2183, previousYear: 2060, unit: '₹/quintal' },
  cotton:    { current: 6620, previousYear: 6380, unit: '₹/quintal (medium staple)' },
  mustard:   { current: 5650, previousYear: 5450, unit: '₹/quintal' },
  gram:      { current: 5440, previousYear: 5230, unit: '₹/quintal' },
  maize:     { current: 2090, previousYear: 1962, unit: '₹/quintal' },
  soybean:   { current: 4600, previousYear: 4300, unit: '₹/quintal' },
  onion:     { current: 0,    previousYear: 0,    unit: 'No MSP — market price only' },
  tomato:    { current: 0,    previousYear: 0,    unit: 'No MSP — market price only' },
  sugarcane: { current: 315,  previousYear: 305,  unit: '₹/quintal (FRP)' },
};
