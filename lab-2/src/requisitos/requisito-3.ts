import { CalculoMaximas } from '../service/calculoMaxMetrica.service';
import { RepositoryEntity } from '../entities/repository.entity';
import { createChart } from '../utils/create-chart.util';
import { createCsv } from '../utils/create-csv.util';
import { Requisito3ResponseDto } from './dto/requisitos-response.dto';
import { requisito3Mapper } from './mapper/requisitos.mapper';
import { responseMaxDTO } from 'src/service/dto/responseMax.dto';

export class Requisito3 {
  constructor(repositories: RepositoryEntity[]) {
    this.repositories = repositories;
  }

  private readonly question = `RQ 03. Qual a relação entre a atividade dos repositórios e as suas características de qualidade?`;
  private results: Requisito3ResponseDto[] | null = null;
  private repositories: RepositoryEntity[];

  private calculateActivityScore(repository: RepositoryEntity, maximos : responseMaxDTO): number {
      const {metricsCk } = repository;
      const { cbo, dit, lcom } = metricsCk;
  
      const W_cbo = 0.2;
      const W_dit = 0.2;
      const W_lcom = 0.2;
  
      const normalizedCbo = cbo !== null ? cbo / maximos.maxCbo : 0;
      const normalizedDit = dit !== null ? dit / maximos.maxDit : 0;
      const normalizedLcom = lcom !== null ? 1 - lcom / maximos.maxLcom : 1;
  
      return (
        W_cbo * normalizedCbo +
        W_dit * normalizedDit +
        W_lcom * normalizedLcom
      );
    }

  async execute(): Promise<Requisito3ResponseDto[]> {
    const maximos =  CalculoMaximas.calcular(this.repositories)
    const result = this.repositories.map((repo) => {
      const mapped = requisito3Mapper(repo);
      mapped.compositeScore = this.calculateActivityScore(repo, maximos);
      return mapped;
    });

    this.results = result;

    await this.saveCsv();
    await this.saveChart();

    return this.results;
  }

  async saveCsv(): Promise<void> {
    if (!this.verifyResults()) {
      return;
    }

    createCsv(this.results, './resultados/csv/requisito-3.csv');
  }

  async saveChart() {
    if (!this.verifyResults()) {
      return;
    }

    const config = {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Atividade vs Qualidade',
            data: this.results.map((r) => ({
              x: r.allReleasesCount,
              y: r.compositeScore,
            })),
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Repositórios',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Pontuação de Atividade',
            },
            beginAtZero: true,
          },
        },
      },
    };

    await createChart(
      config,
      `requisito-3-atividade-vs-qualidade-${this.results.length}`,
    );
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
      `Pontuação média de atividade: ${
        this.results.reduce((acc, curr) => acc + curr.compositeScore, 0) / this.results.length
      }`,
    );
    console.log('==============================================');
  }
}