import { exec } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { promisify } from 'util';

import { parseCsvToJson } from '../utils/parse-csv.util';
import {
  CKResponseDto,
  MetricsCkResponseDto,
} from './dto/metrics-response.dto';
import { metricsCkMapper } from './mappers/metrics/metric.mapper';

export class MetricsService {
  async CK(projectDir, outputName): Promise<MetricsCkResponseDto> {
    try {
      const execAsync = promisify(exec);
      const ckJarPath = path.resolve(
        __dirname,
        '../../java/ck-0.7.0-jar-with-dependencies.jar',
      );
      const outputDir = `./resultados/ck_results/${outputName}/`;
      const command = `java -jar ${ckJarPath} ${projectDir} true 0 false ${outputDir}`;

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      await execAsync(command);

      const resultMetricsClassCsv = await parseCsvToJson<CKResponseDto>(
        `${outputDir}/class.csv`,
      );

      return metricsCkMapper(resultMetricsClassCsv);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      console.log(e);
      return {
        cbo: null,
        dit: null,
        lcom: null,
        loc: null,
      };
    }
  }
}
