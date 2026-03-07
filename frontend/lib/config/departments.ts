export type DepartmentOption = {
  id: string;
  name: string;
};

export const departmentOptions: DepartmentOption[] = [
  { id: "dept-sanitation", name: "Sanitation" },
  { id: "dept-roads", name: "Roads and Transport" },
  { id: "dept-water", name: "Water and Drainage" },
  { id: "dept-lighting", name: "Street Lighting" },
];
