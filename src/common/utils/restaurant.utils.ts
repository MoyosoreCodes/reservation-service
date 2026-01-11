import { Restaurant } from "../../entities/restaurant.entity";

export const operatingDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function getNextDateForDay(day: string, time: string) {
  const dayIndex = operatingDays.indexOf(day.toLowerCase());

  if (dayIndex === -1) return dayIndex;

  const now = new Date();
  const resultDate = new Date(now);
  const currentDay = now.getDay();

  let diff = dayIndex - currentDay;
  if (diff < 0) {
    diff += 7;
  } else if (diff === 0) {
    const [hours, minutes] = time.split(":").map(Number);
    const reservationTimeToday = new Date();
    reservationTimeToday.setHours(hours, minutes, 0, 0);
    if (now > reservationTimeToday) {
      diff += 7;
    }
  }

  resultDate.setDate(now.getDate() + diff);
  const [hours, minutes] = time.split(":").map(Number);
  resultDate.setHours(hours, minutes, 0, 0);

  return resultDate;
}

export function getOperatingHoursForDate(restaurant: Restaurant, date: string) {
  const dayOfWeek = new Date(date).toLocaleString("en-US", { weekday: "long" });
  return restaurant.operatingHours[
    dayOfWeek as keyof typeof restaurant.operatingHours
  ];
}
