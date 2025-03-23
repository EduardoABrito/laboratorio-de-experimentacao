import {
  CKResponseDto,
  MetricsCkResponseDto,
} from 'src/service/dto/metrics-response.dto';

export const metricsCkMapper = (
  data: CKResponseDto[],
): MetricsCkResponseDto => {
  const totalClasses = data.length;

  const metrics = data.reduce(
    (acc, curr) => {
      const locValue = Number(curr.loc);
      acc.cbo += Math.round(curr.cbo * 100) / 100;
      acc.dit += Math.round(curr.dit * 100) / 100;
      acc.lcom += Math.round(curr.lcom * 100) / 100;
      acc.loc += !isNaN(locValue) ? locValue : 0;
      return acc;
    },
    { cbo: 0, dit: 0, lcom: 0, loc: 0},
  );

  return {
    cbo: Number((metrics.cbo / totalClasses).toFixed(2)) || 0,
    dit: Number((metrics.dit / totalClasses).toFixed(2)) || 0,
    lcom: Number((metrics.lcom / totalClasses).toFixed(2)) || 0,
    loc: metrics.loc,
  };
};
