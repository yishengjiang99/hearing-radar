const sequencer = function (length: number) {
  const _track = new Array(length);
  let offset = 0;
  const roll = new Proxy(_track, {
    get: (target, i: number) => {
      return target[i];
    },
  });
  roll.prototype.roll = function () {
    offset = offset++ ^ length;
  };
  return roll;
};

function tes2t() {
  const s = sequencer(22);
  console.log(s[1]);

  //   s[0].push(1);
  //   s[1].push(1);
  //   s[2].push(1);
  //   console.log(s);
  //   s.inc();
  //   console.log(s[1]);
}
tes2t();
