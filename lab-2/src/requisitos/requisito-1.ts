import { promises } from 'dns';
import { RepositoryEntity } from '../entities/repository.entity';
import { createChart } from '../utils/create-chart.util';
import { createCsv } from '../utils/create-csv.util';
import { Requisito1ResponseDto } from './dto/requisitos-response.dto';
import { requisito1Mapper } from './mapper/requisitos.mapper';
import { responseMaxDTO } from 'src/service/dto/responseMax.dto';
import { CalculoMaximas } from '../service/calculoMaxMetrica.service';

export class Requisito1 {
  private readonly question = `RQ 01. Qual a relação entre a popularidade dos repositórios e as suas características de qualidade?`;
  private results: Requisito1ResponseDto[] | null = null;
  private repositories: RepositoryEntity[];

  constructor(repositories: RepositoryEntity[]) {
    this.repositories = repositories;
  }

  private calculateScore(repository: RepositoryEntity, maximos : responseMaxDTO): number {
    const { metricsCk } = repository;
    const { cbo, dit, lcom } = metricsCk;

    const W_cbo = 0.2;
    const W_dit = 0.2;
    const W_lcom = 0.1;

    const normalizedCbo = cbo !== null ? cbo / maximos.maxCbo : 0;
    const normalizedDit = dit !== null ? dit / maximos.maxDit : 0;
    const normalizedLcom = lcom !== null ? 1 - lcom / maximos.maxLcom : 1;

    return (
      W_cbo * normalizedCbo +
      W_dit * normalizedDit +
      W_lcom * normalizedLcom
    );
  }

  async execute(): Promise<Requisito1ResponseDto[]> {
    const maximos =  CalculoMaximas.calcular(this.repositories)
    console.log(this.repositories)
    const result = this.repositories.map((repo) => {
      const mapped = requisito1Mapper(repo);
      mapped.compositeScore = this.calculateScore(repo, maximos);
      return mapped;
    });

    this.results = result;
    return this.results;
  }

  async saveCsv(): Promise<void> {
    if (!this.verifyResults()) {
      return;
    }
    createCsv(this.results, './resultados/csv/requisito-1.csv');
  }

  async saveChart(): Promise<void> {
    if (!this.verifyResults()) {
      return;
    }

    const config = {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Popularidade vs. Qualidade',
            data: this.results.map((r) => ({
              x: r.popularity,
              y: r.compositeScore,
            })),
            backgroundColor: 'blue',
          },
        ],
      },
      options: {
        title: {
          display: true,
          text: this.question,
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Popularidade (Stargazers)',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Pontuação Composta de Qualidade',
            },
          },
        },
      },
    };

    await createChart(config, `requisito-1-popularidade-vs-qualidade`);
  }

  verifyResults(): boolean {
    if (this.results) return true;

    console.log('==============================================');
    console.log(this.question);
    console.log(
      `Ainda não foi possível obter os resultados, execute o método execute() antes de chamar este método.`,
    );
    console.log('==============================================');

    return false;
  }

  toStringResult(): void {
    if (!this.verifyResults()) {
      return;
    }

    console.log('==============================================');
    console.log(this.question);
    console.log(
      `Resultado médio da pontuação composta: ${
        this.results.reduce((acc, curr) => acc + curr.compositeScore, 0) / this.results.length
      }`,
    );
    console.log('==============================================');
  }
}