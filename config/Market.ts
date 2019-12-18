export interface ChartData {
  time: String;
  high: Number;
  low: Number;
  open: Number;
  volumefrom: Number;
  volumeto: Number;
  close: Number;
}
export interface TikerData {
  btcPrice: Number;
  dailyPercentageChange: Number;
  dailyVolume: Number;
  hourlyPercentageChange: Number;
  id: String;
  name: String;
  priceEth: Number;
  symbol: String;
  usdPrice: Number;
  weeklyPercentageChange: Number;
}
