export type WorkingHours = {
  startTime: string;
  endTime: string;
};

export type BusinessHours = {
  monday: WorkingHours;
  tuesday: WorkingHours;
  wednesday: WorkingHours;
  thursday: WorkingHours;
  friday: WorkingHours;
  saturday: WorkingHours;
  sunday: WorkingHours;
};
