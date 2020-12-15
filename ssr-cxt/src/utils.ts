type Time = [number, number];
export const timediff = (t1: Time, t2: Time) => {
  return t1[0] + t1[1] / 1e9 - (t2[0] + t2[1] / 1e9);
};
