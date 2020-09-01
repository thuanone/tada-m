///
const vCPU = [
  {
    unit: "m",
    shortUnit: "m",
    standardStepSize: 100,
    convertUpAt: 1000,
  },
  {
    unit: "vCPU",
    shortUnit: "CPU",
    standardStepSize: 0.1,
    convertUpAt: Infinity,
  },
];
const Memory_1 = [
  {
    unit: "Byte",
    shortUnit: "byte",
    standardStepSize: 1,
    convertUpAt: 1024,
  },
  {
    unit: "KiB",
    shortUnit: "Ki",
    standardStepSize: 1,
    convertUpAt: 1024,
  },

  {
    unit: "MiB",
    shortUnit: "Mi",
    standardStepSize: 1,
    convertUpAt: 1024,
  },
  {
    unit: "GiB",
    shortUnit: "Gi",
    standardStepSize: 0.2,
    convertUpAt: 1024,
  },
  {
    unit: "TiB",
    shortUnit: "Ti",
    standardStepSize: 0.1,
    convertUpAt: 1024,
  },
];
const Memory_2 = [
  {
    unit: "Byte",
    shortUnit: "byte",
    standardStepSize: 1,
    convertUpAt: 1000,
  },
  {
    unit: "KB",
    shortUnit: "Kb",
    standardStepSize: 1,
    convertUpAt: 1000,
  },

  {
    unit: "MB",
    shortUnit: "Mb",
    standardStepSize: 1,
    convertUpAt: 1000,
  },
  {
    unit: "GB",
    shortUnit: "Gb",
    standardStepSize: 0.2,
    convertUpAt: 1000,
  },
  {
    unit: "TB",
    shortUnit: "Tb",
    standardStepSize: 0.1,
    convertUpAt: 1000,
  },
];

const noUnit = [
  {
    unit: "",
    shortUnit: "",
    standardStepSize: 1,
  },
];

const Time = [
  {
    unit: "s",
    shortUnit: "s",
    standardStepSize: 1,
    convertUpAt: 60,
  },
  {
    unit: "Min",
    shortUnit: "min",
    standardStepSize: 1,
    convertUpAt: 60,
  },
  {
    unit: "Hour",
    shortUnit: "h",
    standardStepSize: 1,
    convertUpAt: 24,
  },
  {
    unit: "Day",
    shortUnit: "d",
    standardStepSize: 1,
    convertUpAt: 7,
  },
  {
    unit: "week",
    shortUnit: "w",
    standardStepSize: 1,
    convertUpAt: 30,
  },
  {
    unit: "month",
    shortUnit: "mon",
    standardStepSize: 1,
    convertUpAt: 12,
  },
  {
    unit: "year",
    shortUnit: "yr",
    standardStepSize: 0.5,
    convertUpAt: Infinity,
  },
];
export { vCPU, Memory_1, Memory_2, noUnit, Time };
