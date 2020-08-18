const MemoryOld = {
  general: {
    // base config
    convertUnit: 1024,
    minVal: 0,
    // maxVal : ?,
  },
  unitConfig: [
    {
      unit: "MiB",
      shortUnit: "MI",
      standardStepSize: 1,
      standardChunk: 128,
      allowMultipleUnits: false,
    },
    {
      unit: "GiB",
      shortUnit: "Gi",
      standardStepSize: 0.25,
      standardChunk: 0.5,
      allowMultipleUnits: false,
    },
    {
      unit: "TiB",
      shortUnit: "Ti",
      standardStepSize: 0.1,
      standardChunk: 0.5,
      allowMultipleUnits: false,
    },
  ],
};

///
const vCPU = [
  {
    unit: "m",
    shortUnit: "m",
    standardStepSize: 100,
    standardChunk: 100,
    convertUpAt: 1000,
  },
  {
    unit: "vCPU",
    shortUnit: "CPU",
    standardStepSize: 0.1,
    standardChunk: 1,
    convertUpAt: Infinity,
  },
];
const Memory = [
  /*
  {
    unit: "Byte",
    shortUnit: "byte",
    standardStepSize: 1,
    standardChunk: 128,
    convertUpAt: 1024,
  },
  {
    unit: "KiB",
    shortUnit: "Ki",
    standardStepSize: 1,
    standardChunk: 128,
    convertUpAt: 1024,
  },
  */
  {
    unit: "MiB",
    shortUnit: "Mi",
    standardStepSize: 1,
    standardChunk: 128,
    convertUpAt: 1024,
  },
  {
    unit: "GiB",
    shortUnit: "Gi",
    standardStepSize: 0.25,
    standardChunk: 0.5,
    convertUpAt: 1024,
  },
  {
    unit: "TiB",
    shortUnit: "Ti",
    standardStepSize: 0.1,
    standardChunk: 0.5,
    convertUpAt: 1024,
  },
];

const noUnit = [
  {
    unit: "",
    shortUnit: "",
    standardStepSize: 1,
    standardChunk: 10,
    allowMultipleUnits: false,
  },
];

export { MemoryOld, vCPU, Memory, noUnit };
