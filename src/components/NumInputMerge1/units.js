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
const vCPU = {
  defaultValue: 0,
  isValid: true,
  minVal: 0,
  maxVal: undefined,
  unitConfig: [
    {
      unit: "m",
      shortUnit: "m",
      stepSize: 10,
      standardChunk: 100,
    },
    {
      unit: "vCPU",
      shortUnit: "CPU",
      stepSize: 0.1,
      standardChunk: 1,
    },
  ],
};
const Memory = {
  defaultValue: 0,
  isValid: true,
  minVal: 0,
  maxVal: undefined,
  unitConfig: [
    {
      unit: "Byte",
      shortUnit: "byte",
      standardStepSize: 1,
      standardChunk: 128,
      allowMultipleUnits: false,
    },
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

export { MemoryOld, vCPU, Memory };
