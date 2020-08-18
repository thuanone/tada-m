const kilobyte = 1000;
const megabyte = kilobyte * 1000;
const gigabyte = megabyte * 1000;
const terabyte = gigabyte * 1000;
const petabyte = terabyte * 1000;
const exabyte = petabyte * 1000;

const kibibyte = 1024;
const mebibyte = kibibyte * 1024;
const gibibyte = mebibyte * 1024;
const tebibyte = gibibyte * 1024;
const pebibyte = tebibyte * 1024;
const exbibyte = pebibyte * 1024;

const unitsToMultiplier = {
  e: exabyte,
  eb: exabyte,
  ei: exbibyte,
  eib: exbibyte,
  g: gigabyte,
  gb: gigabyte,
  gi: gibibyte,
  gib: gibibyte,
  k: kilobyte,
  kb: kilobyte,
  ki: kibibyte,
  kib: kibibyte,
  m: megabyte,
  mb: megabyte,
  mi: mebibyte,
  mib: mebibyte,
  p: petabyte,
  pb: petabyte,
  pi: pebibyte,
  pib: pebibyte,
  t: terabyte,
  tb: terabyte,
  ti: tebibyte,
  tib: tebibyte,
};
