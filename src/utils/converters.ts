export function toRealLifeEquivalent(amountRupees: number, state: string, isHi: boolean = true): string {
  // Conversion benchmarks based on NSO household expenditure data
  const daily_food_per_family = 250;     // ₹250/day average family
  const school_fees_monthly = 800;        // ₹800/month average school
  const medical_consultation = 300;       // ₹300 per doctor visit
  const kg_dal = 120;                     // ₹120 per kg toor dal

  const days_food = Math.round(amountRupees / daily_food_per_family);
  const school_months = Math.round(amountRupees / school_fees_monthly);
  const doctor_visits = Math.round(amountRupees / medical_consultation);

  // Return the most relevant comparison based on the amount size
  if (amountRupees < 1000) {
    return isHi ? `${doctor_visits} डॉक्टर के दौरे` : `${doctor_visits} doctor visits`;
  }
  if (amountRupees < 5000) {
    return isHi ? `${days_food} दिन का परिवार का खाना` : `${days_food} days of family meals`;
  }
  if (amountRupees < 15000) {
    return isHi ? `${school_months} महीने की बच्चे की फीस` : `${school_months} months of child's school fees`;
  }
  if (amountRupees < 50000) {
    return isHi ? `${Math.round(amountRupees / 8000)} बकरी / छोटा मवेशी` : `${Math.round(amountRupees / 8000)} goat / small cattle`;
  }
  if (amountRupees < 150000) {
    return isHi ? `${Math.round(amountRupees / 50000)} बीघा ज़मीन का किराया (1 साल)` : `${Math.round(amountRupees / 50000)} bigha land rent (1 year)`;
  }
  return isHi ? `${Math.round(amountRupees / 150000)} साल की बच्चे की पढ़ाई (college)` : `${Math.round(amountRupees / 150000)} years of college education`;
}
