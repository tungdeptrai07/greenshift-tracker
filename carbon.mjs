export function calcCarbon({ kwhPerMonth = 180, commuteKmWeek = 40, meatMealsWeek = 7 }) {
  const elecCo2 = kwhPerMonth * 0.42;
  const transitCo2 = commuteKmWeek * 4 * 0.17;
  const dietCo2 = meatMealsWeek * 4 * 2.5;
  return { monthlyKgCo2: Number((elecCo2 + transitCo2 + dietCo2).toFixed(1)) };
}
