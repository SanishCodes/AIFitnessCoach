export default class ColorInterpolator {
  interpolate(start, end, value) {
    const s = parseInt(start.slice(1), 16);
    const e = parseInt(end.slice(1), 16);
    const r = Math.round(((e >> 16) - (s >> 16)) * value + (s >> 16));
    const g = Math.round(
      (((e >> 8) & 0xff) - ((s >> 8) & 0xff)) * value + ((s >> 8) & 0xff)
    );
    const b = Math.round(((e & 0xff) - (s & 0xff)) * value + (s & 0xff));

    return `rgb(${r}, ${g}, ${b})`;
  }
}
