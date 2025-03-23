import { RepositoryEntity } from "src/entities/repository.entity";
import { responseMaxDTO } from "./dto/responseMax.dto";

export class CalculoMaximas {
  static calcular(repos: RepositoryEntity[]): responseMaxDTO {
    const cbo: number[] = [];
    const dit: number[] = [];
    const lcom: number[] = [];

    repos.forEach((repo) => {
      cbo.push(repo.metricsCk?.cbo ?? 0);
      dit.push(repo.metricsCk?.dit ?? 0);
      lcom.push(repo.metricsCk?.lcom ?? 0);
    });

    return {
      maxCbo: Math.max(...cbo),
      maxDit: Math.max(...dit),
      maxLcom: Math.max(...lcom),
    };
  }
}